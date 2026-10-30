"""Customer REST API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models import Customer, Document, BeneficialOwner, RiskRating, ReviewCase
from backend.app.schemas import CustomerRead, CustomerCreate, CustomerUpdate
from backend.app.services import ComplianceService

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerRead])
def get_customers(
    customer_type: Optional[str] = Query(None, description="Filter by customer type (INDIVIDUAL, BUSINESS_SME, etc.)"),
    risk_level: Optional[str] = Query(None, description="Filter by risk tier (LOW, MEDIUM, HIGH)"),
    status: Optional[str] = Query(None, description="Filter by onboarding status"),
    search: Optional[str] = Query(None, description="Search by name, ID, or registration number"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if customer_type:
        query = query.filter(Customer.customer_type_code == customer_type)
    if risk_level:
        query = query.filter(Customer.current_risk_level == risk_level)
    if status:
        query = query.filter(Customer.onboarding_status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.full_name.ilike(search_pattern),
                Customer.id.ilike(search_pattern),
                Customer.registration_number.ilike(search_pattern),
            )
        )
    return query.order_by(Customer.id).offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
    return customer

@router.get("/{customer_id}/details")
def get_customer_full_details(customer_id: str, db: Session = Depends(get_db)):
    """Returns aggregated customer details with documents, risk history, reviews, and UBOs."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    docs = db.query(Document).filter(Document.customer_id == customer_id).all()
    ratings = db.query(RiskRating).filter(RiskRating.customer_id == customer_id).order_by(RiskRating.effective_date.desc()).all()
    reviews = db.query(ReviewCase).filter(ReviewCase.customer_id == customer_id).all()
    ubos = db.query(BeneficialOwner).filter(BeneficialOwner.business_customer_id == customer_id).all()

    return {
        "customer": customer,
        "documents": docs,
        "risk_ratings": ratings,
        "review_cases": reviews,
        "beneficial_owners": ubos
    }

@router.post("/{customer_id}/recalculate-completeness")
def recalculate_completeness(customer_id: str, db: Session = Depends(get_db)):
    try:
        new_score = ComplianceService.recalculate_customer_completeness(db, customer_id)
        return {"customer_id": customer_id, "kyc_completeness": new_score}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: str, update: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    for k, v in update.model_dump(exclude_unset=True).items():
        setattr(customer, k, v)
    db.commit()
    db.refresh(customer)
    return customer
