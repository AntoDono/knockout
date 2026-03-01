# Cardiology Report — Implementation Plan

**Date:** 2026-02-28
**Depends on:** `2026-02-28-cardiology-report-schema-design.md`
**Scope:** Backend report assembly endpoint + frontend ExportTab upgrade. Cardiologist report only (schema supports future specialist types).

---

## Current State

**Backend:**
- PK model exists (`database.py`) — Drug/Dose models with half-life decay via `get_current_levels()`
- Afib detection exists (`heart_analyze.py`) — full HRV analysis pipeline
- Sensor ingestion exists (`server.py`) — heart rate via `/push`, drug tracking via `/drugs`, `/doses`, `/levels`
- No report generation endpoint
- No episode persistence (episodes are frontend-only, in-memory)

**Frontend (`ExportTab.tsx`):**
- Placeholder UI with date range picker and content checklist
- `generate()` shows an `alert()` — no real functionality
- No physician specialty selector
- No connection to backend

---

## Implementation Steps

### Step 1: Add Episode model to backend database

**File:** `backend/database.py`

Add an `Episode` model to persist tap events:

```python
class Episode(BaseModel):
    id         = AutoField()
    timestamp  = DateTimeField(default=lambda: datetime.now(timezone.utc))
    heart_rate = FloatField(null=True)
    hrv        = FloatField(null=True)
    drug_level = FloatField(null=True)  # primary drug concentration % at time of tap
    notes      = TextField(default="")
```

Add to `init_db()` table creation list.

### Step 2: Add episode endpoints to server

**File:** `backend/server.py`

- `POST /episodes` — log an episode `{ heart_rate, hrv, drug_level, timestamp? }`
- `GET /episodes` — list all episodes, ordered by timestamp desc. Optional `?since=ISO-8601` filter for reporting period.
- `DELETE /episodes/<id>` — remove an episode

### Step 3: Create report assembly module

**New file:** `backend/report.py`

A function `build_cardiology_report(period_start, period_end)` that:

1. Queries episodes in the date range
2. Queries doses in the date range
3. For each episode, computes:
   - Medication coverage at that timestamp (reuse `Dose.remaining_fraction()`)
   - Whether the episode fell in a trough window (configurable threshold, default 55%)
   - HRV deviation from baseline (if available)
4. Computes aggregate analysis:
   - `trough_episode_correlation` — count episodes in trough / total episodes
   - `trigger_analysis.top_correlates` — frequency count of factors present at each episode
   - `autonomic_trends` — HRV start vs end of period (if HRV data is persisted)
   - `executive_summary.flags` — generate 2-3 key findings from the aggregate data
5. Returns a dict matching the schema from the design doc

**Key detail:** The report module should work with whatever data is available. If sleep/weather/temperature data isn't wired yet, those fields are `null` in the output. The module should not break when data is partial.

### Step 4: Add report generation endpoint

**File:** `backend/server.py`

- `GET /report?start=ISO-8601&end=ISO-8601&type=cardiology` — returns the assembled report JSON

The `type` parameter defaults to `cardiology` (only supported type for now). This parameter exists so the frontend can be built with the specialist selector wired up, even though only one type works.

### Step 5: Upgrade ExportTab frontend

**File:** `frontend/components/ExportTab.tsx`

Upgrade the current placeholder to:

1. **Add specialist selector** — radio buttons for report type. Show "Cardiologist" as the only enabled option. Other options (Neurologist, Geneticist, Pediatrician) are visible but disabled/greyed out with a "Coming soon" label. This signals the future capability without pretending it works.

2. **Keep the date range selector** — already exists, wire it to the API call's `start`/`end` params.

3. **Replace the content checklist** — the current checklist items (PK & HRV chart, Episode log, etc.) don't map to the schema sections. Replace with section toggles that match the report schema:
   - Executive Summary (always included, not toggleable)
   - Episode Library
   - Pharmacokinetic Analysis
   - Autonomic Trends
   - Trigger Analysis
   - Supporting Context

4. **Wire the generate button** — call `GET /report?start=...&end=...&type=cardiology`, receive JSON, and for now either:
   - Display the report as a formatted on-screen view, OR
   - Download as JSON (PDF rendering is a later step)

5. **Props:** ExportTab needs access to episodes and medications from the parent. Either pass them as props or have ExportTab fetch from the backend directly (cleaner, since the backend will be the source of truth for the report).

### Step 6: Connect frontend episode capture to backend

**File:** `frontend/app/page.tsx` + `frontend/hooks/useEpisodes.ts`

Currently episodes only exist in React state. When `handleFeelSomething` fires:
- POST to `/episodes` with the captured data
- On page load, GET `/episodes` to hydrate the episode list

This ensures the report endpoint has episode data to work with.

---

## What This Plan Does NOT Include

- **PDF rendering** — the report is assembled as JSON. Visual PDF layout is a separate task.
- **Sleep/weather/temperature data streams** — those fields exist in the schema but will be `null` until those layers are built.
- **HRV baseline tracking** — currently HRV is simulated per-tick in the frontend. Persisting HRV history and computing rolling baselines is a separate task.
- **ICD data integration** — the `icd_shocks` field in executive summary will be `0` / manual entry until ICD interrogation parsing is built.

---

## Build Order

```
Step 1 (Episode model)
  └─→ Step 2 (Episode endpoints)
        ├─→ Step 3 (Report assembly module)
        │     └─→ Step 4 (Report endpoint)
        │           └─→ Step 5 (ExportTab upgrade)
        └─→ Step 6 (Frontend episode persistence)
```

Steps 3-4 and Step 6 can run in parallel after Step 2 is done.

---

## File Change Summary

| File | Action |
|---|---|
| `backend/database.py` | Add Episode model |
| `backend/server.py` | Add episode + report endpoints |
| `backend/report.py` | New — report assembly logic |
| `frontend/components/ExportTab.tsx` | Upgrade — specialist selector, schema-aligned sections, API integration |
| `frontend/hooks/useEpisodes.ts` | Modify — persist to backend |
| `frontend/app/page.tsx` | Minor — may need to pass backend URL config |
| `frontend/lib/types.ts` | Add report-related types if displaying report on-screen |
