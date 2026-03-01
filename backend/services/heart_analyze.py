"""
AFIB detection from a series of BPM readings.

Algorithm
---------
Atrial fibrillation is characterised by two things detectable from BPM data:
  1. Irregularly irregular RR intervals  (high CV, high RMSSD)
  2. Absence of a dominant low-frequency rhythm  (flat/noisy LF/HF spectral ratio)

We derive RR intervals as  rr_ms = 60 000 / bpm,  then compute a battery of
HRV metrics and combine them into a single confidence score.

Metrics used
------------
  cv          Coefficient of variation of RR intervals (SDNN / mean_RR).
              AFIB typically > 0.065.
  rmssd       Root-mean-square of successive RR differences (ms).
              AFIB typically > 40 ms.
  pnn20       Fraction of successive differences > 20 ms.
              AFIB typically > 0.40.
  sd1/sd2     Poincaré-plot short- and long-axis SDs.
              AFIB: sd1/sd2 ratio closer to 1 (more isotropic scatter).
  sampen      Sample entropy of the RR series (regularity measure).
              AFIB: higher entropy (more chaotic).
  lf_hf       Spectral LF/HF power ratio (0.04–0.15 Hz / 0.15–0.4 Hz).
              AFIB: ratio tends toward 1 (loss of low-frequency dominance).

Each metric votes with a weight; confidence = weighted sum / total weight.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np
from scipy.signal import welch


# ---------------------------------------------------------------------------
# Public result type
# ---------------------------------------------------------------------------

@dataclass
class AfibResult:
    afib_detected: bool
    confidence: float          # 0.0 – 1.0
    mean_bpm: float
    n_samples: int
    cv: float                  # coefficient of variation
    rmssd_ms: float
    pnn20: float
    sd1: float
    sd2: float
    sd1_sd2_ratio: float
    sample_entropy: float
    lf_hf_ratio: float | None  # None when signal too short for reliable FFT
    notes: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Thresholds (tunable)
# ---------------------------------------------------------------------------

_CV_THRESH        = 0.065   # > this → irregular
_RMSSD_THRESH     = 40.0    # ms
_PNN20_THRESH     = 0.40
_SD1_SD2_THRESH   = 0.75    # ratio; close to 1 → isotropic (AFIB)
_SAMPEN_THRESH    = 1.5     # higher → more chaotic
_LFHF_AFIB_LOW   = 0.5     # AFIB usually compresses LF/HF toward 1
_LFHF_AFIB_HIGH  = 2.0
_MIN_SAMPLES      = 10


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _rr_from_bpm(bpms: np.ndarray) -> np.ndarray:
    """Convert BPM array to RR intervals in milliseconds."""
    return 60_000.0 / bpms


def _sdnn(rr: np.ndarray) -> float:
    return float(np.std(rr, ddof=1))


def _rmssd(rr: np.ndarray) -> float:
    diff = np.diff(rr)
    return float(np.sqrt(np.mean(diff ** 2)))


def _pnn20(rr: np.ndarray) -> float:
    diff = np.abs(np.diff(rr))
    return float(np.mean(diff > 20.0))


def _poincare(rr: np.ndarray) -> tuple[float, float]:
    """
    Return (SD1, SD2) from the Poincaré plot.

    SD1 = std(diff) / sqrt(2)               — short-term beat-to-beat variation
    SD2 = sqrt(2·SDNN² − SD1²)             — long-term variation
    """
    diff     = np.diff(rr)
    sd1_sq   = float(np.var(diff, ddof=1)) / 2.0
    sd1      = math.sqrt(sd1_sq)
    sdnn_sq  = float(np.var(rr, ddof=1))
    sd2      = math.sqrt(max(2.0 * sdnn_sq - sd1_sq, 0.0))
    return sd1, sd2


def _sample_entropy(rr: np.ndarray, m: int = 2, r_factor: float = 0.2) -> float:
    """
    Sample entropy (SampEn) of the RR series.

    Uses a tolerance window r = r_factor * std(rr).
    Returns NaN if the series is too short or template matches collapse.
    """
    n   = len(rr)
    r   = r_factor * float(np.std(rr, ddof=1))
    if r == 0 or n < 2 * (m + 1):
        return float("nan")

    def _count_matches(template_len: int) -> int:
        count = 0
        templates = np.array([rr[i:i + template_len] for i in range(n - template_len)])
        for i, tmpl in enumerate(templates):
            dists = np.max(np.abs(templates - tmpl), axis=1)
            # exclude self-match
            dists[i] = r + 1
            count += int(np.sum(dists <= r))
        return count

    B = _count_matches(m)
    A = _count_matches(m + 1)

    if B == 0:
        return float("nan")
    return float(-math.log(A / B)) if A > 0 else float("inf")


def _lf_hf_ratio(rr: np.ndarray, fs: float = 4.0) -> float | None:
    """
    Compute LF/HF ratio via Welch PSD on a uniformly resampled RR series.

    Requires at least ~60 s of data for reliable spectral estimates.
    Returns None when the series is too short.
    """
    duration_s = float(np.sum(rr)) / 1000.0
    if duration_s < 30.0:
        return None

    # Resample RR series to uniform time grid
    t_rr    = np.cumsum(rr) / 1000.0          # cumulative time in seconds
    t_grid  = np.arange(t_rr[0], t_rr[-1], 1.0 / fs)
    rr_interp = np.interp(t_grid, t_rr, rr)

    nperseg = min(256, len(rr_interp))
    freqs, psd = welch(rr_interp, fs=fs, nperseg=nperseg)

    lf_mask = (freqs >= 0.04) & (freqs < 0.15)
    hf_mask = (freqs >= 0.15) & (freqs < 0.40)

    lf_power = float(np.trapezoid(psd[lf_mask], freqs[lf_mask])) if lf_mask.any() else 0.0
    hf_power = float(np.trapezoid(psd[hf_mask], freqs[hf_mask])) if hf_mask.any() else 0.0

    if hf_power == 0:
        return None
    return lf_power / hf_power


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect_afib(bpms: list[float] | np.ndarray, min_samples: int = _MIN_SAMPLES) -> AfibResult:
    """
    Detect atrial fibrillation from a sequence of BPM readings.

    Parameters
    ----------
    bpms        : Sequence of heart-rate readings in beats-per-minute.
                  Readings should be in chronological order and roughly evenly
                  spaced (typical wearable output: one reading per second or
                  every few seconds).
    min_samples : Minimum number of samples required for a valid assessment.
                  Results with fewer samples are marked not-detected with
                  confidence = 0.

    Returns
    -------
    AfibResult dataclass with all intermediate metrics and a final verdict.
    """
    bpms = np.asarray(bpms, dtype=float)
    notes: list[str] = []

    # --- sanity checks -------------------------------------------------------
    if len(bpms) < min_samples:
        notes.append(f"Too few samples ({len(bpms)} < {min_samples}); cannot assess.")
        return AfibResult(
            afib_detected=False, confidence=0.0,
            mean_bpm=float(np.mean(bpms)) if len(bpms) else 0.0,
            n_samples=len(bpms),
            cv=0.0, rmssd_ms=0.0, pnn20=0.0,
            sd1=0.0, sd2=0.0, sd1_sd2_ratio=0.0,
            sample_entropy=float("nan"), lf_hf_ratio=None,
            notes=notes,
        )

    # Clamp physiologically implausible readings
    mask = (bpms >= 20) & (bpms <= 300)
    if not mask.all():
        n_removed = int((~mask).sum())
        notes.append(f"Removed {n_removed} implausible BPM reading(s) (outside 20–300 bpm).")
        bpms = bpms[mask]

    if len(bpms) < min_samples:
        notes.append("Too few valid samples after filtering.")
        return AfibResult(
            afib_detected=False, confidence=0.0,
            mean_bpm=float(np.mean(bpms)),
            n_samples=len(bpms),
            cv=0.0, rmssd_ms=0.0, pnn20=0.0,
            sd1=0.0, sd2=0.0, sd1_sd2_ratio=0.0,
            sample_entropy=float("nan"), lf_hf_ratio=None,
            notes=notes,
        )

    # --- derive RR intervals -------------------------------------------------
    rr = _rr_from_bpm(bpms)

    mean_bpm  = float(np.mean(bpms))
    mean_rr   = float(np.mean(rr))
    sdnn_val  = _sdnn(rr)
    cv        = sdnn_val / mean_rr
    rmssd_val = _rmssd(rr)
    pnn20_val = _pnn20(rr)
    sd1, sd2  = _poincare(rr)
    sd1_sd2   = sd1 / sd2 if sd2 > 0 else 0.0
    sampen    = _sample_entropy(rr)
    lfhf      = _lf_hf_ratio(rr)

    # --- weighted voting -----------------------------------------------------
    # Each criterion returns a score in [0, 1]; weight reflects clinical weight.
    votes: list[tuple[float, float, str]] = []   # (score, weight, label)

    def _vote(score: float, weight: float, label: str):
        votes.append((min(max(score, 0.0), 1.0), weight, label))

    # CV: linearly ramp 0→1 over [0.04, 0.12]
    _vote((cv - 0.04) / (0.12 - 0.04), 2.5, "cv")

    # RMSSD: linearly ramp 0→1 over [20, 80] ms
    _vote((rmssd_val - 20.0) / (80.0 - 20.0), 2.0, "rmssd")

    # pNN20: linearly ramp 0→1 over [0.2, 0.7]
    _vote((pnn20_val - 0.2) / (0.7 - 0.2), 1.5, "pnn20")

    # SD1/SD2 ratio: ramp 0→1 over [0.3, 1.0] (higher = more AFIB-like)
    _vote((sd1_sd2 - 0.3) / (1.0 - 0.3), 1.5, "sd1_sd2")

    # Sample entropy: ramp 0→1 over [1.0, 2.5]
    if not math.isnan(sampen) and not math.isinf(sampen):
        _vote((sampen - 1.0) / (2.5 - 1.0), 1.5, "sampen")

    # LF/HF: AFIB collapses ratio toward 1; penalise extremes
    if lfhf is not None:
        # Score highest when ratio is near 1.0 (flat spectrum)
        lfhf_score = max(0.0, 1.0 - abs(math.log(max(lfhf, 1e-6))) / math.log(4))
        _vote(lfhf_score, 1.0, "lf_hf")

    total_weight   = sum(w for _, w, _ in votes)
    weighted_score = sum(s * w for s, w, _ in votes) / total_weight if total_weight else 0.0

    # Confidence is dampened by sample count (saturates at ~120 samples)
    sample_factor  = min(len(bpms) / 120.0, 1.0)
    confidence     = weighted_score * (0.5 + 0.5 * sample_factor)

    afib_detected  = confidence >= 0.75

    # --- human-readable notes ------------------------------------------------
    if cv > _CV_THRESH:
        notes.append(f"High RR variability (CV={cv:.3f} > {_CV_THRESH}).")
    if rmssd_val > _RMSSD_THRESH:
        notes.append(f"Elevated RMSSD ({rmssd_val:.1f} ms > {_RMSSD_THRESH} ms).")
    if pnn20_val > _PNN20_THRESH:
        notes.append(f"High pNN20 ({pnn20_val:.2%} > {_PNN20_THRESH:.0%}).")
    if sd1_sd2 > _SD1_SD2_THRESH:
        notes.append(f"Isotropic Poincaré scatter (SD1/SD2={sd1_sd2:.2f} > {_SD1_SD2_THRESH}).")
    if not math.isnan(sampen) and sampen > _SAMPEN_THRESH:
        notes.append(f"High sample entropy ({sampen:.2f} > {_SAMPEN_THRESH}).")
    if lfhf is not None:
        if _LFHF_AFIB_LOW <= lfhf <= _LFHF_AFIB_HIGH:
            notes.append(f"LF/HF ratio ({lfhf:.2f}) in AFIB-consistent range (0.5–2.0).")
    if not notes:
        notes.append("No significant irregularity detected.")

    return AfibResult(
        afib_detected  = afib_detected,
        confidence     = round(confidence, 4),
        mean_bpm       = round(mean_bpm, 1),
        n_samples      = len(bpms),
        cv             = round(cv, 4),
        rmssd_ms       = round(rmssd_val, 2),
        pnn20          = round(pnn20_val, 4),
        sd1            = round(sd1, 2),
        sd2            = round(sd2, 2),
        sd1_sd2_ratio  = round(sd1_sd2, 4),
        sample_entropy = round(sampen, 4) if not math.isnan(sampen) else float("nan"),
        lf_hf_ratio    = round(lfhf, 4) if lfhf is not None else None,
        notes          = notes,
    )
