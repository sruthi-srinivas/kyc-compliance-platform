"""Database loader for seeding KYC compliance data into SQLAlchemy database."""

from typing import Dict, List, Any
from sqlalchemy.orm import Session
from backend.app.models import (
    CustomerType,
    Customer,
    KYCRequirement,
    Document,
    Verification,
    RiskRating,
    ReviewCase,
    BeneficialOwner,
    Alert,
    AuditEvent,
)

def load_dataset_into_db(db: Session, datasets: Dict[str, List[Dict[str, Any]]]):
    """Loads generated records into the relational database in correct dependency order."""
    # 1. Truncate / delete existing in reverse foreign key order
    models_to_clear = [
        AuditEvent,
        Alert,
        BeneficialOwner,
        ReviewCase,
        RiskRating,
        Verification,
        Document,
        Customer,
        KYCRequirement,
        CustomerType,
    ]
    for model in models_to_clear:
        db.query(model).delete()
    db.commit()

    # 2. Bulk insert in correct relational sequence
    # Customer Types
    for row in datasets["customer_types"]:
        db.add(CustomerType(**row))
    db.commit()

    # KYC Requirements
    for row in datasets["kyc_requirements"]:
        db.add(KYCRequirement(**row))
    db.commit()

    # Customers
    for row in datasets["customers"]:
        db.add(Customer(**row))
    db.commit()

    # Documents
    for row in datasets["documents"]:
        db.add(Document(**row))
    db.commit()

    # Verifications
    for row in datasets["verifications"]:
        db.add(Verification(**row))
    db.commit()

    # Risk Ratings
    for row in datasets["risk_ratings"]:
        db.add(RiskRating(**row))
    db.commit()

    # Review Cases
    for row in datasets["review_cases"]:
        db.add(ReviewCase(**row))
    db.commit()

    # Beneficial Owners
    for row in datasets["beneficial_owners"]:
        db.add(BeneficialOwner(**row))
    db.commit()

    # Alerts
    for row in datasets["alerts"]:
        db.add(Alert(**row))
    db.commit()

    # Audit Events
    for row in datasets["audit_events"]:
        db.add(AuditEvent(**row))
    db.commit()
