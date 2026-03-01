"""
PDF renderer for Knockout cardiology reports.

Takes the assembled report dict from builder.py and renders a formatted PDF
using reportlab.

Run standalone to generate an example report:
    python -m report.pdf
"""

from __future__ import annotations

import io
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)


# ── Colors ────────────────────────────────────────────────────────────────

SKY        = colors.Color(56/255, 189/255, 248/255)
SKY_LIGHT  = colors.Color(224/255, 242/255, 254/255)
ZINC_800   = colors.Color(39/255, 39/255, 42/255)
ZINC_600   = colors.Color(82/255, 82/255, 91/255)
ZINC_400   = colors.Color(161/255, 161/255, 170/255)
RED        = colors.Color(239/255, 68/255, 68/255)
RED_LIGHT  = colors.Color(254/255, 226/255, 226/255)
AMBER      = colors.Color(245/255, 158/255, 11/255)
AMBER_LIGHT = colors.Color(254/255, 243/255, 199/255)
GREEN      = colors.Color(34/255, 197/255, 94/255)
GREEN_LIGHT = colors.Color(220/255, 252/255, 231/255)


# ── Styles ────────────────────────────────────────────────────────────────

def _build_styles():
    base = getSampleStyleSheet()

    styles = {
        "title": ParagraphStyle(
            "ReportTitle", parent=base["Title"],
            fontSize=22, textColor=ZINC_800, spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "ReportSubtitle", parent=base["Normal"],
            fontSize=10, textColor=ZINC_600, spaceAfter=2,
        ),
        "meta": ParagraphStyle(
            "ReportMeta", parent=base["Normal"],
            fontSize=8, textColor=ZINC_400, spaceAfter=8,
        ),
        "section": ParagraphStyle(
            "SectionTitle", parent=base["Heading2"],
            fontSize=14, textColor=ZINC_800, spaceBefore=14, spaceAfter=6,
        ),
        "subsection": ParagraphStyle(
            "SubsectionTitle", parent=base["Heading3"],
            fontSize=11, textColor=ZINC_600, spaceBefore=8, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "ReportBody", parent=base["Normal"],
            fontSize=10, textColor=ZINC_800, spaceAfter=2,
        ),
        "body_small": ParagraphStyle(
            "ReportBodySmall", parent=base["Normal"],
            fontSize=9, textColor=ZINC_600, spaceAfter=2,
        ),
        "flag": ParagraphStyle(
            "FlagText", parent=base["Normal"],
            fontSize=9, textColor=ZINC_800, backColor=AMBER_LIGHT,
            borderPadding=4, spaceAfter=3,
        ),
        "label": ParagraphStyle(
            "Label", parent=base["Normal"],
            fontSize=10, textColor=ZINC_600,
        ),
        "value": ParagraphStyle(
            "Value", parent=base["Normal"],
            fontSize=10, textColor=ZINC_800,
        ),
        "value_bold": ParagraphStyle(
            "ValueBold", parent=base["Normal"],
            fontSize=10, textColor=ZINC_800, fontName="Helvetica-Bold",
        ),
        "disclaimer": ParagraphStyle(
            "Disclaimer", parent=base["Normal"],
            fontSize=7, textColor=ZINC_400, spaceAfter=4,
        ),
        "badge_trough": ParagraphStyle(
            "BadgeTrough", parent=base["Normal"],
            fontSize=8, textColor=RED, fontName="Helvetica-Bold",
        ),
        "badge_ok": ParagraphStyle(
            "BadgeOk", parent=base["Normal"],
            fontSize=8, textColor=GREEN, fontName="Helvetica-Bold",
        ),
        "red_note": ParagraphStyle(
            "RedNote", parent=base["Normal"],
            fontSize=9, textColor=RED,
        ),
        "big_stat": ParagraphStyle(
            "BigStat", parent=base["Normal"],
            fontSize=12, textColor=RED, fontName="Helvetica-Bold",
        ),
    }
    return styles


# ── Report builder ────────────────────────────────────────────────────────

def _label_value_table(label: str, value: str, styles: dict, bold: bool = False):
    """Create a two-column label: value row as a mini table."""
    s_val = styles["value_bold"] if bold else styles["value"]
    data = [[Paragraph(label, styles["label"]), Paragraph(value, s_val)]]
    t = Table(data, colWidths=[2.2 * inch, 4.3 * inch])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
    ]))
    return t


