"""Compliance business services for completeness, risk, verification, and reviews."""

from datetime import date, datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models import (
    Customer,
    Document,
    Verification,
    RiskRating,
    ReviewCase,
    BeneficialOwner,
    Alert,
    KYCRequirement,
)
from backend.app.generator.constants import EVALUATION_DATE
from backend.app.generator.rules import (
    calculate_kyc_completeness,
    calculate_risk_rating,
    calculate_review_due_date,
    evaluate_document_expiry_state,
)
from backend.app.services.audit_service import AuditService

class ComplianceService:
    @staticmethod
    def recalculate_customer_completeness(db: Session, customer_id: str) -> float:
        """Recalculates and persists customer KYC completeness from submitted verified documents."""
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise ValueError(f"Customer {customer_id} not found")

        docs = db.query(Document).filter(Document.customer_id == customer_id).all()
        doc_dicts = [
            {"id": d.id, "document_type": d.document_type, "lifecycle_state": d.lifecycle_state}
            for d in docs
        ]

        doc_ids = [d.id for d in docs]
        verifications = db.query(Verification).filter(Verification.document_id.in_(doc_ids)).all()
        ver_dicts = {v.document_id: {"status": v.status} for v in verifications}

        prev_completeness = customer.kyc_completeness
        new_completeness = calculate_kyc_completeness(
            customer_type_code=customer.customer_type_code,
            risk_level=customer.current_risk_level,
            submitted_docs=doc_dicts,
            verifications_by_doc_id=ver_dicts
        )

        customer.kyc_completeness = new_completeness
        customer.updated_at = datetime.now(timezone.utc)
        db.commit()

        if prev_completeness != new_completeness:
            AuditService.log_event(
                db=db,
                related_entity_type="Customer",
                related_entity_id=customer_id,
                event_type="COMPLETENESS_RECALCULATED",
                actor="SYSTEM_AUTOMATION",
                previous_state=str(prev_completeness),
                new_state=str(new_completeness),
                event_details=f"Completeness recalculated to {new_completeness}%"
            )

        return new_completeness

    @staticmethod
    def verify_document(
        db: Session,
        document_id: str,
        status: str,
        actor: str,
        notes: Optional[str] = None
    ) -> Verification:
        """Updates document verification status and triggers customer completeness update."""
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise ValueError(f"Document {document_id} not found")

        verification = db.query(Verification).filter(Verification.document_id == document_id).first()
        if not verification:
            ver_id = f"VER-{document_id}"
            verification = Verification(
                id=ver_id,
                document_id=document_id,
                status=status,
                verified_by_actor=actor,
                analyst_notes=notes,
                verified_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            db.add(verification)
        else:
            prev_status = verification.status
            verification.status = status
            verification.verified_by_actor = actor
            verification.analyst_notes = notes
            verification.verified_at = datetime.now(timezone.utc)

        db.commit()

        # Recalculate customer completeness
        ComplianceService.recalculate_customer_completeness(db, doc.customer_id)

        AuditService.log_event(
            db=db,
            related_entity_type="Verification",
            related_entity_id=verification.id,
            event_type="DOCUMENT_VERIFIED",
            actor=actor,
            previous_state=getattr(verification, "status", None),
            new_state=status,
            event_details=f"Verification status updated to {status}: {notes or ''}"
        )

        return verification

    @staticmethod
    def assess_risk(db: Session, customer_id: str, actor: str = "RISK_REVIEWER") -> RiskRating:
        """Evaluates customer risk factors and updates active risk rating."""
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise ValueError(f"Customer {customer_id} not found")

        alert_count = db.query(Alert).filter(Alert.customer_id == customer_id).count()
        score, level, interval, breakdown = calculate_risk_rating(
            customer_type_code=customer.customer_type_code,
            jurisdiction_code=customer.jurisdiction,
            industry_sector=customer.industry_sector or "RETAIL_COMMERCE",
            past_alert_count=alert_count
        )

        # Mark existing active ratings as non-current
        existing_ratings = db.query(RiskRating).filter(
            RiskRating.customer_id == customer_id,
            RiskRating.is_current == True
        ).all()
        for r in existing_ratings:
            r.is_current = False

        rating_count = db.query(RiskRating).filter(RiskRating.customer_id == customer_id).count() + 1
        new_rating_id = f"RSK-{customer_id}-{datetime.now().year}-{rating_count:02d}"

        new_rating = RiskRating(
            id=new_rating_id,
            customer_id=customer_id,
            risk_score=score,
            risk_level=level,
            review_interval_months=interval,
            assessed_by=actor,
            score_breakdown=str(breakdown),
            effective_date=date.today(),
            is_current=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_rating)

        prev_level = customer.current_risk_level
        customer.current_risk_level = level
        db.commit()

        AuditService.log_event(
            db=db,
            related_entity_type="RiskRating",
            related_entity_id=new_rating.id,
            event_type="RISK_RATING_ASSESSED",
            actor=actor,
            previous_state=prev_level,
            new_state=level,
            event_details=f"Risk rating reassessed to {level} (Score: {score})"
        )

        return new_rating

    @staticmethod
    def scan_and_generate_expiry_alerts(db: Session, ref_date: date = EVALUATION_DATE) -> int:
        """Scans all documents and generates alerts for expired or expiring documents."""
        docs = db.query(Document).filter(Document.expiry_date.isnot(None)).all()
        created_count = 0
        alert_total = db.query(Alert).count()

        for doc in docs:
            state = evaluate_document_expiry_state(doc.expiry_date, ref_date)
            if state in ("EXPIRED", "EXPIRING_SOON"):
                alert_type = "DOCUMENT_EXPIRED" if state == "EXPIRED" else "EXPIRING_SOON"
                severity = "HIGH" if state == "EXPIRED" else "MEDIUM"
                
                # Check if open alert already exists
                existing = db.query(Alert).filter(
                    Alert.related_entity_id == doc.id,
                    Alert.alert_type == alert_type,
                    Alert.status == "OPEN"
                ).first()

                if not existing:
                    alert_total += 1
                    alert_id = f"ALT-2026-{alert_total:06d}"
                    new_alert = Alert(
                        id=alert_id,
                        customer_id=doc.customer_id,
                        alert_type=alert_type,
                        severity=severity,
                        status="OPEN",
                        description=f"Document {doc.id} ({doc.document_type}) is {state.lower()} (Expiry: {doc.expiry_date}).",
                        related_entity_type="Document",
                        related_entity_id=doc.id,
                        created_at=datetime.now(timezone.utc)
                    )
                    db.add(new_alert)
                    created_count += 1

        db.commit()
        return created_count
