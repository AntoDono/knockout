# Layer 2: Passive Data Engine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persistent storage, rolling baselines, episode context, and synthetic data generation for all six passive data streams (HR, HRV, sleep, wrist temp, weather, medication).

**Architecture:** Five new Peewee models + one Episode model in `database.py`. Extended `/push` endpoint for ingestion. New `services/baselines.py` and `services/synthetic.py`. New `routes/episodes.py` and `routes/baselines.py`. On-the-fly 7-day rolling baselines computed at query time.

**Tech Stack:** Python 3.13, FastAPI, Peewee ORM, SQLite, pytest, uv

**Design doc:** `docs/plans/2026-03-01-layer2-passive-data-engine-design.md`

---

## Task 1: Set Up Test Infrastructure

There are no tests in the project yet. Set up pytest with an in-memory SQLite database.

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_smoke.py`

**Step 1: Add pytest as dev dependency**

Run: `cd backend && uv add --dev pytest httpx`

(`httpx` is needed for FastAPI's `TestClient`.)

**Step 2: Create test directory and conftest**

Create `backend/tests/__init__.py` (empty).

Create `backend/tests/conftest.py`:

```python
"""Shared test fixtures — in-memory DB, FastAPI test client."""

import pytest
from peewee import SqliteDatabase
from fastapi.testclient import TestClient

import database as db_module
from database import (
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
)

# Will be extended in Task 2 with Layer 2 models
ALL_MODELS = [
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
]

_test_db = SqliteDatabase(":memory:", pragmas={"foreign_keys": 1})


@pytest.fixture(autouse=True)
def setup_test_db():
    """Bind all models to an in-memory DB, create tables, tear down after."""
    _test_db.bind(ALL_MODELS)
    _test_db.connect()
    _test_db.create_tables(ALL_MODELS)
    yield
    _test_db.drop_tables(ALL_MODELS)
    _test_db.close()


@pytest.fixture
def seed_patient():
    """Create a minimal test patient with static thresholds."""
    patient = Patient.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth="2006-01-19",
        sex="female",
        primary_diagnosis="TKOS",
    )
    StaticThreshold.create(
        patient=patient,
        effective_date="2025-11-20",
        resting_hr_bpm=70,
        icd_gap_lower_bpm=70,
        icd_gap_upper_bpm=190,
        is_current=True,
    )
    return patient


@pytest.fixture
def client():
    """FastAPI TestClient with in-memory DB."""
    from server import app
    return TestClient(app)
```

**Step 3: Write a smoke test**

Create `backend/tests/test_smoke.py`:

```python
"""Smoke test — verify test infra works."""

from database import Patient


def test_db_setup(seed_patient):
    assert Patient.select().count() == 1
    assert seed_patient.first_name == "Test"
```

**Step 4: Run smoke test**

Run: `cd backend && uv run python -m pytest tests/test_smoke.py -v`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/tests/ backend/pyproject.toml backend/uv.lock
git commit -m "test: add pytest infrastructure with in-memory SQLite"
```

---

## Task 2: Add Layer 2 Database Models

Add the five new stream tables plus the Episode table to `database.py`.

**Files:**
- Modify: `backend/database.py` (add 6 new models after `SurgicalHistory`, update `_LAYER1_MODELS` list, update `init_db`)
- Modify: `backend/tests/conftest.py` (add new models to `ALL_MODELS`)
- Create: `backend/tests/test_models.py`

**Step 1: Write failing tests for new models**

Create `backend/tests/test_models.py`:

```python
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
```

**Step 2: Run tests — expect failure**

Run: `cd backend && uv run python -m pytest tests/test_models.py -v`

Expected: ImportError — `HeartRateReading` not found in `database`.

**Step 3: Add models to `database.py`**

After the `SurgicalHistory` class (around line 319), add:

