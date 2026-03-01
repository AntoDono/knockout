"""
Guardrail report generation module.

Self-contained — does not import from database.py or server.py.
When the real DB layer is ready, swap sample_data for real queries.
"""

from .builder import build_cardiology_report
from .pdf import generate_pdf_bytes
from .sample_data import SAMPLE_REPORT_DATA

__all__ = ["build_cardiology_report", "generate_pdf_bytes", "SAMPLE_REPORT_DATA"]
