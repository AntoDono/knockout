"""Test /push endpoint persists readings to stream tables."""

from database import HeartRateReading, HRVReading, TemperatureReading, WeatherReading


def test_push_persists_heart_rate(client, seed_patient):
    payload = {
        "messageId": "test-1",
        "payload": [
            {"name": "heartRate", "time": 1700000000000000000, "values": {"bpm": 82}}
        ],
    }
    resp = client.post("/push", json=payload)
    assert resp.status_code == 200
    assert HeartRateReading.select().count() == 1
    reading = HeartRateReading.get()
    assert reading.hr_bpm == 82


def test_push_persists_hrv(client, seed_patient):
    payload = {
        "messageId": "test-2",
        "payload": [
            {"name": "hrv", "time": 1700000000000000000, "values": {"hrv_ms": 44.5}}
        ],
    }
    resp = client.post("/push", json=payload)
    assert resp.status_code == 200
    assert HRVReading.select().count() == 1


def test_push_persists_temperature(client, seed_patient):
    payload = {
        "messageId": "test-3",
        "payload": [
            {"name": "wrist_temperature", "time": 1700000000000000000, "values": {"temp_c": 36.3}}
        ],
    }
    resp = client.post("/push", json=payload)
    assert resp.status_code == 200
    assert TemperatureReading.select().count() == 1


def test_push_persists_weather(client, seed_patient):
    payload = {
        "messageId": "test-4",
        "payload": [
            {"name": "weather", "time": 1700000000000000000, "values": {"temp_c": 25.0, "humidity_pct": 60.0}}
        ],
    }
    resp = client.post("/push", json=payload)
    assert resp.status_code == 200
    assert WeatherReading.select().count() == 1


def test_push_unknown_sensor_not_persisted(client, seed_patient):
    """Unknown sensors are tracked in stats but not persisted."""
    payload = {
        "messageId": "test-5",
        "payload": [
            {"name": "gyroscope", "time": 1700000000000000000, "values": {"x": 1.0}}
        ],
    }
    resp = client.post("/push", json=payload)
    assert resp.status_code == 200
    # No stream tables should have data
    assert HeartRateReading.select().count() == 0