```python
# ---------------------------------------------------------------------------
# Layer 2: Passive Data Streams
# ---------------------------------------------------------------------------


class HeartRateReading(BaseModel):
    """Continuous heart rate from watch or sensor."""
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="hr_readings", on_delete="CASCADE")
    recorded_at = DateTimeField(index=True)
    hr_bpm = IntegerField()
    source = CharField(default="sensor_logger")  # apple_watch, sensor_logger, synthetic
    activity = CharField(null=True)  # resting, walking, active

    class Meta:
        table_name = "hr_readings"
        indexes = ((("patient", "recorded_at"), False),)


class HRVReading(BaseModel):
    """Heart rate variability measurements."""
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="hrv_readings", on_delete="CASCADE")
    recorded_at = DateTimeField(index=True)
    hrv_ms = FloatField()  # SDNN in milliseconds
    source = CharField(default="sensor_logger")
    measurement_type = CharField(default="sdnn")  # sdnn, rmssd

    class Meta:
        table_name = "hrv_readings"
        indexes = ((("patient", "recorded_at"), False),)


class SleepRecord(BaseModel):
    """One row per sleep session."""
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="sleep_records", on_delete="CASCADE")
    sleep_start = DateTimeField()
    sleep_end = DateTimeField()
    duration_minutes = IntegerField()
    quality = CharField()  # poor, fair, good, excellent
    deep_minutes = IntegerField(null=True)
    rem_minutes = IntegerField(null=True)
    awakenings = IntegerField(null=True)
    source = CharField(default="synthetic")

    class Meta:
        table_name = "sleep_records"
        indexes = ((("patient", "sleep_start"), False),)


class TemperatureReading(BaseModel):
    """Wrist temperature from Apple Watch."""
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="temperature_readings", on_delete="CASCADE")
    recorded_at = DateTimeField(index=True)
    temp_c = FloatField()  # Celsius
    deviation_c = FloatField(null=True)  # deviation from personal baseline
    source = CharField(default="synthetic")

    class Meta:
        table_name = "temperature_readings"
        indexes = ((("patient", "recorded_at"), False),)


class WeatherReading(BaseModel):
    """Ambient environmental conditions."""
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="weather_readings", on_delete="CASCADE")
    recorded_at = DateTimeField(index=True)
    temp_c = FloatField()  # ambient temp Celsius
    humidity_pct = FloatField()
    location_lat = FloatField(null=True)
    location_lon = FloatField(null=True)
    source = CharField(default="synthetic")  # openweathermap, synthetic

    class Meta:
        table_name = "weather_readings"
        indexes = ((("patient", "recorded_at"), False),)


class Episode(BaseModel):
    """One-tap symptom capture — timestamp marker with context reconstructed from streams."""
    id = AutoField()
    patient = ForeignKeyField(Patient, backref="episodes", on_delete="CASCADE")
    recorded_at = DateTimeField(index=True)
    notes = TextField(null=True)
    source = CharField(default="patient_tap")  # patient_tap, synthetic

    class Meta:
        table_name = "episodes"
        indexes = ((("patient", "recorded_at"), False),)
```

Update the `_LAYER1_MODELS` list (rename it to `_ALL_APP_MODELS` or keep the name and add the new ones). Add after the existing list:

```python
_LAYER2_MODELS = [
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
]
```

Update `init_db()` to include Layer 2 models:

```python
def init_db() -> None:
    """Create tables and seed data."""
    db.connect(reuse_if_open=True)
    db.create_tables([Drug, Dose] + _LAYER1_MODELS + _LAYER2_MODELS, safe=True)
    _seed_from_cache()
    _seed_clinical()
```

**Step 4: Update `tests/conftest.py`** to include new models in `ALL_MODELS`:

Add imports and extend the list:

```python
from database import (
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
)

ALL_MODELS = [
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
]
```

**Step 5: Run tests**

Run: `cd backend && uv run python -m pytest tests/test_models.py -v`

Expected: All 6 tests PASS.

**Step 6: Commit**

```bash
git add backend/database.py backend/tests/
git commit -m "feat: add Layer 2 database models (HR, HRV, sleep, temp, weather, episode)"
```

---

## Task 3: Extend `/push` to Persist Readings

Modify `routes/sensor.py` to persist incoming sensor data to the appropriate table.

**Files:**
- Modify: `backend/routes/sensor.py` (add `_persist_reading` helper, call it from `push_sensor_data`)
- Create: `backend/tests/test_push.py`

**Step 1: Write failing tests**

Create `backend/tests/test_push.py`:

```python
"""Test /push endpoint persists readings to stream tables."""

from database import HeartRateReading, HRVReading, TemperatureReading, WeatherReading, Patient


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
```

**Step 2: Run tests — expect failure**

Run: `cd backend && uv run python -m pytest tests/test_push.py -v`

Expected: FAIL — HR reading not persisted (current code only buffers in memory).

**Step 3: Implement persistence in `sensor.py`**

Add imports at top of `routes/sensor.py`:

```python
from datetime import datetime, timezone

from database import (
    Patient, HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading,
)
```

Add helper functions before the endpoints:

```python
def _get_default_patient():
    """Get patient 1 (single-patient hackathon system)."""
    try:
        return Patient.get_by_id(1)
    except Patient.DoesNotExist:
        return None


def _classify_sensor(name: str) -> str | None:
    """Map sensor name to stream type."""
    n = name.lower()
    if any(k in n for k in ("heart", "bpm", "pulse")) or n == "hr":
        return "hr"
    if "hrv" in n or "heart_rate_variability" in n:
        return "hrv"
    if "sleep" in n:
        return "sleep"
    if "temp" in n or "wrist_temp" in n:
        return "temperature"
    if "weather" in n or "environment" in n:
        return "weather"
    return None


def _persist_reading(stream: str, values: dict, timestamp: datetime, patient) -> None:
    """Route a reading to the appropriate model."""
    if patient is None:
        return

    if stream == "hr":
        bpm = _extract_bpm(values)
        if bpm is not None:
            HeartRateReading.create(
                patient=patient,
                recorded_at=timestamp,
                hr_bpm=int(round(bpm)),
                source="sensor_logger",
                activity=values.get("activity"),
            )
    elif stream == "hrv":
        hrv_val = values.get("hrv_ms") or values.get("hrv") or values.get("value")
        if hrv_val is not None:
            HRVReading.create(
                patient=patient,
                recorded_at=timestamp,
                hrv_ms=float(hrv_val),
                source="sensor_logger",
                measurement_type=values.get("type", "sdnn"),
            )
    elif stream == "sleep":
        SleepRecord.create(
            patient=patient,
            sleep_start=values.get("sleep_start", timestamp),
            sleep_end=values.get("sleep_end", timestamp),
            duration_minutes=int(values.get("duration_minutes", 0)),
            quality=values.get("quality", "fair"),
            source="sensor_logger",
            deep_minutes=values.get("deep_minutes"),
            rem_minutes=values.get("rem_minutes"),
            awakenings=values.get("awakenings"),
        )
    elif stream == "temperature":
        temp = values.get("temp_c") or values.get("temperature") or values.get("value")
        if temp is not None:
            TemperatureReading.create(
                patient=patient,
                recorded_at=timestamp,
                temp_c=float(temp),
                deviation_c=values.get("deviation_c"),
                source="sensor_logger",
            )
    elif stream == "weather":
        temp = values.get("temp_c") or values.get("temperature")
        humidity = values.get("humidity_pct") or values.get("humidity")
        if temp is not None and humidity is not None:
            WeatherReading.create(
                patient=patient,
                recorded_at=timestamp,
                temp_c=float(temp),
                humidity_pct=float(humidity),
                location_lat=values.get("lat"),
                location_lon=values.get("lon"),
                source="sensor_logger",
            )
```

