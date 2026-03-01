"""
External cross-validation against the Kaggle Atrial Fibrillation Signal Dataset.
https://www.kaggle.com/datasets/michaelrowen/atrial-fibrillation-signal-dataset

Dataset: 400 Hz ECG, 10 s recordings (4000 samples each).
  - Train rows 0–499:    AFib
  - Train rows 500–999:  Healthy
  - Train rows 1000–19999: Unlabeled (skipped)

Pipeline:
  ECG (400 Hz) → bandpass → R-peak detection → RR intervals → beat-by-beat BPM
  → pad/truncate to WINDOW_LEN → z-normalize → ResNet inference

Usage:
    uv run python external_validator.py --download   # download + validate
    uv run python external_validator.py              # validate (cached data)
"""

import argparse
import csv as csv_mod
import subprocess
import sys
import zipfile
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from scipy.io import loadmat
from scipy.signal import butter, filtfilt, find_peaks

from model import CHECKPOINT_PATH, WINDOW_LEN, ResNet1d

DATASET_SLUG = "michaelrowen/atrial-fibrillation-signal-dataset"
DATA_DIR = Path(__file__).parent / "external_data"
ECG_FS = 400       # Hz
ECG_SEC = 10       # seconds per recording
ECG_LEN = ECG_FS * ECG_SEC  # 4000 samples

N_AFIB = 500       # rows 0–499
N_HEALTHY = 500    # rows 500–999
N_LABELED = N_AFIB + N_HEALTHY


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

