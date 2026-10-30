"""Deterministic business logic and calculation rules."""

from datetime import date, timedelta
from typing import List, Dict, Tuple, Any
from backend.app.generator.constants import JURISDICTIONS, SECTORS, KYC_REQUIREMENTS_DEF, EVALUATION_DATE

def get_applicable_mandatory_requirements(customer_type_code: str, risk_level: str) -> List[Dict[str, Any]]:
    """Return applicable mandatory requirements for a given customer type and risk level."""
    applicable = []
    for req in KYC_REQUIREMENTS_DEF:
        if req["customer_type_code"] == customer_type_code and req["is_mandatory"]:
            if req["risk_level"] in ("ALL", risk_level):
                applicable.append(req)
    return applicable

def calculate_kyc_completeness(
    customer_type_code: str,
    risk_level: str,
    submitted_docs: List[Dict[str, Any]],
    verifications_by_doc_id: Dict[str, Dict[str, Any]]
) -> float:
    """
    Deterministically derive KYC Completeness Percentage:
    (count of verified & valid mandatory requirements satisfied / total applicable mandatory requirements) * 100.
    """
    applicable = get_applicable_mandatory_requirements(customer_type_code, risk_level)
    if not applicable:
        return 100.0

    satisfied_doc_types = set()
    for doc in submitted_docs:
        doc_id = doc["id"]
        doc_type = doc["document_type"]
        is_valid = doc["lifecycle_state"] == "VALID"
        
        # Check verification status
        ver = verifications_by_doc_id.get(doc_id)
        is_verified = (ver is not None and ver.get("status") == "VERIFIED")
        
        if is_valid and is_verified:
            satisfied_doc_types.add(doc_type)

    satisfied_count = sum(1 for req in applicable if req["document_type"] in satisfied_doc_types)
    completeness = (satisfied_count / len(applicable)) * 100.0
    return round(completeness, 1)

def calculate_risk_rating(
    customer_type_code: str,
    jurisdiction_code: str,
    industry_sector: str,
    past_alert_count: int = 0
) -> Tuple[float, str, int, Dict[str, Any]]:
    """
    Derives deterministic risk score (0-100), categorical risk level, review interval, and breakdown.
    """
    # 1. Base Type Factor
    type_scores = {
        "INDIVIDUAL": 15.0,
        "BUSINESS_SME": 30.0,
        "BUSINESS_CORPORATE": 45.0
    }
    type_score = type_scores.get(customer_type_code, 20.0)

    # 2. Jurisdiction Risk
    jurisdiction_lookup = {j["code"]: j["risk_weight"] for j in JURISDICTIONS}
    country_risk = float(jurisdiction_lookup.get(jurisdiction_code, 20))

    # 3. Industry Sector Risk
    sector_lookup = {s["name"]: s["risk_weight"] for s in SECTORS}
    sector_risk = float(sector_lookup.get(industry_sector, 20.0))

    # 4. Alert Penalty
    alert_penalty = min(float(past_alert_count * 15.0), 30.0)

    # Composite weighted score
    raw_score = (0.20 * type_score) + (0.30 * country_risk) + (0.35 * sector_risk) + (0.15 * (alert_penalty / 30.0 * 100.0))
    final_score = round(max(5.0, min(98.0, raw_score)), 1)

    if final_score < 40.0:
        risk_level = "LOW"
        review_interval_months = 36
    elif final_score < 70.0:
        risk_level = "MEDIUM"
        review_interval_months = 12
    else:
        risk_level = "HIGH"
        review_interval_months = 6

    breakdown = {
        "customer_type_factor": type_score,
        "jurisdiction_risk": country_risk,
        "sector_risk": sector_risk,
        "alert_penalty": alert_penalty,
        "composite_score": final_score
    }

    return final_score, risk_level, review_interval_months, breakdown

def calculate_review_due_date(start_date: date, interval_months: int) -> date:
    """Calculates scheduled due date from start date and month interval."""
    # Approximate month addition: 30 days per month
    return start_date + timedelta(days=interval_months * 30)

def evaluate_document_expiry_state(expiry_date: date, ref_date: date = EVALUATION_DATE) -> str:
    """Returns ACTIVE, EXPIRING_SOON, or EXPIRED based on reference date."""
    if expiry_date is None:
        return "ACTIVE"
    if expiry_date < ref_date:
        return "EXPIRED"
    elif expiry_date <= ref_date + timedelta(days=60):
        return "EXPIRING_SOON"
    return "ACTIVE"
