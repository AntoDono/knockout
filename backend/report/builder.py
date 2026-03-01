"""
Report assembly logic for cardiology briefings.

Takes raw data (episodes, doses, medications, patient info) and assembles
a structured report dict matching the schema in the design doc.

Self-contained — no imports from database.py or server.py.
"""

from datetime import datetime, timezone


# ── Configurable thresholds ───────────────────────────────────────────────

TROUGH_THRESHOLD_PCT = 55.0   # below this = in trough window
HIGH_TEMP_F          = 85.0   # above this = heat exposure
POOR_SLEEP_RATIO     = 0.85   # below baseline * this = poor sleep
MIN_EPISODES_FOR_TRIGGERS = 5


def build_cardiology_report(
    patient: dict,
    medications: list[dict],
    episodes: list[dict],
    doses: dict,
    period_start: str,
    period_end: str,
) -> dict:
    """Assemble a full cardiology report from raw data."""

    report = {
        "metadata": _build_metadata(patient, period_start, period_end),
        "executive_summary": _build_executive_summary(episodes, doses, patient),
        "episode_library": _build_episode_library(episodes, patient),
        "pharmacokinetic_analysis": _build_pk_analysis(medications, episodes, doses),
        "autonomic_trends": _build_autonomic_trends(episodes, patient),
        "trigger_analysis": _build_trigger_analysis(episodes),
        "supporting_context": _build_supporting_context(episodes),
    }

    return report


# ── Section builders ──────────────────────────────────────────────────────

