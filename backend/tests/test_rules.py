from datetime import date, timedelta
from backend.app.generator.rules import (
    calculate_kyc_completeness,
    calculate_risk_rating,
    calculate_review_due_date,
    evaluate_document_expiry_state,
)
from backend.app.generator.constants import EVALUATION_DATE

def test_kyc_completeness_calculation():
    """Verify deterministic completeness derivation."""
    # Individual needs GOVERNMENT_ID and PROOF_OF_ADDRESS
    submitted = [
        {"id": "DOC-1", "document_type": "GOVERNMENT_ID", "lifecycle_state": "VALID"},
        {"id": "DOC-2", "document_type": "PROOF_OF_ADDRESS", "lifecycle_state": "VALID"},
    ]
    verifications = {
        "DOC-1": {"status": "VERIFIED"},
        "DOC-2": {"status": "VERIFIED"},
    }
    score_full = calculate_kyc_completeness("INDIVIDUAL", "LOW", submitted, verifications)
    assert score_full == 100.0

    # If only 1 document is verified
    verifications_half = {
        "DOC-1": {"status": "VERIFIED"},
        "DOC-2": {"status": "PENDING_REVIEW"},
    }
    score_half = calculate_kyc_completeness("INDIVIDUAL", "LOW", submitted, verifications_half)
    assert score_half == 50.0

    # If document is expired, it cannot satisfy mandatory completeness
    submitted_expired = [
        {"id": "DOC-1", "document_type": "GOVERNMENT_ID", "lifecycle_state": "EXPIRED"},
        {"id": "DOC-2", "document_type": "PROOF_OF_ADDRESS", "lifecycle_state": "VALID"},
    ]
    score_exp = calculate_kyc_completeness("INDIVIDUAL", "LOW", submitted_expired, verifications)
    assert score_exp == 50.0

def test_risk_rating_scoring():
    """Verify multi-factor quantitative risk scoring formula and intervals."""
    # Standard low-risk individual
    score_low, level_low, interval_low, _ = calculate_risk_rating(
        customer_type_code="INDIVIDUAL",
        jurisdiction_code="US",
        industry_sector="TECHNOLOGY",
        past_alert_count=0
    )
    assert score_low < 40.0
    assert level_low == "LOW"
    assert interval_low == 36

    # High-risk corporate in elevated jurisdiction with alert history
    score_high, level_high, interval_high, _ = calculate_risk_rating(
        customer_type_code="BUSINESS_CORPORATE",
        jurisdiction_code="PA",  # Panama high risk
        industry_sector="CRYPTO_DIGITAL_ASSETS",  # 90 pts
        past_alert_count=2
    )
    assert score_high >= 70.0
    assert level_high == "HIGH"
    assert interval_high == 6

def test_document_expiry_states():
    """Verify document expiration categorization relative to evaluation anchor."""
    ref_date = EVALUATION_DATE
    past_date = ref_date - timedelta(days=10)
    soon_date = ref_date + timedelta(days=30)
    future_date = ref_date + timedelta(days=120)

    assert evaluate_document_expiry_state(past_date, ref_date) == "EXPIRED"
    assert evaluate_document_expiry_state(soon_date, ref_date) == "EXPIRING_SOON"
    assert evaluate_document_expiry_state(future_date, ref_date) == "ACTIVE"
    assert evaluate_document_expiry_state(None, ref_date) == "ACTIVE"

def test_review_due_date():
    """Verify review due date scheduling from interval."""
    start = date(2026, 1, 1)
    due_12m = calculate_review_due_date(start, 12)
    assert due_12m == date(2026, 1, 1) + timedelta(days=360)
