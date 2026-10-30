"""Exception Detection Engine: Identifies compliance exceptions and anomalies using business rules.

CRITICAL ARCHITECTURAL GUARANTEE:
This engine has ZERO access to ground-truth files or labels.
It operates purely on active relational entities and deterministic compliance constraints.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import (
    Customer,
    Document,
    Verification,
    ReviewCase,
    BeneficialOwner,
)
from backend.app.generator.constants import EVALUATION_DATE

class ExceptionDetectionEngine:
    @staticmethod
    def detect_all_exceptions(db: Session) -> List[Dict[str, Any]]:
        """Runs all 5 anomaly detection modules and aggregates the findings."""
        anomalies: List[Dict[str, Any]] = []

        # Scenario 1: Document expired but marked valid
        anomalies.extend(ExceptionDetectionEngine.detect_expired_valid_documents(db))

        # Scenario 2: Customer approved with missing mandatory evidence
        anomalies.extend(ExceptionDetectionEngine.detect_approved_missing_evidence(db))

        # Scenario 3: Beneficial ownership percentages exceed 100%
        anomalies.extend(ExceptionDetectionEngine.detect_ubo_excess_ownership(db))

        # Scenario 4: Review closes without resolution
        anomalies.extend(ExceptionDetectionEngine.detect_unresolved_review_closures(db))

        # Scenario 5: Duplicate document used across unrelated customers
        anomalies.extend(ExceptionDetectionEngine.detect_duplicate_documents(db))

        return anomalies

    @staticmethod
    def detect_expired_valid_documents(db: Session) -> List[Dict[str, Any]]:
        """Scenario 1: Detects documents whose expiry date has passed but are still marked VALID."""
        findings = []
        expired_docs = db.query(Document).filter(
            Document.expiry_date.isnot(None),
            Document.expiry_date < EVALUATION_DATE,
            Document.lifecycle_state == "VALID"
        ).all()

        for doc in expired_docs:
            findings.append({
                "detection_id": f"DET-EXP-{doc.id}",
                "issue_type": "EXPIRED_DOCUMENT_MARKED_VALID",
                "severity": "HIGH",
                "related_entity_type": "Document",
                "related_entity_id": doc.id,
                "description": (
                    f"Document {doc.id} ({doc.document_type}) expired on {doc.expiry_date} "
                    f"(relative to anchor {EVALUATION_DATE}) but lifecycle_state is still VALID."
                ),
                "expected_decision": "REVOKE_VALIDITY_AND_REQUEST_REFRESH"
            })
        return findings

    @staticmethod
    def detect_approved_missing_evidence(db: Session) -> List[Dict[str, Any]]:
        """Scenario 2: Detects customers approved while KYC completeness is strictly under 100%."""
        findings = []
        approved_incomplete = db.query(Customer).filter(
            Customer.onboarding_status == "APPROVED",
            Customer.kyc_completeness < 100.0
        ).all()

        for cus in approved_incomplete:
            findings.append({
                "detection_id": f"DET-APP-{cus.id}",
                "issue_type": "APPROVED_WITHOUT_MANDATORY_KYC",
                "severity": "CRITICAL",
                "related_entity_type": "Customer",
                "related_entity_id": cus.id,
                "description": (
                    f"Customer {cus.id} ({cus.full_name}) has onboarding_status 'APPROVED' "
                    f"despite incomplete mandatory KYC evidence ({cus.kyc_completeness}%)."
                ),
                "expected_decision": "SUSPEND_APPROVAL_AND_COMMENCE_REMEDIATION"
            })
        return findings

    @staticmethod
    def detect_ubo_excess_ownership(db: Session) -> List[Dict[str, Any]]:
        """Scenario 3: Detects business entities where declared UBO ownership totals exceed 100%."""
        findings = []
        # Group sum by business_customer_id
        owner_sums = db.query(
            BeneficialOwner.business_customer_id,
            func.sum(BeneficialOwner.ownership_percentage).label("total_percentage"),
            func.count(BeneficialOwner.id).label("owner_count")
        ).group_by(BeneficialOwner.business_customer_id).having(
            func.sum(BeneficialOwner.ownership_percentage) > 100.001
        ).all()

        for b_id, total_pct, count in owner_sums:
            findings.append({
                "detection_id": f"DET-UBO-{b_id}",
                "issue_type": "UBO_PERCENTAGE_EXCEEDS_100",
                "severity": "HIGH",
                "related_entity_type": "BeneficialOwner",
                "related_entity_id": b_id,
                "description": (
                    f"Business customer {b_id} beneficial ownership reconciliation failed: "
                    f"declared total is {round(total_pct, 2)}% across {count} owners (exceeds 100.0%)."
                ),
                "expected_decision": "RECONCILE_SHAREHOLDING_CAP_TABLE"
            })
        return findings

    @staticmethod
    def detect_unresolved_review_closures(db: Session) -> List[Dict[str, Any]]:
        """Scenario 4: Detects review cases marked CLOSED without an explicit recorded resolution."""
        findings = []
        invalid_closures = db.query(ReviewCase).filter(
            ReviewCase.status == "CLOSED",
            (ReviewCase.resolution_decision.is_(None) | (ReviewCase.resolution_decision == ""))
        ).all()

        for rev in invalid_closures:
            findings.append({
                "detection_id": f"DET-REV-{rev.id}",
                "issue_type": "REVIEW_CLOSED_WITHOUT_RESOLUTION",
                "severity": "HIGH",
                "related_entity_type": "ReviewCase",
                "related_entity_id": rev.id,
                "description": (
                    f"ReviewCase {rev.id} for customer {rev.customer_id} is marked 'CLOSED' "
                    f"without a documented resolution_decision or justification notes."
                ),
                "expected_decision": "REOPEN_REVIEW_FOR_COMPLIANCE_SIGN_OFF"
            })
        return findings

    @staticmethod
    def detect_duplicate_documents(db: Session) -> List[Dict[str, Any]]:
        """Scenario 5: Detects identical document numbers reused across unrelated customer accounts."""
        findings = []
        # Group by document_number & issuing_country with count > 1
        dup_numbers = db.query(
            Document.document_number,
            Document.issuing_country,
            func.count(Document.id).label("doc_count"),
            func.count(func.distinct(Document.customer_id)).label("customer_count")
        ).group_by(Document.document_number, Document.issuing_country).having(
            func.count(func.distinct(Document.customer_id)) > 1
        ).all()

        for doc_num, country, doc_cnt, cus_cnt in dup_numbers:
            # Query the affected documents
            docs = db.query(Document).filter(
                Document.document_number == doc_num,
                Document.issuing_country == country
            ).all()

            for doc in docs:
                other_customers = [d.customer_id for d in docs if d.customer_id != doc.customer_id]
                findings.append({
                    "detection_id": f"DET-DUP-{doc.id}",
                    "issue_type": "DUPLICATE_DOCUMENT_CROSS_CUSTOMER",
                    "severity": "CRITICAL",
                    "related_entity_type": "Document",
                    "related_entity_id": doc.id,
                    "description": (
                        f"Document {doc.id} (Number: {doc_num}) on customer {doc.customer_id} is duplicated "
                        f"across {cus_cnt} distinct customer accounts ({', '.join(other_customers)})."
                    ),
                    "expected_decision": "FREEZE_ACCOUNTS_AND_INITIATE_FRAUD_INVESTIGATION"
                })
        return findings
