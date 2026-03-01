"""
HTTP server that receives live sensor data pushed from the Sensor Logger app,
and exposes a drug-tracking API backed by a Peewee/SQLite database.

Sensor endpoints
----------------
  POST /push   – receive sensor payloads from the app
  GET  /stats  – request counts and most recent packet per sensor

Drug-tracking endpoints
-----------------------
  GET  /drugs          – list all known drugs
  POST /drugs          – add/register a drug  { name, half_life_s, reasoning? }
  GET  /doses          – list all logged doses  (?drug=<name> to filter)
  POST /doses          – log a dose  { drug, amount_mg, taken_at?, notes? }
  DELETE /doses/<id>   – delete a specific dose
  GET  /levels         – current plasma levels computed from half-life decay

WebSocket endpoint
------------------
  ws://<host>:8081     – live heart stream

  Each message is JSON:
  {
    "type":            "heart_update",
    "timestamp":       "<ISO-8601>",
    "latest_bpm":      <float | null>,
    "bpm_buffer_size": <int>,
    "afib":            { AfibResult fields … } | null,
    "drug_levels":     [ … ]          // same as GET /levels
  }

  The server pushes a message every time a heart-rate reading arrives via
  POST /push.  Clients that connect mid-stream immediately receive a
  "hello" message with the current state.
"""

import asyncio
import json
import threading
from collections import deque
from dataclasses import asdict
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

from websockets.asyncio.server import serve as ws_serve

from database import Drug, Dose, db, init_db, get_current_levels
from heart_analyze import detect_afib
from llm_tools import get_halflife

HOST     = "0.0.0.0"
PORT     = 8080
WS_PORT  = 8081

_lock = threading.Lock()

# Running totals (sensor side)
stats = {
    "total_requests": 0,
    "total_readings": 0,
    "sensors": {},
    "requests": [],
}

# ---------------------------------------------------------------------------
# WebSocket state
# ---------------------------------------------------------------------------

# Rolling window of recent BPM readings fed to AFIB detector
_bpm_buffer: deque[float] = deque(maxlen=120)

# Connected WebSocket clients (accessed only from the WS event loop)
_ws_clients: set = set()

# The asyncio event loop running the WS server (set at startup)
_ws_loop: asyncio.AbstractEventLoop | None = None


def _extract_bpm(values: dict) -> float | None:
    """Pull a BPM value out of a sensor reading's values dict."""
    for key in ("bpm", "heartRate", "heart_rate", "value", "BPM"):
        if key in values:
            try:
                return float(values[key])
            except (TypeError, ValueError):
                pass
    return None


def _is_heart_sensor(name: str) -> bool:
    n = name.lower()
    return "heart" in n or "bpm" in n or "pulse" in n or "hr" == n


def _build_heart_payload(latest_bpm: float | None) -> dict:
    """Assemble the JSON payload pushed to WebSocket clients."""
    with _lock:
        n = len(_bpm_buffer)
        buf = list(_bpm_buffer)

    afib_data = None
    if n >= 10:
        result = detect_afib(buf)
        afib_data = asdict(result)

    return {
        "type":            "heart_update",
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        "latest_bpm":      latest_bpm,
        "bpm_buffer_size": n,
        "afib":            afib_data,
        "drug_levels":     get_current_levels(),
    }


async def _ws_handler(websocket):
    """Handle one WebSocket client for its lifetime."""
    _ws_clients.add(websocket)
    try:
        # Send current state immediately on connect
        payload = await asyncio.get_running_loop().run_in_executor(
            None, _build_heart_payload, None
        )
        payload["type"] = "hello"
        await websocket.send(json.dumps(payload))
        await websocket.wait_closed()
    finally:
        _ws_clients.discard(websocket)


async def _broadcast(message: str) -> None:
    if not _ws_clients:
        return
    await asyncio.gather(
        *[ws.send(message) for ws in list(_ws_clients)],
        return_exceptions=True,
    )


def _schedule_broadcast(latest_bpm: float | None) -> None:
    """Called from the HTTP thread; schedules a broadcast on the WS loop."""
    if _ws_loop is None or not _ws_clients:
        return

    async def _task():
        payload = await asyncio.get_running_loop().run_in_executor(
            None, _build_heart_payload, latest_bpm
        )
        await _broadcast(json.dumps(payload))

    asyncio.run_coroutine_threadsafe(_task(), _ws_loop)


def _start_ws_server() -> None:
    """Run the WebSocket server forever in its own thread + event loop."""
    global _ws_loop
    _ws_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_ws_loop)

    async def _run():
        async with ws_serve(_ws_handler, HOST, WS_PORT):
            await _ws_loop.create_future()  # block forever

    _ws_loop.run_until_complete(_run())