def build_pdf_elements(report: dict, patient: dict | None = None) -> list:
    """Build the list of reportlab flowable elements from a report dict."""
    styles = _build_styles()
    elements: list = []

    meta = report["metadata"]
    patient = patient or {}

    # ── Title block ───────────────────────────────────────────────────
    elements.append(Paragraph("Cardiology Briefing", styles["title"]))

    period_start = meta["period_start"][:10]
    period_end = meta["period_end"][:10]
    elements.append(Paragraph(
        f"Patient: {meta['patient_name']}  &nbsp;|&nbsp;  Period: {period_start} to {period_end}",
        styles["subtitle"],
    ))

    diagnosis = patient.get("diagnosis", "Triadin Knockout Syndrome (TKOS)")
    icd_status = "ICD implanted" if patient.get("icd", True) else "No ICD"
    elements.append(Paragraph(
        f"Diagnosis: {diagnosis}  &nbsp;|&nbsp;  {icd_status}",
        styles["subtitle"],
    ))

    generated = meta["generated_at"][:19].replace("T", " ")
    elements.append(Paragraph(
        f"Generated: {generated} UTC  &nbsp;|&nbsp;  Knockout v{meta['knockout_version']}",
        styles["meta"],
    ))
    elements.append(HRFlowable(width="100%", thickness=1, color=SKY, spaceAfter=8))

    # ── Executive Summary ─────────────────────────────────────────────
    summary = report["executive_summary"]
    elements.append(Paragraph("Executive Summary", styles["section"]))

    elements.append(_label_value_table("Episodes this period:", str(summary["episode_count"]), styles, bold=True))
    if summary.get("previous_period_episode_count") is not None:
        elements.append(_label_value_table("Episodes last period:", str(summary["previous_period_episode_count"]), styles))

    trajectory = summary.get("trajectory", "unknown")
    elements.append(_label_value_table("Overall trajectory:", trajectory.upper(), styles, bold=True))
    elements.append(_label_value_table("ICD shocks:", str(summary.get("icd_shocks", 0)), styles))

    adherence = summary.get("medication_adherence_pct")
    if adherence is not None:
        elements.append(_label_value_table(
            "Medication adherence:",
            f"{adherence}% ({summary.get('missed_doses', 0)} missed doses)",
            styles,
        ))

    elements.append(_label_value_table("HRV baseline trend:", summary.get("hrv_baseline_trend", "unknown").upper(), styles, bold=True))

    flags = summary.get("flags", [])
    if flags:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph("Key Findings", styles["subsection"]))
        for flag in flags:
            elements.append(Paragraph(f"&nbsp;&nbsp;{flag}", styles["flag"]))

    elements.append(Spacer(1, 8))

    # ── Episode Library ───────────────────────────────────────────────
    episodes = report.get("episode_library", [])
    elements.append(Paragraph("Episode Library", styles["section"]))

    if not episodes:
        elements.append(Paragraph("No episodes recorded during this period.", styles["body_small"]))
    else:
        for i, ep in enumerate(episodes):
            ts = ep["timestamp"][:16].replace("T", " ")
            day = ep.get("day_of_week", "")
            elements.append(Paragraph(
                f"<b>Episode {i + 1}</b> &mdash; {day} {ts}",
                styles["body"],
            ))

            # Medication coverage
            med_cov = ep.get("medication_coverage", {})
            med_parts = []
            for drug_name, cov in med_cov.items():
                pct = cov.get("pct_remaining", 0)
                in_trough = cov.get("in_trough", False)
                hrs = cov.get("hours_since_dose", 0)
                color_tag = "red" if in_trough else "green"
                status = "TROUGH" if in_trough else "OK"
                med_parts.append(
                    f'<font color="{color_tag}"><b>{drug_name}: {pct:.0f}% ({hrs:.0f}h post-dose) [{status}]</b></font>'
                )
            if med_parts:
                elements.append(Paragraph("&nbsp;&nbsp;&nbsp;" + "&nbsp;&nbsp;|&nbsp;&nbsp;".join(med_parts), styles["body_small"]))

            # Vitals context
            hrv_ctx = ep.get("hrv_context", {})
            hr_ctx = ep.get("heart_rate", {})
            parts = []
            if hr_ctx.get("at_event_bpm"):
                parts.append(f"HR: {hr_ctx['at_event_bpm']:.0f} bpm (baseline {hr_ctx.get('baseline_bpm', '?')})")
            if hrv_ctx.get("at_event_ms"):
                dev = hrv_ctx.get("deviation_pct", 0)
                parts.append(f"HRV: {hrv_ctx['at_event_ms']:.0f}ms ({dev:+.0f}%)")

            afib = ep.get("afib_result", {})
            if afib.get("detected"):
                parts.append(f'<font color="red"><b>AFib DETECTED ({afib.get("confidence", 0):.0%})</b></font>')

            if parts:
                elements.append(Paragraph("&nbsp;&nbsp;&nbsp;" + "&nbsp;&nbsp;|&nbsp;&nbsp;".join(parts), styles["body_small"]))

            # Context: sleep, environment
            ctx_parts = []
            sleep = ep.get("sleep_prior_night", {})
            if sleep.get("duration_hours") is not None:
                marker = " *" if sleep.get("below_baseline") else ""
                ctx_parts.append(f"Sleep: {sleep['duration_hours']:.1f}h{marker}")
            env = ep.get("environment", {})
            if env.get("temperature_f") is not None:
                ctx_parts.append(f"Temp: {env['temperature_f']:.0f}F / {env.get('humidity_pct', '?')}%")
            wrist = ep.get("wrist_temperature", {})
            if wrist.get("elevated"):
                ctx_parts.append(f"Wrist temp elevated: {wrist.get('value_f', '?')}F")
            if ctx_parts:
                elements.append(Paragraph("&nbsp;&nbsp;&nbsp;" + "&nbsp;&nbsp;|&nbsp;&nbsp;".join(ctx_parts), styles["body_small"]))

            elements.append(HRFlowable(width="90%", thickness=0.5, color=SKY_LIGHT, spaceAfter=4, spaceBefore=4))

    # ── PK Analysis ───────────────────────────────────────────────────
    pk = report.get("pharmacokinetic_analysis", {})
    elements.append(Paragraph("Pharmacokinetic Analysis", styles["section"]))

    for drug in pk.get("drugs", []):
        elements.append(Paragraph(drug["name"].title(), styles["subsection"]))
        elements.append(_label_value_table("Dose:", f"{drug['dose_mg']}mg", styles))
        elements.append(_label_value_table("Half-life:", f"{drug['half_life_hours']}h", styles))
        elements.append(_label_value_table("Schedule:", drug.get("schedule", "—"), styles))
        elements.append(_label_value_table("Trough threshold:", f"{drug.get('trough_threshold_pct', 55)}%", styles))

    corr = pk.get("trough_episode_correlation", {})
    if corr.get("episodes_total", 0) > 0:
        elements.append(Paragraph("Trough-Episode Correlation", styles["subsection"]))
        pct = corr.get("correlation_pct", 0)
        style = styles["big_stat"] if pct >= 60 else styles["body"]
        elements.append(Paragraph(
            f"{corr['episodes_in_trough']} of {corr['episodes_total']} episodes "
            f"({pct}%) occurred during trough windows",
            style,
        ))

    adherence_data = pk.get("adherence", {})
    if adherence_data:
        elements.append(Paragraph("Medication Adherence", styles["subsection"]))
        for drug_name, data in adherence_data.items():
            a_pct = data.get("adherence_pct")
            if a_pct is not None:
                elements.append(_label_value_table(
                    f"{drug_name.title()}:",
                    f"{data['doses_logged']}/{data['doses_expected']} doses ({a_pct}%)",
                    styles,
                ))
                if data.get("missed_dose_preceded_episode", 0) > 0:
                    elements.append(Paragraph(
                        f"&nbsp;&nbsp;&nbsp;{data['missed_dose_preceded_episode']} missed dose(s) preceded an episode within 36 hours",
                        styles["red_note"],
                    ))

    elements.append(Spacer(1, 8))

    # ── Autonomic Trends ──────────────────────────────────────────────
    trends = report.get("autonomic_trends", {})
    elements.append(Paragraph("Autonomic Trends", styles["section"]))
    baseline = trends.get("hrv_baseline", {})

    if baseline.get("trend") == "insufficient data":
        elements.append(Paragraph("Insufficient HRV data for trend analysis.", styles["body_small"]))
    else:
        elements.append(Paragraph("HRV Baseline Trajectory", styles["subsection"]))
        elements.append(_label_value_table("Period start:", f"{baseline.get('period_start_ms')} ms", styles))
        elements.append(_label_value_table("Period end:", f"{baseline.get('period_end_ms')} ms", styles))
        change = baseline.get("change_pct", 0)
        trend = baseline.get("trend", "unknown")
        elements.append(_label_value_table("Change:", f"{change:+.1f}% ({trend.upper()})", styles, bold=True))

        dips = trends.get("notable_hrv_dips", [])
        if dips:
            elements.append(Paragraph(f"Notable HRV Dips ({len(dips)})", styles["subsection"]))
            for dip in dips:
                ts = dip["timestamp"][:16].replace("T", " ")
                ep_note = " (linked to episode)" if dip.get("associated_episode_id") else ""
                elements.append(_label_value_table(f"  {ts}:", f"{dip['value_ms']} ms{ep_note}", styles))

    elements.append(Spacer(1, 8))

    # ── Trigger Analysis ──────────────────────────────────────────────
    triggers = report.get("trigger_analysis", {})
    elements.append(Paragraph("Trigger Analysis", styles["section"]))

    if triggers.get("data_sufficiency") == "insufficient":
        elements.append(Paragraph(triggers.get("note", "Insufficient data."), styles["body_small"]))
    else:
        correlates = triggers.get("top_correlates", [])
        if correlates:
            elements.append(Paragraph("Top Correlating Factors", styles["subsection"]))
            table_data = [["Factor", "Episodes", "of Total", "Rate"]]
            for c in correlates:
                table_data.append([
                    c["factor"].replace("_", " ").title(),
                    str(c["appeared_in_n"]),
                    str(c["of_total"]),
                    f"{c['pct']}%",
                ])
            t = Table(table_data, colWidths=[2.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), SKY_LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), ZINC_600),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 1), (-1, -1), ZINC_800),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.5, SKY_LIGHT),
            ]))
            elements.append(t)

        compounds = triggers.get("compound_patterns", [])
        if compounds:
            elements.append(Spacer(1, 6))
            elements.append(Paragraph("Compound Trigger Patterns", styles["subsection"]))
            for cp in compounds:
                factors = " + ".join(f.replace("_", " ").title() for f in cp["factors"])
                elements.append(Paragraph(
                    f"{factors}: co-occurred in {cp['co_occurred_n']} of {cp['of_total']} episodes",
                    styles["body_small"],
                ))

    elements.append(Spacer(1, 8))

    # ── Supporting Context ────────────────────────────────────────────
    ctx = report.get("supporting_context", {})
    elements.append(Paragraph("Supporting Context", styles["section"]))

    sleep_ctx = ctx.get("sleep_trend", {})
    if sleep_ctx.get("avg_duration_hours") is not None:
        elements.append(Paragraph("Sleep", styles["subsection"]))
        elements.append(_label_value_table("Avg duration (episode nights):", f"{sleep_ctx['avg_duration_hours']}h", styles))
        elements.append(_label_value_table("Baseline duration:", f"{sleep_ctx.get('baseline_duration_hours', '?')}h", styles))

    env_ctx = ctx.get("environmental_exposures", {})
    elements.append(Paragraph("Environmental Exposure", styles["subsection"]))
    elements.append(_label_value_table("Episodes above 85F:", str(env_ctx.get("episodes_above_85f", 0)), styles))
    elements.append(_label_value_table("Episodes above 90F:", str(env_ctx.get("episodes_above_90f", 0)), styles))

    # ── Disclaimer ────────────────────────────────────────────────────
    elements.append(Spacer(1, 16))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=ZINC_400, spaceAfter=6))
    elements.append(Paragraph(
        "KNOCKOUT CLINICAL DECISION SUPPORT | This report is generated from patient-reported "
        "symptom captures and passive biometric data. It is intended to support — not replace — "
        "clinical judgment. All thresholds are calibrated to this patient's personal baselines. "
        "Pharmacokinetic estimates are based on population half-life values and may not reflect "
        "individual metabolism. This system does not provide medical advice or diagnosis.",
        styles["disclaimer"],
    ))

    return elements


