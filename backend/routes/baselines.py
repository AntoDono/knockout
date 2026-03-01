"""
Baselines API -- rolling 7-day personal baselines for all streams.

  GET /baselines  -- returns rolling baselines for patient 1
"""

from fastapi import APIRouter

from services.baselines import get_rolling_baselines

router = APIRouter(tags=["baselines"])


@router.get("/baselines")
def get_baselines():
    return get_rolling_baselines(patient_id=1)
