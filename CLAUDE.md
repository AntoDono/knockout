# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Knockout — a cardiac monitoring platform for Triadin Knockout Syndrome (TKOS), an ultra-rare inherited heart condition (~340 patients worldwide). The system passively monitors a patient's body and environment, lets them flag symptomatic moments with one tap, and generates physician reports that make subclinical events visible.

## Commands

### Backend
```bash
cd backend
uv sync                          # install dependencies (creates .venv)
uv run python server.py          # FastAPI on port 8080, auto-creates knockout.db
uv run python -m report.pdf      # generate example PDF + JSON to report/examples/
```

### Frontend
```bash
cd frontend
npm install
npm run dev                      # Next.js dev server on port 3000
npm run build                    # production build
npm run lint                     # ESLint
```

### Database reset
```bash
cd backend && rm -f knockout.db && uv run python -c "from database import init_db; init_db()"
```

**After merges:** If `knockout.db` has merge conflicts, resolve by running `init_db()` — it creates missing tables (`safe=True`) without touching existing data. `sqlite3 knockout.db ".tables"` to verify.

### Synthetic demo data
```bash
curl -X POST http://localhost:8080/synthetic/generate   # or via the app
```

## Documentation

`docs/overview.md` — full project vision, the 6-layer architecture, and the three blind spots (ICD Gap, Visit Gap, Why Gap). Read this first for context.
`docs/prob_statement.md` — hackathon problem statement (Track 3: Symptom Management for rare disease).
`docs/plans/` — design documents and implementation plans for each layer.

## Architecture

**Backend:** FastAPI (Python 3.13, uv) with Peewee ORM on SQLite (`knockout.db`). The DB file is tracked in git with seed data.
**Frontend:** Next.js 16, React 19, Tailwind CSS v4, D3.js for charts.

### API routes

`server.py` is a thin FastAPI wiring file. All routes live in `routes/`:

```
/push              POST   routes/sensor.py    – ingest Sensor Logger payloads
/stats             GET    routes/sensor.py    – per-sensor request counts
/ws                WS     routes/sensor.py    – live HR stream + AFib detection

/drugs             GET    routes/drugs.py     – list registered drugs
/drugs             POST   routes/drugs.py     – register drug (auto-lookup half-life via Grok)
/doses             GET    routes/drugs.py     – list doses (?drug= filter)
/doses             POST   routes/drugs.py     – log a dose
/doses/{id}        DELETE routes/drugs.py     – delete a dose
/levels            GET    routes/drugs.py     – current PK decay levels

/patient           GET    routes/patient.py   – full profile + diagnoses + allergies
/patient/icd       GET    routes/patient.py   – device, zones, episodes, shock history
/patient/icd/gap   GET    routes/patient.py   – ICD gap boundaries (70–190 bpm)
/patient/ecg       GET    routes/patient.py   – 14 historical ECG readings
/patient/thresholds GET   routes/patient.py   – current static thresholds
/patient/medications GET  routes/patient.py   – active medications with PK params
/patient/triggers  GET    routes/patient.py   – known triggers with source/confidence

/report            GET    routes/reports.py   – generate cardiology PDF report

/baselines         GET    routes/baselines.py – rolling 7-day personal baselines

/episodes          POST   routes/episodes.py  – create episode (one-tap)
/episodes          GET    routes/episodes.py  – list episodes (?start= &end= filter)
/episodes/{id}/context GET routes/episodes.py – 24-hour context for episode

/synthetic/generate POST  routes/synthetic.py – generate 7 days of demo data
```

### Services (`services/`)

Business logic utilities used by routes:
- `heart_analyze.py` — AFib detection from BPM readings
- `llm_tools.py` — Drug half-life lookup via Grok
- `baselines.py` — 7-day rolling baseline computation for all streams
- `synthetic.py` — 7-day synthetic data generator for hackathon demo

### Database layer (`database.py`)

Two tiers of Peewee models:

**Core (drug tracking):** `Drug`, `Dose` — general drug half-life registry and dose logging with exponential decay PK computation via `get_current_levels()`.

**Layer 1 (clinical foundation):** 13 models seeded from `seed/clinical.json` on first startup — `Patient`, `PatientDiagnosis`, `PatientAllergy`, `KnownTrigger`, `Medication`, `ICDDevice`, `ICDZone`, `ICDEpisode`, `ICDShockHistory`, `ECGReading`, `StaticThreshold`, `ClinicalNote`, `SurgicalHistory`.

Seeding is idempotent — `_seed_clinical()` skips if any Patient row exists.

**Layer 2 (passive streams):** 6 models — `HeartRateReading`, `HRVReading`, `SleepRecord`, `TemperatureReading`, `WeatherReading`, `Episode`. All indexed on `(patient_id, recorded_at)`. The `/push` endpoint persists incoming sensor data to the appropriate table via name-based routing.

### Report module (`report/`)

Self-contained — no dependency on server.py or database.py. Takes a plain data dict, outputs structured JSON report + PDF. Can be tested standalone. `get_report_data()` in database.py bridges the DB to the report module's expected input format.

### Frontend hooks

State management via custom hooks, no external state library:
- `useVitals` — simulated HR/HRV based on current drug level
- `usePKData` — 48-hour medication concentration curves
- `useEpisodes` — one-tap episode capture with context snapshot

Frontend currently simulates vitals; not yet wired to backend API.

## Domain concepts

**ICD Gap:** The patient's ICD ignores arrhythmias between 70-190 bpm to prevent shock storms. Knockout monitors this blind zone. `GET /patient/icd/gap` returns the boundaries.

**PK decay model:** `remaining = amount_mg * 0.5^(elapsed_s / half_life_s)`. Implemented in both `database.py` (backend) and `lib/simulate.ts` (frontend). Nadolol half-life = 22h; symptoms cluster during trough windows.

**Static thresholds:** Patient-specific baselines from clinical records (resting HR 70 bpm is pacemaker-set, not intrinsic). Stored in `static_thresholds` table.

**Rolling baselines** (`services/baselines.py`): Dynamic 7-day rolling averages computed on-the-fly for HR, HRV, sleep, temperature, and weather. Available via `GET /baselines`. Complements static thresholds with personal trend data from Layer 2 streams.

**AFib detection** (`services/heart_analyze.py`): Weighted voting across 6 HRV metrics (CV, RMSSD, pNN20, SD1/SD2, sample entropy, LF/HF). Needs >= 10 BPM samples. Broadcasts via WebSocket.

## Environment

`backend/.env` needs `XAI_API_KEY` for Grok-powered drug half-life lookup. Server starts fine without it — only `POST /drugs` auto-lookup fails.

## Preferences

- No pytest or test files unless explicitly requested. Just implement and verify the server starts.

## Test patient

All seed data is for Lily Chen (TKOS, DOB 2007-04-22). Data is parsed from real medical records records and ECG PDFs. The `report/sample_data.py` has older hardcoded data that is partially outdated (lists flecainide, wrong age/HR) — prefer `get_report_data()` for accurate values.
