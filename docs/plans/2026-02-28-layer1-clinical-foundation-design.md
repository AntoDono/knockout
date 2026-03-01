# Layer 1: Clinical Foundation — Design Document

## Overview

Layer 1 is the clinical foundation of Knockout. It stores everything already known about the patient before a single new data point is collected. Every downstream layer reads from it: the passive data engine compares against personal thresholds, the PK model reads medication details, the one-tap capture snapshots medication coverage, and the physician report pulls the full clinical picture.

**Storage:** Single SQLite database file. Clinical foundation data is seeded from a manually parsed `seed.json` on first run. Runtime data (watch streams, tapped events, computed baselines) goes into the same database.

**Patient:** Dishita Agarwal, DOB 1/19/2006, diagnosed TKOS (Triadin Knockout Syndrome).

---

## Data Sources

| Source | Document | What We Extract |
|---|---|---|
| ECG Trend PDF | Result Trends - ECG 12-LEAD (Jan 2022 — Nov 2025) | 14 ECG readings: HR, PR, QRS, QT, QTc over time |
| Clinical Note | Office Visit Nov 20, 2025 — Dr. Salim F Idriss, Duke Children's | Medications, problem list, surgical history, symptom profile, triggers, physical exam |
| LATITUDE Report | Boston Scientific ICD Interrogation, Nov 10, 2025 (12 pages) | Device info, detection zones, episode log, lead measurements, pacing stats, heart rate histograms |

---

## Key Clinical Facts That Shape the Schema

### 1. Her resting HR of 70 bpm is pacemaker-set
She has sick sinus syndrome. The ICD's lower rate limit is 70 bpm. Her atrium is paced 98% of the time. Every ECG shows exactly 70 bpm because the device is setting it, not her heart. This means "resting HR baseline" in our system is the pacemaker floor, not an intrinsic measurement.

### 2. She's on nadolol only — no flecainide
- Nadolol (Corgard) 40mg BID: morning ~9am, evening ~8-11pm
- Half-life: 20-24 hours
- The PK model tracks one cardiac drug curve with two daily doses
- Her note says symptoms are "more pronounced at beginning and end of day" — a trough signal

### 3. Her ICD gap is 120 bpm wide
- VT zone: 190 bpm (shock only — ATP is OFF)
- VF zone: 220 bpm
- Paced floor: 70 bpm
- **Gap: 70 → 190 bpm.** Any ventricular arrhythmia in this range is invisible to the device.

### 4. The Jul 10, 2024 ECG anomaly was device malfunction, not cardiac
QRS jumped to 152ms, QTc to 533ms. Two days later (Jul 12), emergency surgery for lead extraction + ICD reimplant due to generator migration and lead fracture. The anomalous ECG reading must be flagged as non-representative of her cardiac baseline.

### 5. She has Long QT AND TKOS
QTc has ranged 397-475 (excluding the device malfunction reading of 533). Most recent: 434ms. Allergy flagged: "All medications that prolong QT."

### 6. Historical ICD shocks map to specific triggers
- 2011: swimming
- 2013: dancing
- 2/2015: climbing stairs
These are documented triggers that feed into the known_triggers table.

---

## Schema

### patients

```sql
CREATE TABLE patients (
    id              INTEGER PRIMARY KEY,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    date_of_birth   TEXT NOT NULL,
    sex             TEXT NOT NULL,
    height_cm       REAL,
    weight_kg       REAL,
    bmi             REAL,
    primary_diagnosis TEXT NOT NULL,
    gene_variant    TEXT,
    diagnosis_date  TEXT,
    has_myopathy    BOOLEAN DEFAULT FALSE,
    has_sick_sinus  BOOLEAN DEFAULT FALSE,
    cardiac_arrest_history TEXT,
    sympathetic_denervation BOOLEAN DEFAULT FALSE,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);
```

Dishita seed: TKOS, DOB 2006-01-19, 171.6cm, 83kg, myopathy TRUE, sick sinus TRUE, LCSD at age 2.

### patient_diagnoses

```sql
CREATE TABLE patient_diagnoses (
    id          INTEGER PRIMARY KEY,
    patient_id  INTEGER NOT NULL REFERENCES patients(id),
    diagnosis   TEXT NOT NULL,
    noted_date  TEXT,
    notes       TEXT
);
```

Seed: TKOS (5/30/2024), Long QT (6/26/2015), sick sinus (11/25/2018), myopathy (8/11/2015), syncope (6/26/2015), cardiac arrest, AF (3/27/2022), AF with RVR (2/2/2024), multiple concussions (11/20/2025), subdural hematoma (2/2/2024), PCOS (11/26/2024).

