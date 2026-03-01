# AFib Detection: Heuristic Model & ML Model

## Overview

Guardrail uses two complementary approaches for atrial fibrillation detection:

1. **Heuristic detector** (`services/heart_analyze.py`) — real-time, rule-based, runs on every heartbeat
2. **ResNet classifier** (`model.py`) — learned model trained on human-confirmed episodes

---

## 1. Heuristic Detector

### Input

A sliding window of BPM readings (up to 120 samples). BPM values are converted to RR intervals:

$$
RR_i = \frac{60{,}000}{\text{BPM}_i} \quad \text{(milliseconds)}
$$

### Metrics

Six HRV metrics are computed from the RR series, each producing a score in \[0, 1\]:

| Metric | Formula | AFib Threshold | Weight |
|--------|---------|----------------|--------|
| **CV** (Coefficient of Variation) | \(\frac{\text{SDNN}}{\overline{RR}}\) | > 0.065 | 2.5 |
| **RMSSD** (Root Mean Square of Successive Differences) | \(\sqrt{\frac{1}{N-1}\sum_{i}(RR_{i+1} - RR_i)^2}\) | > 40 ms | 2.0 |
| **pNN20** (% of successive diffs > 20 ms) | \(\frac{\\#\{|\Delta RR_i| > 20\}}{N-1}\) | > 0.40 | 1.5 |
| **SD1/SD2** (Poincaré plot ratio) | \(\frac{SD1}{SD2}\) where \(SD1 = \frac{\text{std}(\Delta RR)}{\sqrt{2}}\), \(SD2 = \sqrt{2 \cdot \text{SDNN}^2 - SD1^2}\) | > 0.75 | 1.5 |
| **SampEn** (Sample Entropy) | \(-\ln\frac{A}{B}\) where A, B count template matches at lengths m+1, m | > 1.5 | 1.5 |
| **LF/HF** (Spectral Power Ratio) | \(\frac{\int_{0.04}^{0.15} P(f)\,df}{\int_{0.15}^{0.40} P(f)\,df}\) via Welch PSD | 0.5–2.0 | 1.0 |

### Scoring

Each metric is linearly mapped to a vote score in \[0, 1\]:

$$
\text{score}_k = \text{clamp}\!\left(\frac{x_k - \text{lo}_k}{\text{hi}_k - \text{lo}_k},\; 0,\; 1\right)
$$

Mapping ranges:
- CV: \[0.04, 0.12\]
- RMSSD: \[20, 80\] ms
- pNN20: \[0.2, 0.7\]
- SD1/SD2: \[0.3, 1.0\]
- SampEn: \[1.0, 2.5\]
- LF/HF: highest when ratio ≈ 1.0 (flat spectrum)

### Confidence

Weighted vote → sample-count dampening:

$$
\text{raw} = \frac{\sum_k w_k \cdot s_k}{\sum_k w_k}
$$

$$
\text{confidence} = \text{raw} \times \left(0.5 + 0.5 \cdot \min\!\left(\frac{N}{120},\; 1\right)\right)
$$

**AFib detected** when confidence ≥ 0.75.

The dampening factor ensures that very short windows (< 120 samples) cannot produce high-confidence detections — it linearly scales from 50% to 100% of the raw score as the sample count grows from 0 to 120.

---

## 2. ResNet Classifier

### Architecture

A 1D convolutional residual network with three stages:

```
Input (1 × 100)
  │
  ├─ Stem: Conv1d(1→64, k=7, s=2) → BN → ReLU → MaxPool(k=3, s=2)
  │
  ├─ Stage 1: 2× ResBlock(64→64)
  ├─ Stage 2: 2× ResBlock(64→192, s=2)
  ├─ Stage 3: 2× ResBlock(192→384, s=2)
  │
  ├─ Global Average Pooling
  └─ FC(384→2) → softmax → P(afib)
```

Each **ResBlock** contains:
```
x → Conv1d(k=3, pad=1) → BN → ReLU → Conv1d(k=3, pad=1) → BN → (+shortcut) → ReLU
```

With a 1×1 projection shortcut when channels or resolution change.

**Total parameters:** ~2.06M

### Input preprocessing

Each 100-sample BPM window is z-score normalized per-sample:

$$
\hat{x}_i = \frac{x_i - \mu}{\sigma + \epsilon}, \quad \epsilon = 10^{-8}
$$

### Windowing

Training recordings (~120 BPM readings each) are sliced into overlapping windows:
- **Window length:** 100 samples
- **Stride:** 10 samples
- This produces multiple training windows per recording

### Optimizer: Muon + AdamW

Parameters are split by dimensionality:

| Parameter type | Optimizer | Learning rate |
|----------------|-----------|---------------|
| Conv1d weights (3D → reshaped to 2D) | Muon | 0.02 |
| FC weights (2D) | Muon | 0.02 |
| Biases, BatchNorm params (1D) | AdamW | 0.001 |

**Muon** uses Newton-Schulz orthogonalization to compute near-orthogonal weight updates, providing faster convergence than Adam on weight matrices. Conv1d weights (shape `[out, in, k]`) are reshaped to `[out, in×k]` for the Muon step via `ConvMuonWrapper`.

### Training data

Training samples are collected via a human-in-the-loop feedback system:

1. The heuristic detector flags an AFib event in real-time
2. The frontend prompts: "Did you feel symptoms?"
3. On confirmation:
   - The AFib BPM window is saved as a **positive** sample
   - A clean healthy window (captured separately during non-AFib periods) is saved as the **negative** counterpart
4. On denial: the window is saved as a **false_positive** (treated as negative class)

### Loss

Cross-entropy with class-weight balancing:

$$
w_c = \frac{n_c}{N}
$$

where \(n_c\) is the count of class \(c\) and \(N\) is total samples.

---

## How they work together

The heuristic detector runs in real-time on the live BPM stream. When it detects AFib, the user is prompted for confirmation. Their feedback generates training data for the ResNet, which can then be used as a second-opinion classifier or eventually replace the heuristic as enough patient-specific data accumulates.
