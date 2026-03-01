from .sensor import router as sensor_router
from .drugs import router as drugs_router
from .patient import router as patient_router
from .reports import router as report_router
from .baselines import router as baselines_router
from .episodes import router as episodes_router
from .synthetic import router as synthetic_router
from .afib_feedback import router as afib_feedback_router

__all__ = [
    "sensor_router", "drugs_router", "patient_router",
    "report_router", "baselines_router", "episodes_router",
    "synthetic_router", "afib_feedback_router",
]