def download_dataset():
    DATA_DIR.mkdir(exist_ok=True)
    print(f"Downloading {DATASET_SLUG} → {DATA_DIR} ...")
    result = subprocess.run(
        [
            "kaggle", "datasets", "download",
            "-d", DATASET_SLUG,
            "-p", str(DATA_DIR),
            "--unzip",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"Download failed:\n{result.stderr}")
        print("Ensure `pip install kaggle` and ~/.kaggle/kaggle.json exist.")
        sys.exit(1)
    print("Download complete.\n")


# ---------------------------------------------------------------------------
# ECG → BPM conversion
# ---------------------------------------------------------------------------

def _bandpass(sig: np.ndarray, fs: int = ECG_FS,
              lo: float = 0.5, hi: float = 40.0) -> np.ndarray:
    nyq = fs / 2
    b, a = butter(5, [lo / nyq, hi / nyq], btype="band")
    return filtfilt(b, a, sig)


def ecg_to_bpm(ecg: np.ndarray, fs: int = ECG_FS) -> list[float]:
    """Raw ECG → beat-by-beat instantaneous BPM via R-peak detection."""
    filtered = _bandpass(ecg, fs)

    min_dist = int(0.3 * fs)  # 200 bpm ceiling
    height_thresh = np.percentile(np.abs(filtered), 90) * 0.5
    peaks, _ = find_peaks(filtered, distance=min_dist, height=height_thresh)

    if len(peaks) < 2:
        peaks, _ = find_peaks(filtered, distance=min_dist)
    if len(peaks) < 2:
        return []

    rr_sec = np.diff(peaks) / fs
    bpm = 60.0 / rr_sec
    bpm = bpm[(bpm >= 20) & (bpm <= 250)]
    return bpm.tolist()


# ---------------------------------------------------------------------------
# Data loading (handles CSV or .mat)
# ---------------------------------------------------------------------------

def _try_extract_zips():
    for zf_path in sorted(DATA_DIR.rglob("*.zip")):
        print(f"Extracting {zf_path.name} ...")
        with zipfile.ZipFile(zf_path) as zf:
            zf.extractall(DATA_DIR)


def _pick_file(pattern: str, keyword: str = "train") -> Path | None:
    candidates = sorted(DATA_DIR.rglob(pattern))
    for c in candidates:
        if keyword in c.name.lower():
            return c
    return candidates[0] if candidates else None


def load_labeled_signals() -> tuple[list[np.ndarray], list[int]]:
    """Return (ecg_signals, labels) for the 1000 labeled train entries."""
    if not DATA_DIR.exists():
        print(f"No data in {DATA_DIR}. Run with --download first.")
        sys.exit(1)

    _try_extract_zips()

    csv_file = _pick_file("*.csv")
    mat_file = _pick_file("*.mat")

    signals: list[np.ndarray] = []
    labels: list[int] = []

    if csv_file:
        print(f"Loading CSV: {csv_file.name}")
        with open(csv_file) as fh:
            reader = csv_mod.reader(fh)
            header = next(reader, None)

            has_label_col = header and header[-1].strip().lower() in (
                "label", "class", "target",
            )

            for i, row in enumerate(reader):
                if i >= N_LABELED:
                    break
                if has_label_col:
                    vals = [float(v) for v in row[:-1]]
                else:
                    vals = [float(v) for v in row]

                signals.append(np.array(vals[:ECG_LEN]))
                labels.append(1 if i < N_AFIB else 0)

    elif mat_file:
        print(f"Loading MAT: {mat_file.name}")
        data = loadmat(str(mat_file))
        for key in sorted(data):
            arr = data[key]
            if isinstance(arr, np.ndarray) and arr.ndim == 2 and min(arr.shape) > 1:
                if arr.shape[0] < arr.shape[1]:
                    mat = arr
                else:
                    mat = arr
                n = min(N_LABELED, mat.shape[0])
                for i in range(n):
                    signals.append(mat[i].astype(np.float64))
                    labels.append(1 if i < N_AFIB else 0)
                break

    else:
        print(f"No CSV or MAT files found in {DATA_DIR}/")
        print("Run with --download, or place dataset files in backend/external_data/")
        sys.exit(1)

    return signals, labels


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate():
    if not CHECKPOINT_PATH.exists():
        print(f"No checkpoint at {CHECKPOINT_PATH}")
        print("Train first: uv run python model.py")
        sys.exit(1)

    signals, labels = load_labeled_signals()
    n = len(signals)
    n_afib = sum(labels)
    print(f"Loaded {n} labeled signals ({n_afib} AFib, {n - n_afib} healthy)\n")

    model = ResNet1d(num_classes=2)
    model.load_state_dict(torch.load(CHECKPOINT_PATH, weights_only=True))
    model.eval()

    tp = fp = tn = fn = skipped = 0
    afib_confs: list[float] = []
    healthy_confs: list[float] = []

    for ecg, label in zip(signals, labels):
        bpm = ecg_to_bpm(ecg)
        if len(bpm) < 3:
            skipped += 1
            continue

        if len(bpm) >= WINDOW_LEN:
            bpm = bpm[:WINDOW_LEN]
        else:
            bpm = bpm + [bpm[-1]] * (WINDOW_LEN - len(bpm))

        x = torch.tensor(bpm, dtype=torch.float32)
        x = (x - x.mean()) / (x.std() + 1e-8)
        x = x.unsqueeze(0).unsqueeze(0)

        with torch.no_grad():
            logits = model(x)
            probs = F.softmax(logits, dim=1)
            afib_prob = probs[0, 1].item()

        pred = 1 if afib_prob >= 0.5 else 0

        if label == 1:
            afib_confs.append(afib_prob)
        else:
            healthy_confs.append(afib_prob)

        if pred == 1 and label == 1:
            tp += 1
        elif pred == 1 and label == 0:
            fp += 1
        elif pred == 0 and label == 0:
            tn += 1
        else:
            fn += 1

    total = tp + fp + tn + fn
    acc = (tp + tn) / total * 100 if total else 0
    prec = tp / (tp + fp) * 100 if (tp + fp) else 0
    rec = tp / (tp + fn) * 100 if (tp + fn) else 0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0

    W = 58
    print(f"{'─' * W}")
    print(f"  External Validation — Kaggle AFib Signal Dataset")
    print(f"{'─' * W}")
    print(f"  Source        : 400 Hz ECG, 10 s recordings")
    print(f"  Conversion    : ECG → R-peaks → beat-by-beat BPM")
    print(f"  Model window  : {WINDOW_LEN} BPM samples (pad if shorter)")
    print(f"{'─' * W}")
    print(f"  Evaluated     : {total:>6}")
    print(f"  Skipped (<3 R): {skipped:>6}")
    print(f"{'─' * W}")
    print(f"  Accuracy      : {acc:6.1f}%")
    print(f"  Precision     : {prec:6.1f}%")
    print(f"  Recall        : {rec:6.1f}%")
    print(f"  F1 Score      : {f1:6.1f}%")
    print(f"{'─' * W}")
    print(f"  Confusion Matrix")
    print(f"                    Pred AFib   Pred Healthy")
    print(f"  Actual AFib      {tp:7d}      {fn:7d}")
    print(f"  Actual Healthy   {fp:7d}      {tn:7d}")
    print(f"{'─' * W}")
    if afib_confs:
        print(f"  Mean P(afib) on AFib signals    : {np.mean(afib_confs):.4f}")
    if healthy_confs:
        print(f"  Mean P(afib) on Healthy signals  : {np.mean(healthy_confs):.4f}")
    print(f"{'─' * W}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Cross-validate trained AFib ResNet against Kaggle ECG dataset"
    )
    parser.add_argument(
        "--download", action="store_true",
        help="Download dataset via kaggle CLI before validating",
    )
    args = parser.parse_args()

    if args.download:
        download_dataset()
    validate()
