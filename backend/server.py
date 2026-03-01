"""
Guardrail TKOS Platform – FastAPI app wiring.

Routes are organized into the routes/ package:
  routes/sensor.py   – POST /push, GET /stats, WS /ws
  routes/drugs.py    – /drugs, /doses, /levels
  routes/patient.py  – /patient/*
  routes/reports.py  – /report
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import sensor_router, drugs_router, patient_router, report_router

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
