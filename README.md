# KYC Onboarding Evidence, Validation and Compliance Monitoring Platform
### YottaFlex AI Recruitment Challenge

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.14-blue.svg?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Pytest](https://img.shields.io/badge/Pytest-22%20Passed-green.svg?logo=pytest&logoColor=white)](https://pytest.org)
[![Seed](https://img.shields.io/badge/Fixed%20Seed-20261022-emerald.svg)]()

A complete, working, production-grade application for tracking customer onboarding evidence, validating KYC completeness, managing periodic reviews, monitoring document expirations, and independently identifying compliance anomalies against ground truth.

---

## 1. System Architecture

```text
                    ┌─────────────────────────────────────────────────────────┐
                    │               React 18 + Vite Frontend                  │
                    │         (TypeScript, Tailwind CSS, Recharts)            │
                    │          13 Operational Compliance Screens              │
                    └────────────────────────────┬────────────────────────────┘
                                                 │ HTTP / JSON REST
                                                 ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                 FastAPI REST API Layer                  │
                    │          (Pydantic Schemas, Swagger Docs, CORS)         │
                    └───────────┬───────────────┬─────────────────┬───────────┘
                                │               │                 │
             ┌──────────────────┴──┐    ┌───────┴──────┐    ┌─────┴────────────────┐
             │  Detection Engine   │    │  Validation  │    │  Synthetic Generator │
             │ (Rule-Based Rules)  │    │  & Audit Svc │    │   (Seed: 20261022)   │
             └──────────────────┬──┘    └───────┬──────┘    └─────┬────────────────┘
                                │               │                 │
                                ▼               ▼                 ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │               SQLAlchemy 2.0 ORM Models                 │
                    │        10 Core Entities + Foreign Key Cascades          │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                    ┌────────────────────────────┴────────────────────────────┐
                    │               Database Persistence Layer                │
                    │       PostgreSQL (Primary) / SQLite (Zero-Dep Local)    │
                    └─────────────────────────────────────────────────────────┘
```

---

## 2. Core Entities & Deterministic ID Nomenclature

All 10 mandatory core entities are implemented with deterministic, zero-padded, immutable IDs:

| # | Entity | Table Name | Deterministic ID Format | Description |
|---|---|---|---|---|
| 1 | **Customer** | `customers` | `CUS-000001` | Individual and corporate customer accounts |
| 2 | **CustomerType** | `customer_types` | `INDIVIDUAL`, `BUSINESS_SME`, etc. | Classification codes defining regulatory rules |
| 3 | **KYCRequirement** | `kyc_requirements` | `KYC-2026-000001` | Rule matrix by customer type and risk tier |
| 4 | **Document** | `documents` | `DOC-CUS-000001-001` | Physical and digital evidence items |
| 5 | **Verification** | `verifications` | `VER-DOC-CUS-000001-001` | Analyst verification status & notes |
| 6 | **RiskRating** | `risk_ratings` | `RSK-CUS-000001-2026` | Quantitative risk scores ($0-100$) and tiers |
| 7 | **ReviewCase** | `review_cases` | `REV-CUS-000001-2026` | Scheduled periodic and triggered review cases |
| 8 | **BeneficialOwner**| `beneficial_owners`| `OWN-CUS-000001-001` | Ultimate Beneficial Owners ($\ge 25\%$ shares) |
| 9 | **Alert** | `alerts` | `ALT-2026-000001` | Expiry warnings and exception alerts |
| 10| **AuditEvent** | `audit_events` | `AUD-2026-000001` | Immutable, tamper-evident audit ledger |

---

## 3. Technology Stack

- **Backend**: Python 3.14, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn
- **Database**: PostgreSQL (target production) with SQLite local fallback support
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- **Data Engineering**: Pandas, NumPy, Faker, random module
- **Testing**: Pytest, Pytest-Asyncio, HTTPX
- **Version Control**: Git

---

## 4. Five Mandatory Edge Cases & Anomaly Scenarios

The platform deliberately injects and independently detects all 5 mandatory edge cases without leaking ground truth:

| Scenario | Issue Type | Injection Condition | Business Rule Detection |
|---|---|---|---|
| **Scenario 1** | `EXPIRED_DOCUMENT_MARKED_VALID` | `expiry_date < 2026-10-22` and `lifecycle_state == 'VALID'` | Detects inconsistency between expiration date and active validity |
| **Scenario 2** | `APPROVED_WITHOUT_MANDATORY_KYC` | `onboarding_status == 'APPROVED'` and `kyc_completeness < 100.0%` | Detects unauthorized approval missing mandatory evidence |
| **Scenario 3** | `UBO_PERCENTAGE_EXCEEDS_100` | $\sum \text{ownership\_percentage} > 100.0\%$ | Detects arithmetic cap table failure exceeding 100% |
| **Scenario 4** | `REVIEW_CLOSED_WITHOUT_RESOLUTION` | `status == 'CLOSED'` and `resolution_decision IS NULL` | Detects review closed without recorded compliance verdict |
| **Scenario 5** | `DUPLICATE_DOCUMENT_CROSS_CUSTOMER`| Shared `document_number` across unrelated customer accounts | Detects document duplication cross-contamination |

### Ground Truth Isolation Guarantee
- Ground truth labels are generated into `data/ground_truth/ground_truth.csv` and `ground_truth.json`.
- The application database tables and API ingestion pipelines **never store or ingest ground truth labels**.
- The business validation engine runs purely on relational records and business rules.
- Benchmark Evaluation achieves:
  - **Recall**: `1.0 (100.0%)`
  - **Precision**: `0.8108`
  - **F1-Score**: `0.8955`
  - **Exception Detection Rate**: `100.0%`

---

## 5. Quickstart & Installation

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/kyc-compliance-platform.git
cd kyc-compliance-platform
cp .env.example .env
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Run the Full Application
```bash
# Start FastAPI server (serves both API and unified React frontend)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open your browser at:
- **Application Web UI**: [http://localhost:8000](http://localhost:8000)
- **FastAPI Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)

*Note: For frontend hot-reloading during development, you can optionally run `npm run dev` in the `frontend` directory.*

---

## 6. Synthetic Data Generation

### Starter Dataset (200 Customers, 500 Documents)
```bash
python scripts/generate_datasets.py --preset starter --seed-db
```

### Full Benchmark Dataset (8,000 Customers, 20,000 Documents, 1,000 Businesses, 3,000 Reviews)
```bash
python scripts/generate_datasets.py --preset full --seed-db
```

Output files exported to:
- `data/generated/customers.csv`, `documents.csv`, `risk_ratings.csv`, etc.
- `data/generated/seed_data.sql` (12.9 MB full PostgreSQL seed script)
- `data/ground_truth/ground_truth.csv` and `ground_truth.json`

---

## 7. Fixed-Seed Reproducibility Demonstration

Demonstrate fixed-seed reproducibility using seed `20261022`:
```bash
python scripts/verify_reproducibility.py
```
**Verification Output:**
```text
============================================================
DEMONSTRATING FIXED-SEED REPRODUCIBILITY (Seed: 20261022)
============================================================
Run 1 SHA-256 Checksum: 22512306a36829310930772f90e87ad57b35a291a43af861329cb41604210384
Run 2 SHA-256 Checksum: 22512306a36829310930772f90e87ad57b35a291a43af861329cb41604210384
- SHA-256 Hash Match: True
- All Entity Counts Match: True
============================================================
VERIFICATION RESULT: SUCCESS (100% Bit-for-Bit Reproducibility)
============================================================
```

---

## 8. Automated Testing

Execute the automated test suite:
```bash
pytest backend/tests -v
```
All **22 automated tests** execute and pass:
- Database relationships & FK cascades
- Primary key uniqueness across all 10 entities
- Deterministic completeness calculations
- Risk rating score derivations
- Expiry date evaluation states
- All 5 mandatory edge cases
- Ground truth isolation guarantee
- REST API endpoint contracts
- Fixed-seed bit-for-bit reproducibility

---

## 9. 13 Functional Compliance Web Screens

1. **Overview / Metrics Dashboard**: Real-time KPI counters, Recharts risk distribution pie chart, completeness tier bar chart, and recent alert stream.
2. **Customer Records**: Filterable master directory with search, type filter, risk filter, status filter, and completeness progress bars.
3. **Customer Details**: Full dossier with submitted documents, live "Recalculate Completeness" action, "Re-assess Risk" action, UBO cap table, and review history.
4. **Document Records**: Complete inventory of identity and corporate evidence with lifecycle states and expiration warnings.
5. **Verification Status**: Operations Analyst console for reviewing evidence, approving/rejecting documents, and adding analyst notes.
6. **KYC Completeness**: Regulatory rules matrix defining mandatory documents across customer classifications and risk tiers.
7. **Risk Ratings**: Quantitative scoring factor breakdowns (classification, jurisdiction, sector, alert penalties) and SLA review intervals.
8. **Beneficial Ownership**: Corporate UBO cap table calculating total equity percentages and highlighting ownership failures (>100%).
9. **Review Cases**: Periodic review governance view with overdue SLA tags and resolution verdict workflows.
10. **Expiry Alerts**: Automated lead-time alert console for expired and expiring documents with acknowledge/resolve actions.
11. **Exception Records & Benchmark Evaluation**: Live independent exception detection results and empirical ground truth evaluation (TP, FP, TN, FN, Precision, Recall, F1).
12. **Audit Event History**: Immutable chronological audit ledger capturing actor actions, state transitions, and timestamps.
13. **Data Validation & Reproducibility**: Live 12-point automated data quality audit and cryptographic checksum reproducibility verification.

---

## 10. Supporting Documentation

- [Data Dictionary](docs/data_dictionary.md): Complete field-by-field dictionary for all 10 entities.
- [Database Schema](docs/database_schema.md): Relational ER diagram, cardinalities, cascades, and constraints.
- [Technical Decisions](docs/technical_decisions.md): Architecture, framework choices, and design rationale.
- [Assumptions & Business Rules](docs/assumptions.md): Actor roles, domain definitions, and formula specifications.
- [Validation Summary Report](docs/validation_summary.md): 12-point automated data quality audit results.
- [Testing Report](docs/testing_report.md): Pytest execution log and coverage summary.
- [Source Code Manifest](docs/source_manifest.md): Complete index of all codebase files.
- [AI Prompt History](prompts/AI_PROMPT_HISTORY.md): Verifiable record of all prompts submitted during development.

---

## 11. Final Acceptance Verification Checklist

- [x] All 10 required database entities implemented with deterministic IDs (`CUS-000001`, etc.)
- [x] Full dataset volume generated: 8,000 customers, 20,000 documents, 1,000 business entities, 3,000 review cases
- [x] Fixed random seed `20261022` with bit-for-bit reproducibility verified
- [x] All 5 mandatory edge cases injected and detected with 100% recall
- [x] Ground truth dataset strictly isolated (`data/ground_truth/`)
- [x] Reusable deterministic business logic for completeness, risk rating, UBO reconciliation, and expiry alerts
- [x] Multi-format exports: CSVs, JSONs, and PostgreSQL `seed_data.sql`
- [x] 12 automated data quality validation checks
- [x] Comprehensive Pytest automated test suite (22 tests passed)
- [x] Functional React 18 + TypeScript + Vite + Tailwind CSS + Recharts UI with all 13 compliance screens
- [x] Complete README and documentation suite ready for public GitHub submission
