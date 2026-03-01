"""
AFib feedback endpoint for human-in-the-loop training data collection.

  POST /afib/feedback  – confirm or deny an AFib detection event

When the user confirms AFib, two training samples are saved:
  1. The AFib window (positive label)
  2. The most recent healthy window (negative label)

Training data is stored as JSON in  backend/training_data/.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from routes import sensor as _sensor

log = logging.getLogger(__name__)

router = APIRouter(tags=["afib_feedback"])

_TRAINING_DIR = Path(__file__).resolve().parent.parent / "training_data"


class FeedbackRequest(BaseModel):
    event_id: str
    confirmed: bool


def _save_sample(event_id: str, label: str, data: dict) -> Path:
    _TRAINING_DIR.mkdir(exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    filename = f"{label}_{ts}_{event_id}.json"
    path = _TRAINING_DIR / filename
    path.write_text(json.dumps(data, indent=2))
    log.info("Saved training sample: %s", filename)
    return path


@router.post("/afib/feedback")
def submit_afib_feedback(req: FeedbackRequest):
    snapshot = _sensor._afib_snapshots.get(req.event_id)
    if snapshot is None:
        raise HTTPException(404, "Unknown AFib event ID — window may have expired.")

    if not req.confirmed:
        _save_sample(req.event_id, "false_positive", {
            "event_id": req.event_id,
            "label": "false_positive",
            "timestamp": snapshot["timestamp"],
            "bpm_readings": snapshot["bpm_readings"],
            "afib_metrics": snapshot["afib_metrics"],
            "drug_levels": snapshot["drug_levels"],
        })
        _sensor._afib_snapshots.pop(req.event_id, None)
        return {"status": "saved", "label": "false_positive", "event_id": req.event_id}

    # Confirmed AFib — save the positive sample
    _save_sample(req.event_id, "afib", {
        "event_id": req.event_id,
        "label": "afib",
        "timestamp": snapshot["timestamp"],
        "bpm_readings": snapshot["bpm_readings"],
        "afib_metrics": snapshot["afib_metrics"],
        "drug_levels": snapshot["drug_levels"],
    })

    # Healthy counterpart: frozen snapshot from AFib onset → live buffer
    healthy_bpm = snapshot.get("healthy_snapshot")
    if not healthy_bpm:
        healthy_bpm = list(_sensor._healthy_window) if _sensor._healthy_window else None

    healthy_saved = False
    if healthy_bpm:
        _save_sample(req.event_id, "healthy", {
            "event_id": req.event_id,
            "label": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "bpm_readings": healthy_bpm,
            "afib_metrics": None,
            "drug_levels": snapshot["drug_levels"],
        })
        healthy_saved = True
    else:
        log.warning("No healthy window available for event %s", req.event_id)

    _sensor._afib_snapshots.pop(req.event_id, None)

    return {
        "status": "saved",
        "label": "afib",
        "healthy_sample_saved": healthy_saved,
        "event_id": req.event_id,
    }
