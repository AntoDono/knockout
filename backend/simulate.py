"""
Simulation engine for the Guardrail TKOS Platform.

Loads YAML or JSON scenario files and replays cardiac and drug events against
the live server state — BPM readings feed the sensor buffer (triggering AFib
detection and WebSocket broadcasts), drug doses are written to the database so
/levels reflects the simulated PK curve.

Usage
-----
    uv run server.py --simulate afib_episode
    uv run server.py --simulate ../simulations/normal_day.yaml

Simulation file format (YAML preferred, JSON also accepted)
------------------------------------------------------------
    name:        "Human-readable title"
    description: "What this scenario demonstrates"
    speed:       20          # playback multiplier; 20 = 20× real-time
    duration:    "60m"       # total simulated duration  (h / m / s units)

    drugs:                   # optional – doses to inject into the PK model
      - name: flecainide
        doses:
          - amount_mg: 100
            taken_at: "-8h"   # negative = already in the past at sim start
          - amount_mg: 100
            taken_at: "+45m"  # positive = this far into the sim

    heart:
      baseline_bpm: 68
      noise_std:    2.0
      segments:                 # ordered list of cardiac phases
        - start:   "0m"
          end:     "20m"
          pattern: normal       # normal | afib | tachycardia | bradycardia | vt
          bpm:     68
        - start:    "20m"
          end:      "40m"
          pattern:  afib
          bpm_mean: 95          # afib pattern uses bpm_mean + bpm_std
          bpm_std:  22

Time notation
-------------
    "-4h"   → 4 hours before sim start (already happened)
    "30m"   → 30 minutes into the sim
    "+1h"   → 1 hour into the sim  ('+' prefix is optional for positive values)
    Units   → h (hours), m (minutes), s (seconds)
"""

from __future__ import annotations

import asyncio
import json
import math
import random
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml


# ---------------------------------------------------------------------------
# Simulation data model
# ---------------------------------------------------------------------------

@dataclass
class DoseEvent:
    drug: str
    amount_mg: float
    offset_s: float        # seconds from sim start; negative = already past


@dataclass
class Segment:
    start_s:  float
    end_s:    float
    pattern:  str          # normal | afib | tachycardia | bradycardia | vt
    bpm:      float = 70.0
    bpm_mean: float = 0.0
    bpm_std:  float = 15.0


@dataclass
class SimConfig:
    name:        str
    description: str
    speed:       float         # playback multiplier
    duration_s:  float         # total simulated seconds
    doses:       list[DoseEvent]
    segments:    list[Segment]
    tick_s:      float = 1.0   # simulated seconds between BPM samples


# ---------------------------------------------------------------------------
# Time-string parsing
# ---------------------------------------------------------------------------

_TIME_RE = re.compile(r"^([+-]?)(\d+(?:\.\d+)?)(h|m|s)$")


def _parse_offset(raw: str) -> float:
    """Parse a time-offset string into seconds.

    Examples: '-4h' → -14400, '30m' → 1800, '+1h' → 3600, '45s' → 45
    """
    s = str(raw).strip()
    m = _TIME_RE.match(s)
    if not m:
        raise ValueError(
            f"Invalid time offset {s!r}. Expected format: [-+]<number><h|m|s>  "
            f"(e.g. '-4h', '30m', '+90s')"
        )
    sign_str, value_str, unit = m.groups()
    value = float(value_str) * {"h": 3600.0, "m": 60.0, "s": 1.0}[unit]
    return -value if sign_str == "-" else value


# ---------------------------------------------------------------------------
# File loading and schema building
# ---------------------------------------------------------------------------

_SIMULATIONS_ROOT = Path(__file__).parent / "simulations"


def parse_sim_file(path: str | Path) -> SimConfig:
    """Load a simulation file (YAML or JSON) and return a validated SimConfig.

    The *path* argument is resolved in order:
      1. As-is (absolute or relative to cwd)
      2. Inside the project's top-level  simulations/  folder
      3. With .yaml / .json extension appended (in that folder)
    """
    p = Path(path)

    if not p.exists():
        stem = p.stem if p.suffix else str(p)
        candidates = [
            _SIMULATIONS_ROOT / p,
            _SIMULATIONS_ROOT / f"{stem}.yaml",
            _SIMULATIONS_ROOT / f"{stem}.json",
        ]
        for c in candidates:
            if c.exists():
                p = c
                break
        else:
            raise FileNotFoundError(
                f"Simulation file not found: {path!r}\n"
                f"Searched in: {_SIMULATIONS_ROOT}"
            )

    raw = p.read_text()
    data = yaml.safe_load(raw) if p.suffix in (".yaml", ".yml") else json.loads(raw)
    return _build_config(data)