def _build_metadata(patient: dict, period_start: str, period_end: str) -> dict:
    return {
        "report_type": "cardiology",
        "patient_id": patient["patient_id"],
        "patient_name": patient["patient_name"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "period_start": period_start,
        "period_end": period_end,
        "knockout_version": "0.1.0",
    }


def _build_executive_summary(episodes: list[dict], doses: dict, patient: dict) -> dict:
    n = len(episodes)

    # Trough correlation for nadolol (primary drug)
    in_trough = sum(
        1 for ep in episodes
        if ep.get("medication_coverage", {}).get("nadolol", {}).get("in_trough", False)
    )
    trough_pct = round(in_trough / n * 100, 1) if n else 0

    # HRV trend: compare first half vs second half of episodes
    hrvs = [ep["hrv"] for ep in episodes if ep.get("hrv") is not None]
    if len(hrvs) >= 4:
        mid = len(hrvs) // 2
        first_half_avg = sum(hrvs[:mid]) / mid
        second_half_avg = sum(hrvs[mid:]) / (len(hrvs) - mid)
        hrv_change_pct = round((second_half_avg - first_half_avg) / first_half_avg * 100, 1)
        if hrv_change_pct < -10:
            hrv_trend = "declining"
        elif hrv_change_pct > 10:
            hrv_trend = "improving"
        else:
            hrv_trend = "stable"
    else:
        hrv_trend = "insufficient data"
        hrv_change_pct = 0

    # Adherence (nadolol as primary)
    nad_doses = doses.get("nadolol", {})
    adherence_pct = round(
        nad_doses.get("logged", 0) / nad_doses.get("expected", 1) * 100, 1
    ) if nad_doses.get("expected") else None
    missed = nad_doses.get("expected", 0) - nad_doses.get("logged", 0)

    # Build flags — the 2-3 most important findings
    flags = []
    if n > 0 and trough_pct >= 60:
        flags.append(f"{trough_pct}% of episodes occurred during nadolol trough windows")
    if hrv_trend == "declining":
        flags.append(f"HRV baseline declined {abs(hrv_change_pct)}% over reporting period")
    if hrv_trend == "improving":
        flags.append(f"HRV baseline improved {hrv_change_pct}% over reporting period")

    # Check for afib detections
    afib_episodes = [ep for ep in episodes if ep.get("afib_result", {}).get("detected", False)]
    if afib_episodes:
        flags.append(f"Atrial fibrillation pattern detected in {len(afib_episodes)} episode(s)")

    # Poor sleep correlation
    poor_sleep_eps = [
        ep for ep in episodes
        if ep.get("sleep_prior_night", {}).get("below_baseline", False)
    ]
    if n > 0 and len(poor_sleep_eps) / n >= 0.6:
        flags.append(f"Poor sleep preceded {len(poor_sleep_eps)} of {n} episodes ({round(len(poor_sleep_eps)/n*100)}%)")

    return {
        "episode_count": n,
        "previous_period_episode_count": None,  # no historical data yet
        "trajectory": hrv_trend,
        "icd_shocks": 0,  # not wired yet
        "medication_adherence_pct": adherence_pct,
        "missed_doses": missed,
        "hrv_baseline_trend": hrv_trend,
        "flags": flags,
    }


def _build_episode_library(episodes: list[dict], patient: dict) -> list[dict]:
    baseline_hrv = patient.get("hrv_baseline_ms", 35.0)
    baseline_hr = patient.get("resting_hr_baseline", 78.0)

    library = []
    for ep in episodes:
        hrv_val = ep.get("hrv")
        hr_val = ep.get("heart_rate")

        entry = {
            "id": ep["id"],
            "timestamp": ep["timestamp"],
            "day_of_week": ep.get("day_of_week"),
            "medication_coverage": ep.get("medication_coverage"),
            "hrv_context": {
                "at_event_ms": hrv_val,
                "baseline_ms": baseline_hrv,
                "deviation_pct": round((hrv_val - baseline_hrv) / baseline_hrv * 100, 1) if hrv_val else None,
            },
            "heart_rate": {
                "at_event_bpm": hr_val,
                "baseline_bpm": baseline_hr,
            },
            "afib_result": ep.get("afib_result"),
            "sleep_prior_night": ep.get("sleep_prior_night"),
            "environment": ep.get("environment"),
            "wrist_temperature": ep.get("wrist_temperature"),
        }
        library.append(entry)

    return library


def _build_pk_analysis(medications: list[dict], episodes: list[dict], doses: dict) -> dict:
    drugs_section = []
    for med in medications:
        drugs_section.append({
            "name": med["name"],
            "dose_mg": med["dose_mg"],
            "half_life_hours": med["half_life_hours"],
            "schedule": med["schedule"],
            "trough_window_start_hours": med.get("trough_window_start_hours"),
            "trough_threshold_pct": med.get("trough_threshold_pct", TROUGH_THRESHOLD_PCT),
        })

    # Trough correlation for nadolol
    n = len(episodes)
    in_trough = sum(
        1 for ep in episodes
        if ep.get("medication_coverage", {}).get("nadolol", {}).get("in_trough", False)
    )

    # Count missed doses that preceded an episode within 36 hours
    nad_doses = doses.get("nadolol", {})
    missed_ts = nad_doses.get("missed_timestamps", [])
    missed_preceded = 0
    for missed in missed_ts:
        missed_dt = datetime.fromisoformat(missed)
        for ep in episodes:
            ep_dt = datetime.fromisoformat(ep["timestamp"])
            delta = (ep_dt - missed_dt).total_seconds() / 3600
            if 0 < delta < 36:
                missed_preceded += 1
                break

    # Combined adherence across all drugs
    adherence = {}
    for drug_name, drug_doses in doses.items():
        expected = drug_doses.get("expected", 0)
        logged = drug_doses.get("logged", 0)
        adherence[drug_name] = {
            "doses_expected": expected,
            "doses_logged": logged,
            "adherence_pct": round(logged / expected * 100, 1) if expected else None,
            "missed_dose_timestamps": drug_doses.get("missed_timestamps", []),
            "missed_dose_preceded_episode": missed_preceded if drug_name == "nadolol" else 0,
        }

    return {
        "drugs": drugs_section,
        "trough_episode_correlation": {
            "episodes_in_trough": in_trough,
            "episodes_total": n,
            "correlation_pct": round(in_trough / n * 100, 1) if n else 0,
        },
        "adherence": adherence,
    }


def _build_autonomic_trends(episodes: list[dict], patient: dict) -> dict:
    baseline = patient.get("hrv_baseline_ms", 35.0)
    hrvs = [(ep["timestamp"], ep["hrv"]) for ep in episodes if ep.get("hrv") is not None]

    if len(hrvs) < 2:
        return {
            "hrv_baseline": {
                "period_start_ms": None,
                "period_end_ms": None,
                "trend": "insufficient data",
                "change_pct": None,
            },
            "notable_hrv_dips": [],
        }

    # Sort by timestamp
    hrvs.sort(key=lambda x: x[0])
    start_hrv = hrvs[0][1]
    end_hrv = hrvs[-1][1]
    change_pct = round((end_hrv - start_hrv) / start_hrv * 100, 1)

    if change_pct < -10:
        trend = "declining"
    elif change_pct > 10:
        trend = "improving"
    else:
        trend = "stable"

    # Notable dips: HRV below 60% of baseline
    dip_threshold = baseline * 0.6
    dips = []
    for ts, hrv_val in hrvs:
        if hrv_val <= dip_threshold:
            # Find matching episode
            matching = next((ep for ep in episodes if ep["timestamp"] == ts), None)
            dips.append({
                "timestamp": ts,
                "value_ms": hrv_val,
                "associated_episode_id": matching["id"] if matching else None,
            })

    return {
        "hrv_baseline": {
            "period_start_ms": start_hrv,
            "period_end_ms": end_hrv,
            "trend": trend,
            "change_pct": change_pct,
        },
        "notable_hrv_dips": dips,
    }


def _build_trigger_analysis(episodes: list[dict]) -> dict:
    n = len(episodes)

    if n < MIN_EPISODES_FOR_TRIGGERS:
        return {
            "top_correlates": [],
            "compound_patterns": [],
            "data_sufficiency": "insufficient",
            "note": f"Minimum {MIN_EPISODES_FOR_TRIGGERS} episodes needed; only {n} recorded",
        }

    # Count factor presence across episodes
    factors = {
        "medication_trough": 0,
        "high_temperature": 0,
        "poor_sleep": 0,
        "elevated_wrist_temp": 0,
        "dual_trough": 0,  # both drugs in trough simultaneously
    }

    # Track per-episode factor sets for compound analysis
    ep_factors: list[set[str]] = []

    for ep in episodes:
        present: set[str] = set()
        med_cov = ep.get("medication_coverage", {})

        if med_cov.get("nadolol", {}).get("in_trough", False):
            factors["medication_trough"] += 1
            present.add("medication_trough")

        if med_cov.get("nadolol", {}).get("in_trough", False) and med_cov.get("flecainide", {}).get("in_trough", False):
            factors["dual_trough"] += 1
            present.add("dual_trough")

        env = ep.get("environment", {})
        if env.get("temperature_f", 0) >= HIGH_TEMP_F:
            factors["high_temperature"] += 1
            present.add("high_temperature")

        if ep.get("sleep_prior_night", {}).get("below_baseline", False):
            factors["poor_sleep"] += 1
            present.add("poor_sleep")

        if ep.get("wrist_temperature", {}).get("elevated", False):
            factors["elevated_wrist_temp"] += 1
            present.add("elevated_wrist_temp")

        ep_factors.append(present)

    # Sort by frequency
    top = sorted(
        [
            {"factor": f, "appeared_in_n": c, "of_total": n, "pct": round(c / n * 100, 1)}
            for f, c in factors.items() if c > 0
        ],
        key=lambda x: x["pct"],
        reverse=True,
    )

    # Compound patterns: find pairs that co-occur in >= 30% of episodes
    factor_names = [f for f, c in factors.items() if c > 0]
    compounds = []
    for i, f1 in enumerate(factor_names):
        for f2 in factor_names[i + 1:]:
            co_count = sum(1 for ep_f in ep_factors if f1 in ep_f and f2 in ep_f)
            if co_count >= 2 and co_count / n >= 0.2:
                compounds.append({
                    "factors": [f1, f2],
                    "co_occurred_n": co_count,
                    "of_total": n,
                })
    compounds.sort(key=lambda x: x["co_occurred_n"], reverse=True)

    return {
        "top_correlates": top,
        "compound_patterns": compounds,
        "data_sufficiency": "sufficient",
        "note": None,
    }


def _build_supporting_context(episodes: list[dict]) -> dict:
    sleep_durations = [
        ep["sleep_prior_night"]["duration_hours"]
        for ep in episodes
        if ep.get("sleep_prior_night", {}).get("duration_hours") is not None
    ]
    avg_sleep = round(sum(sleep_durations) / len(sleep_durations), 1) if sleep_durations else None

    temps = [
        ep["environment"]["temperature_f"]
        for ep in episodes
        if ep.get("environment", {}).get("temperature_f") is not None
    ]
    days_above_85 = sum(1 for t in temps if t >= 85)
    days_above_90 = sum(1 for t in temps if t >= 90)

    return {
        "sleep_trend": {
            "avg_duration_hours": avg_sleep,
            "baseline_duration_hours": 7.2,
            "trend": "stable",  # simplified for now
        },
        "environmental_exposures": {
            "episodes_above_85f": days_above_85,
            "episodes_above_90f": days_above_90,
        },
    }
