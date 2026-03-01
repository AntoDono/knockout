"""
Sensor push, stats, and WebSocket heart stream endpoints.

  POST /push   – receive sensor payloads from the app
  GET  /stats  – request counts and most recent packet per sensor
  WS   /ws     – live heart stream
"""

import json
import logging
import os
import threading
import uuid
from collections import deque
from dataclasses import asdict
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from database import (
    get_current_levels, Patient,
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading,
)
from services.heart_analyze import detect_afib
from send_sms import send_sms

log = logging.getLogger(__name__)

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
_afib_alert_sent: bool = False

# AFib feedback: snapshots of BPM windows keyed by event ID.
# _healthy_buffer accumulates readings one at a time during non-AFib.
# _healthy_window is only frozen from _healthy_buffer when confidence is
# well below threshold, so transition-period contamination is excluded.
_afib_snapshots: dict[str, dict] = {}
_healthy_buffer: deque[float] = deque(maxlen=120)
_healthy_window: list[float] = []
_prev_afib_detected: bool = False
_HEALTHY_CONF_CEILING = 0.25  # only snapshot when confidence is clearly safe


# ---------------------------------------------------------------------------
# WebSocket helpers
# ---------------------------------------------------------------------------

def _build_heart_payload(latest_bpm: float | None) -> dict:
    global _prev_afib_detected

    n = len(_bpm_buffer)
    buf = list(_bpm_buffer)

    afib_data = None
    afib_event_id = None
    if n >= 10:
        result = detect_afib(buf)
        afib_data = asdict(result)

        if result.afib_detected:
            if not _prev_afib_detected:
                # Rising edge: use the frozen clean snapshot as the paired sample
                event_id = uuid.uuid4().hex[:12]
                _afib_snapshots[event_id] = {
                    "bpm_readings": buf[:],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "afib_metrics": afib_data,
                    "drug_levels": get_current_levels(),
                    "healthy_snapshot": list(_healthy_window) if _healthy_window else None,
                }
                afib_event_id = event_id
            else:
                if _afib_snapshots:
                    afib_event_id = list(_afib_snapshots.keys())[-1]
            _prev_afib_detected = True
        else:
            _prev_afib_detected = False
            if latest_bpm is not None:
                _healthy_buffer.append(latest_bpm)
            # Only freeze the snapshot when confidence is well below threshold
            # so transition-period readings never contaminate it
            if result.confidence <= _HEALTHY_CONF_CEILING and len(_healthy_buffer) >= 10:
                _healthy_window[:] = list(_healthy_buffer)

    return {
        "type": "heart_update",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latest_bpm": latest_bpm,
        "bpm_buffer_size": n,
        "afib": afib_data,
        "afib_event_id": afib_event_id,
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


def _get_current_location() -> tuple[float, float] | None:
    """Return (lat, lon) via IP geolocation."""
    try:
        import geocoder
        g = geocoder.ip("me")
        if g.ok and g.latlng:
            return tuple(g.latlng)
    except Exception:
        log.debug("IP geolocation failed", exc_info=True)
    return None


def _check_afib_alert(afib_data: dict | None) -> None:
    """Send one SMS when AFib is first detected; reset when it clears."""
    global _afib_alert_sent

    if afib_data is None:
        return

    if afib_data.get("afib_detected"):
        if not _afib_alert_sent:
            print("SENDING AFIB ALERT")
            _afib_alert_sent = True
            alert_to = os.environ.get("ALERT_PHONE_NUMBER")
            if not alert_to:
                log.warning("ALERT_PHONE_NUMBER not set — skipping AFib SMS alert")
                return
            confidence = afib_data.get("confidence", 0)
            body = (
                f"⚠️ AFib detected (confidence {confidence:.0%}). "
                "Check on the patient right now."
            )
            loc = _get_current_location()
            if loc:
                lat, lon = loc
                body += f"\n📍 Last known location: https://maps.google.com/?q={lat},{lon}"
            threading.Thread(
                target=_send_alert, args=(alert_to, body), daemon=True
            ).start()
    else:
        _afib_alert_sent = False


def _send_alert(to: str, body: str) -> None:
    try:
        sid = send_sms(to, body)
        log.info("AFib SMS alert sent (SID %s)", sid)
    except Exception:
        log.exception("Failed to send AFib SMS alert")


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
# Persistence helpers
# ---------------------------------------------------------------------------

def _get_default_patient():
    """Get patient 1 (single-patient hackathon system)."""
    try:
        return Patient.get_by_id(1)
    except Patient.DoesNotExist:
        return None


def _classify_sensor(name: str) -> str | None:
    """Map sensor name to stream type."""
    n = name.lower()
    # Check HRV before HR since "hrv" also contains no "heart" keyword
    if "hrv" in n or "heart_rate_variability" in n:
        return "hrv"
    if any(k in n for k in ("heart", "bpm", "pulse")) or n == "hr":
        return "hr"
    if "sleep" in n:
        return "sleep"
    if "temp" in n or "wrist_temp" in n:
        return "temperature"
    if "weather" in n or "environment" in n:
        return "weather"
    return None


def _persist_reading(stream: str, values: dict, timestamp: datetime, patient) -> None:
    """Route a reading to the appropriate model."""
    if patient is None:
        return

    if stream == "hr":
        bpm = _extract_bpm(values)
        if bpm is not None:
            HeartRateReading.create(
                patient=patient,
                recorded_at=timestamp,
                hr_bpm=int(round(bpm)),
                source="sensor_logger",
                activity=values.get("activity"),
            )
    elif stream == "hrv":
        hrv_val = values.get("hrv_ms") or values.get("hrv") or values.get("value")
        if hrv_val is not None:
            HRVReading.create(
                patient=patient,
                recorded_at=timestamp,
                hrv_ms=float(hrv_val),
                source="sensor_logger",
                measurement_type=values.get("type", "sdnn"),
            )
    elif stream == "sleep":
        SleepRecord.create(
            patient=patient,
            sleep_start=values.get("sleep_start", timestamp),
            sleep_end=values.get("sleep_end", timestamp),
            duration_minutes=int(values.get("duration_minutes", 0)),
            quality=values.get("quality", "fair"),
            source="sensor_logger",
            deep_minutes=values.get("deep_minutes"),
            rem_minutes=values.get("rem_minutes"),
            awakenings=values.get("awakenings"),
        )
    elif stream == "temperature":
        temp = values.get("temp_c") or values.get("temperature") or values.get("value")
        if temp is not None:
            TemperatureReading.create(
                patient=patient,
                recorded_at=timestamp,
                temp_c=float(temp),
                deviation_c=values.get("deviation_c"),
                source="sensor_logger",
            )
    elif stream == "weather":
        temp = values.get("temp_c") or values.get("temperature")
        humidity = values.get("humidity_pct") or values.get("humidity")
        if temp is not None and humidity is not None:
            WeatherReading.create(
                patient=patient,
                recorded_at=timestamp,
                temp_c=float(temp),
                humidity_pct=float(humidity),
                location_lat=values.get("lat"),
                location_lon=values.get("lon"),
                source="sensor_logger",
            )


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

        # Persist to stream table
        stream = _classify_sensor(name)
        if stream:
            reading_time = datetime.fromtimestamp(t, tz=timezone.utc)
            _persist_reading(stream, values, reading_time, _get_default_patient())

        if _is_heart_sensor(name):
            bpm = _extract_bpm(values)
            if bpm is not None:
                _bpm_buffer.append(bpm)
                latest_bpm = bpm

    if latest_bpm is not None:
        payload = _build_heart_payload(latest_bpm)
        await _broadcast(json.dumps(payload))
        _check_afib_alert(payload.get("afib"))

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