In the `push_sensor_data` function, after the existing `stats["sensors"]` update block and before the heart sensor check, add:

```python
        # Persist to stream table
        stream = _classify_sensor(name)
        if stream:
            reading_time = datetime.fromtimestamp(t, tz=timezone.utc)
            _persist_reading(stream, values, reading_time, _get_default_patient())
```

**Step 4: Run tests**

Run: `cd backend && uv run python -m pytest tests/test_push.py -v`

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add backend/routes/sensor.py backend/tests/test_push.py
git commit -m "feat: extend /push to persist readings to Layer 2 stream tables"
```

---

## Task 4: Rolling Baselines Service

New service that computes 7-day rolling baselines on-the-fly.

**Files:**
- Create: `backend/services/baselines.py`
- Create: `backend/tests/test_baselines.py`

**Step 1: Write failing tests**

Create `backend/tests/test_baselines.py`:

```python
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
```

**Step 2: Run tests — expect failure**

Run: `cd backend && uv run python -m pytest tests/test_baselines.py -v`

Expected: ImportError — `services.baselines` not found.

**Step 3: Implement baselines service**

Create `backend/services/baselines.py`:

```python
"""
Rolling 7-day baselines for all six passive data streams.

Computes mean, std, and count on-the-fly from the last 7 days of readings.
No background jobs — queries SQLite directly at request time.
"""

from datetime import datetime, timezone, timedelta

from database import (
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, get_current_levels,
)

_WINDOW_DAYS = 7

# Map sleep quality to numeric score for averaging
_QUALITY_SCORES = {"poor": 1, "fair": 2, "good": 3, "excellent": 4}


def _safe_stats(values: list[float]) -> dict:
    """Compute mean and std from a list of floats, handling empty lists."""
    if not values:
        return {"mean": None, "std": None}
    n = len(values)
    mean = sum(values) / n
    if n < 2:
        return {"mean": round(mean, 2), "std": 0.0}
    variance = sum((x - mean) ** 2 for x in values) / (n - 1)
    return {"mean": round(mean, 2), "std": round(variance ** 0.5, 2)}


