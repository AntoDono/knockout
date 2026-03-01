# Layer 1: Clinical Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add clinical foundation tables to the existing Peewee/SQLite database, seed them with Dishita's real clinical data, and expose API endpoints so the frontend and report generator can read from real data instead of hardcoded sample_data.py.

**Architecture:** Extend the existing `backend/database.py` (Peewee ORM + SQLite) with new models for patient profile, ICD data, ECG readings, static thresholds, clinical notes, and surgical history. Create a `backend/seed/clinical.json` file parsed from Dishita's real MyChart + ECG PDFs. Add GET endpoints to the existing `backend/server.py` HTTP handler.

**Tech Stack:** Peewee ORM, SQLite (existing `knockout.db`), Python stdlib HTTP server (existing)

---

### Task 1: Add Layer 1 Peewee Models

**Files:**
- Modify: `backend/database.py`

**Step 1: Add the Patient model and related tables**

Add after the existing `Dose` model in `backend/database.py`:

```python
class Patient(BaseModel):
    """Core patient profile."""
    id = AutoField()
    first_name = CharField()
    last_name = CharField()
    date_of_birth = CharField()  # ISO date string
    sex = CharField()
    height_cm = FloatField(null=True)
    weight_kg = FloatField(null=True)
    bmi = FloatField(null=True)
    primary_diagnosis = CharField()
    gene_variant = CharField(null=True)
    diagnosis_date = CharField(null=True)
    has_myopathy = BooleanField(default=False)
    has_sick_sinus = BooleanField(default=False)
    cardiac_arrest_history = TextField(null=True)
    sympathetic_denervation = BooleanField(default=False)

    class Meta:
        table_name = "patients"


class PatientDiagnosis(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="diagnoses", on_delete="CASCADE")
    diagnosis = CharField()
    noted_date = CharField(null=True)
    notes = TextField(null=True)

    class Meta:
        table_name = "patient_diagnoses"


class PatientAllergy(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="allergies", on_delete="CASCADE")
    allergen = CharField()
    reaction = TextField(null=True)

    class Meta:
        table_name = "patient_allergies"


class KnownTrigger(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="triggers", on_delete="CASCADE")
    trigger_type = CharField()
    source = CharField(null=True)
    confidence = CharField(default="documented")
    notes = TextField(null=True)

    class Meta:
        table_name = "known_triggers"


class Medication(BaseModel):
    """Patient medication — extends existing Drug model with clinical details."""
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="medications", on_delete="CASCADE")
    drug_name = CharField()
    brand_name = CharField(null=True)
    drug_class = CharField(null=True)
    is_cardiac = BooleanField(default=False)
    dose_mg = FloatField()
    dose_unit = CharField(default="mg")
    frequency = CharField()
    dose_times = TextField()  # JSON array: '["09:00","20:00"]'
    half_life_hours = FloatField(null=True)
    dose_per_kg = FloatField(null=True)
    started_date = CharField(null=True)
    is_active = BooleanField(default=True)
    notes = TextField(null=True)

    class Meta:
        table_name = "medications"


class ICDDevice(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="icd_devices", on_delete="CASCADE")
    manufacturer = CharField()
    model = CharField()
    serial_number = CharField(null=True)
    implant_date = CharField()
    lead_config = CharField(null=True)
    pacing_mode = CharField(null=True)
    lower_rate_limit_bpm = IntegerField(null=True)
    max_tracking_rate_bpm = IntegerField(null=True)
    battery_life_years = IntegerField(null=True)
    battery_status = CharField(null=True)
    atrial_pacing_pct = IntegerField(null=True)
    ventricular_pacing_pct = IntegerField(null=True)
    atrial_lead_impedance = IntegerField(null=True)
    atrial_sensing_mv = FloatField(null=True)
    ventricular_lead_impedance = IntegerField(null=True)
    ventricular_sensing_mv = FloatField(null=True)
    shock_impedance_ohms = IntegerField(null=True)
    last_interrogation_date = CharField(null=True)
    last_shock_date = CharField(null=True)
    notes = TextField(null=True)

    class Meta:
        table_name = "icd_device"


class ICDZone(BaseModel):
    id = AutoField()
    device = ForeignKeyField(ICDDevice, backref="zones", on_delete="CASCADE")
    zone_name = CharField()       # VT, VF, ATR
    zone_type = CharField()       # therapy, monitor, mode_switch
    rate_cutoff_bpm = IntegerField()
    therapies = TextField(null=True)  # JSON array
    atp_enabled = BooleanField(default=False)
    programmed_date = CharField(null=True)
    notes = TextField(null=True)

    class Meta:
        table_name = "icd_zones"


class ICDEpisode(BaseModel):
    id = AutoField()
    device = ForeignKeyField(ICDDevice, backref="episodes", on_delete="CASCADE")
    episode_datetime = CharField()
    zone_triggered = CharField(null=True)
    detected_rate_bpm = IntegerField(null=True)
    avg_v_rate_bpm = IntegerField(null=True)
    duration_seconds = FloatField(null=True)
    therapy_delivered = CharField(null=True)
    therapy_result = CharField(null=True)
    classification = CharField(null=True)
    activity_at_onset = CharField(null=True)
    notes = TextField(null=True)

    class Meta:
        table_name = "icd_episodes"


class ICDShockHistory(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="shock_history", on_delete="CASCADE")
    event_date = CharField(null=True)
    event_type = CharField(null=True)
    context = TextField(null=True)
    device_era = CharField(null=True)

    class Meta:
        table_name = "icd_shock_history"


class ECGReading(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="ecg_readings", on_delete="CASCADE")
    reading_date = CharField()
    hr_bpm = IntegerField(null=True)
    pr_ms = IntegerField(null=True)
    qrs_ms = IntegerField(null=True)
    qt_ms = IntegerField(null=True)
    qtc_ms = IntegerField(null=True)
    findings = TextField(null=True)
    source = CharField(default="clinic_ecg")
    is_anomalous = BooleanField(default=False)
    notes = TextField(null=True)

    class Meta:
        table_name = "ecg_readings"


class StaticThreshold(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="thresholds", on_delete="CASCADE")
    effective_date = CharField()
    source = CharField(null=True)
    clinician = CharField(null=True)
    resting_hr_bpm = IntegerField(null=True)
    ectopy_onset_hr_bpm = IntegerField(null=True)
    prescribed_hr_ceiling = IntegerField(null=True)
    qrs_baseline_ms = IntegerField(null=True)
    qtc_baseline_ms = IntegerField(null=True)
    qrs_widening_alert_pct = FloatField(default=0.25)
    qrs_absolute_alert_ms = IntegerField(null=True)
    qtc_upper_limit_ms = IntegerField(default=500)
    icd_gap_lower_bpm = IntegerField(null=True)
    icd_gap_upper_bpm = IntegerField(null=True)
    notes = TextField(null=True)
    is_current = BooleanField(default=True)

    class Meta:
        table_name = "static_thresholds"


class ClinicalNote(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="clinical_notes", on_delete="CASCADE")
    visit_date = CharField()
    clinician = CharField(null=True)
    facility = CharField(null=True)
    note_type = CharField(null=True)
    raw_text = TextField(null=True)
    extracted_json = TextField(null=True)

    class Meta:
        table_name = "clinical_notes"


class SurgicalHistory(BaseModel):
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="surgeries", on_delete="CASCADE")
    procedure_date = CharField()
    procedure_name = CharField()
    surgeon = CharField(null=True)
    facility = CharField(null=True)
    laterality = CharField(null=True)
    notes = TextField(null=True)

    class Meta:
        table_name = "surgical_history"
```

