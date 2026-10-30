# Technical Architecture and Design Decisions

## 1. System Architecture Overview

The KYC Onboarding Evidence, Validation and Compliance Monitoring Platform adopts a modular, decoupled architecture adhering to Clean Architecture principles.

```
                    ┌──────────────────────────────────────────────┐
                    │               React + Vite UI                │
                    │      (TypeScript, Tailwind CSS, Recharts)    │
                    │        13 Operational Compliance Screens     │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP / JSON REST
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            FastAPI REST API Layer            │
                    │     (Pydantic Schemas, CORS, Swagger UI)     │
                    └──────┬───────────────┬───────────────┬───────┘
                           │               │               │
        ┌──────────────────┴──┐    ┌───────┴──────┐    ┌───┴──────────────────┐
        │  Detection Engine   │    │  Validation  │    │  Synthetic Generator │
        │ (Rule-Based Rules)  │    │  & Audit Svc │    │  (Seed 20261022)     │
        └──────────────────┬──┘    └───────┬──────┘    └───┬──────────────────┘
                           │               │               │
                           ▼               ▼               ▼
                    ┌──────────────────────────────────────────────┐
                    │         SQLAlchemy 2.0 ORM & Models          │
                    │    10 Core Entities + Bridge Associations    │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │          PostgreSQL / SQLite Storage         │
                    │  (PostgreSQL Primary, SQLite Local Fallback) │
                    └──────────────────────────────────────────────┘
```

---

## 2. Technical Stack Justifications

### 2.1 Backend: Python 3.14 + FastAPI + Pydantic v2 + SQLAlchemy 2.0
- **FastAPI**: High-throughput asynchronous HTTP handling with automatic OpenAPI / Swagger documentation (`/docs`).
- **Pydantic v2**: Strict deterministic schema validation with fast Rust-based core parsing.
- **SQLAlchemy 2.0**: Unified Declarative Base with type-hinted mapped columns (`Mapped[...]`, `mapped_column(...)`), transactional session management, and database engine portability.

### 2.2 Database: PostgreSQL & Dialect-Agnostic SQLAlchemy Implementation
- **Requirement**: PostgreSQL is specified as the target production database.
- **Decision**: All models use ANSI-SQL compatible types (`String`, `Integer`, `Float`, `DateTime`, `Boolean`, `Text`, `ForeignKey`) with explicit foreign key cascades and relational integrity checks.
- **Portability Benefit**: The system runs against PostgreSQL via `DATABASE_URL=postgresql://...` while also supporting `sqlite:///./kyc_compliance.db` for zero-dependency local test execution without requiring an external database daemon to be installed on developer machines.
- **SQL Seed Export**: In addition to database execution, a full standalone PostgreSQL DDL and INSERT script (`seed_data.sql`) is generated.

### 2.3 Data Engineering: Pandas, NumPy, and Faker with Fixed Seed
- **Reproducibility Guarantee**: Fixed random seed `20261022` passed explicitly to Python's `random.seed()`, `np.random.seed()`, and `Faker.seed_instance()`.
- **Deterministic ID Sequence**: IDs are generated sequentially (`CUS-000001`, `KYC-2026-000001`, `DOC-CUS-000001-001`, `REV-CUS-000001-2026`, `ALT-2026-000001`), ensuring that multiple runs with identical seed produce identical byte-for-byte datasets.
- **Scale Configurations**:
  - `starter`: 200 customers, 500 documents, 25 businesses, 75 review cases (rapid development & test execution).
  - `full`: 8,000 customers, 20,000 documents, 1,000 businesses, 3,000 review cases (mandatory challenge benchmark).

### 2.4 Anomaly Detection & Ground Truth Separation
- **No Data Leakage**: Ground truth labels (`issue_type`, `expected_classification`, `expected_decision`) are stored exclusively in `data/ground_truth/ground_truth.csv` and `data/ground_truth/ground_truth.json`.
- **Independent Business Engine**: The exception detection engine queries only active database entities (`customers`, `documents`, `verifications`, `beneficial_owners`, `review_cases`) and applies pure deterministic logic to discover discrepancies.
- **Evaluation Engine**: Evaluates the detection output against the ground truth labels to compute empirical confusion matrix metrics:
  $$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}, \quad F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

### 2.5 Frontend: Vite + React 18 + TypeScript + Tailwind CSS + Recharts
- **Design System**: Tailored dark-mode / slate corporate compliance palette with subtle glassmorphism and clear visual hierarchy.
- **Live Integration**: Every chart, table, and metric card is wired to live FastAPI endpoints backed by database queries.
- **Responsiveness**: Modular navigation bar and sidebar supporting all 13 required compliance screens.
