# Cardiology Report Schema — Design Doc

**Date:** 2026-02-28
**Status:** Draft v0.1 — will evolve as layers are built out
**Report type:** Cardiology (first specialist target; others to follow)

## Design Decisions

- **Approach A: Clinical Sections** — organized by clinical decision-making priority, not system architecture. The cardiologist's most urgent question ("is this patient stable?") comes first.
- **Sections are independently populatable** — as layers (PK, sleep, weather, etc.) come online, their corresponding fields get filled in. Missing data is `null`, not faked.
- **Episode library entries are self-contained** — each episode has enough inline context to answer "why did this happen?" without cross-referencing.
- **`flags` array in executive summary** — the 2-3 things the cardiologist actually needs to read. Everything else is supporting evidence.
- **Honest uncertainty** — `data_sufficiency` field in trigger analysis. If there aren't enough episodes to draw conclusions, the report says so.
- **Personal baselines, not population norms** — all deviations are computed against the patient's own rolling baselines.

## Schema

```json
{
  "metadata": {
    "report_type": "cardiology",
    "patient_id": "string",
    "patient_name": "string",
    "generated_at": "ISO-8601",
    "period_start": "ISO-8601",
    "period_end": "ISO-8601",
    "guardrail_version": "string"
  },

  "executive_summary": {
    "episode_count": 11,
    "previous_period_episode_count": 7,
    "trajectory": "declining | stable | improving",
    "icd_shocks": 0,
    "medication_adherence_pct": 94.0,
    "missed_doses": 3,
    "hrv_baseline_trend": "declining | stable | improving",
    "flags": [
      "73% of episodes occurred during medication trough windows",
      "HRV baseline declined 15% over reporting period"
    ]
  },

  "episode_library": [
    {
      "id": "uuid",
      "timestamp": "ISO-8601",
      "day_of_week": "Tuesday",
      "medication_coverage": {
        "nadolol": {
          "pct_remaining": 47.0,
          "hours_since_dose": 19.2,
          "in_trough": true
        },
        "flecainide": {
          "pct_remaining": 62.0,
          "hours_since_dose": 8.5,
          "in_trough": false
        }
      },
      "hrv_context": {
        "at_event_ms": 22.0,
        "baseline_ms": 35.0,
        "deviation_pct": -37.1
      },
      "heart_rate": {
        "at_event_bpm": 112.0,
        "baseline_bpm": 78.0
      },
      "afib_result": {
        "detected": false,
        "confidence": 0.32
      },
      "sleep_prior_night": {
        "duration_hours": 4.5,
        "baseline_hours": 7.2,
        "below_baseline": true
      },
      "environment": {
        "temperature_f": 91.0,
        "humidity_pct": 78.0
      },
      "wrist_temperature": {
        "value_f": 99.1,
        "elevated": true
      }
    }
  ],

  "pharmacokinetic_analysis": {
    "drugs": [
      {
        "name": "nadolol",
        "dose_mg": 40.0,
        "half_life_hours": 22.0,
        "schedule": "once daily, 08:00",
        "trough_window_start_hours": 16,
        "trough_threshold_pct": 55.0
      }
    ],
    "trough_episode_correlation": {
      "episodes_in_trough": 8,
      "episodes_total": 11,
      "correlation_pct": 72.7
    },
    "adherence": {
      "doses_expected": 90,
      "doses_logged": 87,
      "missed_dose_timestamps": ["ISO-8601"],
      "missed_dose_preceded_episode": 2
    }
  },

  "autonomic_trends": {
    "hrv_baseline": {
      "period_start_ms": 38.0,
      "period_end_ms": 32.0,
      "trend": "declining",
      "change_pct": -15.8
    },
    "notable_hrv_dips": [
      {
        "timestamp": "ISO-8601",
        "value_ms": 18.0,
        "associated_episode_id": "uuid | null"
      }
    ]
  },

  "trigger_analysis": {
    "top_correlates": [
      { "factor": "medication_trough", "appeared_in_n": 8, "of_total": 11, "pct": 72.7 },
      { "factor": "high_temperature", "appeared_in_n": 6, "of_total": 11, "pct": 54.5 },
      { "factor": "poor_sleep", "appeared_in_n": 5, "of_total": 11, "pct": 45.5 }
    ],
    "compound_patterns": [
      {
        "factors": ["medication_trough", "high_temperature"],
        "co_occurred_n": 5,
        "of_total": 11
      }
    ],
    "data_sufficiency": "sufficient | insufficient",
    "note": "Minimum 5 episodes recommended for trigger analysis"
  },

  "supporting_context": {
    "sleep_trend": {
      "avg_duration_hours": 6.8,
      "baseline_duration_hours": 7.2,
      "trend": "stable"
    },
    "environmental_exposures": {
      "days_above_85f": 12,
      "days_above_90f": 4
    }
  }
}
```

## Mapping to Existing Code

| Schema Section | Data Source | Status |
|---|---|---|
| `episode_library[].medication_coverage` | `database.get_current_levels()` | Ready — PK decay model exists |
| `episode_library[].afib_result` | `heart_analyze.detect_afib()` | Ready — full HRV/afib pipeline exists |
| `episode_library[].heart_rate` | Sensor ingestion via `/push` | Ready — BPM stream ingested |
| `pharmacokinetic_analysis.drugs` | `database.Drug` model | Ready — half-life + dosing stored |
| `pharmacokinetic_analysis.adherence` | `database.Dose` model | Ready — dose timestamps logged |
| `episode_library[].hrv_context` | HRV from sensor stream | Needs baseline tracking layer |
| `episode_library[].sleep_prior_night` | Apple Watch / HealthKit | Not yet wired |
| `episode_library[].environment` | Weather API | Not yet wired |
| `episode_library[].wrist_temperature` | Apple Watch | Not yet wired |
| `autonomic_trends` | Derived from HRV stream | Needs rolling baseline computation |
| `trigger_analysis` | Derived from episode library | Needs analysis logic |

## Future Specialist Variants

This schema is cardiology-first. For other specialists:
- **Neurologist** — would de-emphasize PK/trough analysis, add seizure-related metrics, expand sleep section
- **Geneticist** — would add mutation/variant info, family history, phenotype progression
- **General pediatrician** — would simplify, add growth/development context, emphasize medication adherence

The `report_type` field in metadata determines which sections are included and how they're prioritized.
