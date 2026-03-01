# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Guardrail — a cardiac monitoring platform for Triadin Knockout Syndrome (TKOS), an ultra-rare inherited heart condition (~340 patients worldwide). The system passively monitors a patient's body and environment, lets them flag symptomatic moments with one tap, and generates physician reports that make subclinical events visible.

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

## Architecture

**Backend:** FastAPI (Python 3.13, uv) with Peewee ORM on SQLite (`knockout.db`).
**Frontend:** Next.js 16, React 19, Tailwind CSS v4, D3.js for charts.

### Backend module layout

`server.py` is a thin FastAPI wiring file. All routes live in domain modules:

| Module | Routes | Purpose |
|---|---|---|
| `sensor.py` | `/push`, `/stats`, WS `/ws` | Sensor Logger ingestion, live heart-rate WebSocket with AFib detection |
| `drugs.py` | `/drugs`, `/doses`, `/levels` | Drug registry, dose logging, PK decay levels |
| `patient.py` | `/patient/*` (7 endpoints) | Layer 1 clinical foundation — read-only patient data |
| `reports.py` | `/report` | PDF cardiology report generation |

### Database layer (`database.py`)

Two tiers of Peewee models:

**Core (drug tracking):** `Drug`, `Dose` — general drug half-life registry and dose logging with exponential decay PK computation via `get_current_levels()`.

**Layer 1 (clinical foundation):** 13 models seeded from `seed/clinical.json` on first startup — `Patient`, `PatientDiagnosis`, `PatientAllergy`, `KnownTrigger`, `Medication`, `ICDDevice`, `ICDZone`, `ICDEpisode`, `ICDShockHistory`, `ECGReading`, `StaticThreshold`, `ClinicalNote`, `SurgicalHistory`.

Seeding is idempotent — `_seed_clinical()` skips if any Patient row exists.

### Report module (`report/`)

Self-contained — no dependency on server.py or database.py. Takes a plain data dict, outputs structured JSON report + PDF. Can be tested standalone. `get_report_data()` in database.py bridges the DB to the report module's expected input format.

### Frontend hooks

State management via custom hooks, no external state library:
- `useVitals` — simulated HR/HRV based on current drug level
- `usePKData` — 48-hour medication concentration curves
- `useEpisodes` — one-tap episode capture with context snapshot

Frontend currently simulates vitals; not yet wired to backend API.

## Domain concepts

**ICD Gap:** The patient's ICD ignores arrhythmias between 70-190 bpm to prevent shock storms. Guardrail monitors this blind zone. `GET /patient/icd/gap` returns the boundaries.

**PK decay model:** `remaining = amount_mg * 0.5^(elapsed_s / half_life_s)`. Implemented in both `database.py` (backend) and `lib/simulate.ts` (frontend). Nadolol half-life = 22h; symptoms cluster during trough windows.

**Static thresholds:** Patient-specific baselines from clinical records (resting HR 70 bpm is pacemaker-set, not intrinsic). Stored in `static_thresholds` table. Dynamic baselines (rolling averages from watch data) are a future Layer 2 concern.

**AFib detection** (`heart_analyze.py`): Weighted voting across 6 HRV metrics (CV, RMSSD, pNN20, SD1/SD2, sample entropy, LF/HF). Needs >= 10 BPM samples. Broadcasts via WebSocket.

## Environment

`backend/.env` needs `XAI_API_KEY` for Grok-powered drug half-life lookup. Server starts fine without it — only `POST /drugs` auto-lookup fails.

## Test patient

All seed data is for Dishita Agarwal (TKOS, DOB 2006-01-19). Data is parsed from real MyChart records and ECG PDFs. The `report/sample_data.py` has older hardcoded data that is partially outdated (lists flecainide, wrong age/HR) — prefer `get_report_data()` for accurate values.