def get_rolling_baselines(patient_id: int, now: datetime | None = None) -> dict:
    """
    Compute 7-day rolling baselines for all streams.

    Returns dict with keys: hr, hrv, sleep, temperature, weather, medication.
    Each contains mean, std (where applicable), count, and window_days.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=_WINDOW_DAYS)

    # --- Heart Rate ---
    hr_values = [
        r.hr_bpm for r in
        HeartRateReading.select(HeartRateReading.hr_bpm).where(
            HeartRateReading.patient == patient_id,
            HeartRateReading.recorded_at >= cutoff,
        )
    ]
    hr_stats = _safe_stats([float(v) for v in hr_values])

    # --- HRV ---
    hrv_values = [
        r.hrv_ms for r in
        HRVReading.select(HRVReading.hrv_ms).where(
            HRVReading.patient == patient_id,
            HRVReading.recorded_at >= cutoff,
        )
    ]
    hrv_stats = _safe_stats(hrv_values)

    # --- Sleep ---
    sleep_records = list(
        SleepRecord.select(SleepRecord.duration_minutes, SleepRecord.quality).where(
            SleepRecord.patient == patient_id,
            SleepRecord.sleep_start >= cutoff,
        )
    )
    sleep_durations = [r.duration_minutes for r in sleep_records]
    sleep_qualities = [_QUALITY_SCORES.get(r.quality, 2) for r in sleep_records]
    sleep_dur_stats = _safe_stats([float(d) for d in sleep_durations])
    sleep_qual_stats = _safe_stats([float(q) for q in sleep_qualities])

    # --- Temperature ---
    temp_values = [
        r.temp_c for r in
        TemperatureReading.select(TemperatureReading.temp_c).where(
            TemperatureReading.patient == patient_id,
            TemperatureReading.recorded_at >= cutoff,
        )
    ]
    temp_stats = _safe_stats(temp_values)

    # --- Weather ---
    weather_records = list(
        WeatherReading.select(WeatherReading.temp_c, WeatherReading.humidity_pct).where(
            WeatherReading.patient == patient_id,
            WeatherReading.recorded_at >= cutoff,
        )
    )
    weather_temp_stats = _safe_stats([r.temp_c for r in weather_records])
    weather_hum_stats = _safe_stats([r.humidity_pct for r in weather_records])

    # --- Medication (existing) ---
    medication = get_current_levels()

    return {
        "hr": {
            **hr_stats,
            "count": len(hr_values),
            "window_days": _WINDOW_DAYS,
        },
        "hrv": {
            **hrv_stats,
            "count": len(hrv_values),
            "window_days": _WINDOW_DAYS,
        },
        "sleep": {
            "mean_duration_min": sleep_dur_stats["mean"],
            "std_duration_min": sleep_dur_stats["std"],
            "mean_quality_score": sleep_qual_stats["mean"],
            "count": len(sleep_records),
            "window_days": _WINDOW_DAYS,
        },
        "temperature": {
            **temp_stats,
            "count": len(temp_values),
            "window_days": _WINDOW_DAYS,
        },
        "weather": {
            "mean_temp_c": weather_temp_stats["mean"],
            "std_temp_c": weather_temp_stats["std"],
            "mean_humidity_pct": weather_hum_stats["mean"],
            "std_humidity_pct": weather_hum_stats["std"],
            "count": len(weather_records),
            "window_days": _WINDOW_DAYS,
        },
        "medication": medication,
    }
```

**Step 4: Run tests**

Run: `cd backend && uv run python -m pytest tests/test_baselines.py -v`

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add backend/services/baselines.py backend/tests/test_baselines.py
git commit -m "feat: add rolling 7-day baselines service for all six streams"
```

---

## Task 5: Baselines API Route

Expose baselines via `GET /baselines`.

**Files:**
- Create: `backend/routes/baselines.py`
- Modify: `backend/routes/__init__.py` (add export)
- Modify: `backend/server.py` (register router)
- Create: `backend/tests/test_baselines_api.py`

**Step 1: Write failing test**

Create `backend/tests/test_baselines_api.py`:

```python
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
```

**Step 2: Run tests — expect failure**

Run: `cd backend && uv run python -m pytest tests/test_baselines_api.py -v`

Expected: 404 — route not found.

**Step 3: Create the route**

Create `backend/routes/baselines.py`:

```python
"""
Baselines API — rolling 7-day personal baselines for all streams.

  GET /baselines  — returns rolling baselines for patient 1
"""

from fastapi import APIRouter

from services.baselines import get_rolling_baselines

router = APIRouter(tags=["baselines"])


@router.get("/baselines")
def get_baselines():
    return get_rolling_baselines(patient_id=1)
```

Update `backend/routes/__init__.py`:

```python
from .sensor import router as sensor_router
from .drugs import router as drugs_router
from .patient import router as patient_router
from .reports import router as report_router
from .baselines import router as baselines_router

__all__ = [
    "sensor_router", "drugs_router", "patient_router",
    "report_router", "baselines_router",
]
```

Update `backend/server.py` — add import and router:

```python
from routes import sensor_router, drugs_router, patient_router, report_router, baselines_router
```

```python
app.include_router(baselines_router)
```

**Step 4: Run tests**

Run: `cd backend && uv run python -m pytest tests/test_baselines_api.py -v`

Expected: All 2 tests PASS.

**Step 5: Commit**

```bash
git add backend/routes/baselines.py backend/routes/__init__.py backend/server.py backend/tests/test_baselines_api.py
git commit -m "feat: add GET /baselines endpoint for rolling 7-day personal baselines"
```

---

## Task 6: Episodes API Route

Episode CRUD and 24-hour context reconstruction.

**Files:**
- Create: `backend/routes/episodes.py`
- Modify: `backend/routes/__init__.py` (add export)
- Modify: `backend/server.py` (register router)
- Create: `backend/tests/test_episodes.py`

**Step 1: Write failing tests**

Create `backend/tests/test_episodes.py`:

```python
"""Test episodes endpoints."""

from datetime import datetime, timezone, timedelta
from database import Episode, HeartRateReading, HRVReading


def test_create_episode(client, seed_patient):
    resp = client.post("/episodes", json={"notes": "felt dizzy"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["notes"] == "felt dizzy"
    assert data["source"] == "patient_tap"
    assert Episode.select().count() == 1


def test_list_episodes(client, seed_patient):
    now = datetime.now(timezone.utc)
    Episode.create(patient=seed_patient, recorded_at=now, source="patient_tap")
    Episode.create(
        patient=seed_patient,
        recorded_at=now - timedelta(hours=5),
        source="patient_tap",
    )

    resp = client.get("/episodes")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


def test_episode_context(client, seed_patient):
    now = datetime.now(timezone.utc)
    ep = Episode.create(patient=seed_patient, recorded_at=now, source="patient_tap")

    # Insert some HR data in the 24h window
    for h in range(5):
        HeartRateReading.create(
            patient=seed_patient,
            recorded_at=now - timedelta(hours=h),
            hr_bpm=72 + h,
            source="synthetic",
        )
    # Insert one HR reading outside window (25h ago) — should be excluded
    HeartRateReading.create(
        patient=seed_patient,
        recorded_at=now - timedelta(hours=25),
        hr_bpm=99,
        source="synthetic",
    )

    resp = client.get(f"/episodes/{ep.id}/context")
    assert resp.status_code == 200
    data = resp.json()
    assert data["episode"]["id"] == ep.id
    assert len(data["hr"]) == 5  # only the 5 within 24h window
    assert "hrv" in data
    assert "sleep" in data
    assert "temperature" in data
    assert "weather" in data
    assert "baselines" in data


def test_episode_not_found(client, seed_patient):
    resp = client.get("/episodes/999/context")
    assert resp.status_code == 404
```

**Step 2: Run tests — expect failure**

Run: `cd backend && uv run python -m pytest tests/test_episodes.py -v`

Expected: 404 or 405 — route not found.

**Step 3: Implement episodes route**

Create `backend/routes/episodes.py`:

```python
"""
Episodes API — one-tap symptom capture with 24-hour context reconstruction.

  POST /episodes              — create an episode (the one-tap)
  GET  /episodes              — list episodes (optional ?start= &end= filters)
  GET  /episodes/{id}/context — full 24-hour context from all six streams
