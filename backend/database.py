"""
Peewee ORM models for the drug tracking system.

Models
------
  Drug  – a substance with a known half-life (seeded from halflife.json)
  Dose  – a logged intake event (drug + amount + timestamp)

Key helper
----------
  get_current_levels() → dict[str, float]
    Returns the current plasma level (in mg-equivalents) for every drug
    that has at least one dose, computed via exponential decay:

        level = Σ  amount_mg × 0.5 ^ (elapsed_s / half_life_s)
"""

import json
import math
from datetime import datetime, timezone
from pathlib import Path

from peewee import (
    SqliteDatabase,
    Model,
    AutoField,
    CharField,
    FloatField,
    IntegerField,
    TextField,
    DateTimeField,
    ForeignKeyField,
)

_DB_PATH    = Path(__file__).parent / "knockout.db"
_CACHE_FILE = Path(__file__).parent / "halflife.json"

db = SqliteDatabase(str(_DB_PATH), pragmas={"foreign_keys": 1})


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class BaseModel(Model):
    class Meta:
        database = db


class Drug(BaseModel):
    """A substance with a known half-life."""

    id             = AutoField()
    name           = CharField(unique=True, index=True)   # lowercase canonical name
    half_life_s    = IntegerField()                        # half-life in seconds
    reasoning      = TextField(default="")                 # source / explanation

    class Meta:
        table_name = "drugs"

    @property
    def half_life_h(self) -> float:
        return self.half_life_s / 3600


class Dose(BaseModel):
    """A single intake event."""

    id         = AutoField()
    drug       = ForeignKeyField(Drug, backref="doses", on_delete="CASCADE")
    amount_mg  = FloatField()                              # dose amount in mg
    taken_at   = DateTimeField(default=lambda: datetime.now(timezone.utc))
    notes      = TextField(default="")

    class Meta:
        table_name = "doses"

    def elapsed_seconds(self, now: datetime | None = None) -> float:
        """Seconds between this dose and *now* (UTC)."""
        if now is None:
            now = datetime.now(timezone.utc)
        taken = self.taken_at
        if taken.tzinfo is None:
            taken = taken.replace(tzinfo=timezone.utc)
        return (now - taken).total_seconds()

    def remaining_fraction(self, now: datetime | None = None) -> float:
        """Fraction of dose still active: 0.5^(elapsed / half_life)."""
        elapsed = self.elapsed_seconds(now)
        return math.pow(0.5, elapsed / self.drug.half_life_s)

    def remaining_mg(self, now: datetime | None = None) -> float:
        return self.amount_mg * self.remaining_fraction(now)


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create tables and seed Drug rows from halflife.json."""
    db.connect(reuse_if_open=True)
    db.create_tables([Drug, Dose], safe=True)
    _seed_from_cache()


def _seed_from_cache() -> None:
    if not _CACHE_FILE.exists():
        return
    cache = json.loads(_CACHE_FILE.read_text())
    for name, data in cache.items():
        Drug.get_or_create(
            name=name.strip().lower(),
            defaults={
                "half_life_s": data["halflife"],
                "reasoning":   data.get("reasoning", ""),
            },
        )


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

def get_current_levels(now: datetime | None = None) -> list[dict]:
    """
    Return current plasma levels for all drugs with at least one dose.

    Each entry:
        {
            "drug":         str,
            "half_life_h":  float,
            "total_dosed_mg":   float,   # sum of all doses ever logged
            "remaining_mg":     float,   # amount still active right now
            "pct_remaining":    float,   # remaining / total_dosed × 100
            "doses":        list[dict],  # individual dose breakdown
        }
    """
    if now is None:
        now = datetime.now(timezone.utc)

    results = []
    drugs_with_doses = (
        Drug
        .select()
        .join(Dose)
        .group_by(Drug.id)
    )

    for drug in drugs_with_doses:
        doses_breakdown = []
        total_dosed  = 0.0
        remaining    = 0.0

        for dose in drug.doses.order_by(Dose.taken_at):
            rem = dose.remaining_mg(now)
            total_dosed += dose.amount_mg
            remaining   += rem
            doses_breakdown.append({
                "id":           dose.id,
                "amount_mg":    dose.amount_mg,
                "taken_at":     dose.taken_at.isoformat(),
                "remaining_mg": round(rem, 4),
                "notes":        dose.notes,
            })

        results.append({
            "drug":           drug.name,
            "half_life_h":    round(drug.half_life_h, 2),
            "total_dosed_mg": round(total_dosed, 4),
            "remaining_mg":   round(remaining, 4),
            "pct_remaining":  round(remaining / total_dosed * 100, 2) if total_dosed else 0.0,
            "doses":          doses_breakdown,
        })

    return results
