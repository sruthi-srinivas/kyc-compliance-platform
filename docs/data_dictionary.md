# Complete Data Dictionary: KYC Compliance Platform

This document describes all 10 core database entities, their field definitions, data types, constraints, and relational mappings.

---

## 1. Customer (`customers`)
Represents an individual or corporate account holder undergoing identity verification and compliance monitoring.

| Field Name | Data Type | Req/Opt | Allowed Values / Format | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(32) | Req | `CUS-000001` to `CUS-999999` | PK | Unique, immutable, zero-padded deterministic customer ID. |
| `customer_type_code` | VARCHAR(32) | Req | `INDIVIDUAL`, `BUSINESS_SME`, `BUSINESS_CORPORATE` | FK | References `customer_types.code`. |
| `full_name` | VARCHAR(255) | Req | Valid string | None | Legal personal name or registered corporate legal entity name. |
| `registration_number` | VARCHAR(64) | Opt | Alphanumeric (Tax ID / SSN / Company No) | None | Tax Identification or Corporate Registration Number. |
| `jurisdiction` | VARCHAR(3) | Req | ISO 3166-1 alpha-2 or alpha-3 (e.g., `US`, `GB`, `IN`, `DE`, `SG`) | None | Operating or citizenship country code. |
| `industry_sector` | VARCHAR(64) | Opt | `FINTECH`, `RETAIL`, `ENERGY`, `GAMBLING`, `REAL_ESTATE`, `CRYPTO`, etc. | None | Commercial sector for risk assessment. |
| `onboarding_status` | VARCHAR(32) | Req | `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED` | None | Lifecycle state of customer onboarding. |
| `kyc_completeness` | FLOAT | Req | `0.0` to `100.0` | None | Deterministically calculated percentage of satisfied mandatory KYC requirements. |
| `current_risk_level` | VARCHAR(16) | Req | `LOW`, `MEDIUM`, `HIGH` | None | Active risk tier derived from latest risk rating. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC timestamp | None | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Req | ISO 8601 UTC timestamp | None | Last modification timestamp. |

---

## 2. CustomerType (`customer_types`)
Defines regulatory customer classifications and default baseline compliance requirements.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `code` | VARCHAR(32) | Req | `INDIVIDUAL`, `BUSINESS_SME`, `BUSINESS_CORPORATE` | PK | Unique classification code. |
| `name` | VARCHAR(128) | Req | Text | None | Human-readable classification title. |
| `description` | TEXT | Opt | Text | None | Regulatory classification notes. |
| `requires_ubo` | BOOLEAN | Req | `TRUE`, `FALSE` | None | Flag indicating if entity mandates Beneficial Ownership declaration. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Timestamp when type was registered. |

---

## 3. KYCRequirement (`kyc_requirements`)
Specifies mandatory or optional evidence rules based on customer type and risk level.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(32) | Req | `KYC-2026-000001` to `KYC-2026-999999` | PK | Deterministic unique requirement ID. |
| `customer_type_code` | VARCHAR(32) | Req | Matches `customer_types.code` | FK | Customer category to which rule applies. |
| `risk_level` | VARCHAR(16) | Req | `ALL`, `LOW`, `MEDIUM`, `HIGH` | None | Risk sensitivity tier applying to rule. |
| `document_type` | VARCHAR(64) | Req | `PASSPORT`, `NATIONAL_ID`, `PROOF_OF_ADDRESS`, `CERT_INCORPORATION`, `ARTICLES_OF_ASSOC`, `PROOF_OF_WEALTH`, `UBO_DECLARATION` | None | Document category required. |
| `is_mandatory` | BOOLEAN | Req | `TRUE`, `FALSE` | None | Whether document is strictly required for approval. |
| `validity_period_days`| INTEGER | Req | Positive Integer (e.g., 365, 730, 1825) | None | Standard expected validity duration in days. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Rule creation timestamp. |

---

