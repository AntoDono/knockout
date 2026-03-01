"""
Guardrail TKOS Platform – FastAPI app wiring.

Routes are organized into domain modules:
  sensor.py   – POST /push, GET /stats, WS /ws
  drugs.py    – /drugs, /doses, /levels
  patient.py  – /patient/*
  reports.py  – /report

Simulation mode
───────────────
Pass --simulate <name> to replay a scenario file at startup:

    uv run server.py --simulate afib_episode
    uv run server.py --simulate vt_storm
    uv run server.py --simulate ../simulations/normal_day.yaml

Scenario files live in  simulations/  at the repo root (YAML or JSON).
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from sensor import router as sensor_router
from drugs import router as drugs_router
from patient import router as patient_router
from reports import router as report_router

# Set by __main__ before uvicorn starts; lifespan reads it.
_sim_file: str | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup → yield → shutdown lifecycle."""
    init_db()

    sim_task: asyncio.Task | None = None
    if _sim_file:
        from simulate import parse_sim_file, run_simulation
        try:
            config   = parse_sim_file(_sim_file)
            sim_task = asyncio.create_task(run_simulation(config))
        except FileNotFoundError as e:
            print(f"[SIM] ERROR – {e}")
        except Exception as e:
            print(f"[SIM] Failed to load simulation: {e}")

    yield  # server is live here

    if sim_task and not sim_task.done():
        sim_task.cancel()
        try:
            await sim_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Guardrail TKOS Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor_router)
app.include_router(drugs_router)
app.include_router(patient_router)
app.include_router(report_router)


if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser(description="Guardrail TKOS Platform")
    parser.add_argument(
        "--simulate", metavar="FILE",
        help="Run a simulation scenario (name or path to .yaml/.json file)",
    )
    args = parser.parse_args()

    if args.simulate:
        _sim_file = args.simulate
        print(f"[SIM] Simulation mode: {args.simulate!r}")
        # Pass the app object directly so uvicorn uses this module instance
        # (not a fresh re-import via string), keeping _sim_file in scope.
        uvicorn.run(app, host="0.0.0.0", port=8080, reload=False)
    else:
        uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=True)
