"""Main FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.models import Customer
from backend.app.generator import KYCDataGenerator, DataExporter, load_dataset_into_db
from backend.app.routes import (
    customers_router,
    documents_router,
    compliance_router,
    alerts_router,
    audit_router,
    analytics_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and auto-seed starter data if empty
    init_db()
    db = SessionLocal()
    try:
        cus_count = db.query(Customer).count()
        if cus_count == 0:
            print("Database empty. Auto-seeding starter compliance dataset...")
            gen = KYCDataGenerator(preset="starter")
            dataset = gen.generate_all()
            exporter = DataExporter(output_dir=settings.STARTER_DIR, ground_truth_dir=settings.GROUND_TRUTH_DIR)
            exporter.export_all(dataset)
            load_dataset_into_db(db, dataset)
            print("Starter dataset auto-seeding complete.")
    finally:
        db.close()
    yield

app = FastAPI(
    title="KYC Onboarding Evidence, Validation & Compliance Monitoring Platform",
    description="Deterministic regulatory compliance platform featuring synthetic generation, rule-based exception detection, and ground truth evaluation.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(customers_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(compliance_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")

# Serve frontend static assets if dist exists
dist_dir = settings.BASE_DIR / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=dist_dir / "assets"), name="static_assets")
    
    from fastapi.responses import FileResponse
    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "platform": "KYC Onboarding Evidence, Validation & Compliance Monitoring Platform",
            "status": "OPERATIONAL",
            "version": "1.0.0",
            "docs_url": "/docs",
            "api_prefix": "/api"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