"""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database import (
    Patient, Episode, HeartRateReading, HRVReading,
    SleepRecord, TemperatureReading, WeatherReading,
    get_current_levels,
)
from services.baselines import get_rolling_baselines

router = APIRouter(tags=["episodes"])

_CONTEXT_HOURS = 24


class EpisodeCreate(BaseModel):
    notes: str | None = None


@router.post("/episodes", status_code=201)
def create_episode(body: EpisodeCreate):
    patient = Patient.get_by_id(1)
    now = datetime.now(timezone.utc)
    episode = Episode.create(
        patient=patient,
        recorded_at=now,
        notes=body.notes,
        source="patient_tap",
    )
    return {
        "id": episode.id,
        "recorded_at": episode.recorded_at.isoformat(),
        "notes": episode.notes,
        "source": episode.source,
    }


@router.get("/episodes")
def list_episodes(
    start: str | None = Query(None),
    end: str | None = Query(None),
):
    query = Episode.select().where(
        Episode.patient == 1
    ).order_by(Episode.recorded_at.desc())

    if start:
        query = query.where(Episode.recorded_at >= start)
    if end:
        query = query.where(Episode.recorded_at <= end)

    return [
        {
            "id": e.id,
            "recorded_at": e.recorded_at.isoformat() if isinstance(e.recorded_at, datetime) else e.recorded_at,
            "notes": e.notes,
            "source": e.source,
        }
        for e in query
    ]


@router.get("/episodes/{episode_id}/context")
def get_episode_context(episode_id: int):
    try:
        episode = Episode.get_by_id(episode_id)
    except Episode.DoesNotExist:
        raise HTTPException(status_code=404, detail=f"episode {episode_id} not found")

    ep_time = episode.recorded_at
    if isinstance(ep_time, str):
        ep_time = datetime.fromisoformat(ep_time)
    if ep_time.tzinfo is None:
        ep_time = ep_time.replace(tzinfo=timezone.utc)

    window_start = ep_time - timedelta(hours=_CONTEXT_HOURS)
    patient_id = episode.patient_id

    # Query each stream for the 24h window
    hr = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "hr_bpm": r.hr_bpm, "activity": r.activity}
        for r in HeartRateReading.select().where(
            HeartRateReading.patient == patient_id,
            HeartRateReading.recorded_at >= window_start,
            HeartRateReading.recorded_at <= ep_time,
        ).order_by(HeartRateReading.recorded_at)
    ]

    hrv = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "hrv_ms": r.hrv_ms, "measurement_type": r.measurement_type}
        for r in HRVReading.select().where(
            HRVReading.patient == patient_id,
            HRVReading.recorded_at >= window_start,
            HRVReading.recorded_at <= ep_time,
        ).order_by(HRVReading.recorded_at)
    ]

    sleep = [
        {"sleep_start": r.sleep_start.isoformat() if isinstance(r.sleep_start, datetime) else r.sleep_start,
         "sleep_end": r.sleep_end.isoformat() if isinstance(r.sleep_end, datetime) else r.sleep_end,
         "duration_minutes": r.duration_minutes, "quality": r.quality}
        for r in SleepRecord.select().where(
            SleepRecord.patient == patient_id,
            SleepRecord.sleep_start >= window_start,
            SleepRecord.sleep_start <= ep_time,
        ).order_by(SleepRecord.sleep_start)
    ]

    temperature = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "temp_c": r.temp_c, "deviation_c": r.deviation_c}
        for r in TemperatureReading.select().where(
            TemperatureReading.patient == patient_id,
            TemperatureReading.recorded_at >= window_start,
            TemperatureReading.recorded_at <= ep_time,
        ).order_by(TemperatureReading.recorded_at)
    ]

    weather = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "temp_c": r.temp_c, "humidity_pct": r.humidity_pct}
        for r in WeatherReading.select().where(
            WeatherReading.patient == patient_id,
            WeatherReading.recorded_at >= window_start,
            WeatherReading.recorded_at <= ep_time,
        ).order_by(WeatherReading.recorded_at)
    ]

    baselines = get_rolling_baselines(patient_id, now=ep_time)

    return {
        "episode": {
            "id": episode.id,
            "recorded_at": episode.recorded_at.isoformat() if isinstance(episode.recorded_at, datetime) else episode.recorded_at,
            "notes": episode.notes,
        },
        "context_window": {
            "start": window_start.isoformat(),
            "end": ep_time.isoformat(),
        },
        "hr": hr,
        "hrv": hrv,
        "sleep": sleep,
        "temperature": temperature,
        "weather": weather,
        "medication_levels": get_current_levels(now=ep_time),
        "baselines": baselines,
    }
```

Update `backend/routes/__init__.py` — add:

```python
from .episodes import router as episodes_router
```

And to `__all__`:

```python
__all__ = [
    "sensor_router", "drugs_router", "patient_router",
    "report_router", "baselines_router", "episodes_router",
]
```

Update `backend/server.py` — add import and router:

```python
from routes import (
    sensor_router, drugs_router, patient_router,
    report_router, baselines_router, episodes_router,
)
```

```python
app.include_router(episodes_router)
```

**Step 4: Run tests**

Run: `cd backend && uv run python -m pytest tests/test_episodes.py -v`

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add backend/routes/episodes.py backend/routes/__init__.py backend/server.py backend/tests/test_episodes.py
git commit -m "feat: add episodes API with 24-hour context reconstruction"
```

---

## Task 7: Synthetic Data Generator

Generate 7 days of clinically plausible demo data.

**Files:**
- Create: `backend/services/synthetic.py`
- Create: `backend/routes/synthetic.py`
- Modify: `backend/routes/__init__.py` (add export)
- Modify: `backend/server.py` (register router)
- Create: `backend/tests/test_synthetic.py`

**Step 1: Write failing test**

Create `backend/tests/test_synthetic.py`:

```python
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
```

**Step 2: Run tests — expect failure**

Run: `cd backend && uv run python -m pytest tests/test_synthetic.py -v`

Expected: ImportError — `services.synthetic` not found.

**Step 3: Implement synthetic data generator**

Create `backend/services/synthetic.py`:

```python
"""
Synthetic data generator for hackathon demo.

