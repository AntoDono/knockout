"""
Clinical foundation API endpoints (Layer 1).

  GET /patient              – full patient profile
  GET /patient/icd          – ICD device, zones, episodes, shock history
  GET /patient/icd/gap      – computed ICD gap boundaries
  GET /patient/ecg          – all ECG readings
  GET /patient/thresholds   – current static thresholds
  GET /patient/medications  – active medications
  GET /patient/triggers     – known triggers
"""

import json

from fastapi import APIRouter, HTTPException

from database import (
    Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
)

router = APIRouter(prefix="/patient", tags=["patient"])


def _get_patient() -> Patient:
    try:
        return Patient.get()
    except Patient.DoesNotExist:
        raise HTTPException(status_code=404, detail="no patient found")


@router.get("")
def get_patient():
    p = _get_patient()
    return {
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
    }


@router.get("/icd")
def get_icd():
    p = _get_patient()
    try:
        device = ICDDevice.get(ICDDevice.patient == p)
    except ICDDevice.DoesNotExist:
        raise HTTPException(status_code=404, detail="no ICD data found")

    return {
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
    }


@router.get("/icd/gap")
def get_icd_gap():
    p = _get_patient()
    try:
        t = StaticThreshold.get(
            StaticThreshold.patient == p, StaticThreshold.is_current == True
        )
    except StaticThreshold.DoesNotExist:
        raise HTTPException(status_code=404, detail="no threshold data found")

    return {
        "gap_lower_bpm": t.icd_gap_lower_bpm,
        "gap_upper_bpm": t.icd_gap_upper_bpm,
        "resting_hr_bpm": t.resting_hr_bpm,
        "note": f"Events between {t.icd_gap_lower_bpm} and {t.icd_gap_upper_bpm} bpm are invisible to the ICD",
    }


@router.get("/ecg")
def get_ecg():
    p = _get_patient()
    return [
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
    ]


@router.get("/thresholds")
def get_thresholds():
    p = _get_patient()
    try:
        t = StaticThreshold.get(
            StaticThreshold.patient == p, StaticThreshold.is_current == True
        )
    except StaticThreshold.DoesNotExist:
        raise HTTPException(status_code=404, detail="no threshold data found")

    return {
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
    }


@router.get("/medications")
def get_medications():
    p = _get_patient()
    return [
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
    ]


@router.get("/triggers")
def get_triggers():
    p = _get_patient()
    return [
        {
            "trigger_type": t.trigger_type,
            "source": t.source,
            "confidence": t.confidence,
            "notes": t.notes,
        }
        for t in p.triggers
    ]