### patient_allergies

```sql
CREATE TABLE patient_allergies (
    id          INTEGER PRIMARY KEY,
    patient_id  INTEGER NOT NULL REFERENCES patients(id),
    allergen    TEXT NOT NULL,
    reaction    TEXT
);
```

Seed: "All medications that prolong QT"

### known_triggers

```sql
CREATE TABLE known_triggers (
    id              INTEGER PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    trigger_type    TEXT NOT NULL,
    source          TEXT,
    confidence      TEXT DEFAULT 'documented',
    notes           TEXT
);
```

Seed from ICD discharge history and clinical note:
- swimming (ICD discharge 2011, documented)
- dancing (ICD discharge 2013, documented)
- climbing stairs (ICD discharge 2/2015, documented)
- sleep deprivation (clinical note: 5-6hrs/night, patient_reported)
- physical exertion / walking (clinical note: symptoms exacerbated by walking, patient_reported)

### medications

```sql
CREATE TABLE medications (
    id              INTEGER PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    drug_name       TEXT NOT NULL,
    brand_name      TEXT,
    drug_class      TEXT,
    is_cardiac      BOOLEAN DEFAULT FALSE,
    dose_mg         REAL NOT NULL,
    dose_unit       TEXT DEFAULT 'mg',
    frequency       TEXT NOT NULL,
    dose_times      TEXT NOT NULL,
    half_life_hours REAL,
    dose_per_kg     REAL,
    started_date    TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);
```

Seed:
| Drug | Dose | Freq | Times | Cardiac | Half-life |
|---|---|---|---|---|---|
| nadolol | 40mg | twice_daily | ["09:00","20:00"] | TRUE | 22h |
| spironolactone | 25mg | once_daily | ["09:00"] | FALSE | — |
| norgestimate-ethinyl estradiol | — | once_daily | ["09:00"] | FALSE | — |
| cholecalciferol (Vit D3) | 400 units | once_daily | — | FALSE | — |
| multivitamin | — | once_daily | ["09:00"] | FALSE | — |

### icd_device

```sql
CREATE TABLE icd_device (
    id                          INTEGER PRIMARY KEY,
    patient_id                  INTEGER NOT NULL REFERENCES patients(id),
    manufacturer                TEXT NOT NULL,
    model                       TEXT NOT NULL,
    serial_number               TEXT,
    implant_date                TEXT NOT NULL,
    lead_config                 TEXT,
    pacing_mode                 TEXT,
    lower_rate_limit_bpm        INTEGER,
    max_tracking_rate_bpm       INTEGER,
    max_sensor_rate_bpm         INTEGER,
    battery_life_years          INTEGER,
    battery_status              TEXT,
    atrial_pacing_pct           INTEGER,
    ventricular_pacing_pct      INTEGER,
    atrial_lead_impedance       INTEGER,
    atrial_sensing_mv           REAL,
    atrial_pace_threshold_v     REAL,
    ventricular_lead_impedance  INTEGER,
    ventricular_sensing_mv      REAL,
    ventricular_pace_threshold_v REAL,
    shock_impedance_ohms        INTEGER,
    last_interrogation_date     TEXT,
    last_shock_date             TEXT,
    last_shock_energy_j         INTEGER,
    notes                       TEXT,
    updated_at                  TEXT DEFAULT (datetime('now'))
);
```

Seed: Boston Scientific RESONATE EL ICD D433/657030, implanted 2023-12-11, DDDR mode, lower rate 70 bpm, battery 11 years, atrial pacing 98%, ventricular pacing 1%, all lead measurements normal, shock impedance 57 ohms, last shock 2024-02-02 at 41J.

### icd_zones

```sql
CREATE TABLE icd_zones (
    id              INTEGER PRIMARY KEY,
    device_id       INTEGER NOT NULL REFERENCES icd_device(id),
    zone_name       TEXT NOT NULL,
    zone_type       TEXT NOT NULL,
    rate_cutoff_bpm INTEGER NOT NULL,
    therapies       TEXT,
    atp_enabled     BOOLEAN DEFAULT FALSE,
    programmed_date TEXT,
    notes           TEXT
);
```

Seed:
| Zone | Rate | Type | Therapies | ATP |
|---|---|---|---|---|
| VT | 190 bpm | therapy | ["31J","41J","41J x4"] | OFF |
| VF | 220 bpm | therapy | ["31J","41J","41J x6"] | OFF |
| ATR | 170 bpm | mode_switch | — | — |

