# Automated Data Validation Summary Report

## 1. Executive Summary
- **Validation Run Timestamp**: 2026-10-30T17:11:00Z
- **Reference Evaluation Date**: `2026-10-22`
- **Total Automated Quality Checks**: 12
- **Passed Structural Integrity Checks**: 7 (100% of baseline constraints passed)
- **Flagged Deliberate Edge Cases**: 5 (100% of injected anomaly scenarios successfully detected and isolated)
- **Zero Silent Data Corruption**: Confirmed.

---

## 2. Detailed Results by Validation Check

| Check ID | Verification Rule | Target Entities | Result | Category | Traceability & Findings |
|---|---|---|---|---|---|
| **VAL-01** | Primary-Key Uniqueness | All 10 Entities | **PASSED** | Structural | 100% unique zero-padded primary keys (`CUS-...`, `DOC-...`, `REV-...`, etc.). Zero collisions. |
| **VAL-02** | Foreign-Key Referential Integrity | Documents, Verifications, Risks, Reviews, UBOs, Alerts | **PASSED** | Relational | Zero orphan records detected across all child tables. All foreign keys match valid parents. |
| **VAL-03** | Domain Enum Compliance | `Customer.onboarding_status`, `current_risk_level`, `Document.lifecycle_state` | **PASSED** | Semantic | All values conform to declared regulatory enums (`PENDING`, `APPROVED`, `LOW`, `VALID`, etc.). |
| **VAL-04** | Chronological Date Ordering | `Document.issue_date` vs `expiry_date` | **PASSED** | Temporal | All documents strictly maintain `issue_date <= expiry_date`. |
| **VAL-05** | Arithmetic Completeness Range | `Customer.kyc_completeness` | **PASSED** | Mathematical | All derived completeness percentages strictly reside in `[0.0%, 100.0%]`. |
| **VAL-06** | Beneficial Ownership Reconciliation | `BeneficialOwner` | **FLAGGED ANOMALY** | Scenario 3 | Detected business entities where declared UBO ownership totals exceed 100.0%. Matched injected Scenario 3 ground truth. |
| **VAL-07** | Document Expiry Lifecycle Consistency | `Document` | **FLAGGED ANOMALY** | Scenario 1 | Detected documents expired before evaluation date `2026-10-22` but retaining `lifecycle_state == 'VALID'`. Matched injected Scenario 1. |
| **VAL-08** | Document Duplication Detection | `Document` | **FLAGGED ANOMALY** | Scenario 5 | Detected identical `document_number` and issuing authority reused across unrelated customers. Matched injected Scenario 5. |
| **VAL-09** | Customer-Document Relational Consistency | `Customer` & `Document` | **PASSED** | Relational | Every document links to a registered active customer entity. |
| **VAL-10** | Review Case Resolution Governance | `ReviewCase` | **FLAGGED ANOMALY** | Scenario 4 | Detected review cases marked `CLOSED` without recorded `resolution_decision`. Matched injected Scenario 4. |
| **VAL-11** | Mandatory KYC Evidence Enforcement | `Customer` & `KYCRequirement` | **FLAGGED ANOMALY** | Scenario 2 | Detected customers approved while `kyc_completeness < 100.0%`. Matched injected Scenario 2. |
| **VAL-12** | Audit Trail & Event Ledger Completeness | `AuditEvent` & `Alert` | **PASSED** | Compliance | Full immutable audit trail retained for customer creation, document verifications, reviews, and alerts. |

---

## 3. Anomaly Isolation and Ground Truth Separation Verification

- Injected anomalies did **not** corrupt unrelated database records.
- Ground truth labels (`data/ground_truth/ground_truth.json`) are stored strictly outside the application schema.
- Exception detection engine operates purely using business logic rules on active entities.
- Evaluation against ground truth yields **Recall = 1.0 (100%)** and **F1-score = 0.9091**.
