"""
Synthetic data generator for hackathon demo.

Generates 7 days of clinically plausible data across all six streams
for the TKOS patient. Data patterns are designed to demonstrate:
  - HR/HRV changes during medication trough windows
  - Sleep deprivation preceding worse HRV days
  - Episode clustering during troughs + poor sleep
"""

import math
import random
from datetime import datetime, timezone, timedelta

from database import (
    Patient, Medication,
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
)

_DAYS = 7
_HR_BASELINE = 70      # pacemaker lower rate
_HRV_BASELINE = 44.0   # ms SDNN
_TEMP_BASELINE = 36.1   # wrist temp Celsius


def _gaussian(mean: float, std: float) -> float:
    return random.gauss(mean, std)


def _is_trough_window(hour_of_day: float, dose_times: list[float], half_life_h: float) -> bool:
    """Check if current hour is in a medication trough window (>60% of half-life since last dose)."""
    for dose_hour in dose_times:
        hours_since = (hour_of_day - dose_hour) % 24
        if hours_since > half_life_h * 0.6:
            return True
    return False


def _get_nadolol_dose_times(patient_id: int) -> tuple[list[float], float]:
    """Get nadolol dose times and half-life from medication table."""
    try:
        med = Medication.get(
            Medication.patient == patient_id,
            Medication.drug_name == "nadolol",
        )
        import json
        times = json.loads(med.dose_times)
        dose_hours = []
        for t in times:
            parts = t.split(":")
            dose_hours.append(int(parts[0]) + int(parts[1]) / 60)
        return dose_hours, med.half_life_hours or 22.0
    except Medication.DoesNotExist:
        return [9.0, 20.0], 22.0


def _clear_synthetic(patient_id: int) -> None:
    """Remove all synthetic data for a patient."""
    HeartRateReading.delete().where(
        HeartRateReading.patient == patient_id,
        HeartRateReading.source == "synthetic",
    ).execute()
    HRVReading.delete().where(
        HRVReading.patient == patient_id,
        HRVReading.source == "synthetic",
    ).execute()
    SleepRecord.delete().where(
        SleepRecord.patient == patient_id,
        SleepRecord.source == "synthetic",
    ).execute()
    TemperatureReading.delete().where(
        TemperatureReading.patient == patient_id,
        TemperatureReading.source == "synthetic",
    ).execute()
    WeatherReading.delete().where(
        WeatherReading.patient == patient_id,
        WeatherReading.source == "synthetic",
    ).execute()
    Episode.delete().where(
        Episode.patient == patient_id,
        Episode.source == "synthetic",
    ).execute()


