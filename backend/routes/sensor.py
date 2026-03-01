"""
Sensor push, stats, and WebSocket heart stream endpoints.

  POST /push   – receive sensor payloads from the app
  GET  /stats  – request counts and most recent packet per sensor
  WS   /ws     – live heart stream
"""

import json
from collections import deque
from dataclasses import asdict
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from database import get_current_levels
from services.heart_analyze import detect_afib

router = APIRouter(tags=["sensor"])


# ---------------------------------------------------------------------------
# Shared state
# ---------------------------------------------------------------------------

stats = {
    "total_requests": 0,
    "total_readings": 0,
    "sensors": {},
    "requests": [],
}

_bpm_buffer: deque[float] = deque(maxlen=120)
_ws_clients: set[WebSocket] = set()


# ---------------------------------------------------------------------------
# WebSocket helpers
# ---------------------------------------------------------------------------

def _build_heart_payload(latest_bpm: float | None) -> dict:
    n = len(_bpm_buffer)
    buf = list(_bpm_buffer)

    afib_data = None
    if n >= 10:
        result = detect_afib(buf)
        afib_data = asdict(result)

    return {
        "type": "heart_update",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latest_bpm": latest_bpm,
        "bpm_buffer_size": n,
        "afib": afib_data,
        "drug_levels": get_current_levels(),
    }


async def _broadcast(message: str) -> None:
    dead = []
    for ws in _ws_clients:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.discard(ws)


@router.websocket("/ws")
async def websocket_heart(websocket: WebSocket):
    await websocket.accept()
    _ws_clients.add(websocket)
    try:
        payload = _build_heart_payload(None)
        payload["type"] = "hello"
        await websocket.send_text(json.dumps(payload))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _ws_clients.discard(websocket)


# ---------------------------------------------------------------------------
# Sensor helpers
# ---------------------------------------------------------------------------

def _extract_bpm(values: dict) -> float | None:
    for key in ("bpm", "heartRate", "heart_rate", "value", "BPM"):
        if key in values:
            try:
                return float(values[key])
            except (TypeError, ValueError):
                pass
    return None


def _is_heart_sensor(name: str) -> bool:
    n = name.lower()
    return "heart" in n or "bpm" in n or "pulse" in n or "hr" == n


# ---------------------------------------------------------------------------
# Sensor endpoints
# ---------------------------------------------------------------------------

@router.post("/push")
async def push_sensor_data(data: dict):
    payload = data.get("payload", [])
    msg_id = data.get("messageId", "?")
    session = data.get("sessionId", "?")
    device = data.get("deviceId", "?")
    received_at = datetime.now(timezone.utc).isoformat()

    latest_bpm: float | None = None

    stats["total_requests"] += 1
    stats["total_readings"] += len(payload)
    stats["requests"].append({
        "messageId": msg_id,
        "sessionId": session,
        "deviceId": device,
        "readings": len(payload),
        "received_at": received_at,
    })

    for reading in payload:
        name = reading.get("name", "unknown")
        ts_ns = reading.get("time", 0)
        t = ts_ns / 1_000_000_000
        values = reading.get("values") or {
            k: v for k, v in reading.items()
            if k not in ("name", "time", "accuracy")
        }

        if name not in stats["sensors"]:
            stats["sensors"][name] = {"count": 0, "last_t": None, "last_values": None}
        stats["sensors"][name]["count"] += 1
        stats["sensors"][name]["last_t"] = t
        stats["sensors"][name]["last_values"] = values

        if _is_heart_sensor(name):
            bpm = _extract_bpm(values)
            if bpm is not None:
                _bpm_buffer.append(bpm)
                latest_bpm = bpm

    if latest_bpm is not None:
        msg = json.dumps(_build_heart_payload(latest_bpm))
        await _broadcast(msg)

    return {"status": "ok"}


@router.get("/stats")
def get_stats():
    return {
        "total_requests": stats["total_requests"],
        "total_readings": stats["total_readings"],
        "sensors": {
            name: {
                "count": s["count"],
                "last_t": s["last_t"],
                "last_values": s["last_values"],
            }
            for name, s in stats["sensors"].items()
        },
        "requests": list(stats["requests"]),
    }