**Step 2: Add BooleanField import and update `init_db`**

Add `BooleanField` to the Peewee imports at the top of `database.py`.

Update `init_db()` to create the new tables:

```python
_LAYER1_MODELS = [
    Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
]

def init_db() -> None:
    """Create tables and seed data."""
    db.connect(reuse_if_open=True)
    db.create_tables([Drug, Dose] + _LAYER1_MODELS, safe=True)
    _seed_from_cache()
    _seed_clinical()
```

**Step 3: Verify models create tables**

Run: `cd backend && python -c "from database import init_db; init_db(); print('OK')"`
Expected: OK, no errors, `knockout.db` now has the new tables.

**Step 4: Commit**

```bash
git add backend/database.py
git commit -m "feat: add Layer 1 clinical foundation Peewee models"
```

---

### Task 2: Create Seed Data File

**Files:**
- Create: `backend/seed/clinical.json`

**Step 1: Create the seed directory and JSON file**

This file contains Dishita's real clinical data parsed from the MyChart visit (Nov 20, 2025) and ECG trend PDF (Jan 2022 — Nov 2025). All values come directly from the source documents.

```bash
mkdir -p backend/seed
```

Create `backend/seed/clinical.json` with the full patient data. Key data points:

- **Patient:** Dishita Agarwal, DOB 2006-01-19, 171.6cm, 83kg, TKOS + Long QT + sick sinus + myopathy
- **Medications:** Nadolol 40mg BID (9am/8pm), spironolactone 25mg, Sprintec, Vitamin D3, multivitamin
- **ICD:** Boston Scientific RESONATE EL, implanted 2023-12-11, VT zone 190 bpm, VF zone 220 bpm, ATR 170 bpm, lower rate 70 bpm, atrial pacing 98%
- **ICD Episodes:** VT at 199 bpm (May 2025, no therapy), ATR events (Oct/Nov 2025)
- **ICD Shock History:** 2011 swimming, 2013 dancing, 2015 stairs
- **ECG Readings:** 14 readings from Jan 2022 — Nov 2025 (Jul 10 2024 flagged anomalous — device malfunction)
- **Static Thresholds:** Resting HR 70 (paced), QRS 70ms, QTc 434ms, ICD gap 70-190 bpm
- **Known Triggers:** swimming, dancing, climbing stairs, sleep deprivation, physical exertion
- **Surgical History:** LCSD (2008), lead extractions (2018, 2024), generator replacements (2023, 2024)
- **Diagnoses:** 11 documented conditions from the problem list
- **Allergies:** All medications that prolong QT

