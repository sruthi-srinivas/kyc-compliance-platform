"""Compliance governance, reviews, UBO, requirements, and risk routes."""

from typing import List, Optional
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models import (
    CustomerType,
    KYCRequirement,
    RiskRating,
    ReviewCase,
    BeneficialOwner,
    Verification,
)
from backend.app.schemas import (
    CustomerTypeRead,
    KYCRequirementRead,
    RiskRatingRead,
    ReviewCaseRead,
    ReviewCaseUpdate,
    BeneficialOwnerRead,
    VerificationRead,
)
from backend.app.services import ComplianceService, AuditService

router = APIRouter(tags=["Compliance Governance"])

# --- Customer Types ---
@router.get("/customer-types", response_model=List[CustomerTypeRead])
def get_customer_types(db: Session = Depends(get_db)):
    return db.query(CustomerType).order_by(CustomerType.code).all()

# --- KYC Requirements ---
@router.get("/kyc-requirements", response_model=List[KYCRequirementRead])
def get_kyc_requirements(
    customer_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(KYCRequirement)
    if customer_type:
        query = query.filter(KYCRequirement.customer_type_code == customer_type)
    if risk_level:
        query = query.filter(KYCRequirement.risk_level.in_(["ALL", risk_level]))
    return query.order_by(KYCRequirement.id).all()

# --- Risk Ratings ---
@router.get("/risk-ratings", response_model=List[RiskRatingRead])
def get_risk_ratings(
    customer_id: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    is_current_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(RiskRating)
    if customer_id:
        query = query.filter(RiskRating.customer_id == customer_id)
    if risk_level:
        query = query.filter(RiskRating.risk_level == risk_level)
    if is_current_only:
        query = query.filter(RiskRating.is_current == True)
    return query.order_by(RiskRating.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/risk-ratings/{customer_id}/assess", response_model=RiskRatingRead)
def assess_customer_risk(customer_id: str, actor: str = Query("RISK_REVIEWER"), db: Session = Depends(get_db)):
    try:
        new_rating = ComplianceService.assess_risk(db=db, customer_id=customer_id, actor=actor)
        return new_rating
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# --- Beneficial Owners ---
@router.get("/beneficial-owners", response_model=List[BeneficialOwnerRead])
def get_beneficial_owners(
    business_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(BeneficialOwner)
    if business_id:
        query = query.filter(BeneficialOwner.business_customer_id == business_id)
    return query.order_by(BeneficialOwner.id).offset(skip).limit(limit).all()

@router.get("/beneficial-owners/reconciliation")
def get_ubo_reconciliation(db: Session = Depends(get_db)):
    """Computes total ownership percentage per business and flags anomalies."""
    results = db.query(
        BeneficialOwner.business_customer_id,
        func.sum(BeneficialOwner.ownership_percentage).label("total_percentage"),
        func.count(BeneficialOwner.id).label("owner_count")
    ).group_by(BeneficialOwner.business_customer_id).all()

    report = []
    for biz_id, total_pct, count in results:
        is_excess = total_pct > 100.001
        report.append({
            "business_customer_id": biz_id,
            "owner_count": count,
            "total_ownership_pct": round(total_pct, 2),
            "reconciliation_status": "EXCESS_OWNERSHIP_FAILURE" if is_excess else "BALANCED",
            "is_valid": not is_excess
        })
    return report

# --- Review Cases ---
@router.get("/review-cases", response_model=List[ReviewCaseRead])
def get_review_cases(
    status: Optional[str] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(ReviewCase)
    if status:
        query = query.filter(ReviewCase.status == status)
    if is_overdue is not None:
        query = query.filter(ReviewCase.is_overdue == is_overdue)
    return query.order_by(ReviewCase.scheduled_due_date).offset(skip).limit(limit).all()

@router.patch("/review-cases/{case_id}", response_model=ReviewCaseRead)
def update_review_case(
    case_id: str,
    payload: ReviewCaseUpdate,
    actor: str = Query("RISK_REVIEWER"),
    db: Session = Depends(get_db)
):
    case = db.query(ReviewCase).filter(ReviewCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Review case {case_id} not found")

    prev_status = case.status
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(case, k, v)

    if payload.status == "RESOLVED" and not case.completed_date:
        case.completed_date = date.today()
        case.is_overdue = False

    db.commit()
    db.refresh(case)

    AuditService.log_event(
        db=db,
        related_entity_type="ReviewCase",
        related_entity_id=case_id,
        event_type="REVIEW_UPDATED",
        actor=actor,
        previous_state=prev_status,
        new_state=case.status,
        event_details=f"Resolution: {case.resolution_decision or 'None'}"
    )

    return case

# --- Verifications ---
@router.get("/verifications", response_model=List[VerificationRead])
def get_verifications(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Verification)
    if status:
        query = query.filter(Verification.status == status)
    return query.order_by(Verification.created_at.desc()).offset(skip).limit(limit).all()
