"""
Episodes API -- one-tap symptom capture with 24-hour context reconstruction.

  POST /episodes              -- create an episode (the one-tap)
  GET  /episodes              -- list episodes (optional ?start= &end= filters)
  GET  /episodes/{id}/context -- full 24-hour context from all six streams
"""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database import (
    Patient, Episode, HeartRateReading, HRVReading,
    SleepRecord, TemperatureReading, WeatherReading,
    get_current_levels,
)
from services.baselines import get_rolling_baselines

router = APIRouter(tags=["episodes"])

_CONTEXT_HOURS = 24


class EpisodeCreate(BaseModel):
    notes: str | None = None


@router.post("/episodes", status_code=201)
def create_episode(body: EpisodeCreate):
    patient = Patient.get_by_id(1)
    now = datetime.now(timezone.utc)
    episode = Episode.create(
        patient=patient,
        recorded_at=now,
        notes=body.notes,
        source="patient_tap",
    )
    return {
        "id": episode.id,
        "recorded_at": episode.recorded_at.isoformat(),
        "notes": episode.notes,
        "source": episode.source,
    }


@router.get("/episodes")
def list_episodes(
    start: str | None = Query(None),
    end: str | None = Query(None),
):
    query = Episode.select().where(
        Episode.patient == 1
    ).order_by(Episode.recorded_at.desc())

    if start:
        query = query.where(Episode.recorded_at >= start)
    if end:
        query = query.where(Episode.recorded_at <= end)

    return [
        {
            "id": e.id,
            "recorded_at": e.recorded_at.isoformat() if isinstance(e.recorded_at, datetime) else e.recorded_at,
            "notes": e.notes,
            "source": e.source,
        }
        for e in query
    ]


@router.delete("/episodes/{episode_id}", status_code=204)
def delete_episode(episode_id: int):
    try:
        episode = Episode.get_by_id(episode_id)
    except Episode.DoesNotExist:
        raise HTTPException(status_code=404, detail=f"episode {episode_id} not found")
    episode.delete_instance()


@router.get("/episodes/{episode_id}/context")
def get_episode_context(episode_id: int):
    try:
        episode = Episode.get_by_id(episode_id)
    except Episode.DoesNotExist:
        raise HTTPException(status_code=404, detail=f"episode {episode_id} not found")

    ep_time = episode.recorded_at
    if isinstance(ep_time, str):
        ep_time = datetime.fromisoformat(ep_time)
    if ep_time.tzinfo is None:
        ep_time = ep_time.replace(tzinfo=timezone.utc)

    window_start = ep_time - timedelta(hours=_CONTEXT_HOURS)
    patient_id = episode.patient_id

    # Query each stream for the 24h window
    hr = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "hr_bpm": r.hr_bpm, "activity": r.activity}
        for r in HeartRateReading.select().where(
            HeartRateReading.patient == patient_id,
            HeartRateReading.recorded_at >= window_start,
            HeartRateReading.recorded_at <= ep_time,
        ).order_by(HeartRateReading.recorded_at)
    ]

    hrv = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "hrv_ms": r.hrv_ms, "measurement_type": r.measurement_type}
        for r in HRVReading.select().where(
            HRVReading.patient == patient_id,
            HRVReading.recorded_at >= window_start,
            HRVReading.recorded_at <= ep_time,
        ).order_by(HRVReading.recorded_at)
    ]

    sleep = [
        {"sleep_start": r.sleep_start.isoformat() if isinstance(r.sleep_start, datetime) else r.sleep_start,
         "sleep_end": r.sleep_end.isoformat() if isinstance(r.sleep_end, datetime) else r.sleep_end,
         "duration_minutes": r.duration_minutes, "quality": r.quality}
        for r in SleepRecord.select().where(
            SleepRecord.patient == patient_id,
            SleepRecord.sleep_start >= window_start,
            SleepRecord.sleep_start <= ep_time,
        ).order_by(SleepRecord.sleep_start)
    ]

    temperature = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "temp_c": r.temp_c, "deviation_c": r.deviation_c}
        for r in TemperatureReading.select().where(
            TemperatureReading.patient == patient_id,
            TemperatureReading.recorded_at >= window_start,
            TemperatureReading.recorded_at <= ep_time,
        ).order_by(TemperatureReading.recorded_at)
    ]

    weather = [
        {"recorded_at": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
         "temp_c": r.temp_c, "humidity_pct": r.humidity_pct}
        for r in WeatherReading.select().where(
            WeatherReading.patient == patient_id,
            WeatherReading.recorded_at >= window_start,
            WeatherReading.recorded_at <= ep_time,
        ).order_by(WeatherReading.recorded_at)
    ]

    baselines = get_rolling_baselines(patient_id, now=ep_time)

    return {
        "episode": {
            "id": episode.id,
            "recorded_at": episode.recorded_at.isoformat() if isinstance(episode.recorded_at, datetime) else episode.recorded_at,
            "notes": episode.notes,
        },
        "context_window": {
            "start": window_start.isoformat(),
            "end": ep_time.isoformat(),
        },
        "hr": hr,
        "hrv": hrv,
        "sleep": sleep,
        "temperature": temperature,
        "weather": weather,
        "medication_levels": get_current_levels(now=ep_time),
        "baselines": baselines,
    }
