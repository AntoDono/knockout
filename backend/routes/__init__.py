from .sensor import router as sensor_router
from .drugs import router as drugs_router
from .patient import router as patient_router
from .reports import router as report_router

__all__ = ["sensor_router", "drugs_router", "patient_router", "report_router"]