### icd_episodes

```sql
CREATE TABLE icd_episodes (
    id                  INTEGER PRIMARY KEY,
    device_id           INTEGER NOT NULL REFERENCES icd_device(id),
    episode_datetime    TEXT NOT NULL,
    zone_triggered      TEXT,
    detected_rate_bpm   INTEGER,
    avg_v_rate_bpm      INTEGER,
    duration_seconds    REAL,
    therapy_delivered   TEXT,
    therapy_result      TEXT,
    classification      TEXT,
    activity_at_onset   TEXT,
    notes               TEXT
);
```

Seed from LATITUDE event log:
| Date | Zone | Rate | Therapy | Notes |
|---|---|---|---|---|
| 2025-05-05 12:57 | VT | 199 bpm | none | Self-terminated before therapy |
| 2025-10-17 23:10 | ATR | 151 bpm atrial, V rate 121 | mode_switch | 3 seconds |
| 2025-11-08 18:17 | ATR | 117 bpm atrial, V rate 106 | mode_switch | Brief |

### icd_shock_history

```sql
CREATE TABLE icd_shock_history (
    id          INTEGER PRIMARY KEY,
    patient_id  INTEGER NOT NULL REFERENCES patients(id),
    event_date  TEXT,
    event_type  TEXT,
    context     TEXT,
    device_era  TEXT
);
```

Seed: 2011 swimming, 2013 dancing, 2/2015 stairs, 2/2024 last delivered shock.

### ecg_readings

```sql
CREATE TABLE ecg_readings (
    id              INTEGER PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    reading_date    TEXT NOT NULL,
    hr_bpm          INTEGER,
    pr_ms           INTEGER,
    qrs_ms          INTEGER,
    qt_ms           INTEGER,
    qtc_ms          INTEGER,
    axis_p          INTEGER,
    axis_r          INTEGER,
    axis_t          INTEGER,
    findings        TEXT,
    source          TEXT DEFAULT 'clinic_ecg',
    is_anomalous    BOOLEAN DEFAULT FALSE,
    notes           TEXT
);
```

Seed: 14 readings from Jan 2022 — Nov 2025. Jul 10, 2024 flagged as anomalous (device malfunction, not cardiac baseline).

Most recent (Nov 20, 2025): HR 70, PR 170, QRS 70, QT 402, QTc 434.

### static_thresholds

```sql
CREATE TABLE static_thresholds (
    id                      INTEGER PRIMARY KEY,
    patient_id              INTEGER NOT NULL REFERENCES patients(id),
    effective_date          TEXT NOT NULL,
    source                  TEXT,
    clinician               TEXT,
    resting_hr_bpm          INTEGER,
    ectopy_onset_hr_bpm     INTEGER,
    prescribed_hr_ceiling   INTEGER,
    qrs_baseline_ms         INTEGER,
    qtc_baseline_ms         INTEGER,
    qrs_widening_alert_pct  REAL DEFAULT 0.25,
    qrs_absolute_alert_ms   INTEGER,
    qtc_upper_limit_ms      INTEGER DEFAULT 500,
    icd_gap_lower_bpm       INTEGER,
    icd_gap_upper_bpm       INTEGER,
    notes                   TEXT,
    is_current              BOOLEAN DEFAULT TRUE
);
```

Seed: resting HR 70 (paced), QRS 70ms, QTc 434ms, QRS alert at 88ms (70 * 1.25), ICD gap 70-190 bpm. Ectopy onset and HR ceiling NULL (no stress test data available).

### clinical_notes

```sql
CREATE TABLE clinical_notes (
    id              INTEGER PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    visit_date      TEXT NOT NULL,
    clinician       TEXT,
    facility        TEXT,
    note_type       TEXT,
    raw_text        TEXT,
    extracted_json  TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);
```

Seed: Nov 20, 2025 progress note from Dr. Idriss. Raw text stored, Claude API extraction populates extracted_json with structured triggers, symptoms, medication observations, and clinician assessment.

### surgical_history

```sql
CREATE TABLE surgical_history (
    id              INTEGER PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    procedure_date  TEXT NOT NULL,
    procedure_name  TEXT NOT NULL,
    surgeon         TEXT,
    facility        TEXT,
    laterality      TEXT,
    notes           TEXT
);
```

Seed: 8+ procedures from LCSD at age 2 (2008) through ICD reimplant (Jul 2024) and bilateral reduction mammaplasty (Dec 2024).