def _build_config(data: dict) -> SimConfig:
    name        = data.get("name", "Unnamed Simulation")
    description = data.get("description", "")
    speed       = float(data.get("speed", 1.0))
    duration_s  = abs(_parse_offset(str(data.get("duration", "60m"))))

    # -- doses ---------------------------------------------------------------
    doses: list[DoseEvent] = []
    for drug_entry in data.get("drugs", []):
        drug_name = drug_entry["name"].strip().lower()
        for d in drug_entry.get("doses", []):
            doses.append(DoseEvent(
                drug      = drug_name,
                amount_mg = float(d["amount_mg"]),
                offset_s  = _parse_offset(str(d["taken_at"])),
            ))

    # -- heart segments ------------------------------------------------------
    heart_cfg  = data.get("heart", {})
    baseline   = float(heart_cfg.get("baseline_bpm", 70.0))
    noise_std  = float(heart_cfg.get("noise_std", 2.0))
    raw_segs   = heart_cfg.get("segments", [])

    if not raw_segs:
        raw_segs = [{"start": "0m", "end": f"{int(duration_s)}s",
                     "pattern": "normal", "bpm": baseline}]

    segments: list[Segment] = []
    for i, seg in enumerate(raw_segs):
        start_s = _parse_offset(str(seg["start"]))
        if "end" in seg:
            end_s = _parse_offset(str(seg["end"]))
        elif i + 1 < len(raw_segs):
            end_s = _parse_offset(str(raw_segs[i + 1]["start"]))
        else:
            end_s = duration_s

        bpm = float(seg.get("bpm", baseline))
        pattern = seg.get("pattern", "normal")
        default_std = noise_std if pattern in ("normal", "bradycardia") else noise_std * 4
        segments.append(Segment(
            start_s  = start_s,
            end_s    = end_s,
            pattern  = pattern,
            bpm      = bpm,
            bpm_mean = float(seg.get("bpm_mean", bpm)),
            bpm_std  = float(seg.get("bpm_std", default_std)),
        ))

    return SimConfig(
        name        = name,
        description = description,
        speed       = speed,
        duration_s  = duration_s,
        doses       = doses,
        segments    = segments,
    )


# ---------------------------------------------------------------------------
# BPM generators per cardiac pattern
# ---------------------------------------------------------------------------

def _clamp(v: float, lo: float = 20.0, hi: float = 300.0) -> float:
    return max(lo, min(hi, v))


# Smoothed random walk state for sinus-rhythm patterns. Each call nudges the
# previous value toward the target with a small random step — producing beat-
# to-beat correlation that keeps RMSSD and CV low (like real sinus rhythm).
_prev_bpm: float | None = None
_SMOOTH_ALPHA = 0.08   # pull toward target per tick (lower = smoother)
_STEP_STD     = 0.4    # random walk step size (bpm per tick)


def _gen_smooth(target: float, **_) -> float:
    """Autoregressive generator: correlated beat-to-beat for sinus rhythm."""
    global _prev_bpm
    if _prev_bpm is None:
        _prev_bpm = target

    # Drift toward target + tiny random step
    _prev_bpm += _SMOOTH_ALPHA * (target - _prev_bpm) + random.gauss(0, _STEP_STD)
    _prev_bpm = _clamp(_prev_bpm)
    return _prev_bpm


def _gen_afib(bpm_mean: float, bpm_std: float = 20.0, **_) -> float:
    """AFib: erratic rate drawn from a wide distribution with occasional tail events."""
    global _prev_bpm
    raw = random.gauss(bpm_mean, bpm_std)
    if random.random() < 0.15:
        raw += random.choice([-1, 1]) * random.expovariate(0.06)
    _prev_bpm = _clamp(raw)
    return _prev_bpm


def _gen_tachycardia(bpm: float, bpm_std: float = 4.0, **_) -> float:
    return _gen_smooth(target=max(100.0, bpm))


def _gen_vt(bpm: float = 185.0, bpm_std: float = 6.0, **_) -> float:
    """VT: fast and somewhat regular — still uses smooth walk."""
    return _gen_smooth(target=bpm)


_GENERATORS = {
    "normal":      lambda bpm, **_: _gen_smooth(target=bpm),
    "afib":        _gen_afib,
    "tachycardia": _gen_tachycardia,
    "bradycardia": lambda bpm, **_: _gen_smooth(target=min(55.0, bpm)),
    "vt":          _gen_vt,
}


