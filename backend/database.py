"""
Peewee ORM models for the drug tracking system.

Models
------
  Drug  – a substance with a known half-life (seeded from halflife.json)
  Dose  – a logged intake event (drug + amount + timestamp)

Key helper
----------
  get_current_levels() → dict[str, float]
    Returns the current plasma level (in mg-equivalents) for every drug
    that has at least one dose, computed via exponential decay:

        level = Σ  amount_mg × 0.5 ^ (elapsed_s / half_life_s)
"""

import json
import math
from datetime import datetime, timezone
from pathlib import Path

from peewee import (
    SqliteDatabase,
    Model,
    AutoField,
    BooleanField,
    CharField,
    FloatField,
    IntegerField,
    TextField,
    DateTimeField,
    ForeignKeyField,
)

_DB_PATH         = Path(__file__).parent / "knockout.db"
_CACHE_FILE      = Path(__file__).parent / "halflife.json"
_CLINICAL_SEED   = Path(__file__).parent / "seed" / "clinical.json"

db = SqliteDatabase(str(_DB_PATH), pragmas={"foreign_keys": 1})


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class BaseModel(Model):
    class Meta:
        database = db


class Drug(BaseModel):
    """A substance with a known half-life."""

    id             = AutoField()
    name           = CharField(unique=True, index=True)   # lowercase canonical name
    half_life_s    = IntegerField()                        # half-life in seconds
    reasoning      = TextField(default="")                 # source / explanation

    class Meta:
        table_name = "drugs"

    @property
    def half_life_h(self) -> float:
        return self.half_life_s / 3600


class Dose(BaseModel):
    """A single intake event."""

    id         = AutoField()
    drug       = ForeignKeyField(Drug, backref="doses", on_delete="CASCADE")
    amount_mg  = FloatField()                              # dose amount in mg
    taken_at   = DateTimeField(default=lambda: datetime.now(timezone.utc))
    notes      = TextField(default="")

    class Meta:
        table_name = "doses"

    def elapsed_seconds(self, now: datetime | None = None) -> float:
        """Seconds between this dose and *now* (UTC)."""
        if now is None:
            now = datetime.now(timezone.utc)
        taken = self.taken_at
        if taken.tzinfo is None:
            taken = taken.replace(tzinfo=timezone.utc)
        return (now - taken).total_seconds()

    def remaining_fraction(self, now: datetime | None = None) -> float:
        """Fraction of dose still active: 0.5^(elapsed / half_life)."""
        elapsed = self.elapsed_seconds(now)
        return math.pow(0.5, elapsed / self.drug.half_life_s)

    def remaining_mg(self, now: datetime | None = None) -> float:
        return self.amount_mg * self.remaining_fraction(now)


# ---------------------------------------------------------------------------
# Layer 1: Clinical Foundation Models
# ---------------------------------------------------------------------------


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


_LAYER1_MODELS = [
    Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
]


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create tables and seed data."""
    db.connect(reuse_if_open=True)
    db.create_tables([Drug, Dose] + _LAYER1_MODELS, safe=True)
    _seed_from_cache()
    _seed_clinical()


def _seed_from_cache() -> None:
    if not _CACHE_FILE.exists():
        return
    cache = json.loads(_CACHE_FILE.read_text())
    for name, data in cache.items():
        Drug.get_or_create(
            name=name.strip().lower(),
            defaults={
                "half_life_s": data["halflife"],
                "reasoning":   data.get("reasoning", ""),
            },
        )


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


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

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

    # Compute age from DOB
    today = datetime.now(timezone.utc).date()
    dob = datetime.strptime(p.date_of_birth, "%Y-%m-%d").date()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return {
        "patient": {
            "patient_id": f"TKOS-{p.id:03d}",
            "patient_name": p.first_name,
            "age": age,
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


def get_current_levels(now: datetime | None = None) -> list[dict]:
    """
    Return current plasma levels for all drugs with at least one dose.

    Each entry:
        {
            "drug":         str,
            "half_life_h":  float,
            "total_dosed_mg":   float,   # sum of all doses ever logged
            "remaining_mg":     float,   # amount still active right now
            "pct_remaining":    float,   # remaining / total_dosed × 100
            "doses":        list[dict],  # individual dose breakdown
        }
    """
    if now is None:
        now = datetime.now(timezone.utc)

    results = []
    drugs_with_doses = (
        Drug
        .select()
        .join(Dose)
        .group_by(Drug.id)
    )

    for drug in drugs_with_doses:
        doses_breakdown = []
        total_dosed  = 0.0
        remaining    = 0.0

        for dose in drug.doses.order_by(Dose.taken_at):
            rem = dose.remaining_mg(now)
            total_dosed += dose.amount_mg
            remaining   += rem
            doses_breakdown.append({
                "id":           dose.id,
                "amount_mg":    dose.amount_mg,
                "taken_at":     dose.taken_at.isoformat(),
                "remaining_mg": round(rem, 4),
                "notes":        dose.notes,
            })

        results.append({
            "drug":           drug.name,
            "half_life_h":    round(drug.half_life_h, 2),
            "total_dosed_mg": round(total_dosed, 4),
            "remaining_mg":   round(remaining, 4),
            "pct_remaining":  round(remaining / total_dosed * 100, 2) if total_dosed else 0.0,
            "doses":          doses_breakdown,
        })

    return results