---

## Runtime Tables (Layer 2+ — Not Seeded)

### passive_readings

```sql
CREATE TABLE passive_readings (
    id          INTEGER PRIMARY KEY,
    patient_id  INTEGER NOT NULL REFERENCES patients(id),
    stream_type TEXT NOT NULL,
    timestamp   TEXT NOT NULL,
    value       REAL NOT NULL,
    unit        TEXT,
    source      TEXT,
    metadata    TEXT
);

CREATE INDEX idx_passive_ts ON passive_readings(patient_id, stream_type, timestamp);
```

Populated by: Apple Watch (HR, HRV, sleep, wrist temp), Sensor Logger, OpenWeatherMap.

### dynamic_baselines

```sql
CREATE TABLE dynamic_baselines (
    id              INTEGER PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    metric          TEXT NOT NULL,
    baseline_value  REAL NOT NULL,
    std_value       REAL,
    alert_threshold REAL,
    window_start    TEXT NOT NULL,
    window_end      TEXT NOT NULL,
    n_readings      INTEGER,
    computed_at     TEXT DEFAULT (datetime('now')),
    is_current      BOOLEAN DEFAULT TRUE
);
```

Computed by Layer 2 from rolling passive_readings windows (7-day for HRV, 14-day for HR/sleep/temp).

### tapped_events

```sql
CREATE TABLE tapped_events (
    id                  INTEGER PRIMARY KEY,
    patient_id          INTEGER NOT NULL REFERENCES patients(id),
    tap_datetime        TEXT NOT NULL,
    event_type          TEXT DEFAULT 'symptom',
    symptom_tags        TEXT,
    context_snapshot    TEXT NOT NULL,
    med_coverage_pct    TEXT,
    notes               TEXT,
    created_at          TEXT DEFAULT (datetime('now'))
);
```

Populated by: one-tap button (real symptom) or hackathon simulation buttons.

### medication_logs

```sql
CREATE TABLE medication_logs (
    id              INTEGER PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    medication_id   INTEGER NOT NULL REFERENCES medications(id),
    logged_datetime TEXT NOT NULL,
    scheduled_time  TEXT,
    is_missed       BOOLEAN DEFAULT FALSE,
    source          TEXT DEFAULT 'manual',
    created_at      TEXT DEFAULT (datetime('now'))
);
```

Populated by: daily dose confirmation taps.

---

## Data Flow

```
LAYER 1 — CLINICAL FOUNDATION (seeded from seed.json, read-mostly)
┌──────────────────────────────────────────────────────────────┐
│  patients + diagnoses + allergies + known_triggers            │
│  medications (nadolol 40mg BID)                              │
│  icd_device + icd_zones + icd_episodes + shock_history       │
│  ecg_readings (14 historical)                                │
│  static_thresholds (QRS 70, QTc 434, ICD gap 70-190)        │
│  clinical_notes + extracted_json                             │
│  surgical_history                                            │
└──────────────────────────┬───────────────────────────────────┘
                           │ read by ↓
LAYER 2+ — RUNTIME (empty at startup, filled by app)
┌──────────────────────────────────────────────────────────────┐
│  passive_readings (HR, HRV, temp, sleep, weather)            │
│  dynamic_baselines (rolling averages, written back daily)    │
│  tapped_events (one-tap captures + 24h context snapshots)    │
│  medication_logs (dose confirmations)                        │
└──────────────────────────────────────────────────────────────┘
```

Layer 2 reads static thresholds FROM Layer 1.
Layer 2 computes and writes dynamic baselines back.
Layer 3 (PK model) reads medications from Layer 1 + dose logs from runtime.
Layer 4 (one-tap) reads all of the above to build context snapshots.
Layer 6 (physician report) reads everything.

---

## Seed File Strategy

1. Manually parse the two PDFs (ECG trend + MyChart visit) into `backend/seed/seed.json`
2. On FastAPI startup, check if database is empty; if so, load seed.json
3. The seed file is version-controlled and human-readable
4. To update clinical data (new visit, new ICD interrogation), update seed.json or use the app's update endpoints

---

## Open Questions

- **Ectopy onset rate:** Not available in current documents. May be in a stress test report. Leaving NULL in static_thresholds until we get it.
- **Prescribed HR ceiling:** Not documented in this clinical note. May need to ask Dishita or find it in another note.
- **Nadolol evening dose timing:** Note says "between 8 and 11pm" — we default to 20:00 in seed but the actual time varies daily. The medication_logs table captures the real time each day.
