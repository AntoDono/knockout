# Knockout Backend

HTTP + WebSocket server for the Knockout TKOS platform. Handles sensor data ingestion, drug/dose tracking with pharmacokinetic decay modeling, live heart-rate streaming with AFib detection, and cardiology report generation.

## Prerequisites

- Python 3.14+ (project uses `uv` for dependency management)
- [uv](https://docs.astral.sh/uv/) installed (`brew install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Setup

```bash
cd backend

# Install dependencies (creates .venv automatically)
uv sync
```

### Environment variables

The server needs one env var for the drug half-life lookup feature (powered by Grok):

```bash
# Create a .env file in the backend directory
echo 'XAI_API_KEY=your-key-here' > .env
```

If you don't have an xAI API key, the server still starts — the half-life auto-lookup via `POST /drugs` (without `half_life_s`) will fail, but everything else works. You can always provide `half_life_s` directly when registering a drug.

## Running the server

```bash
uv run python server.py
```

This starts:
- **HTTP server** on port `8080` — sensor ingestion, drug/dose API, report generation
- **WebSocket server** on port `8081` — live heart-rate stream with AFib detection

Output on startup:
```
Sensor + Drug server  →  HTTP port 8080  |  WebSocket port 8081
  Push URL  :  http://<your-ip>:8080/push
  Stats     :  http://<your-ip>:8080/stats
  Drugs     :  http://<your-ip>:8080/drugs
  Doses     :  http://<your-ip>:8080/doses
  Levels    :  http://<your-ip>:8080/levels
  Heart WS  :  ws://<your-ip>:8081
```

## API Endpoints

### Sensor
| Method | Path | Description |
|--------|------|-------------|
| POST | `/push` | Receive sensor payloads from the Sensor Logger app |
| GET | `/stats` | Request counts and most recent packet per sensor |

### Drugs & Doses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/drugs` | List all registered drugs |
| POST | `/drugs` | Register a drug `{ name, half_life_s?, reasoning? }` — auto-looks up half-life via Grok if `half_life_s` omitted |
| GET | `/doses` | List logged doses (optional `?drug=name` filter) |
| POST | `/doses` | Log a dose `{ drug, amount_mg, taken_at?, notes? }` |
| DELETE | `/doses/<id>` | Delete a dose |
| GET | `/levels` | Current plasma levels computed via exponential half-life decay |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8081` | Live heart-rate stream. Pushes `heart_update` JSON on each BPM reading with AFib detection results and current drug levels. |

## Report Generation (standalone module)

The `report/` module is self-contained and does not depend on the server or database. It can generate cardiology reports independently.

### Generate an example PDF + JSON

```bash
uv run python -m report.pdf
```

Outputs to `report/examples/`:
- `cardiology_report_example.pdf` — formatted 3-page cardiology briefing
- `cardiology_report_example.json` — the raw report data

### Use programmatically

```python
from report import build_cardiology_report, SAMPLE_REPORT_DATA
from report.pdf import generate_pdf

# Build report from data
data = SAMPLE_REPORT_DATA
report = build_cardiology_report(
    patient=data["patient"],
    medications=data["medications"],
    episodes=data["episodes"],
    doses=data["doses"],
    period_start=data["period_start"],
    period_end=data["period_end"],
)

# Render to PDF
generate_pdf(report, "my_report.pdf", patient_data=data["patient"])
```

### Module structure

```
report/
├── __init__.py        # Public API: build_cardiology_report, SAMPLE_REPORT_DATA
├── builder.py         # Report assembly logic (trough correlation, triggers, flags)
├── pdf.py             # PDF rendering via reportlab
├── sample_data.py     # Hardcoded realistic TKOS patient data (11 episodes, 2 drugs)
└── examples/          # Generated example outputs
```

The sample data simulates a 90-day period for a TKOS patient (Lily) on nadolol + flecainide with an ICD. When the real database layer is ready, swap `sample_data` for actual queries — `builder.py` works unchanged.

## Database

SQLite database at `knockout.db` (auto-created on first run). Managed by Peewee ORM.

**Models:**
- `Drug` — name, half_life_s, reasoning
- `Dose` — drug FK, amount_mg, taken_at, notes

Pre-seeded from `halflife.json` if present.

## Key Files

| File | What it does |
|------|-------------|
| `server.py` | HTTP + WebSocket server, all routing |
| `database.py` | Peewee models (Drug, Dose), PK decay computation |
| `heart_analyze.py` | AFib detection from BPM stream (HRV metrics, weighted voting) |
| `llm_tools.py` | Drug half-life lookup via Grok with web search |
| `report/` | Standalone cardiology report generation module |
