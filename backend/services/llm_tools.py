"""
Drug half-life lookup via Grok 4 with live web search + structured output.

Usage:
    result = get_halflife("testosterone")
    print(result.halflife)  # seconds (int)
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from xai_sdk import Client
from xai_sdk.chat import user, system
from xai_sdk.tools import web_search

load_dotenv()


class HalfLife(BaseModel):
    reasoning: str = Field(description="Reasoning about the drug half-life")
    halflife: int = Field(description="Drug half-life in seconds")


_api_key = os.environ.get("XAI_API_KEY")
_client = Client(api_key=_api_key) if _api_key else None

_SYSTEM = "\n".join([
    "Given a drug, do web search to find its half live in seconds and return it in json. ",
    "If there is a range, return the median",
    "Example:",
    "Input: minocycline",
    "Output: { reasoning: 'The typical half-life of minocycline is 11 - 15 hours, the median is about 12 hours. So the half-life is 43,200 seconds.', halflife: 43200 }",
    "Guidelines:",
    "You should only return the son { reasoning: ..., halflife: ... }",
])


_CACHE_FILE = Path(__file__).parent.parent / "halflife.json"


def _load_cache() -> dict:
    if _CACHE_FILE.exists():
        return json.loads(_CACHE_FILE.read_text())
    return {}


def _save_cache(cache: dict) -> None:
    _CACHE_FILE.write_text(json.dumps(cache, indent=2))


def get_halflife(drug: str) -> HalfLife:
    key = drug.strip().lower()
    cache = _load_cache()
    if key in cache:
        return HalfLife(**cache[key])

    if _client is None:
        raise RuntimeError("XAI_API_KEY not set — cannot look up half-life. Provide half_life_s directly.")

    chat = _client.chat.create(
        model="grok-4-1-fast-reasoning",
        tools=[web_search()],
    )
    chat.append(user(_SYSTEM + "\n\n" + drug))

    _, result = chat.parse(HalfLife)

    cache[key] = result.model_dump()
    _save_cache(cache)

    return result

if __name__ == "__main__":
    import sys, time
    drug = sys.argv[1] if len(sys.argv) > 1 else "minocycline"
    print(f"Searching for {drug}...")
    t = time.time()
    result = get_halflife(drug)
    print(f"Time taken: {time.time() - t:.2f}s")
    print(f"Half-life of {drug}: {result.halflife}s  ({result.halflife / 3600:.1f}h)")