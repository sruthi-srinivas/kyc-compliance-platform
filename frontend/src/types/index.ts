export interface Customer {
  id: string;
  customer_type_code: string;
  full_name: string;
  registration_number?: string;
  jurisdiction: string;
  industry_sector?: string;
  onboarding_status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  kyc_completeness: number;
  current_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
}

export interface CustomerType {
  code: string;
  name: string;
  description?: string;
  requires_ubo: boolean;
  created_at: string;
}

export interface KYCRequirement {
  id: string;
  customer_type_code: string;
  risk_level: string;
  document_type: string;
  is_mandatory: boolean;
  validity_period_days: number;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  customer_id: string;
  document_type: string;
  document_number: string;
  issuing_country: string;
  issuing_authority?: string;
  issue_date: string;
  expiry_date?: string;
  lifecycle_state: 'VALID' | 'EXPIRED' | 'SUPERSEDED' | 'REVOKED';
  created_at: string;
  updated_at: string;
}

export interface Verification {
  id: string;
  document_id: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  verified_by_actor: string;
  analyst_notes?: string;
  verified_at?: string;
  created_at: string;
}

export interface RiskRating {
  id: string;
  customer_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  review_interval_months: number;
  assessed_by: string;
  score_breakdown?: string;
  effective_date: string;
  is_current: boolean;
  created_at: string;
}

export interface ReviewCase {
  id: string;
  customer_id: string;
  review_type: 'PERIODIC' | 'TRIGGERED_EVENT' | 'REMEDIATION';
  status: 'SCHEDULED' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  assigned_reviewer?: string;
  scheduled_due_date: string;
  completed_date?: string;
  is_overdue: boolean;
  resolution_decision?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface BeneficialOwner {
  id: string;
  business_customer_id: string;
  owner_name: string;
  nationality: string;
  ownership_percentage: number;
  is_controlling_person: boolean;
  id_document_number?: string;
  created_at: string;
}

export interface AlertItem {
  id: string;
  customer_id: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  description: string;
  related_entity_type: string;
  related_entity_id: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  related_entity_type: string;
  related_entity_id: string;
  event_type: string;
  actor: string;
  previous_state?: string;
  new_state: string;
  event_details?: string;
  timestamp: string;
}

export interface DashboardMetrics {
  total_customers: number;
  individual_customers: number;
  business_customers: number;
  total_documents: number;
  verified_documents: number;
  pending_documents: number;
  expired_documents: number;
  expiring_soon_documents: number;
  total_review_cases: number;
  pending_reviews: number;
  overdue_reviews: number;
  resolved_reviews: number;
  active_alerts: number;
  risk_distribution: Record<string, number>;
  completeness_distribution: Record<string, number>;
}

export interface EvaluationMetrics {
  ground_truth_total: number;
  total_detected: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
  exception_detection_rate_pct: number;
}

export interface EvaluationResponse {
  summary: EvaluationMetrics;
  scenario_breakdown: Record<string, {
    injected_ground_truth_count: number;
    detected_count: number;
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    precision: number;
    recall: number;
  }>;
  detected_exceptions: Array<{
    detection_id: string;
    issue_type: string;
    severity: string;
    related_entity_type: string;
    related_entity_id: string;
    description: string;
    expected_decision: string;
  }>;
}

export interface ValidationCheck {
  check_id: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'FLAGGED_ANOMALY';
  details: string;
  is_expected_anomaly?: boolean;
}

export interface ValidationSummaryResponse {
  summary: {
    total_checks: number;
    passed_checks: number;
    flagged_checks: number;
    validation_passed: boolean;
    timestamp: string;
  };
  checks: ValidationCheck[];
}