**Step 2: Commit**

```bash
git add backend/seed/clinical.json
git commit -m "feat: add clinical seed data from Dishita's real medical records"
```

---

### Task 3: Add Seeding Logic

**Files:**
- Modify: `backend/database.py`

**Step 1: Add `_seed_clinical()` function**

This function loads `backend/seed/clinical.json` and populates all Layer 1 tables. It's idempotent — checks if the patient already exists before inserting.

```python
_CLINICAL_SEED = Path(__file__).parent / "seed" / "clinical.json"

def _seed_clinical() -> None:
    """Load clinical foundation data from seed file (idempotent)."""
    if not _CLINICAL_SEED.exists():
        return
    # Skip if patient already seeded
    if Patient.select().count() > 0:
        return

    data = json.loads(_CLINICAL_SEED.read_text())
    p = data["patient"]

    patient = Patient.create(
        first_name=p["first_name"],
        last_name=p["last_name"],
        date_of_birth=p["date_of_birth"],
        sex=p["sex"],
        height_cm=p.get("height_cm"),
        weight_kg=p.get("weight_kg"),
        bmi=p.get("bmi"),
        primary_diagnosis=p["primary_diagnosis"],
        gene_variant=p.get("gene_variant"),
        diagnosis_date=p.get("diagnosis_date"),
        has_myopathy=p.get("has_myopathy", False),
        has_sick_sinus=p.get("has_sick_sinus", False),
        cardiac_arrest_history=p.get("cardiac_arrest_history"),
        sympathetic_denervation=p.get("sympathetic_denervation", False),
    )

    for d in data.get("diagnoses", []):
        PatientDiagnosis.create(patient=patient, **d)

    for a in data.get("allergies", []):
        PatientAllergy.create(patient=patient, **a)

    for t in data.get("triggers", []):
        KnownTrigger.create(patient=patient, **t)

    for m in data.get("medications", []):
        Medication.create(patient=patient, **m)

    for device_data in data.get("icd_devices", []):
        zones = device_data.pop("zones", [])
        episodes = device_data.pop("episodes", [])
        device = ICDDevice.create(patient=patient, **device_data)
        for z in zones:
            ICDZone.create(device=device, **z)
        for e in episodes:
            ICDEpisode.create(device=device, **e)

    for s in data.get("shock_history", []):
        ICDShockHistory.create(patient=patient, **s)

    for e in data.get("ecg_readings", []):
        ECGReading.create(patient=patient, **e)

    for t in data.get("static_thresholds", []):
        StaticThreshold.create(patient=patient, **t)

    for n in data.get("clinical_notes", []):
        ClinicalNote.create(patient=patient, **n)

    for s in data.get("surgical_history", []):
        SurgicalHistory.create(patient=patient, **s)

    print(f"[SEED] Loaded clinical data for {patient.first_name} {patient.last_name}")
```