## 4. Document (`documents`)
Stores evidence items submitted by or on behalf of customers.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(32) | Req | `DOC-CUS-000001-001` | PK | Immutable zero-padded document identifier. |
| `customer_id` | VARCHAR(32) | Req | Valid `customers.id` | FK | Parent customer owning this evidence item. |
| `document_type` | VARCHAR(64) | Req | Defined document types | None | Document classification. |
| `document_number` | VARCHAR(128) | Req | Alphanumeric | None | Physical ID / certificate number. |
| `issuing_country` | VARCHAR(3) | Req | ISO country code | None | Country of issuance. |
| `issuing_authority`| VARCHAR(128) | Opt | Text | None | Government agency or institution. |
| `issue_date` | DATE | Req | Valid ISO date | None | Date document was legally issued. |
| `expiry_date` | DATE | Opt | Valid ISO date | None | Date document expires. If null, perpetual. |
| `lifecycle_state` | VARCHAR(32) | Req | `VALID`, `EXPIRED`, `SUPERSEDED`, `REVOKED` | None | Active lifecycle state. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Timestamp of ingestion. |
| `updated_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Timestamp of update. |

---

## 5. Verification (`verifications`)
Records human analyst or automated system verification checks performed on documents.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(64) | Req | `VER-DOC-CUS-000001-001` | PK | Deterministic verification check ID. |
| `document_id` | VARCHAR(32) | Req | Valid `documents.id` | FK | Document under verification (Unique 1-to-1 or latest 1-to-N). |
| `status` | VARCHAR(32) | Req | `PENDING_REVIEW`, `VERIFIED`, `REJECTED` | None | Operational verification decision. |
| `verified_by_actor`| VARCHAR(64) | Req | `OPERATIONS_ANALYST`, `SYSTEM_AUTOMATION` | None | Actor who executed verification. |
| `analyst_notes` | TEXT | Opt | String | None | Notes or justification for rejection. |
| `verified_at` | TIMESTAMP | Opt | ISO 8601 UTC | None | Timestamp when verification completed. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Creation timestamp. |

---

## 6. RiskRating (`risk_ratings`)
Maintains historical and current risk assessments and scores for customers.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(64) | Req | `RSK-CUS-000001-2026` | PK | Deterministic rating record identifier. |
| `customer_id` | VARCHAR(32) | Req | Valid `customers.id` | FK | Evaluated customer. |
| `risk_score` | FLOAT | Req | `0.0` to `100.0` | None | Derived quantitative score. |
| `risk_level` | VARCHAR(16) | Req | `LOW`, `MEDIUM`, `HIGH` | None | Derived categorical risk tier. |
| `review_interval_months`| INTEGER | Req | 6, 12, 36 | None | Scheduled interval between reviews. |
| `assessed_by` | VARCHAR(64) | Req | `RISK_REVIEWER`, `SYSTEM_ENGINE` | None | Actor recording the assessment. |
| `score_breakdown` | TEXT / JSON | Opt | JSON string | None | Component factors contributing to score. |
| `effective_date` | DATE | Req | ISO Date | None | Date rating becomes legally effective. |
| `is_current` | BOOLEAN | Req | `TRUE`, `FALSE` | None | Indicates if this is the active rating. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Timestamp of generation. |

---

## 7. ReviewCase (`review_cases`)
Tracks scheduled periodic reviews and event-driven trigger investigations.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(64) | Req | `REV-CUS-000001-2026` | PK | Deterministic review case ID. |
| `customer_id` | VARCHAR(32) | Req | Valid `customers.id` | FK | Customer subject to review. |
| `review_type` | VARCHAR(32) | Req | `PERIODIC`, `TRIGGERED_EVENT`, `REMEDIATION` | None | Trigger motivation. |
| `status` | VARCHAR(32) | Req | `SCHEDULED`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED` | None | Workflow state. |
| `assigned_reviewer`| VARCHAR(64) | Opt | Analyst identifier | None | Assigned compliance officer. |
| `scheduled_due_date`| DATE | Req | ISO Date | None | Deadline for review completion. |
| `completed_date` | DATE | Opt | ISO Date | None | Date review concluded. |
| `is_overdue` | BOOLEAN | Req | `TRUE`, `FALSE` | None | Derived flag: due date < current date & not resolved. |
| `resolution_decision`| VARCHAR(64) | Opt | `MAINTAIN_RATING`, `UPGRADE_RISK`, `DOWNGRADE_RISK`, `OFFBOARD` | None | Final recorded verdict. |
| `resolution_notes` | TEXT | Opt | String | None | Documented rationale. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Case opened timestamp. |

