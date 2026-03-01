"""
Rolling 7-day baselines for all six passive data streams.

Computes mean, std, and count on-the-fly from the last 7 days of readings.
No background jobs -- queries SQLite directly at request time.
"""

from datetime import datetime, timezone, timedelta

from database import (
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, get_current_levels,
)

_WINDOW_DAYS = 7

# Map sleep quality to numeric score for averaging
_QUALITY_SCORES = {"poor": 1, "fair": 2, "good": 3, "excellent": 4}


def _safe_stats(values: list[float]) -> dict:
    """Compute mean and std from a list of floats, handling empty lists."""
    if not values:
        return {"mean": None, "std": None}
    n = len(values)
    mean = sum(values) / n
    if n < 2:
        return {"mean": round(mean, 2), "std": 0.0}
    variance = sum((x - mean) ** 2 for x in values) / (n - 1)
    return {"mean": round(mean, 2), "std": round(variance ** 0.5, 2)}


def get_rolling_baselines(patient_id: int, now: datetime | None = None) -> dict:
    """
    Compute 7-day rolling baselines for all streams.

    Returns dict with keys: hr, hrv, sleep, temperature, weather, medication.
    Each contains mean, std (where applicable), count, and window_days.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=_WINDOW_DAYS)

    # --- Heart Rate ---
    hr_values = [
        r.hr_bpm for r in
        HeartRateReading.select(HeartRateReading.hr_bpm).where(
            HeartRateReading.patient == patient_id,
            HeartRateReading.recorded_at >= cutoff,
        )
    ]
    hr_stats = _safe_stats([float(v) for v in hr_values])

    # --- HRV ---
    hrv_values = [
        r.hrv_ms for r in
        HRVReading.select(HRVReading.hrv_ms).where(
            HRVReading.patient == patient_id,
            HRVReading.recorded_at >= cutoff,
        )
    ]
    hrv_stats = _safe_stats(hrv_values)

    # --- Sleep ---
    sleep_records = list(
        SleepRecord.select(SleepRecord.duration_minutes, SleepRecord.quality).where(
            SleepRecord.patient == patient_id,
            SleepRecord.sleep_start >= cutoff,
        )
    )
    sleep_durations = [r.duration_minutes for r in sleep_records]
    sleep_qualities = [_QUALITY_SCORES.get(r.quality, 2) for r in sleep_records]
    sleep_dur_stats = _safe_stats([float(d) for d in sleep_durations])
    sleep_qual_stats = _safe_stats([float(q) for q in sleep_qualities])

    # --- Temperature ---
    temp_values = [
        r.temp_c for r in
        TemperatureReading.select(TemperatureReading.temp_c).where(
            TemperatureReading.patient == patient_id,
            TemperatureReading.recorded_at >= cutoff,
        )
    ]
    temp_stats = _safe_stats(temp_values)

    # --- Weather ---
    weather_records = list(
        WeatherReading.select(WeatherReading.temp_c, WeatherReading.humidity_pct).where(
            WeatherReading.patient == patient_id,
            WeatherReading.recorded_at >= cutoff,
        )
    )
    weather_temp_stats = _safe_stats([r.temp_c for r in weather_records])
    weather_hum_stats = _safe_stats([r.humidity_pct for r in weather_records])

    # --- Medication (existing) ---
    medication = get_current_levels()

    return {
        "hr": {
            **hr_stats,
            "count": len(hr_values),
            "window_days": _WINDOW_DAYS,
        },
        "hrv": {
            **hrv_stats,
            "count": len(hrv_values),
            "window_days": _WINDOW_DAYS,
        },
        "sleep": {
            "mean_duration_min": sleep_dur_stats["mean"],
            "std_duration_min": sleep_dur_stats["std"],
            "mean_quality_score": sleep_qual_stats["mean"],
            "count": len(sleep_records),
            "window_days": _WINDOW_DAYS,
        },
        "temperature": {
            **temp_stats,
            "count": len(temp_values),
            "window_days": _WINDOW_DAYS,
        },
        "weather": {
            "mean_temp_c": weather_temp_stats["mean"],
            "std_temp_c": weather_temp_stats["std"],
            "mean_humidity_pct": weather_hum_stats["mean"],
            "std_humidity_pct": weather_hum_stats["std"],
            "count": len(weather_records),
            "window_days": _WINDOW_DAYS,
        },
        "medication": medication,
    }
