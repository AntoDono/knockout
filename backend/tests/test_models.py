"""Test Layer 2 database models."""

from datetime import datetime, timezone

from database import (
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
)


def test_heart_rate_reading_create(seed_patient):
    reading = HeartRateReading.create(
        patient=seed_patient,
        recorded_at=datetime.now(timezone.utc),
        hr_bpm=75,
        source="synthetic",
    )
    assert reading.hr_bpm == 75
    assert HeartRateReading.select().count() == 1


def test_hrv_reading_create(seed_patient):
    reading = HRVReading.create(
        patient=seed_patient,
        recorded_at=datetime.now(timezone.utc),
        hrv_ms=42.5,
        source="synthetic",
        measurement_type="sdnn",
    )
    assert reading.hrv_ms == 42.5


def test_sleep_record_create(seed_patient):
    now = datetime.now(timezone.utc)
    record = SleepRecord.create(
        patient=seed_patient,
        sleep_start=now.replace(hour=23),
        sleep_end=now.replace(hour=6),
        duration_minutes=420,
        quality="good",
        source="synthetic",
    )
    assert record.duration_minutes == 420
    assert record.quality == "good"


def test_temperature_reading_create(seed_patient):
    reading = TemperatureReading.create(
        patient=seed_patient,
        recorded_at=datetime.now(timezone.utc),
        temp_c=36.2,
        source="synthetic",
    )
    assert reading.temp_c == 36.2


def test_weather_reading_create(seed_patient):
    reading = WeatherReading.create(
        patient=seed_patient,
        recorded_at=datetime.now(timezone.utc),
        temp_c=24.5,
        humidity_pct=65.0,
        source="synthetic",
    )
    assert reading.humidity_pct == 65.0


def test_episode_create(seed_patient):
    episode = Episode.create(
        patient=seed_patient,
        recorded_at=datetime.now(timezone.utc),
        source="patient_tap",
    )
    assert episode.source == "patient_tap"
    assert Episode.select().count() == 1
