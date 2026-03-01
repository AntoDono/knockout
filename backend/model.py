"""
1D ResNet for AFib detection from BPM windows.

Architecture:  Conv1d stem → 6 residual blocks → GAP → FC  (~2M params)
Optimizer:     Muon for conv/FC weight matrices, AdamW for biases/norms
Input:         BPM window (1 channel)
Output:        P(afib)

Usage:
    uv run python model.py              # train on backend/training_data/
    uv run python model.py --epochs 100 # custom epoch count
"""

import json
import glob
import argparse
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, random_split
from tqdm import tqdm

TRAINING_DIR = Path(__file__).parent / "training_data"
CHECKPOINT_PATH = Path(__file__).parent / "afib_resnet30.pt"
WINDOW_LEN = 100
WINDOW_STRIDE = 10


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class AfibDataset(Dataset):
    def __init__(self, data_dir: Path = TRAINING_DIR, window_len: int = WINDOW_LEN, stride: int = WINDOW_STRIDE):
        self.samples: list[tuple[torch.Tensor, int]] = []
        self.n_files = 0
        for fp in sorted(glob.glob(str(data_dir / "*.json"))):
            with open(fp) as f:
                rec = json.load(f)
            label_str = rec["label"]
            if label_str in ("afib",):
                label = 1
            elif label_str in ("healthy", "false_positive"):
                label = 0
            else:
                continue
            self.n_files += 1
            bpm = rec["bpm_readings"]
            # Slide windows over the recording
            if len(bpm) >= window_len:
                for start in range(0, len(bpm) - window_len + 1, stride):
                    window = bpm[start:start + window_len]
                    self.samples.append((torch.tensor(window, dtype=torch.float32), label))
            else:
                padded = bpm + [bpm[-1]] * (window_len - len(bpm))
                self.samples.append((torch.tensor(padded, dtype=torch.float32), label))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        x, y = self.samples[idx]
        x = (x - x.mean()) / (x.std() + 1e-8)
        return x.unsqueeze(0), y  # (1, WINDOW_LEN)


# ---------------------------------------------------------------------------
# 1D ResNet-30
# ---------------------------------------------------------------------------

