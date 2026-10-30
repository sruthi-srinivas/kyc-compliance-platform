from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class DashboardMetrics(BaseModel):
    total_customers: int
    individual_customers: int
    business_customers: int
    total_documents: int
    verified_documents: int
    pending_documents: int
    expired_documents: int
    expiring_soon_documents: int
    total_review_cases: int
    pending_reviews: int
    overdue_reviews: int
    resolved_reviews: int
    active_alerts: int
    risk_distribution: Dict[str, int]
    completeness_distribution: Dict[str, int]

class EvaluationSummaryMetrics(BaseModel):
    ground_truth_total: int
    total_detected: int
    true_positives: int
    false_positives: int
    false_negatives: int
    true_negatives: int
    precision: float
    recall: float
    f1_score: float
    exception_detection_rate_pct: float

class EvaluationResponse(BaseModel):
    summary: EvaluationSummaryMetrics
    scenario_breakdown: Dict[str, Any]
    detected_exceptions: List[Dict[str, Any]]
