"""Analytics, Dashboard Metrics, Exception Evaluation, and Validation endpoints."""

import hashlib
import json
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models import (
    Customer,
    Document,
    Verification,
    ReviewCase,
    Alert,
    RiskRating,
    BeneficialOwner,
)
from backend.app.schemas import DashboardMetrics, EvaluationResponse
from backend.app.services import ExceptionDetectionEngine, EvaluationService
from backend.app.validators import DataValidator
from backend.app.generator import KYCDataGenerator, DataExporter, load_dataset_into_db, FIXED_SEED

router = APIRouter(prefix="/analytics", tags=["Analytics & Evaluation"])

@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Computes real-time aggregated metrics from the active database."""
    total_customers = db.query(Customer).count()
    individual_customers = db.query(Customer).filter(Customer.customer_type_code == "INDIVIDUAL").count()
    business_customers = total_customers - individual_customers

    total_documents = db.query(Document).count()
    verified_documents = db.query(Verification).filter(Verification.status == "VERIFIED").count()
    pending_documents = db.query(Verification).filter(Verification.status == "PENDING_REVIEW").count()
    
    from backend.app.generator.constants import EVALUATION_DATE
    from datetime import timedelta
    expired_documents = db.query(Document).filter(
        Document.expiry_date.isnot(None),
        Document.expiry_date < EVALUATION_DATE
    ).count()
    expiring_soon_documents = db.query(Document).filter(
        Document.expiry_date >= EVALUATION_DATE,
        Document.expiry_date <= EVALUATION_DATE + timedelta(days=60)
    ).count()

    total_review_cases = db.query(ReviewCase).count()
    pending_reviews = db.query(ReviewCase).filter(ReviewCase.status.in_(["SCHEDULED", "UNDER_REVIEW"])).count()
    overdue_reviews = db.query(ReviewCase).filter(ReviewCase.is_overdue == True).count()
    resolved_reviews = db.query(ReviewCase).filter(ReviewCase.status == "RESOLVED").count()

    active_alerts = db.query(Alert).filter(Alert.status == "OPEN").count()

    # Risk Distribution
    risk_counts = db.query(Customer.current_risk_level, func.count(Customer.id)).group_by(Customer.current_risk_level).all()
    risk_dist = {r[0]: r[1] for r in risk_counts}

    # Completeness Distribution
    comp_100 = db.query(Customer).filter(Customer.kyc_completeness == 100.0).count()
    comp_75 = db.query(Customer).filter(Customer.kyc_completeness >= 75.0, Customer.kyc_completeness < 100.0).count()
    comp_50 = db.query(Customer).filter(Customer.kyc_completeness >= 50.0, Customer.kyc_completeness < 75.0).count()
    comp_low = db.query(Customer).filter(Customer.kyc_completeness < 50.0).count()

    completeness_dist = {
        "100% Complete": comp_100,
        "75% - 99%": comp_75,
        "50% - 74%": comp_50,
        "< 50%": comp_low,
    }

    return DashboardMetrics(
        total_customers=total_customers,
        individual_customers=individual_customers,
        business_customers=business_customers,
        total_documents=total_documents,
        verified_documents=verified_documents,
        pending_documents=pending_documents,
        expired_documents=expired_documents,
        expiring_soon_documents=expiring_soon_documents,
        total_review_cases=total_review_cases,
        pending_reviews=pending_reviews,
        overdue_reviews=overdue_reviews,
        resolved_reviews=resolved_reviews,
        active_alerts=active_alerts,
        risk_distribution=risk_dist,
        completeness_distribution=completeness_dist,
    )

@router.get("/exceptions")
def get_exceptions(db: Session = Depends(get_db)):
    """Runs pure business-rule exception detection engine (no ground truth leakage)."""
    exceptions = ExceptionDetectionEngine.detect_all_exceptions(db)
    return {
        "total_exceptions": len(exceptions),
        "exceptions": exceptions
    }

@router.get("/evaluation", response_model=EvaluationResponse)
def get_evaluation(db: Session = Depends(get_db)):
    """Benchmarks exception detection engine against isolated ground truth."""
    return EvaluationService.evaluate_model(db)

@router.get("/validation")
def get_data_validation(db: Session = Depends(get_db)):
    """Executes all 12 automated data quality and referential integrity validations."""
    validator = DataValidator(db)
    return validator.run_all_validations()

@router.post("/generate-data")
def trigger_data_generation(
    preset: str = Query("starter", pattern="^(starter|full)$"),
    db: Session = Depends(get_db)
):
    """Triggers synthetic data generation for starter (200) or full (8,000) scale."""
    generator = KYCDataGenerator(preset=preset)
    data = generator.generate_all()

    # Determine export directory
    export_dir = settings.DATA_DIR / ("generated" if preset == "full" else "starter")
    exporter = DataExporter(output_dir=export_dir, ground_truth_dir=settings.GROUND_TRUTH_DIR)
    exporter.export_all(data)

    # Load into active database session
    load_dataset_into_db(db, data)

    return {
        "message": f"Successfully generated and loaded '{preset}' dataset.",
        "counts": {k: len(v) for k, v in data.items()}
    }

@router.get("/reproducibility")
def verify_reproducibility():
    """Runs data generation twice with fixed seed 20261022 and verifies cryptographic identity."""
    gen1 = KYCDataGenerator(seed=FIXED_SEED, preset="starter")
    data1 = gen1.generate_all()

    gen2 = KYCDataGenerator(seed=FIXED_SEED, preset="starter")
    data2 = gen2.generate_all()

    # Compare entity counts
    counts1 = {k: len(v) for k, v in data1.items()}
    counts2 = {k: len(v) for k, v in data2.items()}
    counts_match = (counts1 == counts2)

    # Compare SHA-256 serialization checksums
    def compute_hash(dataset_dict):
        def default_serializer(obj):
            if hasattr(obj, "isoformat"):
                return obj.isoformat()
            return str(obj)
        dump = json.dumps(dataset_dict, default=default_serializer, sort_keys=True)
        return hashlib.sha256(dump.encode("utf-8")).hexdigest()

    hash1 = compute_hash(data1)
    hash2 = compute_hash(data2)
    checksums_match = (hash1 == hash2)

    return {
        "fixed_seed": FIXED_SEED,
        "is_reproducible": counts_match and checksums_match,
        "counts_run_1": counts1,
        "counts_run_2": counts2,
        "checksum_run_1": hash1,
        "checksum_run_2": hash2,
        "status": "PASS: Fixed-seed reproducibility verified bit-for-bit." if checksums_match else "FAIL: Discrepancy detected."
    }

@router.get("/exports")
def list_exports():
    """Lists exported CSV, JSON, and SQL files."""
    results = {}
    for folder_name in ["starter", "generated", "ground_truth"]:
        folder = settings.DATA_DIR / folder_name
        if folder.exists():
            files = [
                {"name": f.name, "size_bytes": f.stat().st_size}
                for f in folder.iterdir() if f.is_file()
            ]
            results[folder_name] = files
        else:
            results[folder_name] = []
    return results
