"""Test rolling baselines computation."""

from datetime import datetime, timezone, timedelta

from database import HeartRateReading, HRVReading, SleepRecord, TemperatureReading, WeatherReading
from services.baselines import get_rolling_baselines


def _insert_hr(patient, hr_bpm, hours_ago, now):
    HeartRateReading.create(
        patient=patient,
        recorded_at=now - timedelta(hours=hours_ago),
        hr_bpm=hr_bpm,
        source="synthetic",
    )


def test_hr_baseline(seed_patient):
    now = datetime.now(timezone.utc)
    for h in range(24):
        _insert_hr(seed_patient, 70 + h % 5, h, now)

    baselines = get_rolling_baselines(seed_patient.id, now=now)
    assert "hr" in baselines
    assert baselines["hr"]["count"] == 24
    assert 70 <= baselines["hr"]["mean"] <= 75


def test_empty_baselines(seed_patient):
    now = datetime.now(timezone.utc)
    baselines = get_rolling_baselines(seed_patient.id, now=now)
    assert baselines["hr"]["count"] == 0
    assert baselines["hr"]["mean"] is None


def test_old_data_excluded(seed_patient):
    now = datetime.now(timezone.utc)
    # Insert reading 8 days ago — outside 7-day window
    _insert_hr(seed_patient, 80, hours_ago=8 * 24, now=now)
    baselines = get_rolling_baselines(seed_patient.id, now=now)
    assert baselines["hr"]["count"] == 0


def test_hrv_baseline(seed_patient):
    now = datetime.now(timezone.utc)
    for h in range(10):
        HRVReading.create(
            patient=seed_patient,
            recorded_at=now - timedelta(hours=h),
            hrv_ms=40.0 + h,
            source="synthetic",
            measurement_type="sdnn",
        )
    baselines = get_rolling_baselines(seed_patient.id, now=now)
    assert baselines["hrv"]["count"] == 10
    assert 40 <= baselines["hrv"]["mean"] <= 50


def test_sleep_baseline(seed_patient):
    now = datetime.now(timezone.utc)
    for d in range(5):
        day = now - timedelta(days=d)
        SleepRecord.create(
            patient=seed_patient,
            sleep_start=day.replace(hour=23),
            sleep_end=(day + timedelta(hours=7)).replace(hour=6),
            duration_minutes=360 + d * 10,
            quality="good",
            source="synthetic",
        )
    baselines = get_rolling_baselines(seed_patient.id, now=now)
    assert baselines["sleep"]["count"] == 5
    assert baselines["sleep"]["mean_duration_min"] is not None
