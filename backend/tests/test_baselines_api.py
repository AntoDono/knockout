"""Test GET /baselines endpoint."""

from datetime import datetime, timezone, timedelta
from database import HeartRateReading


def test_baselines_endpoint(client, seed_patient):
    now = datetime.now(timezone.utc)
    for h in range(10):
        HeartRateReading.create(
            patient=seed_patient,
            recorded_at=now - timedelta(hours=h),
            hr_bpm=72,
            source="synthetic",
        )

    resp = client.get("/baselines")
    assert resp.status_code == 200
    data = resp.json()
    assert "hr" in data
    assert data["hr"]["count"] == 10
    assert data["hr"]["mean"] == 72.0


def test_baselines_empty(client, seed_patient):
    resp = client.get("/baselines")
    assert resp.status_code == 200
    data = resp.json()
    assert data["hr"]["count"] == 0
