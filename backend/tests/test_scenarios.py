from backend.app.services import ExceptionDetectionEngine, EvaluationService
from backend.app.models import Customer, Document, BeneficialOwner, ReviewCase

def test_scenario_1_expired_doc_marked_valid(db):
    """Scenario 1: Detect document expired before anchor date but marked VALID."""
    findings = ExceptionDetectionEngine.detect_expired_valid_documents(db)
    assert len(findings) == 5
    for f in findings:
        assert f["issue_type"] == "EXPIRED_DOCUMENT_MARKED_VALID"
        doc = db.query(Document).filter(Document.id == f["related_entity_id"]).first()
        assert doc.lifecycle_state == "VALID"
        assert doc.expiry_date < date_eval()

def test_scenario_2_approved_without_mandatory_evidence(db):
    """Scenario 2: Detect customer approved while KYC completeness < 100%."""
    findings = ExceptionDetectionEngine.detect_approved_missing_evidence(db)
    assert len(findings) == 5
    for f in findings:
        assert f["issue_type"] == "APPROVED_WITHOUT_MANDATORY_KYC"
        cus = db.query(Customer).filter(Customer.id == f["related_entity_id"]).first()
        assert cus.onboarding_status == "APPROVED"
        assert cus.kyc_completeness < 100.0

def test_scenario_3_beneficial_ownership_exceeds_100(db):
    """Scenario 3: Detect business entities where UBO sum exceeds 100%."""
    findings = ExceptionDetectionEngine.detect_ubo_excess_ownership(db)
    assert len(findings) == 5
    for f in findings:
        assert f["issue_type"] == "UBO_PERCENTAGE_EXCEEDS_100"
        owners = db.query(BeneficialOwner).filter(BeneficialOwner.business_customer_id == f["related_entity_id"]).all()
        total_pct = sum(o.ownership_percentage for o in owners)
        assert total_pct > 100.0

def test_scenario_4_review_closed_without_resolution(db):
    """Scenario 4: Detect review case closed without recorded resolution decision."""
    findings = ExceptionDetectionEngine.detect_unresolved_review_closures(db)
    assert len(findings) == 5
    for f in findings:
        assert f["issue_type"] == "REVIEW_CLOSED_WITHOUT_RESOLUTION"
        rev = db.query(ReviewCase).filter(ReviewCase.id == f["related_entity_id"]).first()
        assert rev.status == "CLOSED"
        assert rev.resolution_decision is None or rev.resolution_decision == ""

def test_scenario_5_duplicate_document_cross_customer(db):
    """Scenario 5: Detect identical document number used across unrelated customers."""
    findings = ExceptionDetectionEngine.detect_duplicate_documents(db)
    assert len(findings) >= 5
    for f in findings:
        assert f["issue_type"] == "DUPLICATE_DOCUMENT_CROSS_CUSTOMER"

def test_ground_truth_isolation(db):
    """Verify application database tables do not contain ground truth classification columns."""
    for table in [Customer, Document, BeneficialOwner, ReviewCase]:
        columns = [c.name for c in table.__table__.columns]
        assert "ground_truth" not in columns
        assert "issue_type" not in columns
        assert "expected_classification" not in columns

def test_evaluation_benchmark_recall(db):
    """Verify independent detection engine achieves 100% recall against ground truth."""
    eval_res = EvaluationService.evaluate_model(db)
    summary = eval_res["summary"]
    assert summary["ground_truth_total"] == 25
    assert summary["true_positives"] == 25
    assert summary["false_negatives"] == 0
    assert summary["recall"] == 1.0
    assert summary["precision"] >= 0.80

def date_eval():
    from backend.app.generator.constants import EVALUATION_DATE
    return EVALUATION_DATE
