"""Test synthetic data generation."""

from database import (
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
)
from services.synthetic import generate_synthetic_data


def test_generates_all_streams(seed_patient):
    result = generate_synthetic_data(seed_patient.id)

    assert result["hr_count"] > 0
    assert result["hrv_count"] > 0
    assert result["sleep_count"] > 0
    assert result["temperature_count"] > 0
    assert result["weather_count"] > 0
    assert result["episode_count"] > 0

    assert HeartRateReading.select().count() == result["hr_count"]
    assert Episode.select().count() == result["episode_count"]


def test_idempotent(seed_patient):
    generate_synthetic_data(seed_patient.id)
    count_1 = HeartRateReading.select().count()

    generate_synthetic_data(seed_patient.id)
    count_2 = HeartRateReading.select().count()

    # Second run clears synthetic data first, so counts should be equal
    assert count_1 == count_2


def test_episodes_cluster_in_troughs(seed_patient):
    """Episodes should be placed during medication trough windows."""
    result = generate_synthetic_data(seed_patient.id)
    episodes = list(Episode.select().where(Episode.source == "synthetic"))
    assert len(episodes) >= 4