def generate_synthetic_data(patient_id: int = 1) -> dict:
    """
    Generate 7 days of synthetic data for all six streams.

    Returns a summary dict with counts per stream.
    """
    _clear_synthetic(patient_id)

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=_DAYS)

    dose_times, half_life_h = _get_nadolol_dose_times(patient_id)

    # Plan sleep quality per night (day 3 and 5 are bad sleep nights)
    sleep_quality = ["good", "good", "fair", "poor", "good", "poor", "fair"]

    counts = {
        "hr_count": 0, "hrv_count": 0, "sleep_count": 0,
        "temperature_count": 0, "weather_count": 0, "episode_count": 0,
    }

    hr_batch = []
    hrv_batch = []
    temp_batch = []
    weather_batch = []

    for day in range(_DAYS):
        day_start = start + timedelta(days=day)
        prev_poor_sleep = day > 0 and sleep_quality[day - 1] in ("poor",)

        # --- HR and HRV: one reading every 5 minutes ---
        for minute in range(0, 24 * 60, 5):
            hour = minute / 60.0
            t = day_start + timedelta(minutes=minute)
            if t > now:
                break

            is_sleeping = hour < 7 or hour >= 23
            in_trough = _is_trough_window(hour, dose_times, half_life_h)

            # HR: elevated in trough, lower during sleep
            hr_mean = _HR_BASELINE
            if in_trough:
                hr_mean += 10
            if prev_poor_sleep:
                hr_mean += 4
            if is_sleeping:
                hr_mean -= 5

            activity = "resting"
            if not is_sleeping and random.random() < 0.08:
                activity = "walking"
                hr_mean += 15

            hr = max(55, min(130, int(_gaussian(hr_mean, 3))))
            hr_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "hr_bpm": hr,
                "source": "synthetic",
                "activity": activity,
            })
            counts["hr_count"] += 1

            # HRV: inversely correlated with HR stress
            hrv_mean = _HRV_BASELINE
            if in_trough:
                hrv_mean -= 12
            if prev_poor_sleep:
                hrv_mean -= 6
            if is_sleeping:
                hrv_mean += 8

            hrv = max(10, min(80, round(_gaussian(hrv_mean, 4), 1)))
            hrv_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "hrv_ms": hrv,
                "source": "synthetic",
                "measurement_type": "sdnn",
            })
            counts["hrv_count"] += 1

        # --- Temperature: every 30 minutes ---
        for minute in range(0, 24 * 60, 30):
            hour = minute / 60.0
            t = day_start + timedelta(minutes=minute)
            if t > now:
                break

            # Circadian variation: cooler at night, warmer midday
            circadian = 0.3 * math.sin(2 * math.pi * (hour - 14) / 24)
            # Day 5: simulate low-grade fever
            fever_bump = 0.8 if day == 5 else 0.0
            temp = round(_gaussian(_TEMP_BASELINE + circadian + fever_bump, 0.15), 2)

            temp_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "temp_c": temp,
                "deviation_c": round(temp - _TEMP_BASELINE, 2),
                "source": "synthetic",
            })
            counts["temperature_count"] += 1

        # --- Weather: every 30 minutes (Durham, NC seasonal) ---
        for minute in range(0, 24 * 60, 30):
            hour = minute / 60.0
            t = day_start + timedelta(minutes=minute)
            if t > now:
                break

            # Late winter Durham: ~8-16C, humidity 50-75%
            diurnal = 4 * math.sin(2 * math.pi * (hour - 14) / 24)
            ambient = round(_gaussian(12 + diurnal + day * 0.5, 1.5), 1)
            humidity = round(_gaussian(62 - diurnal * 2, 5), 1)
            humidity = max(30, min(95, humidity))

            weather_batch.append({
                "patient": patient_id,
                "recorded_at": t,
                "temp_c": ambient,
                "humidity_pct": humidity,
                "source": "synthetic",
            })
            counts["weather_count"] += 1

        # --- Sleep: one record per night ---
        quality = sleep_quality[day]
        duration = {"poor": random.randint(280, 340), "fair": random.randint(340, 400),
                     "good": random.randint(400, 460), "excellent": random.randint(440, 500)}
        dur = duration[quality]
        sleep_start = day_start + timedelta(hours=23)
        sleep_end = sleep_start + timedelta(minutes=dur)
        if sleep_end <= now:
            SleepRecord.create(
                patient=patient_id,
                sleep_start=sleep_start,
                sleep_end=sleep_end,
                duration_minutes=dur,
                quality=quality,
                deep_minutes=int(dur * random.uniform(0.15, 0.25)),
                rem_minutes=int(dur * random.uniform(0.2, 0.3)),
                awakenings=random.randint(0, 3) if quality != "poor" else random.randint(3, 7),
                source="synthetic",
            )
            counts["sleep_count"] += 1

    # Batch insert HR, HRV, temp, weather
    with HeartRateReading._meta.database.atomic():
        for batch in [hr_batch[i:i+100] for i in range(0, len(hr_batch), 100)]:
            HeartRateReading.insert_many(batch).execute()

    with HRVReading._meta.database.atomic():
        for batch in [hrv_batch[i:i+100] for i in range(0, len(hrv_batch), 100)]:
            HRVReading.insert_many(batch).execute()

    with TemperatureReading._meta.database.atomic():
        for batch in [temp_batch[i:i+100] for i in range(0, len(temp_batch), 100)]:
            TemperatureReading.insert_many(batch).execute()

    with WeatherReading._meta.database.atomic():
        for batch in [weather_batch[i:i+100] for i in range(0, len(weather_batch), 100)]:
            WeatherReading.insert_many(batch).execute()

    # --- Episodes: 6 deterministic episodes matching frontend intelligence layer ---
    # Created newest-first so autoincrement IDs 1-6 match EPISODE_INSIGHTS.
    # Spread across the full 7-day window with varied, authentic notes.
    episode_specs = [
        # (hours_ago, notes) — ID 1 = most recent, ID 6 = oldest
        (3,   "Heart racing after barely sleeping, felt it walking to class"),
        (26,  "Chest fluttering while sitting in lecture, came out of nowhere"),
        (60,  "Felt dizzy and pounding walking up stairs from parking deck"),
        (96,  "Random flutter watching TV — wasn't even doing anything"),
        (132, "Woke up with chest thumping, skipped vitamins yesterday"),
        (156, "Heart felt off during dinner, really cold outside today"),
    ]

    for hours_ago, notes in episode_specs:
        ep_time = now - timedelta(hours=hours_ago)
        if ep_time >= start:
            Episode.create(
                patient=patient_id,
                recorded_at=ep_time,
                notes=notes,
                source="synthetic",
            )
            counts["episode_count"] += 1

    return counts