**Step 2: Test seeding**

Delete existing DB and re-init:

```bash
cd backend && rm -f knockout.db && python -c "from database import init_db; init_db()"
```

Expected: `[SEED] Loaded clinical data for Dishita Agarwal`

**Step 3: Verify data loaded**

```bash
cd backend && python -c "
from database import init_db, Patient, ICDDevice, ICDZone, Medication, ECGReading
init_db()
p = Patient.get()
print(f'Patient: {p.first_name} {p.last_name}, DOB: {p.date_of_birth}')
print(f'Diagnoses: {p.diagnoses.count()}')
print(f'Medications: {[m.drug_name for m in p.medications]}')
d = ICDDevice.get()
print(f'ICD: {d.manufacturer} {d.model}, pacing mode: {d.pacing_mode}')
print(f'ICD Zones: {[(z.zone_name, z.rate_cutoff_bpm) for z in d.zones]}')
print(f'ICD Episodes: {d.episodes.count()}')
print(f'ECG Readings: {p.ecg_readings.count()}')
"
```

Expected:
```
Patient: Dishita Agarwal, DOB: 2006-01-19
Diagnoses: 11
Medications: ['nadolol', 'spironolactone', 'norgestimate-ethinyl estradiol', 'cholecalciferol', 'multivitamin']
ICD: Boston Scientific RESONATE EL ICD D433/657030, pacing mode: DDDR
ICD Zones: [('VT', 190), ('VF', 220), ('ATR', 170)]
ICD Episodes: 3
ECG Readings: 14
```

**Step 4: Commit**

```bash
git add backend/database.py
git commit -m "feat: add clinical data seeding from JSON"
```

---

### Task 4: Add API Endpoints

**Files:**
- Modify: `backend/server.py`

**Step 1: Add clinical foundation GET endpoints**

Add these routes to `do_GET` in `SensorHandler`:

```python
elif path == "/patient":
    self._handle_get_patient()
elif path == "/patient/icd":
    self._handle_get_icd()
elif path == "/patient/icd/gap":
    self._handle_get_icd_gap()
elif path == "/patient/ecg":
    self._handle_get_ecg()
elif path == "/patient/thresholds":
    self._handle_get_thresholds()
elif path == "/patient/medications":
    self._handle_get_medications()
elif path == "/patient/triggers":
    self._handle_get_triggers()
```

**Step 2: Implement each handler**

Add the new imports at the top of `server.py`:

```python
from database import (
    Drug, Dose, db, init_db, get_current_levels,
    Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
)
```

Add handler methods:

```python
def _handle_get_patient(self):
    """GET /patient — full patient profile with diagnoses, allergies, triggers."""
    try:
        p = Patient.get()
    except Patient.DoesNotExist:
        self._send_error(404, "no patient found")
        return

    self._json({
        "id": p.id,
        "first_name": p.first_name,
        "last_name": p.last_name,
        "date_of_birth": p.date_of_birth,
        "sex": p.sex,
        "height_cm": p.height_cm,
        "weight_kg": p.weight_kg,
        "bmi": p.bmi,
        "primary_diagnosis": p.primary_diagnosis,
        "gene_variant": p.gene_variant,
        "diagnosis_date": p.diagnosis_date,
        "has_myopathy": p.has_myopathy,
        "has_sick_sinus": p.has_sick_sinus,
        "cardiac_arrest_history": p.cardiac_arrest_history,
        "sympathetic_denervation": p.sympathetic_denervation,
        "diagnoses": [
            {"diagnosis": d.diagnosis, "noted_date": d.noted_date, "notes": d.notes}
            for d in p.diagnoses
        ],
        "allergies": [
            {"allergen": a.allergen, "reaction": a.reaction}
            for a in p.allergies
        ],
    })


def _handle_get_icd(self):
    """GET /patient/icd — ICD device, zones, episodes, shock history."""
    try:
        p = Patient.get()
        device = ICDDevice.get(ICDDevice.patient == p)
    except (Patient.DoesNotExist, ICDDevice.DoesNotExist):
        self._send_error(404, "no ICD data found")
        return

    self._json({
        "device": {
            "manufacturer": device.manufacturer,
            "model": device.model,
            "implant_date": device.implant_date,
            "pacing_mode": device.pacing_mode,
            "lower_rate_limit_bpm": device.lower_rate_limit_bpm,
            "battery_life_years": device.battery_life_years,
            "battery_status": device.battery_status,
            "atrial_pacing_pct": device.atrial_pacing_pct,
            "ventricular_pacing_pct": device.ventricular_pacing_pct,
            "shock_impedance_ohms": device.shock_impedance_ohms,
            "last_interrogation_date": device.last_interrogation_date,
        },
        "zones": [
            {
                "zone_name": z.zone_name,
                "zone_type": z.zone_type,
                "rate_cutoff_bpm": z.rate_cutoff_bpm,
                "therapies": json.loads(z.therapies) if z.therapies else [],
                "atp_enabled": z.atp_enabled,
            }
            for z in device.zones.order_by(ICDZone.rate_cutoff_bpm)
        ],
        "episodes": [
            {
                "episode_datetime": e.episode_datetime,
                "zone_triggered": e.zone_triggered,
                "detected_rate_bpm": e.detected_rate_bpm,
                "avg_v_rate_bpm": e.avg_v_rate_bpm,
                "duration_seconds": e.duration_seconds,
                "therapy_delivered": e.therapy_delivered,
                "therapy_result": e.therapy_result,
                "notes": e.notes,
            }
            for e in device.episodes.order_by(ICDEpisode.episode_datetime)
        ],
        "shock_history": [
            {
                "event_date": s.event_date,
                "event_type": s.event_type,
                "context": s.context,
            }
            for s in p.shock_history.order_by(ICDShockHistory.event_date)
        ],
    })


def _handle_get_icd_gap(self):
    """GET /patient/icd/gap — computed ICD gap boundaries."""
    try:
        p = Patient.get()
        t = StaticThreshold.get(StaticThreshold.patient == p, StaticThreshold.is_current == True)
    except (Patient.DoesNotExist, StaticThreshold.DoesNotExist):
        self._send_error(404, "no threshold data found")
        return

    self._json({
        "gap_lower_bpm": t.icd_gap_lower_bpm,
        "gap_upper_bpm": t.icd_gap_upper_bpm,
        "resting_hr_bpm": t.resting_hr_bpm,
        "note": f"Events between {t.icd_gap_lower_bpm} and {t.icd_gap_upper_bpm} bpm are invisible to the ICD",
    })


def _handle_get_ecg(self):
    """GET /patient/ecg — all ECG readings, chronological."""
    try:
        p = Patient.get()
    except Patient.DoesNotExist:
        self._send_error(404, "no patient found")
        return

    self._json([
        {
            "reading_date": e.reading_date,
            "hr_bpm": e.hr_bpm,
            "pr_ms": e.pr_ms,
            "qrs_ms": e.qrs_ms,
            "qt_ms": e.qt_ms,
            "qtc_ms": e.qtc_ms,
            "findings": e.findings,
            "is_anomalous": e.is_anomalous,
            "notes": e.notes,
        }
        for e in p.ecg_readings.order_by(ECGReading.reading_date)
    ])


def _handle_get_thresholds(self):
    """GET /patient/thresholds — current static thresholds."""
    try:
        p = Patient.get()
        t = StaticThreshold.get(StaticThreshold.patient == p, StaticThreshold.is_current == True)
    except (Patient.DoesNotExist, StaticThreshold.DoesNotExist):
        self._send_error(404, "no threshold data found")
        return

    self._json({
        "effective_date": t.effective_date,
        "clinician": t.clinician,
        "resting_hr_bpm": t.resting_hr_bpm,
        "ectopy_onset_hr_bpm": t.ectopy_onset_hr_bpm,
        "prescribed_hr_ceiling": t.prescribed_hr_ceiling,
        "qrs_baseline_ms": t.qrs_baseline_ms,
        "qtc_baseline_ms": t.qtc_baseline_ms,
        "qrs_widening_alert_pct": t.qrs_widening_alert_pct,
        "qrs_absolute_alert_ms": t.qrs_absolute_alert_ms,
        "qtc_upper_limit_ms": t.qtc_upper_limit_ms,
        "icd_gap_lower_bpm": t.icd_gap_lower_bpm,
        "icd_gap_upper_bpm": t.icd_gap_upper_bpm,
    })


def _handle_get_medications(self):
    """GET /patient/medications — all active medications."""
    try:
        p = Patient.get()
    except Patient.DoesNotExist:
        self._send_error(404, "no patient found")
        return

    self._json([
        {
            "id": m.id,
            "drug_name": m.drug_name,
            "brand_name": m.brand_name,
            "drug_class": m.drug_class,
            "is_cardiac": m.is_cardiac,
            "dose_mg": m.dose_mg,
            "frequency": m.frequency,
            "dose_times": json.loads(m.dose_times) if m.dose_times else [],
            "half_life_hours": m.half_life_hours,
            "dose_per_kg": m.dose_per_kg,
            "is_active": m.is_active,
            "notes": m.notes,
        }
        for m in p.medications.where(Medication.is_active == True)
    ])


def _handle_get_triggers(self):
    """GET /patient/triggers — known triggers with source and confidence."""
    try:
        p = Patient.get()
    except Patient.DoesNotExist:
        self._send_error(404, "no patient found")
        return

    self._json([
        {
            "trigger_type": t.trigger_type,
            "source": t.source,
            "confidence": t.confidence,
            "notes": t.notes,
        }
        for t in p.triggers
    ])
```

