from sqlalchemy import func
from backend.app.models import (
    Customer,
    CustomerType,
    KYCRequirement,
    Document,
    Verification,
    RiskRating,
    ReviewCase,
    BeneficialOwner,
    Alert,
    AuditEvent,
)

def test_all_10_entities_present(db):
    """Verify all 10 core entities contain active seeded records."""
    assert db.query(CustomerType).count() == 3
    assert db.query(KYCRequirement).count() == 15
    assert db.query(Customer).count() == 200
    assert db.query(Document).count() >= 500
    assert db.query(Verification).count() >= 500
    assert db.query(RiskRating).count() == 200
    assert db.query(ReviewCase).count() == 75
    assert db.query(BeneficialOwner).count() > 0
    assert db.query(Alert).count() > 0
    assert db.query(AuditEvent).count() > 0

def test_primary_key_uniqueness(db):
    """Verify 100% uniqueness of deterministic primary keys."""
    models = [
        Customer, Document, Verification, RiskRating,
        ReviewCase, BeneficialOwner, Alert, AuditEvent, KYCRequirement
    ]
    for m in models:
        pk_col = m.id
        dups = db.query(pk_col, func.count(pk_col)).group_by(pk_col).having(func.count(pk_col) > 1).all()
        assert len(dups) == 0, f"Duplicate PKs found in {m.__tablename__}"

def test_foreign_key_referential_integrity(db):
    """Verify zero orphan records across all relational foreign keys."""
    # Documents -> Customers
    orphan_docs = db.query(Document).filter(~Document.customer_id.in_(db.query(Customer.id))).count()
    assert orphan_docs == 0

    # Verifications -> Documents
    orphan_vers = db.query(Verification).filter(~Verification.document_id.in_(db.query(Document.id))).count()
    assert orphan_vers == 0

    # BeneficialOwners -> Customers
    orphan_ubos = db.query(BeneficialOwner).filter(~BeneficialOwner.business_customer_id.in_(db.query(Customer.id))).count()
    assert orphan_ubos == 0

    # RiskRatings -> Customers
    orphan_risks = db.query(RiskRating).filter(~RiskRating.customer_id.in_(db.query(Customer.id))).count()
    assert orphan_risks == 0

    # ReviewCases -> Customers
    orphan_revs = db.query(ReviewCase).filter(~ReviewCase.customer_id.in_(db.query(Customer.id))).count()
    assert orphan_revs == 0