---

## 8. BeneficialOwner (`beneficial_owners`)
Captures Ultimate Beneficial Owners (UBOs) and controlling shareholders of corporate entities.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(64) | Req | `OWN-CUS-000001-001` | PK | Deterministic beneficial owner record ID. |
| `business_customer_id`| VARCHAR(32) | Req | Valid `customers.id` | FK | Corporate entity parent. |
| `owner_name` | VARCHAR(255) | Req | Legal person name | None | Full legal name of UBO. |
| `nationality` | VARCHAR(3) | Req | ISO country code | None | Citizenship of owner. |
| `ownership_percentage`| FLOAT | Req | `0.01` to `100.0` | None | Equity or voting percentage held. |
| `is_controlling_person`| BOOLEAN | Req | `TRUE`, `FALSE` | None | Flag indicating executive control. |
| `id_document_number`| VARCHAR(128) | Opt | Alphanumeric | None | Verified identity document number. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Creation timestamp. |

---

## 9. Alert (`alerts`)
Monitors compliance exceptions, approaching document expirations, and regulatory anomalies.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(32) | Req | `ALT-2026-000001` | PK | Deterministic zero-padded alert ID. |
| `customer_id` | VARCHAR(32) | Req | Valid `customers.id` | FK | Related customer. |
| `alert_type` | VARCHAR(64) | Req | `DOCUMENT_EXPIRED`, `EXPIRING_SOON`, `MISSING_EVIDENCE`, `UBO_OVER_100`, `UNRESOLVED_CLOSURE`, `DUPLICATE_DOCUMENT` | None | Regulatory classification of anomaly. |
| `severity` | VARCHAR(16) | Req | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | None | Priority tier for remediation. |
| `status` | VARCHAR(32) | Req | `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED` | None | Remediation status. |
| `description` | TEXT | Req | Detailed explanation | None | Human and machine-readable explanation of exception. |
| `related_entity_type`| VARCHAR(32) | Req | `Document`, `Customer`, `BeneficialOwner`, `ReviewCase` | None | Targeted entity class. |
| `related_entity_id`| VARCHAR(64) | Req | Related record ID | None | Target record identifier. |
| `created_at` | TIMESTAMP | Req | ISO 8601 UTC | None | Alert triggering timestamp. |

---

## 10. AuditEvent (`audit_events`)
Provides an immutable, tamper-evident audit log of all compliance state transitions, reviews, and decisions.

| Field Name | Data Type | Req/Opt | Allowed Values | PK/FK | Validation Rules & Descriptions |
|---|---|---|---|---|---|
| `id` | VARCHAR(64) | Req | `AUD-2026-000001` | PK | Deterministic audit event identifier. |
| `related_entity_type`| VARCHAR(32) | Req | `Customer`, `Document`, `Verification`, `ReviewCase`, `Alert`, `RiskRating` | None | Entity domain. |
| `related_entity_id`| VARCHAR(64) | Req | Entity identifier | None | Specific instance ID. |
| `event_type` | VARCHAR(64) | Req | `CUSTOMER_CREATED`, `DOCUMENT_UPLOADED`, `DOCUMENT_VERIFIED`, `RISK_RATED`, `REVIEW_SCHEDULED`, `REVIEW_RESOLVED`, `ALERT_RAISED` | None | Action category. |
| `actor` | VARCHAR(64) | Req | User or system actor | None | Actor who triggered event. |
| `previous_state` | TEXT / JSON | Opt | State value or JSON | None | State before transition. |
| `new_state` | TEXT / JSON | Req | State value or JSON | None | State after transition. |
| `event_details` | TEXT | Opt | Narrative explanation | None | Contextual metadata. |
| `timestamp` | TIMESTAMP | Req | ISO 8601 UTC | None | Exact immutable event timestamp. |
