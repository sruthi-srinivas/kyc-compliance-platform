# Database Schema Documentation: KYC Compliance Platform

## 1. Entity-Relationship Overview

The platform implements 10 core entities with strict relational integrity, foreign key constraints, and cascade policies.

```mermaid
erDiagram
    CustomerType ||--o{ Customer : classifies
    CustomerType ||--o{ KYCRequirement : configures
    Customer ||--o{ Document : owns
    Customer ||--o{ RiskRating : evaluated_in
    Customer ||--o{ ReviewCase : subject_of
    Customer ||--o{ BeneficialOwner : controlled_by
    Customer ||--o{ Alert : flags
    Document ||--o| Verification : verified_by
    Customer ||--o{ AuditEvent : logged_for
    Document ||--o{ AuditEvent : logged_for
    ReviewCase ||--o{ AuditEvent : logged_for

    Customer {
        string id PK "CUS-000001"
        string customer_type_code FK
        string full_name
        string registration_number
        string jurisdiction
        string industry_sector
        string onboarding_status
        float kyc_completeness
        string current_risk_level
        datetime created_at
        datetime updated_at
    }

    CustomerType {
        string code PK "INDIVIDUAL, BUSINESS_SME, etc."
        string name
        string description
        boolean requires_ubo
        datetime created_at
    }

    KYCRequirement {
        string id PK "KYC-2026-000001"
        string customer_type_code FK
        string risk_level
        string document_type
        boolean is_mandatory
        int validity_period_days
        datetime created_at
    }

    Document {
        string id PK "DOC-CUS-000001-001"
        string customer_id FK
        string document_type
        string document_number
        string issuing_country
        string issuing_authority
        date issue_date
        date expiry_date
        string lifecycle_state
        datetime created_at
        datetime updated_at
    }

    Verification {
        string id PK "VER-DOC-CUS-000001-001"
        string document_id FK
        string status
        string verified_by_actor
        text analyst_notes
        datetime verified_at
        datetime created_at
    }

    RiskRating {
        string id PK "RSK-CUS-000001-2026"
        string customer_id FK
        float risk_score
        string risk_level
        int review_interval_months
        string assessed_by
        text score_breakdown
        date effective_date
        boolean is_current
        datetime created_at
    }

    ReviewCase {
        string id PK "REV-CUS-000001-2026"
        string customer_id FK
        string review_type
        string status
        string assigned_reviewer
        date scheduled_due_date
        date completed_date
        boolean is_overdue
        string resolution_decision
        text resolution_notes
        datetime created_at
    }

    BeneficialOwner {
        string id PK "OWN-CUS-000001-001"
        string business_customer_id FK
        string owner_name
        string nationality
        float ownership_percentage
        boolean is_controlling_person
        string id_document_number
        datetime created_at
    }

    Alert {
        string id PK "ALT-2026-000001"
        string customer_id FK
        string alert_type
        string severity
        string status
        text description
        string related_entity_type
        string related_entity_id
        datetime created_at
    }

    AuditEvent {
        string id PK "AUD-2026-000001"
        string related_entity_type
        string related_entity_id
        string event_type
        string actor
        text previous_state
        text new_state
        text event_details
        datetime timestamp
    }
```

---

## 2. Cardinality and Relationship Details

| Relationship | Cardinality | Parent Entity | Child Entity | Foreign Key | Cascade Rule | Business Meaning |
|---|---|---|---|---|---|---|
| Customer Classification | 1 : N | `CustomerType` | `Customer` | `customer_type_code` | RESTRICT | A customer must belong to an existing customer type. |
| Compliance Rules | 1 : N | `CustomerType` | `KYCRequirement` | `customer_type_code` | CASCADE | Customer types dictate mandatory/optional requirements. |
| Customer Evidence | 1 : N | `Customer` | `Document` | `customer_id` | CASCADE | A customer may upload multiple documents across their lifecycle. |
| Document Verification | 1 : 1 (or 1 : N audit) | `Document` | `Verification` | `document_id` | CASCADE | Each document undergoes operational verification checks. |
| Risk Rating History | 1 : N | `Customer` | `RiskRating` | `customer_id` | CASCADE | Multiple historical ratings; one active `is_current = TRUE`. |
| Review Governance | 1 : N | `Customer` | `ReviewCase` | `customer_id` | CASCADE | Periodic and event-triggered review instances. |
| Beneficial Ownership | 1 : N | `Customer` | `BeneficialOwner` | `business_customer_id` | CASCADE | Corporate customers link to natural person owners. |
| Operational Alerts | 1 : N | `Customer` | `Alert` | `customer_id` | CASCADE | System flags non-compliance, expiry, and discrepancies. |
| Audit Trail | 1 : N (Polymorphic) | Any Entity | `AuditEvent` | `related_entity_id` | SET NULL / RETAIN | Complete immutable historical ledger. |

---

## 3. Referential Integrity and Constraints

1. **Deterministic Primary Keys**: Enforced via `PRIMARY KEY` constraint on all tables.
2. **Foreign Key Integrity**: All foreign keys reference valid parent records; index created on all FK columns for fast join performance.
3. **Check Constraints**:
   - `kyc_completeness BETWEEN 0.0 AND 100.0`
   - `risk_score BETWEEN 0.0 AND 100.0`
   - `ownership_percentage > 0.0`
4. **Historical Immutability**:
   - `AuditEvent` records are write-only (never updated or deleted).
   - Old `RiskRating` records retain `is_current = FALSE` upon risk reassessment.
