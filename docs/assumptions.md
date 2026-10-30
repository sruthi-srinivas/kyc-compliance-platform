# Project Assumptions and Business Rules

## 1. Overview
This document specifies the foundational assumptions, domain rules, actor responsibilities, and operational conventions implemented in the **KYC Onboarding Evidence, Validation and Compliance Monitoring Platform** for the YottaFlex AI Recruitment Challenge.

---

## 2. Primary Actors and Operational Responsibilities

| Actor | Primary Responsibilities | Lifecycle Actions |
|---|---|---|
| **Customer / Account Holder** | Submits onboarding identity details, company information, and verification documents. | Registers, submits documents, responds to requests for refreshed evidence. |
| **Operations Analyst** | Performs primary intake, verifies submitted identity evidence against issuing standards, flags anomalies. | Verifies documents (`VERIFIED`, `REJECTED`), checks completeness, escalates discrepancies. |
| **Risk / Compliance Reviewer** | Performs periodic reviews, calculates and adjusts risk ratings, investigates alerts and exception records. | Initiates review cases, records risk decisions (`LOW`, `MEDIUM`, `HIGH`), resolves or closes cases. |
| **System Administrator** | Manages system-wide KYC requirement policies, triggers synthetic batch runs, monitors audit event streams. | Configures requirement thresholds, triggers validation suites, exports compliance evidence. |

---

## 3. Core Domain Entities & ID Conventions

The platform strictly implements all ten mandatory entities with deterministic, zero-padded, immutable IDs:

1. **Customer** (`Customer`): Format `CUS-000001` to `CUS-008000`. Types: `INDIVIDUAL` or `BUSINESS`.
2. **CustomerType** (`CustomerType`): Master definitions (`INDIVIDUAL`, `BUSINESS_SME`, `BUSINESS_CORPORATE`).
3. **KYCRequirement** (`KYCRequirement`): Format `KYC-2026-000001`. Defines document types required based on customer type and risk level.
4. **Document** (`Document`): Format `DOC-CUS-000001-001`. Represents physical/digital evidence (e.g., Passport, Certificate of Incorporation).
5. **Verification** (`Verification`): Format `VER-DOC-CUS-000001-001`. Records analyst verification status (`VERIFIED`, `REJECTED`, `PENDING_REVIEW`).
6. **RiskRating** (`RiskRating`): Format `RSK-CUS-000001-2026`. Captures quantitative score (`0.0 - 100.0`) and qualitative band (`LOW`, `MEDIUM`, `HIGH`).
7. **ReviewCase** (`ReviewCase`): Format `REV-CUS-000001-2026`. Scheduled or triggered compliance reviews with lifecycle (`SCHEDULED`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED_UNRESOLVED`).
8. **BeneficialOwner** (`BeneficialOwner`): Format `OWN-CUS-000001-001`. Ultimate Beneficial Owners (UBO) for business entities with shareholding percentage (`0.0 - 100.0%`).
9. **Alert** (`Alert`): Format `ALT-2026-000001`. System notifications for expirations, missing documents, or policy exceptions.
10. **AuditEvent** (`AuditEvent`): Format `AUD-2026-000001`. Immutable tamper-evident audit trail capturing actor, entity, event type, previous state, and new state.

---

## 4. KYC Completeness Calculation Rules

KYC Completeness is **never randomly generated**. It is deterministically derived as:

$$\text{KYC Completeness (\%)} = \left( \frac{\text{Count of Valid, Verified Mandatory Requirements Submitted}}{\text{Total Count of Applicable Mandatory Requirements}} \right) \times 100$$

### Applicable Mandatory Requirements Matrix:
- **Individual - Low Risk**:
  - Government ID / Passport (Proof of Identity)
  - Proof of Address (Utility Bill or Bank Statement <= 90 days)
- **Individual - Medium / High Risk**:
  - Government ID / Passport
  - Proof of Address
  - Proof of Source of Wealth / Funds
- **Business - All Levels**:
  - Certificate of Incorporation
  - Memorandum & Articles of Association
  - Proof of Registered Business Address
  - Beneficial Ownership Declaration (UBO identifying all owners >= 25%)
  - Directors / Signatories Identity Documents

A document only satisfies a requirement if:
1. It is linked to the customer.
2. Its lifecycle state is `VALID` (not expired).
3. Its verification status is `VERIFIED`.

---

## 5. Risk Rating Scoring Rules

Risk scores ($0 - 100$) are calculated using a weighted multi-factor rule engine:
- **Customer Type Factor (Base 20%)**: Individual = 10 pts, SME = 20 pts, High-volume Corporate = 30 pts.
- **Jurisdiction / Country Risk (Weight 25%)**: FATF high-risk jurisdictions = 80-100 pts, Standard = 20 pts.
- **Industry Sector Risk (Weight 25%)**: Gambling/Crypto/Precious Metals = 75-90 pts, Retail/Tech/Manufacturing = 20-30 pts.
- **Negative Screening & Alert History (Weight 30%)**: Past suspicious alerts = +25 pts each.

### Risk Tier Categorization:
- **Low Risk**: Score $0.0 \le S < 40.0$ $\rightarrow$ Periodic review interval: **36 months** (3 years).
- **Medium Risk**: Score $40.0 \le S < 70.0$ $\rightarrow$ Periodic review interval: **12 months** (1 year).
- **High Risk**: Score $70.0 \le S \le 100.0$ $\rightarrow$ Periodic review interval: **6 months**.

---

## 6. Beneficial Ownership (UBO) Rules

1. Applicable only to `BUSINESS` customers.
2. Any natural person owning $\ge 25\%$ voting rights or shares must be recorded as a UBO.
3. **Reconciliation Law**: Total accounted ownership percentage across all declared owners should logically equal $100\%$ (or explain remaining non-controlling public float).
4. **Anomaly Condition**: If declared total percentage exceeds $100.0\%$, the system detects an arithmetic contradiction.

---

## 7. Document Expiry and Alert Rules

- Reference Evaluation Date: `2026-10-22` (fixed baseline anchor aligned with seed).
- Expiry states:
  - **EXPIRED**: Document `expiry_date` $<$ Reference Date.
  - **EXPIRING_SOON**: Document `expiry_date` between Reference Date and Reference Date $+ 60$ days.
  - **ACTIVE**: Document `expiry_date` $>$ Reference Date $+ 60$ days.
- Lead time alert generation:
  - Alert triggered with severity `HIGH` if expired and customer is `ACTIVE`.
  - Alert triggered with severity `MEDIUM` if expiring within 60 days.

---

## 8. Five Mandatory Edge Cases & Anomaly Scenarios

The platform deliberately injects and identifies 5 specific, labelled negative scenarios:

1. **Scenario 1: Document Expired But Marked Valid**
   - *Condition*: `Document.expiry_date < 2026-10-22` but `Document.lifecycle_state == 'VALID'`.
   - *Expected Detection*: Inconsistency detected between document expiration date and validity status.
2. **Scenario 2: Customer Approved with Missing Mandatory Evidence**
   - *Condition*: `Customer.onboarding_status == 'APPROVED'` while `Customer.kyc_completeness < 100.0%`.
   - *Expected Detection*: Approval conflict with applicable mandatory KYC requirements.
3. **Scenario 3: Beneficial Ownership Exceeds 100%**
   - *Condition*: $\sum \text{BeneficialOwner.ownership\_percentage} > 100.0\%$.
   - *Expected Detection*: Ownership reconciliation arithmetic failure detected.
4. **Scenario 4: Review Case Closed Without Resolution**
   - *Condition*: `ReviewCase.status == 'CLOSED'` while `ReviewCase.resolution_decision IS NULL` or `resolution_notes IS NULL`.
   - *Expected Detection*: Invalid review closure without documented compliance resolution.
5. **Scenario 5: Duplicate Document Used Across Unrelated Customers**
   - *Condition*: Exact same `document_number` / issuing authority used across distinct `Customer` records with different tax IDs and no group affiliation.
   - *Expected Detection*: Identity document duplication cross-contamination alert.

---

## 9. Ground Truth Isolation Guarantee

To preserve benchmark integrity:
- Ground-truth anomaly labels (`issue_type`, `expected_classification`, `expected_decision`) are generated into `data/ground_truth/ground_truth.csv` and `data/ground_truth/ground_truth.json`.
- The application database tables and API ingestion pipelines **never store or ingest the ground truth classification column**.
- The business validation engine runs purely on relational records and business rules.
- The evaluation service compares the independent detection engine output against the isolated ground truth dataset to calculate actual True Positives, False Positives, False Negatives, True Negatives, Precision, Recall, and F1-score.