def _bpm_at(t_s: float, segments: list[Segment]) -> float:
    """Return a generated BPM for simulated time *t_s* seconds."""
    for seg in segments:
        if seg.start_s <= t_s < seg.end_s:
            gen = _GENERATORS.get(seg.pattern, lambda bpm, **_: _gen_smooth(target=bpm))
            return gen(bpm=seg.bpm, bpm_mean=seg.bpm_mean, bpm_std=seg.bpm_std)
    if segments:
        last = segments[-1]
        return _gen_smooth(target=last.bpm)
    return _gen_smooth(target=70.0)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def _inject_dose(drug_name: str, amount_mg: float, taken_at: datetime) -> None:
    """Write a dose directly into the database; auto-register drug if unknown."""
    from database import Drug, Dose  # imported late to avoid circular imports

    try:
        drug = Drug.get(Drug.name == drug_name)
    except Drug.DoesNotExist:
        # Try LLM lookup; fall back to a generic 10-hour half-life
        try:
            from llm_tools import get_halflife
            hl = get_halflife(drug_name)
            half_life_s = hl.halflife
            reasoning   = hl.reasoning
        except Exception:
            half_life_s = 36_000
            reasoning   = "auto-registered by simulation (fallback half-life)"

        drug = Drug.create(name=drug_name, half_life_s=half_life_s, reasoning=reasoning)
        _log(f"Auto-registered drug: {drug_name}  (t½ = {half_life_s / 3600:.1f}h)")

    Dose.create(drug=drug, amount_mg=amount_mg, taken_at=taken_at)


# ---------------------------------------------------------------------------
# Simulation runner
# ---------------------------------------------------------------------------

def _log(msg: str) -> None:
    print(f"[SIM] {msg}", flush=True)


async def run_simulation(config: SimConfig) -> None:
    """Drive BPM readings and drug doses into the live server state.

    Runs as a FastAPI background task.  Imports sensor shared state at runtime
    so there are no import-time circular dependencies.
    """
    global _prev_bpm
    _prev_bpm = None  # reset walk state for each run

    import json as _json
    from sensor import _bpm_buffer, _build_heart_payload, _broadcast

    sim_start = datetime.now(timezone.utc)

    _log(f"{'─' * 60}")
    _log(f"Scenario : {config.name}")
    _log(f"Notes    : {config.description}")
    _log(f"Speed    : {config.speed}×   Duration: {config.duration_s / 60:.1f} min simulated")
    _log(f"Segments : {len(config.segments)}   Doses: {len(config.doses)}")
    _log(f"{'─' * 60}")

    # Inject past doses immediately (they already happened relative to now)
    for ev in config.doses:
        if ev.offset_s < 0:
            taken_at = sim_start + timedelta(seconds=ev.offset_s)
            _inject_dose(ev.drug, ev.amount_mg, taken_at)
            _log(f"Past dose : {ev.amount_mg}mg {ev.drug}  "
                 f"(taken {abs(ev.offset_s)/3600:.1f}h ago)")

    # Index future doses; track which have fired
    future_doses = [(i, ev) for i, ev in enumerate(config.doses) if ev.offset_s >= 0]
    fired: set[int] = set()

    real_tick_s = config.tick_s / config.speed   # wall-clock seconds per tick
    total_ticks = int(config.duration_s / config.tick_s)

    for i in range(total_ticks):
        t = i * config.tick_s    # simulated seconds elapsed

        # Fire future doses whose offset has been reached
        for idx, ev in future_doses:
            if idx not in fired and t >= ev.offset_s:
                taken_at = sim_start + timedelta(seconds=ev.offset_s)
                _inject_dose(ev.drug, ev.amount_mg, taken_at)
                fired.add(idx)
                _log(f"t={t/60:6.1f}min  Dose : {ev.amount_mg}mg {ev.drug}")

        # Generate and push a BPM sample
        bpm = _bpm_at(t, config.segments)
        _bpm_buffer.append(bpm)

        payload = _build_heart_payload(bpm)
        payload["sim_time_s"] = round(t, 1)
        payload["sim_name"]   = config.name
        await _broadcast(_json.dumps(payload))

        await asyncio.sleep(real_tick_s)

    _log(f"Simulation complete: {config.name!r}")


# ---------------------------------------------------------------------------
# CLI – run standalone for quick schema validation
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python simulate.py <sim_file>")
        sys.exit(1)

    cfg = parse_sim_file(sys.argv[1])
    print(f"✓ Parsed: {cfg.name!r}")
    print(f"  Duration : {cfg.duration_s / 60:.1f} min  |  Speed: {cfg.speed}×")
    print(f"  Segments : {len(cfg.segments)}")
    for s in cfg.segments:
        print(f"    [{s.start_s/60:.1f}–{s.end_s/60:.1f}min]  {s.pattern}  "
              f"bpm={s.bpm_mean or s.bpm}  std={s.bpm_std:.1f}")
    print(f"  Doses    : {len(cfg.doses)}")
    for d in cfg.doses:
        sign = f"{d.offset_s/60:+.0f}min"
        print(f"    {d.amount_mg}mg {d.drug}  ({sign})")