def generate_pdf(report: dict, output_path: str | Path, patient_data: dict | None = None) -> Path:
    """Generate a PDF from an assembled report dict.

    Args:
        report: The assembled report dict from builder.build_cardiology_report().
        output_path: Where to save the PDF.
        patient_data: Optional patient metadata for the title block.

    Returns:
        Path to the generated PDF file.
    """
    output_path = Path(output_path)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title=f"Knockout Cardiology Report — {report['metadata']['patient_name']}",
        author="Knockout TKOS Platform",
    )

    elements = build_pdf_elements(report, patient_data)
    doc.build(elements)

    return output_path


def generate_pdf_bytes(report: dict, patient_data: dict | None = None) -> bytes:
    """Generate a PDF in memory and return the raw bytes."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title=f"Knockout Cardiology Report — {report['metadata']['patient_name']}",
        author="Knockout TKOS Platform",
    )

    elements = build_pdf_elements(report, patient_data)
    doc.build(elements)

    return buf.getvalue()


# ── Standalone entry point ────────────────────────────────────────────────

if __name__ == "__main__":
    from .sample_data import SAMPLE_REPORT_DATA
    from .builder import build_cardiology_report

    data = SAMPLE_REPORT_DATA
    report = build_cardiology_report(
        patient=data["patient"],
        medications=data["medications"],
        episodes=data["episodes"],
        doses=data["doses"],
        period_start=data["period_start"],
        period_end=data["period_end"],
    )

    examples_dir = Path(__file__).parent / "examples"
    examples_dir.mkdir(exist_ok=True)

    out = generate_pdf(report, examples_dir / "cardiology_report_example.pdf", patient_data=data["patient"])
    print(f"Generated: {out}")

    json_out = examples_dir / "cardiology_report_example.json"
    json_out.write_text(json.dumps(report, indent=2, default=str))
    print(f"JSON:      {json_out}")
