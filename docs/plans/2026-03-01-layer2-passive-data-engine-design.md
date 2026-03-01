# Layer 2: Passive Data Engine — Design Document

**Date:** 2026-03-01
**Status:** Approved
**Scope:** Backend data models, ingestion, rolling baselines, episode context, synthetic data generation

---

## Overview

Layer 2 adds persistent storage and baseline computation for six passive data streams that run continuously without patient effort. This replaces the current state where only medication timing is fully modeled — HR and HRV exist only as in-memory simulation, and sleep, wrist temperature, and weather have no infrastructure at all.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Stream scope | All 6 streams | Full Layer 2 as described in overview.md. Synthetic data fills gaps where real sensors aren't available at hackathon. |
| Data model | One table per stream | Each stream has genuinely different fields, cadences, and query patterns. Five small tables is not a problem for SQLite. |
| Ingestion | Single `/push` endpoint | Extend existing Sensor Logger endpoint with name-based routing. One firehose, backend sorts it out. |
| Baselines | On-the-fly at query time | Query last 7 days and compute mean/std on demand. Fine for SQLite at hackathon scale. No background jobs. |
| Episode context | Reference-based | Episode is a timestamp marker. Context reconstructed by querying each stream's table for 24h before the timestamp. No data duplication. |

---

## 1. New Database Models

All models extend `BaseModel` (Peewee on SQLite). All have a composite index on `(patient_id, recorded_at)`.

### HeartRateReading

| Column | Type | Notes |
|---|---|---|
| patient | FK → Patient | CASCADE delete |
| recorded_at | DateTime | UTC |
| hr_bpm | Integer | Beats per minute |
| source | CharField | "apple_watch", "sensor_logger", "synthetic" |
| activity | CharField (nullable) | "resting", "walking", "active" |

### HRVReading

| Column | Type | Notes |
|---|---|---|
| patient | FK → Patient | CASCADE delete |
| recorded_at | DateTime | UTC |
| hrv_ms | Float | SDNN in milliseconds |
| source | CharField | Same as above |
| measurement_type | CharField | "sdnn", "rmssd" — Apple Watch reports SDNN |

### SleepRecord

| Column | Type | Notes |
|---|---|---|
| patient | FK → Patient | CASCADE delete |
| sleep_start | DateTime | UTC |
| sleep_end | DateTime | UTC |
| duration_minutes | Integer | Total sleep time |
| quality | CharField | "poor", "fair", "good", "excellent" |
| deep_minutes | Integer (nullable) | Deep sleep duration |
| rem_minutes | Integer (nullable) | REM sleep duration |
| awakenings | Integer (nullable) | Number of awakenings |
| source | CharField | Same as above |

### TemperatureReading

| Column | Type | Notes |
|---|---|---|
| patient | FK → Patient | CASCADE delete |
| recorded_at | DateTime | UTC |
| temp_c | Float | Celsius from Apple Watch wrist sensor |
| deviation_c | Float (nullable) | Deviation from personal baseline (as reported by Apple Watch) |
| source | CharField | Same as above |

### WeatherReading

| Column | Type | Notes |
|---|---|---|
| patient | FK → Patient | CASCADE delete |
| recorded_at | DateTime | UTC |
| temp_c | Float | Ambient temperature Celsius |
| humidity_pct | Float | Relative humidity percentage |
| location_lat | Float (nullable) | Latitude |
| location_lon | Float (nullable) | Longitude |
| source | CharField | "openweathermap", "synthetic" |

### Episode

| Column | Type | Notes |
|---|---|---|
| patient | FK → Patient | CASCADE delete |
| recorded_at | DateTime | UTC — the moment of the tap |
| notes | TextField (nullable) | Optional patient note |
| source | CharField | "patient_tap", "synthetic" |

---

## 2. Extended `/push` Endpoint

The existing `POST /push` receives Sensor Logger payloads where each reading has a `name` field. We add name-based routing to persist readings to the appropriate table.

### Sensor name mapping

| Sensor name pattern | Handler | Table |
|---|---|---|
| `heart*`, `bpm`, `pulse`, `hr` | Heart rate | `hr_readings` |
| `hrv*`, `heart_rate_variability` | HRV | `hrv_readings` |
| `sleep*` | Sleep | `sleep_records` |
| `temp*`, `wrist_temp*` | Temperature | `temperature_readings` |
| `weather*`, `environment*` | Weather | `weather_readings` |

### Behavior

