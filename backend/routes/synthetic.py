"""
Synthetic data API -- generate demo data for hackathon.

  POST /synthetic/generate  -- generate 7 days of synthetic data
"""

from fastapi import APIRouter

from services.synthetic import generate_synthetic_data

router = APIRouter(tags=["synthetic"])


@router.post("/synthetic/generate")
def generate_data():
    result = generate_synthetic_data(patient_id=1)
    return {"status": "ok", **result}
