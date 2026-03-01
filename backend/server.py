"""
Guardrail TKOS Platform – FastAPI app wiring.

Routes are organized into domain modules:
  sensor.py   – POST /push, GET /stats, WS /ws
  drugs.py    – /drugs, /doses, /levels
  patient.py  – /patient/*
  reports.py  – /report
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from sensor import router as sensor_router
from drugs import router as drugs_router
from patient import router as patient_router
from reports import router as report_router

app = FastAPI(title="Guardrail TKOS Platform")

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


@app.on_event("startup")
def startup():
    init_db()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=True)
