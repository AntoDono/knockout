"""
Drug-tracking API endpoints.

  GET  /drugs          – list all known drugs
  POST /drugs          – add/register a drug  { name, half_life_s, reasoning? }
  GET  /doses          – list all logged doses  (?drug=<name> to filter)
  POST /doses          – log a dose  { drug, amount_mg, taken_at?, notes? }
  DELETE /doses/{id}   – delete a specific dose
  GET  /levels         – current plasma levels computed from half-life decay
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database import Drug, Dose, get_current_levels
from services.llm_tools import get_halflife

router = APIRouter(tags=["drugs"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class DrugCreate(BaseModel):
    name: str
    half_life_s: int | None = None
    reasoning: str = ""


class DoseCreate(BaseModel):
    drug: str
    amount_mg: float
    taken_at: str | None = None
    notes: str = ""


# ---------------------------------------------------------------------------
# Drug endpoints
# ---------------------------------------------------------------------------

@router.get("/drugs")
def get_drugs():
    return [
        {
            "id": d.id,
            "name": d.name,
            "half_life_s": d.half_life_s,
            "half_life_h": round(d.half_life_h, 2),
            "reasoning": d.reasoning,
        }
        for d in Drug.select().order_by(Drug.name)
    ]


@router.post("/drugs", status_code=201)
def create_drug(body: DrugCreate):
    name = body.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="field 'name' is required")

    if body.half_life_s is not None:
        half_life_s = body.half_life_s
        reasoning = body.reasoning
    else:
        try:
            hl = get_halflife(name)
            half_life_s = hl.halflife
            reasoning = hl.reasoning
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"half-life lookup failed: {e}")

    drug, created = Drug.get_or_create(
        name=name,
        defaults={"half_life_s": half_life_s, "reasoning": reasoning},
    )
    if not created:
        drug.half_life_s = half_life_s
        drug.reasoning = reasoning
        drug.save()

    return {
        "id": drug.id,
        "name": drug.name,
        "half_life_s": drug.half_life_s,
        "half_life_h": round(drug.half_life_h, 2),
        "reasoning": drug.reasoning,
        "created": created,
    }


# ---------------------------------------------------------------------------
# Dose endpoints
# ---------------------------------------------------------------------------

@router.get("/doses")
def get_doses(drug: str | None = Query(None)):
    query = Dose.select(Dose, Drug).join(Drug).order_by(Dose.taken_at.desc())
    if drug:
        query = query.where(Drug.name == drug.strip().lower())

    return [
        {
            "id": d.id,
            "drug": d.drug.name,
            "amount_mg": d.amount_mg,
            "taken_at": d.taken_at.isoformat(),
            "notes": d.notes,
        }
        for d in query
    ]


@router.post("/doses", status_code=201)
def create_dose(body: DoseCreate):
    drug_name = body.drug.strip().lower()
    if not drug_name:
        raise HTTPException(status_code=400, detail="field 'drug' is required")

    try:
        drug = Drug.get(Drug.name == drug_name)
    except Drug.DoesNotExist:
        raise HTTPException(status_code=404, detail=f"drug '{drug_name}' not found – register it via POST /drugs first")

    if body.taken_at:
        try:
            taken_at = datetime.fromisoformat(body.taken_at)
            if taken_at.tzinfo is None:
                taken_at = taken_at.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="invalid 'taken_at' – use ISO-8601 format")
    else:
        taken_at = datetime.now(timezone.utc)

    dose = Dose.create(
        drug=drug,
        amount_mg=body.amount_mg,
        taken_at=taken_at,
        notes=body.notes,
    )

    return {
        "id": dose.id,
        "drug": drug.name,
        "amount_mg": dose.amount_mg,
        "taken_at": dose.taken_at.isoformat(),
        "notes": dose.notes,
    }


@router.delete("/doses/{dose_id}")
def delete_dose(dose_id: int):
    deleted = Dose.delete().where(Dose.id == dose_id).execute()
    if not deleted:
        raise HTTPException(status_code=404, detail=f"dose {dose_id} not found")
    return {"deleted": dose_id}


# ---------------------------------------------------------------------------
# Levels
# ---------------------------------------------------------------------------

@router.get("/levels")
def get_levels():
    return get_current_levels()