Generates 7 days of clinically plausible data across all six streams
for the TKOS patient. Data patterns are designed to demonstrate:
  - HR/HRV changes during medication trough windows
  - Sleep deprivation preceding worse HRV days
  - Episode clustering during troughs + poor sleep
"""

import math
import random
from datetime import datetime, timezone, timedelta

from database import (
    Patient, Medication,
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
)

_DAYS = 7
_HR_BASELINE = 70      # pacemaker lower rate
_HRV_BASELINE = 44.0   # ms SDNN
_TEMP_BASELINE = 36.1   # wrist temp Celsius


def _gaussian(mean: float, std: float) -> float:
    return random.gauss(mean, std)


def _is_trough_window(hour_of_day: float, dose_times: list[float], half_life_h: float) -> bool:
    """Check if current hour is in a medication trough window (>60% of half-life since last dose)."""
    for dose_hour in dose_times:
        hours_since = (hour_of_day - dose_hour) % 24
        if hours_since > half_life_h * 0.6:
            return True
    return False


def _get_nadolol_dose_times(patient_id: int) -> tuple[list[float], float]:
    """Get nadolol dose times and half-life from medication table."""
    try:
        med = Medication.get(
            Medication.patient == patient_id,
            Medication.drug_name == "nadolol",
        )
        import json
        times = json.loads(med.dose_times)
        dose_hours = []
        for t in times:
            parts = t.split(":")
            dose_hours.append(int(parts[0]) + int(parts[1]) / 60)
        return dose_hours, med.half_life_hours or 22.0
    except Medication.DoesNotExist:
        return [9.0, 20.0], 22.0


def _clear_synthetic(patient_id: int) -> None:
    """Remove all synthetic data for a patient."""
    HeartRateReading.delete().where(
        HeartRateReading.patient == patient_id,
        HeartRateReading.source == "synthetic",
    ).execute()
    HRVReading.delete().where(
        HRVReading.patient == patient_id,
        HRVReading.source == "synthetic",
    ).execute()
    SleepRecord.delete().where(
        SleepRecord.patient == patient_id,
        SleepRecord.source == "synthetic",
    ).execute()
    TemperatureReading.delete().where(
        TemperatureReading.patient == patient_id,
        TemperatureReading.source == "synthetic",
    ).execute()
    WeatherReading.delete().where(
        WeatherReading.patient == patient_id,
        WeatherReading.source == "synthetic",
    ).execute()
    Episode.delete().where(
        Episode.patient == patient_id,
        Episode.source == "synthetic",
    ).execute()


def generate_synthetic_data(patient_id: int = 1) -> dict:
    """
    Generate 7 days of synthetic data for all six streams.

    Returns a summary dict with counts per stream.
    """
    _clear_synthetic(patient_id)

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=_DAYS)

    dose_times, half_life_h = _get_nadolol_dose_times(patient_id)

    # Plan sleep quality per night (day 3 and 5 are bad sleep nights)
    sleep_quality = ["good", "good", "fair", "poor", "good", "poor", "fair"]

    counts = {
        "hr_count": 0, "hrv_count": 0, "sleep_count": 0,
        "temperature_count": 0, "weather_count": 0, "episode_count": 0,
    }

    hr_batch = []
    hrv_batch = []
    temp_batch = []
    weather_batch = []

    for day in range(_DAYS):
        day_start = start + timedelta(days=day)
        is_poor_sleep = sleep_quality[day] in ("poor",)
        prev_poor_sleep = day > 0 and sleep_quality[day - 1] in ("poor",)

        # --- HR and HRV: one reading every 5 minutes during waking hours (7am-11pm) ---
        for minute in range(0, 24 * 60, 5):
            hour = minute / 60.0
            t = day_start + timedelta(minutes=minute)
            if t > now:
                break

            is_sleeping = hour < 7 or hour >= 23
            in_trough = _is_trough_window(hour, dose_times, half_life_h)

            # HR: elevated in trough, lower during sleep
            hr_mean = _HR_BASELINE
            if in_trough:
                hr_mean += 10
            if prev_poor_sleep:
                hr_mean += 4
            if is_sleeping:
                hr_mean -= 5

            activity = "resting"
            if not is_sleeping and random.random() < 0.08:
                activity = "walking"
                hr_mean += 15

            hr = max(55, min(130, int(_gaussian(hr_mean, 3))))
            hr_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "hr_bpm": hr,
                "source": "synthetic",
                "activity": activity,
            })
            counts["hr_count"] += 1

            # HRV: inversely correlated with HR stress
            hrv_mean = _HRV_BASELINE
            if in_trough:
                hrv_mean -= 12
            if prev_poor_sleep:
                hrv_mean -= 6
            if is_sleeping:
                hrv_mean += 8

            hrv = max(10, min(80, round(_gaussian(hrv_mean, 4), 1)))
            hrv_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "hrv_ms": hrv,
                "source": "synthetic",
                "measurement_type": "sdnn",
            })
            counts["hrv_count"] += 1

        # --- Temperature: every 30 minutes ---
        for minute in range(0, 24 * 60, 30):
            hour = minute / 60.0
            t = day_start + timedelta(minutes=minute)
            if t > now:
                break

            # Circadian variation: cooler at night, warmer midday
            circadian = 0.3 * math.sin(2 * math.pi * (hour - 14) / 24)
            # Day 5: simulate low-grade fever
            fever_bump = 0.8 if day == 5 else 0.0
            temp = round(_gaussian(_TEMP_BASELINE + circadian + fever_bump, 0.15), 2)

            temp_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "temp_c": temp,
                "deviation_c": round(temp - _TEMP_BASELINE, 2),
                "source": "synthetic",
            })
            counts["temperature_count"] += 1

        # --- Weather: every 30 minutes (Durham, NC seasonal) ---
        for minute in range(0, 24 * 60, 30):
            hour = minute / 60.0
            t = day_start + timedelta(minutes=minute)
            if t > now:
                break

            # Late winter Durham: ~8-16°C, humidity 50-75%
            diurnal = 4 * math.sin(2 * math.pi * (hour - 14) / 24)
            ambient = round(_gaussian(12 + diurnal + day * 0.5, 1.5), 1)
            humidity = round(_gaussian(62 - diurnal * 2, 5), 1)
            humidity = max(30, min(95, humidity))

            weather_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "temp_c": ambient,
                "humidity_pct": humidity,
                "source": "synthetic",
            })
            counts["weather_count"] += 1

        # --- Sleep: one record per night ---
        quality = sleep_quality[day]
        duration = {"poor": random.randint(280, 340), "fair": random.randint(340, 400),
                     "good": random.randint(400, 460), "excellent": random.randint(440, 500)}
        dur = duration[quality]
        sleep_start = day_start + timedelta(hours=23)
        sleep_end = sleep_start + timedelta(minutes=dur)
        if sleep_end <= now:
            SleepRecord.create(
                patient=patient_id,
                sleep_start=sleep_start,
                sleep_end=sleep_end,
                duration_minutes=dur,
                quality=quality,
                deep_minutes=int(dur * random.uniform(0.15, 0.25)),
                rem_minutes=int(dur * random.uniform(0.2, 0.3)),
                awakenings=random.randint(0, 3) if quality != "poor" else random.randint(3, 7),
                source="synthetic",
            )
            counts["sleep_count"] += 1

    # Batch insert HR, HRV, temp, weather
    with HeartRateReading._meta.database.atomic():
        for batch in [hr_batch[i:i+100] for i in range(0, len(hr_batch), 100)]:
            HeartRateReading.insert_many(batch).execute()

    with HRVReading._meta.database.atomic():
        for batch in [hrv_batch[i:i+100] for i in range(0, len(hrv_batch), 100)]:
            HRVReading.insert_many(batch).execute()

    with TemperatureReading._meta.database.atomic():
        for batch in [temp_batch[i:i+100] for i in range(0, len(temp_batch), 100)]:
            TemperatureReading.insert_many(batch).execute()

    with WeatherReading._meta.database.atomic():
        for batch in [weather_batch[i:i+100] for i in range(0, len(weather_batch), 100)]:
            WeatherReading.insert_many(batch).execute()

    # --- Episodes: 4-6 episodes clustered during troughs and after poor sleep ---
    episode_targets = []
    for day in range(_DAYS):
        day_start = start + timedelta(days=day)
        prev_poor = day > 0 and sleep_quality[day - 1] == "poor"
        # Place episodes on days after poor sleep, during trough windows
        if prev_poor:
            # Morning trough (before first dose) and evening trough
            episode_targets.append(day_start + timedelta(hours=7, minutes=random.randint(0, 60)))
            episode_targets.append(day_start + timedelta(hours=18, minutes=random.randint(0, 120)))
        elif random.random() < 0.3:
            # Occasional episode on other days during trough
            episode_targets.append(day_start + timedelta(hours=random.choice([7, 18, 19]),
                                                          minutes=random.randint(0, 60)))

    for ep_time in episode_targets:
        if ep_time <= now:
            Episode.create(
                patient=patient_id,
                recorded_at=ep_time,
                source="synthetic",
            )
            counts["episode_count"] += 1

    return counts
```

**Step 4: Create the API route**

Create `backend/routes/synthetic.py`:

```python
"""
Synthetic data API — generate demo data for hackathon.

  POST /synthetic/generate  — generate 7 days of synthetic data