# ---------------------------------------------------------------------------
# Handler
# ---------------------------------------------------------------------------

class SensorHandler(BaseHTTPRequestHandler):

    # ---- routing -----------------------------------------------------------

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/")
        if path == "/stats":
            self._handle_stats()
        elif path == "/drugs":
            self._handle_get_drugs()
        elif path == "/doses":
            self._handle_get_doses()
        elif path == "/levels":
            self._handle_get_levels()
        else:
            self._send(404)

    def do_POST(self):
        path = self.path.rstrip("/")
        if path == "/push":
            self._handle_push()
        elif path == "/drugs":
            self._handle_post_drug()
        elif path == "/doses":
            self._handle_post_dose()
        else:
            self._send(404)

    def do_DELETE(self):
        # DELETE /doses/<id>
        if self.path.startswith("/doses/"):
            try:
                dose_id = int(self.path.split("/doses/")[1])
                self._handle_delete_dose(dose_id)
            except (ValueError, IndexError):
                self._send(400)
        else:
            self._send(404)

    # ---- sensor: POST /push ------------------------------------------------

    def _handle_push(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw)
            self._ingest(data)
            self._send(200)
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON parse: {e}\n[RAW] {raw!r}")
            self._send(400)

    # ---- sensor: GET /stats ------------------------------------------------

    def _handle_stats(self):
        with _lock:
            snapshot = {
                "total_requests": stats["total_requests"],
                "total_readings": stats["total_readings"],
                "sensors": {
                    name: {
                        "count":       s["count"],
                        "last_t":      s["last_t"],
                        "last_values": s["last_values"],
                    }
                    for name, s in stats["sensors"].items()
                },
                "requests": list(stats["requests"]),
            }
        self._json(snapshot)

    # ---- drug: GET /drugs --------------------------------------------------

    def _handle_get_drugs(self):
        drugs = [
            {
                "id":          d.id,
                "name":        d.name,
                "half_life_s": d.half_life_s,
                "half_life_h": round(d.half_life_h, 2),
                "reasoning":   d.reasoning,
            }
            for d in Drug.select().order_by(Drug.name)
        ]
        self._json(drugs)

    # ---- drug: POST /drugs -------------------------------------------------

    def _handle_post_drug(self):
        body = self._read_json()
        if body is None:
            return

        name = (body.get("name") or "").strip().lower()
        if not name:
            self._send_error(400, "field 'name' is required")
            return

        # If half_life_s not provided, look it up via Grok
        if "half_life_s" in body:
            half_life_s = int(body["half_life_s"])
            reasoning   = body.get("reasoning", "")
        else:
            try:
                hl = get_halflife(name)
                half_life_s = hl.halflife
                reasoning   = hl.reasoning
            except Exception as e:
                self._send_error(500, f"half-life lookup failed: {e}")
                return

        drug, created = Drug.get_or_create(
            name=name,
            defaults={"half_life_s": half_life_s, "reasoning": reasoning},
        )
        if not created:
            drug.half_life_s = half_life_s
            drug.reasoning   = reasoning
            drug.save()

        self._json({
            "id":          drug.id,
            "name":        drug.name,
            "half_life_s": drug.half_life_s,
            "half_life_h": round(drug.half_life_h, 2),
            "reasoning":   drug.reasoning,
            "created":     created,
        }, status=201 if created else 200)

    # ---- dose: GET /doses --------------------------------------------------

    def _handle_get_doses(self):
        from urllib.parse import urlparse, parse_qs
        qs   = parse_qs(urlparse(self.path).query)
        drug_filter = qs.get("drug", [None])[0]

        query = Dose.select(Dose, Drug).join(Drug).order_by(Dose.taken_at.desc())
        if drug_filter:
            query = query.where(Drug.name == drug_filter.strip().lower())

        doses = [
            {
                "id":         d.id,
                "drug":       d.drug.name,
                "amount_mg":  d.amount_mg,
                "taken_at":   d.taken_at.isoformat(),
                "notes":      d.notes,
            }
            for d in query
        ]
        self._json(doses)

    # ---- dose: POST /doses -------------------------------------------------

    def _handle_post_dose(self):
        body = self._read_json()
        if body is None:
            return

        drug_name = (body.get("drug") or "").strip().lower()
        if not drug_name:
            self._send_error(400, "field 'drug' is required")
            return

        amount_mg = body.get("amount_mg")
        if amount_mg is None:
            self._send_error(400, "field 'amount_mg' is required")
            return

        try:
            drug = Drug.get(Drug.name == drug_name)
        except Drug.DoesNotExist:
            self._send_error(404, f"drug '{drug_name}' not found – register it via POST /drugs first")
            return

        taken_at = body.get("taken_at")
        if taken_at:
            try:
                taken_at = datetime.fromisoformat(taken_at)
                if taken_at.tzinfo is None:
                    taken_at = taken_at.replace(tzinfo=timezone.utc)
            except ValueError:
                self._send_error(400, "invalid 'taken_at' – use ISO-8601 format")
                return
        else:
            taken_at = datetime.now(timezone.utc)

        dose = Dose.create(
            drug=drug,
            amount_mg=float(amount_mg),
            taken_at=taken_at,
            notes=body.get("notes", ""),
        )

        self._json({
            "id":        dose.id,
            "drug":      drug.name,
            "amount_mg": dose.amount_mg,
            "taken_at":  dose.taken_at.isoformat(),
            "notes":     dose.notes,
        }, status=201)

    # ---- dose: DELETE /doses/<id> ------------------------------------------

    def _handle_delete_dose(self, dose_id: int):
        deleted = Dose.delete().where(Dose.id == dose_id).execute()
        if deleted:
            self._json({"deleted": dose_id})
        else:
            self._send_error(404, f"dose {dose_id} not found")

    # ---- levels: GET /levels -----------------------------------------------

    def _handle_get_levels(self):
        self._json(get_current_levels())

    # ---- helpers -----------------------------------------------------------

    def _read_json(self) -> dict | None:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            self._send_error(400, f"invalid JSON: {e}")
            return None

    def _json(self, data, status: int = 200):
        body = json.dumps(data, indent=2).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _send(self, code: int):
        self.send_response(code)
        self.end_headers()

    def _send_error(self, code: int, message: str):
        self._json({"error": message}, status=code)

    def _ingest(self, data: dict):
        payload     = data.get("payload", [])
        msg_id      = data.get("messageId", "?")
        session     = data.get("sessionId", "?")
        device      = data.get("deviceId", "?")
        received_at = datetime.now(timezone.utc).isoformat()

        latest_bpm: float | None = None

        with _lock:
            stats["total_requests"] += 1
            stats["total_readings"] += len(payload)
            stats["requests"].append({
                "messageId":   msg_id,
                "sessionId":   session,
                "deviceId":    device,
                "readings":    len(payload),
                "received_at": received_at,
            })

            for reading in payload:
                name     = reading.get("name", "unknown")
                ts_ns    = reading.get("time", 0)
                t        = ts_ns / 1_000_000_000
                values   = reading.get("values") or {
                    k: v for k, v in reading.items()
                    if k not in ("name", "time", "accuracy")
                }

                if name not in stats["sensors"]:
                    stats["sensors"][name] = {"count": 0, "last_t": None, "last_values": None}
                stats["sensors"][name]["count"]      += 1
                stats["sensors"][name]["last_t"]      = t
                stats["sensors"][name]["last_values"] = values

                # Accumulate heart-rate readings for AFIB analysis
                if _is_heart_sensor(name):
                    bpm = _extract_bpm(values)
                    if bpm is not None:
                        _bpm_buffer.append(bpm)
                        latest_bpm = bpm

        # Broadcast outside the lock so DB queries don't hold _lock
        if latest_bpm is not None:
            _schedule_broadcast(latest_bpm)

    def log_message(self, fmt, *args):
        pass  # silence default request logs


# ---------------------------------------------------------------------------

def main():
    import socket

    init_db()

    # Start WebSocket server in a daemon thread (dies with the main process)
    ws_thread = threading.Thread(target=_start_ws_server, daemon=True, name="ws-server")
    ws_thread.start()

    server = HTTPServer((HOST, PORT), SensorHandler)
    try:
        local_ip = socket.gethostbyname(socket.gethostname())
    except Exception:
        local_ip = "127.0.0.1"

    print(f"Sensor + Drug server  →  HTTP port {PORT}  |  WebSocket port {WS_PORT}")
    print(f"  Push URL  :  http://{local_ip}:{PORT}/push")
    print(f"  Stats     :  http://{local_ip}:{PORT}/stats")
    print(f"  Drugs     :  http://{local_ip}:{PORT}/drugs")
    print(f"  Doses     :  http://{local_ip}:{PORT}/doses")
    print(f"  Levels    :  http://{local_ip}:{PORT}/levels")
    print(f"  Heart WS  :  ws://{local_ip}:{WS_PORT}")
    print("Press Ctrl+C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
