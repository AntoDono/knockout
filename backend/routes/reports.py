"""
Report generation endpoints.

  GET /report  – generate a cardiology PDF report (?sections=... to filter)
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter(prefix="/report", tags=["report"])


@router.get("")
def get_report(
    type: str = Query("cardiology", alias="type"),
    sections: str | None = Query(None),
):
    try:
        from report import build_cardiology_report, generate_pdf_bytes, SAMPLE_REPORT_DATA
    except ImportError:
        raise HTTPException(status_code=501, detail="report module not implemented yet")

    if type != "cardiology":
        raise HTTPException(status_code=400, detail=f"unsupported report type '{type}' – only 'cardiology' is available")

    data = SAMPLE_REPORT_DATA
    report = build_cardiology_report(
        patient=data["patient"],
        medications=data["medications"],
        episodes=data["episodes"],
        doses=data["doses"],
        period_start=data["period_start"],
        period_end=data["period_end"],
    )

    if sections:
        allowed = set(sections.split(","))
        optional_keys = [
            "episode_library", "pharmacokinetic_analysis",
            "autonomic_trends", "trigger_analysis", "supporting_context",
        ]
        for key in optional_keys:
            if key not in allowed:
                report.pop(key, None)

    pdf_bytes = generate_pdf_bytes(report, patient_data=data["patient"])
    patient_name = data["patient"].get("name", "patient").replace(" ", "_")
    filename = f"guardrail_{type}_report_{patient_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