"""

from fastapi import APIRouter

from services.synthetic import generate_synthetic_data

router = APIRouter(tags=["synthetic"])


@router.post("/synthetic/generate")
def generate_data():
    result = generate_synthetic_data(patient_id=1)
    return {"status": "ok", **result}
```

Update `backend/routes/__init__.py` — add:

```python
from .synthetic import router as synthetic_router
```

And to `__all__`:

```python
__all__ = [
    "sensor_router", "drugs_router", "patient_router",
    "report_router", "baselines_router", "episodes_router",
    "synthetic_router",
]
```

Update `backend/server.py` — add import and router:

```python
from routes import (
    sensor_router, drugs_router, patient_router,
    report_router, baselines_router, episodes_router,
    synthetic_router,
)
```

```python
app.include_router(synthetic_router)
```

**Step 5: Run tests**

Run: `cd backend && uv run python -m pytest tests/test_synthetic.py -v`

Expected: All 3 tests PASS.

**Step 6: Run full test suite**

Run: `cd backend && uv run python -m pytest tests/ -v`

Expected: All tests PASS.

**Step 7: Commit**

```bash
git add backend/services/synthetic.py backend/routes/synthetic.py backend/routes/__init__.py backend/server.py backend/tests/test_synthetic.py
git commit -m "feat: add synthetic data generator with 7 days of clinically plausible demo data"
```

---

## Task 8: Update CLAUDE.md with New Endpoints

Update the project documentation to reflect the new API surface.

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add new routes to the API routes table in CLAUDE.md**

Add these rows to the API routes section:

```
/baselines         GET    routes/baselines.py – rolling 7-day personal baselines
/episodes          POST   routes/episodes.py  – create episode (one-tap)
/episodes          GET    routes/episodes.py  – list episodes (?start= &end= filter)
/episodes/{id}/context GET routes/episodes.py – 24-hour context for episode
/synthetic/generate POST  routes/synthetic.py – generate 7 days of demo data
```

Add a new "Layer 2 models" section under the Database layer documentation:

```
**Layer 2 (passive streams):** 6 models — `HeartRateReading`, `HRVReading`, `SleepRecord`, `TemperatureReading`, `WeatherReading`, `Episode`. All indexed on `(patient_id, recorded_at)`.
```

Add a note under Services:

```
- `baselines.py` — 7-day rolling baseline computation for all streams
- `synthetic.py` — 7-day synthetic data generator for hackathon demo
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Layer 2 endpoints and models"
```

---

## Summary of Deliverables

| Task | What | Files Created/Modified |
|------|------|----------------------|
| 1 | Test infrastructure | `tests/conftest.py`, `tests/test_smoke.py` |
| 2 | 6 new DB models | `database.py`, `tests/test_models.py` |
| 3 | `/push` persistence | `routes/sensor.py`, `tests/test_push.py` |
| 4 | Baselines service | `services/baselines.py`, `tests/test_baselines.py` |
| 5 | `GET /baselines` | `routes/baselines.py`, `tests/test_baselines_api.py` |
| 6 | Episodes API | `routes/episodes.py`, `tests/test_episodes.py` |
| 7 | Synthetic generator | `services/synthetic.py`, `routes/synthetic.py`, `tests/test_synthetic.py` |
| 8 | Documentation | `CLAUDE.md` |

**Total: 8 tasks, ~8 commits, 7 new files, 4 modified files.**