- After updating in-memory stats (existing behavior), also persist to the appropriate table via `_persist_reading(name, values, timestamp)`
- The BPM buffer for AFib detection stays as-is (in-memory deque for real-time analysis)
- Patient ID defaults to patient 1 (single-patient hackathon system). Optional `patient_id` field in push payload for future multi-patient support.
- Unknown sensor names are tracked in stats but not persisted (existing behavior).

---

## 3. Rolling Baselines Service

New file: `services/baselines.py`

### Function signature

```python
get_rolling_baselines(patient_id: int, now: datetime | None = None) -> dict
```

### Return shape

```python
{
  "hr":          {"mean": 74.2, "std": 6.1, "count": 1420, "window_days": 7},
  "hrv":         {"mean": 42.5, "std": 8.3, "count": 1420, "window_days": 7},
  "sleep":       {"mean_duration_min": 410, "mean_quality_score": 2.5, "count": 7, "window_days": 7},
  "temperature": {"mean_c": 36.1, "std": 0.3, "count": 200, "window_days": 7},
  "weather":     {"mean_temp_c": 22.4, "mean_humidity_pct": 55.0, "count": 336, "window_days": 7},
  "medication":  <existing get_current_levels() output>
}
```

### Deviation detection

Compare latest reading to rolling baseline. Flag when > 1.5 standard deviations from personal mean. This replaces population-norm thresholds with personal baselines per the overview's core principle.

### Relationship to StaticThreshold

Static thresholds remain as the clinical reference (pacemaker lower rate, ICD gap boundaries, QTc limits). Rolling baselines are the dynamic Layer 2 complement. Both are available — the system uses whichever is clinically relevant.

### API endpoint

`GET /baselines` — returns the rolling baselines dict for the patient.

---

## 4. Episode Context API

### Endpoints

- `POST /episodes` — create an episode (the one-tap). Body: `{"notes": "optional"}`. Returns the episode with ID.
- `GET /episodes` — list episodes with optional `?start=` and `?end=` date range filter.
- `GET /episodes/{id}/context` — returns full 24-hour context from all six streams.

### Context response shape

```python
{
  "episode": {"id": 1, "recorded_at": "...", "notes": null},
  "context_window": {"start": "...", "end": "..."},
  "hr": [{"recorded_at": "...", "hr_bpm": 82}, ...],
  "hrv": [{"recorded_at": "...", "hrv_ms": 38.2}, ...],
  "sleep": [{"sleep_start": "...", "sleep_end": "...", "duration_minutes": 340, "quality": "poor"}, ...],
  "temperature": [{"recorded_at": "...", "temp_c": 36.4}, ...],
  "weather": [{"recorded_at": "...", "temp_c": 28.5, "humidity_pct": 72.0}, ...],
  "medication_levels": [...],
  "baselines": {...}
}
```

### Frontend change

`useEpisodes` hook switches from local state to backend API calls. Episode type gains optional `context` field populated on drill-in.

---

## 5. Synthetic Data Generation

New file: `services/synthetic.py`

### What it generates

7 days of backdated data across all six streams, seeded with clinically plausible patterns for the TKOS patient (Dishita Agarwal).

### Stream-specific patterns

- **HR:** Baseline 70 bpm (pacemaker-set). Gaussian noise ±4 bpm. Elevated periods (+12 bpm) during simulated trough windows (18-22h post-dose). Brief spikes (90-110 bpm) during simulated activity.
- **HRV:** Baseline ~44ms SDNN. Drops during trough windows (correlating with HR elevation). Higher during sleep.
- **Sleep:** 7 nights, 5-7 hours (matching clinical note: "sleeps 5-6 hours"). Occasional poor quality nights that precede higher HR / lower HRV the next day.
- **Temperature:** Baseline ~36.1°C wrist temp. Stable with slight circadian variation (~0.5°C). One simulated low-grade fever day to demonstrate detection.
- **Weather:** Realistic seasonal data for Durham, NC. Temperature and humidity varying by time of day.
- **Episodes:** 4-6 pre-seeded episodes, clustered during medication trough windows and poor sleep days to demonstrate the trough-episode correlation.

### API endpoint

`POST /synthetic/generate` — generates and inserts 7 days of synthetic data. Idempotent: clears existing synthetic data first (identified by `source = "synthetic"`).

### Frontend

"Generate Demo Data" button (dev/demo mode) that calls this endpoint.

---

## What Stays Unchanged

- `Drug` / `Dose` models and all medication endpoints
- `StaticThreshold` and all Layer 1 clinical foundation models
- Report module (`report/`)
- AFib detection (`services/heart_analyze.py`)
- In-memory BPM buffer and WebSocket broadcast in sensor.py
