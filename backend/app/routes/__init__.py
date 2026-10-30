from backend.app.routes.customers import router as customers_router
from backend.app.routes.documents import router as documents_router
from backend.app.routes.compliance import router as compliance_router
from backend.app.routes.alerts import router as alerts_router
from backend.app.routes.audit import router as audit_router
from backend.app.routes.analytics import router as analytics_router

__all__ = [
    "customers_router",
    "documents_router",
    "compliance_router",
    "alerts_router",
    "audit_router",
    "analytics_router",
]