class ResBlock1d(nn.Module):
    """Two-conv residual block with optional projection shortcut."""
    def __init__(self, in_ch: int, out_ch: int, stride: int = 1):
        super().__init__()
        self.conv1 = nn.Conv1d(in_ch, out_ch, 3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm1d(out_ch)
        self.conv2 = nn.Conv1d(out_ch, out_ch, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm1d(out_ch)
        self.shortcut = nn.Sequential()
        if stride != 1 or in_ch != out_ch:
            self.shortcut = nn.Sequential(
                nn.Conv1d(in_ch, out_ch, 1, stride=stride, bias=False),
                nn.BatchNorm1d(out_ch),
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = F.relu(out + self.shortcut(x))
        return out


class ResNet1d(nn.Module):
    """
    Configurable 1D ResNet.
    Default: [2, 2, 2] blocks at [64, 192, 384] channels ≈ 2M params.
    """
    def __init__(
        self,
        num_classes: int = 2,
        channels: tuple[int, ...] = (32, 64, 192),
        blocks: tuple[int, ...] = (2, 2, 2),
    ):
        super().__init__()
        c0 = channels[0]
        self.stem = nn.Sequential(
            nn.Conv1d(1, c0, 7, stride=2, padding=3, bias=False),
            nn.BatchNorm1d(c0),
            nn.ReLU(),
            nn.MaxPool1d(3, stride=2, padding=1),
        )
        layers = []
        in_ch = c0
        for i, (out_ch, n) in enumerate(zip(channels, blocks)):
            stride = 1 if i == 0 else 2
            layers.append(self._make_layer(in_ch, out_ch, n, stride))
            in_ch = out_ch
        self.res_layers = nn.Sequential(*layers)
        self.fc = nn.Linear(channels[-1], num_classes)

    @staticmethod
    def _make_layer(in_ch: int, out_ch: int, n_blocks: int, stride: int):
        blocks = [ResBlock1d(in_ch, out_ch, stride)]
        for _ in range(1, n_blocks):
            blocks.append(ResBlock1d(out_ch, out_ch))
        return nn.Sequential(*blocks)

    def forward(self, x):
        x = self.stem(x)
        x = self.res_layers(x)
        x = x.mean(dim=-1)  # global average pooling
        return self.fc(x)


# ---------------------------------------------------------------------------
# Optimizer setup: Muon for 2D weights, AdamW for everything else
# ---------------------------------------------------------------------------

class ConvMuonWrapper(torch.optim.Optimizer):
    """Wraps torch.optim.Muon to handle Conv1d weights (3D) by reshaping to 2D."""
    def __init__(self, params, lr=0.02, weight_decay=0.01):
        param_list = list(params)
        self._flat_params = []
        self._orig_shapes = []
        for p in param_list:
            self._orig_shapes.append(p.shape)
            flat = nn.Parameter(p.data.view(p.shape[0], -1))
            flat.grad = None
            self._flat_params.append((p, flat))

        flat_only = [fp for _, fp in self._flat_params]
        self._inner = torch.optim.Muon(flat_only, lr=lr, weight_decay=weight_decay)
        super().__init__(flat_only, dict(lr=lr, weight_decay=weight_decay))

    def zero_grad(self, set_to_none=True):
        self._inner.zero_grad(set_to_none=set_to_none)

    @torch.no_grad()
    def step(self, closure=None):
        for orig, flat in self._flat_params:
            if orig.grad is not None:
                flat.grad = orig.grad.view(flat.shape)
        self._inner.step(closure)
        for orig, flat in self._flat_params:
            orig.data.copy_(flat.data.view(orig.shape))


def build_optimizers(model: ResNet1d, lr: float = 0.02, wd: float = 0.01):
    muon_2d = []
    muon_conv = []
    adam_params = []
    for name, p in model.named_parameters():
        if not p.requires_grad:
            continue
        if p.ndim == 2:
            muon_2d.append(p)
        elif p.ndim >= 3:
            muon_conv.append(p)
        else:
            adam_params.append(p)

    optimizers = []
    if muon_2d:
        optimizers.append(torch.optim.Muon(muon_2d, lr=lr, weight_decay=wd))
    if muon_conv:
        optimizers.append(ConvMuonWrapper(muon_conv, lr=lr, weight_decay=wd))
    if adam_params:
        optimizers.append(torch.optim.AdamW(adam_params, lr=1e-3, weight_decay=wd))
    return optimizers


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------

def train(epochs: int = 50, val_split: float = 0.2):
    ds = AfibDataset()
    if len(ds) == 0:
        print("No training data found in", TRAINING_DIR)
        return

    n_afib = sum(1 for _, y in ds.samples if y == 1)
    n_healthy = len(ds) - n_afib

    # --- train / val split ---------------------------------------------------
    n_val = max(1, int(len(ds) * val_split))
    n_train = len(ds) - n_val
    train_ds, val_ds = random_split(ds, [n_train, n_val])

    def _count_labels(subset):
        a = sum(1 for i in subset.indices if ds.samples[i][1] == 1)
        return a, len(subset) - a

    tr_afib, tr_healthy = _count_labels(train_ds)
    va_afib, va_healthy = _count_labels(val_ds)

    print(f"{'─' * 55}")
    print(f"  Files    : {ds.n_files}")
    print(f"  Windows  : {len(ds)} total ({n_afib} afib, {n_healthy} healthy)")
    print(f"  Window   : {WINDOW_LEN} samples, stride {WINDOW_STRIDE}")
    print(f"  Train    : {n_train} windows ({tr_afib} afib, {tr_healthy} healthy)")
    print(f"  Val      : {n_val} windows ({va_afib} afib, {va_healthy} healthy)")
    print(f"{'─' * 55}")

    train_loader = DataLoader(train_ds, batch_size=max(1, n_train), shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=max(1, n_val))

    device = "cpu"
    model = ResNet1d(num_classes=2).to(device)

    total_params = sum(p.numel() for p in model.parameters())
    print(f"  Model    : ResNet 1D  ({total_params:,} params)")

    optimizers = build_optimizers(model)
    print(f"  Optimizer: Muon (conv + FC weights) + AdamW (biases/norms)")
    print(f"{'─' * 55}\n")

    if n_afib > 0 and n_healthy > 0:
        w = torch.tensor([n_afib / len(ds), n_healthy / len(ds)], dtype=torch.float32).to(device)
    else:
        w = None
    criterion = nn.CrossEntropyLoss(weight=w)

    best_val_acc = 0.0
    pbar = tqdm(range(1, epochs + 1), desc="Training", unit="epoch")
    for epoch in pbar:
        # ---- train ----------------------------------------------------------
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        for x_batch, y_batch in train_loader:
            x_batch, y_batch = x_batch.to(device), y_batch.to(device)
            logits = model(x_batch)
            loss = criterion(logits, y_batch)

            for opt in optimizers:
                opt.zero_grad()
            loss.backward()
            for opt in optimizers:
                opt.step()

            train_loss += loss.item() * y_batch.size(0)
            train_correct += (logits.argmax(1) == y_batch).sum().item()
            train_total += y_batch.size(0)

        t_loss = train_loss / train_total
        t_acc = train_correct / train_total * 100

        # ---- val ------------------------------------------------------------
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for x_batch, y_batch in val_loader:
                x_batch, y_batch = x_batch.to(device), y_batch.to(device)
                logits = model(x_batch)
                loss = criterion(logits, y_batch)
                val_loss += loss.item() * y_batch.size(0)
                val_correct += (logits.argmax(1) == y_batch).sum().item()
                val_total += y_batch.size(0)

        v_loss = val_loss / val_total
        v_acc = val_correct / val_total * 100

        if v_acc >= best_val_acc:
            best_val_acc = v_acc
            torch.save(model.state_dict(), CHECKPOINT_PATH)

        pbar.set_postfix(
            t_loss=f"{t_loss:.4f}",
            t_acc=f"{t_acc:.0f}%",
            v_loss=f"{v_loss:.4f}",
            v_acc=f"{v_acc:.0f}%",
        )

    print(f"\n{'─' * 55}")
    print(f"  Best val accuracy : {best_val_acc:.1f}%")
    print(f"  Checkpoint saved  : {CHECKPOINT_PATH}")
    print(f"{'─' * 55}")


# ---------------------------------------------------------------------------
# Inference helper (used by the server at runtime)
# ---------------------------------------------------------------------------

_cached_model: ResNet1d | None = None

def predict_afib(bpm_readings: list[float]) -> dict:
    """Run the trained ResNet on a BPM window. Returns {afib: bool, confidence: float}."""
    global _cached_model
    if not CHECKPOINT_PATH.exists():
        return {"afib": None, "confidence": 0.0, "note": "no trained checkpoint"}

    if _cached_model is None:
        _cached_model = ResNet1d(num_classes=2)
        _cached_model.load_state_dict(torch.load(CHECKPOINT_PATH, weights_only=True))
        _cached_model.eval()

    bpm = bpm_readings[:WINDOW_LEN]
    if len(bpm) < WINDOW_LEN:
        bpm += [bpm[-1]] * (WINDOW_LEN - len(bpm))
    x = torch.tensor(bpm, dtype=torch.float32)
    x = (x - x.mean()) / (x.std() + 1e-8)
    x = x.unsqueeze(0).unsqueeze(0)  # (1, 1, 120)

    with torch.no_grad():
        logits = _cached_model(x)
        probs = F.softmax(logits, dim=1)
        afib_prob = probs[0, 1].item()

    return {"afib": afib_prob >= 0.5, "confidence": round(afib_prob, 4)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train AFib ResNet-30")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--val-split", type=float, default=0.2)
    args = parser.parse_args()
    train(epochs=args.epochs, val_split=args.val_split)
