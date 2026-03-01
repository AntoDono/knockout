"""
Hardcoded sample data for a TKOS patient (Dishita).

This simulates what the real database would provide once the Episode model
and data streams are wired up. All values are clinically plausible for a
TKOS patient on nadolol + flecainide with an ICD.

Replace this with real DB queries when the persistence layer is ready.
"""

from datetime import datetime, timedelta, timezone

# ── Reporting period ──────────────────────────────────────────────────────

_NOW = datetime(2026, 2, 28, 14, 0, 0, tzinfo=timezone.utc)
_PERIOD_START = _NOW - timedelta(days=90)
_PERIOD_END = _NOW

# ── Medications ───────────────────────────────────────────────────────────

MEDICATIONS = [
    {
        "name": "nadolol",
        "dose_mg": 40.0,
        "half_life_hours": 22.0,
        "schedule": "once daily, 08:00",
        "trough_window_start_hours": 16,
        "trough_threshold_pct": 55.0,
    },
    {
        "name": "flecainide",
        "dose_mg": 50.0,
        "half_life_hours": 14.0,
        "schedule": "twice daily, 08:00 / 20:00",
        "trough_window_start_hours": 10,
        "trough_threshold_pct": 50.0,
    },
]

# ── Episodes (one-tap captures) ──────────────────────────────────────────
# Each episode includes the context snapshot at time of tap.

EPISODES = [
    {
        "id": "ep-001",
        "timestamp": (_PERIOD_START + timedelta(days=8, hours=3, minutes=12)).isoformat(),
        "day_of_week": "Saturday",
        "heart_rate": 108.0,
        "hrv": 24.0,
        "drug_level": 42.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 42.0, "hours_since_dose": 19.2, "in_trough": True},
            "flecainide": {"pct_remaining": 58.0, "hours_since_dose": 7.2,  "in_trough": False},
        },
        "sleep_prior_night": {"duration_hours": 5.1, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 72.0, "humidity_pct": 45.0},
        "wrist_temperature": {"value_f": 98.4, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.18},
    },
    {
        "id": "ep-002",
        "timestamp": (_PERIOD_START + timedelta(days=15, hours=14, minutes=45)).isoformat(),
        "day_of_week": "Saturday",
        "heart_rate": 115.0,
        "hrv": 19.0,
        "drug_level": 38.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 38.0, "hours_since_dose": 20.8, "in_trough": True},
            "flecainide": {"pct_remaining": 41.0, "hours_since_dose": 8.8,  "in_trough": True},
        },
        "sleep_prior_night": {"duration_hours": 4.5, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 88.0, "humidity_pct": 72.0},
        "wrist_temperature": {"value_f": 98.8, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.31},
    },
    {
        "id": "ep-003",
        "timestamp": (_PERIOD_START + timedelta(days=22, hours=6, minutes=30)).isoformat(),
        "day_of_week": "Friday",
        "heart_rate": 102.0,
        "hrv": 26.0,
        "drug_level": 51.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 51.0, "hours_since_dose": 16.5, "in_trough": True},
            "flecainide": {"pct_remaining": 63.0, "hours_since_dose": 6.5,  "in_trough": False},
        },
        "sleep_prior_night": {"duration_hours": 7.0, "baseline_hours": 7.2, "below_baseline": False},
        "environment":       {"temperature_f": 91.0, "humidity_pct": 78.0},
        "wrist_temperature": {"value_f": 98.6, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.12},
    },
    {
        "id": "ep-004",
        "timestamp": (_PERIOD_START + timedelta(days=31, hours=17, minutes=20)).isoformat(),
        "day_of_week": "Sunday",
        "heart_rate": 122.0,
        "hrv": 17.0,
        "drug_level": 35.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 35.0, "hours_since_dose": 21.3, "in_trough": True},
            "flecainide": {"pct_remaining": 38.0, "hours_since_dose": 9.3,  "in_trough": True},
        },
        "sleep_prior_night": {"duration_hours": 4.0, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 94.0, "humidity_pct": 82.0},
        "wrist_temperature": {"value_f": 99.2, "elevated": True},
        "afib_result":       {"detected": True, "confidence": 0.58},
    },
    {
        "id": "ep-005",
        "timestamp": (_PERIOD_START + timedelta(days=38, hours=2, minutes=10)).isoformat(),
        "day_of_week": "Wednesday",
        "heart_rate": 98.0,
        "hrv": 29.0,
        "drug_level": 48.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 48.0, "hours_since_dose": 18.2, "in_trough": True},
            "flecainide": {"pct_remaining": 55.0, "hours_since_dose": 6.2,  "in_trough": False},
        },
        "sleep_prior_night": {"duration_hours": 6.5, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 85.0, "humidity_pct": 60.0},
        "wrist_temperature": {"value_f": 98.5, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.22},
    },
    {
        "id": "ep-006",
        "timestamp": (_PERIOD_START + timedelta(days=45, hours=11, minutes=55)).isoformat(),
        "day_of_week": "Wednesday",
        "heart_rate": 112.0,
        "hrv": 21.0,
        "drug_level": 44.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 44.0, "hours_since_dose": 19.9, "in_trough": True},
            "flecainide": {"pct_remaining": 47.0, "hours_since_dose": 7.9,  "in_trough": True},
        },
        "sleep_prior_night": {"duration_hours": 5.5, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 90.0, "humidity_pct": 75.0},
        "wrist_temperature": {"value_f": 98.7, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.35},
    },
    {
        "id": "ep-007",
        "timestamp": (_PERIOD_START + timedelta(days=52, hours=8, minutes=40)).isoformat(),
        "day_of_week": "Wednesday",
        "heart_rate": 95.0,
        "hrv": 31.0,
        "drug_level": 72.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 72.0, "hours_since_dose": 8.7,  "in_trough": False},
            "flecainide": {"pct_remaining": 68.0, "hours_since_dose": 4.7,  "in_trough": False},
        },
        "sleep_prior_night": {"duration_hours": 3.5, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 78.0, "humidity_pct": 50.0},
        "wrist_temperature": {"value_f": 99.8, "elevated": True},
        "afib_result":       {"detected": False, "confidence": 0.15},
    },
    {
        "id": "ep-008",
        "timestamp": (_PERIOD_START + timedelta(days=58, hours=16, minutes=5)).isoformat(),
        "day_of_week": "Tuesday",
        "heart_rate": 118.0,
        "hrv": 18.0,
        "drug_level": 39.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 39.0, "hours_since_dose": 20.1, "in_trough": True},
            "flecainide": {"pct_remaining": 43.0, "hours_since_dose": 8.1,  "in_trough": True},
        },
        "sleep_prior_night": {"duration_hours": 6.0, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 87.0, "humidity_pct": 68.0},
        "wrist_temperature": {"value_f": 98.5, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.41},
    },
    {
        "id": "ep-009",
        "timestamp": (_PERIOD_START + timedelta(days=67, hours=13, minutes=22)).isoformat(),
        "day_of_week": "Thursday",
        "heart_rate": 105.0,
        "hrv": 25.0,
        "drug_level": 46.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 46.0, "hours_since_dose": 19.4, "in_trough": True},
            "flecainide": {"pct_remaining": 52.0, "hours_since_dose": 7.4,  "in_trough": False},
        },
        "sleep_prior_night": {"duration_hours": 7.5, "baseline_hours": 7.2, "below_baseline": False},
        "environment":       {"temperature_f": 82.0, "humidity_pct": 55.0},
        "wrist_temperature": {"value_f": 98.4, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.19},
    },
    {
        "id": "ep-010",
        "timestamp": (_PERIOD_START + timedelta(days=75, hours=19, minutes=50)).isoformat(),
        "day_of_week": "Friday",
        "heart_rate": 125.0,
        "hrv": 15.0,
        "drug_level": 33.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 33.0, "hours_since_dose": 23.8, "in_trough": True},
            "flecainide": {"pct_remaining": 35.0, "hours_since_dose": 11.8, "in_trough": True},
        },
        "sleep_prior_night": {"duration_hours": 4.2, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 93.0, "humidity_pct": 80.0},
        "wrist_temperature": {"value_f": 99.0, "elevated": True},
        "afib_result":       {"detected": True, "confidence": 0.62},
    },
    {
        "id": "ep-011",
        "timestamp": (_PERIOD_START + timedelta(days=83, hours=5, minutes=15)).isoformat(),
        "day_of_week": "Saturday",
        "heart_rate": 100.0,
        "hrv": 27.0,
        "drug_level": 50.0,
        "medication_coverage": {
            "nadolol":    {"pct_remaining": 50.0, "hours_since_dose": 17.3, "in_trough": True},
            "flecainide": {"pct_remaining": 59.0, "hours_since_dose": 5.3,  "in_trough": False},
        },
        "sleep_prior_night": {"duration_hours": 5.8, "baseline_hours": 7.2, "below_baseline": True},
        "environment":       {"temperature_f": 76.0, "humidity_pct": 48.0},
        "wrist_temperature": {"value_f": 98.3, "elevated": False},
        "afib_result":       {"detected": False, "confidence": 0.14},
    },
]