**Step 3: Add CORS header for frontend**

The frontend runs on a different port. Add to the `_json` helper:

```python
self.send_header("Access-Control-Allow-Origin", "*")
```

And add a `do_OPTIONS` method for preflight:

```python
def do_OPTIONS(self):
    self.send_response(204)
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    self.send_header("Access-Control-Allow-Headers", "Content-Type")
    self.end_headers()
```

**Step 4: Test endpoints**

Start the server and test:

```bash
cd backend && python server.py &
curl -s http://localhost:8080/patient | python -m json.tool | head -20
curl -s http://localhost:8080/patient/icd/gap | python -m json.tool
curl -s http://localhost:8080/patient/medications | python -m json.tool
curl -s http://localhost:8080/patient/ecg | python -m json.tool | head -20
```

Expected: JSON responses with Dishita's real clinical data.

**Step 5: Update startup print block**

Add the new endpoints to the startup banner in `main()`:

```python
print(f"  Patient  :  http://{local_ip}:{PORT}/patient")
print(f"  ICD      :  http://{local_ip}:{PORT}/patient/icd")
print(f"  ICD Gap  :  http://{local_ip}:{PORT}/patient/icd/gap")
print(f"  ECG      :  http://{local_ip}:{PORT}/patient/ecg")
print(f"  Thresholds: http://{local_ip}:{PORT}/patient/thresholds")
```

**Step 6: Commit**

```bash
git add backend/server.py
git commit -m "feat: add clinical foundation API endpoints"
```

---

### Task 5: Update Report Sample Data (Optional)

**Files:**
- Modify: `backend/report/sample_data.py`

The current `sample_data.py` has incorrect data (age 7, resting HR 78, flecainide listed). Once Layer 1 is seeded, the report generator should read from the database instead.

**Step 1: Add a `get_report_data()` function to database.py**

```python
def get_report_data(patient_id: int = 1) -> dict:
    """Build the report data dict from the database, replacing sample_data.py."""
    p = Patient.get_by_id(patient_id)
    device = ICDDevice.get(ICDDevice.patient == p)
    threshold = StaticThreshold.get(
        StaticThreshold.patient == p,
        StaticThreshold.is_current == True,
    )
    cardiac_meds = Medication.select().where(
        Medication.patient == p,
        Medication.is_cardiac == True,
    )

    return {
        "patient": {
            "patient_id": f"TKOS-{p.id:03d}",
            "patient_name": p.first_name,
            "age": 19,  # computed from DOB
            "diagnosis": p.primary_diagnosis,
            "icd": True,
            "hrv_baseline_ms": None,  # populated by Layer 2 dynamic baselines
            "resting_hr_baseline": threshold.resting_hr_bpm,
        },
        "medications": [
            {
                "name": m.drug_name,
                "dose_mg": m.dose_mg,
                "half_life_hours": m.half_life_hours,
                "schedule": f"{m.frequency}, {m.dose_times}",
            }
            for m in cardiac_meds
        ],
        "icd_gap": {
            "lower_bpm": threshold.icd_gap_lower_bpm,
            "upper_bpm": threshold.icd_gap_upper_bpm,
        },
    }
```

This is optional cleanup — the report generator can continue using `sample_data.py` for the hackathon demo if needed, but this provides the path to using real data.

**Step 2: Commit**

```bash
git add backend/database.py
git commit -m "feat: add get_report_data() to read from clinical foundation"
```

---

## API Reference (after implementation)

| Endpoint | Method | Description |
|---|---|---|
| `/patient` | GET | Full patient profile with diagnoses and allergies |
| `/patient/medications` | GET | Active medications with PK parameters |
| `/patient/icd` | GET | ICD device, zones, episodes, shock history |
| `/patient/icd/gap` | GET | Computed ICD gap boundaries |
| `/patient/ecg` | GET | All ECG readings (14 historical) |
| `/patient/thresholds` | GET | Current static thresholds |
| `/patient/triggers` | GET | Known triggers with source |
| `/drugs` | GET | Drug registry (existing) |
| `/doses` | GET/POST | Dose logging (existing) |
| `/levels` | GET | Current PK levels (existing) |
| `/push` | POST | Sensor data ingestion (existing) |
| `/stats` | GET | Sensor stats (existing) |

## Open Items

- **seed/clinical.json needs to be written** with all 14 ECG readings, 11 diagnoses, 5 medications, 3 ICD zones, 3 ICD episodes, 4 shock history entries, 8+ surgeries, and the clinical note text.
- **Ectopy onset rate** is NULL — not available in current documents.
- **Prescribed HR ceiling** is NULL — not documented in the Nov 2025 note.
- **The existing `halflife.json` has "nadalol" (typo)** — should be "nadolol". The Medication model stores the correct name independently.