# ── Dose log (for adherence calculation) ──────────────────────────────────

DOSES = {
    "nadolol": {
        "expected": 90,
        "logged": 87,
        "missed_timestamps": [
            (_PERIOD_START + timedelta(days=14)).isoformat(),
            (_PERIOD_START + timedelta(days=30)).isoformat(),
            (_PERIOD_START + timedelta(days=74)).isoformat(),
        ],
    },
    "flecainide": {
        "expected": 180,
        "logged": 174,
        "missed_timestamps": [
            (_PERIOD_START + timedelta(days=14)).isoformat(),
            (_PERIOD_START + timedelta(days=14, hours=12)).isoformat(),
            (_PERIOD_START + timedelta(days=30)).isoformat(),
            (_PERIOD_START + timedelta(days=30, hours=12)).isoformat(),
            (_PERIOD_START + timedelta(days=74)).isoformat(),
            (_PERIOD_START + timedelta(days=74, hours=12)).isoformat(),
        ],
    },
}

# ── Patient metadata ─────────────────────────────────────────────────────

PATIENT = {
    "patient_id": "TKOS-001",
    "patient_name": "Dishita",
    "age": 7,
    "diagnosis": "Triadin Knockout Syndrome (TKOS)",
    "icd": True,
    "hrv_baseline_ms": 35.0,
    "resting_hr_baseline": 78.0,
}

# ── Bundled for convenience ───────────────────────────────────────────────

SAMPLE_REPORT_DATA = {
    "patient": PATIENT,
    "medications": MEDICATIONS,
    "episodes": EPISODES,
    "doses": DOSES,
    "period_start": _PERIOD_START.isoformat(),
    "period_end": _PERIOD_END.isoformat(),
}
