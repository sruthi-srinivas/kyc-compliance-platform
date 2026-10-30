# Source Code Manifest

This document indexes all source code files, modules, components, and scripts in the **KYC Onboarding Evidence, Validation and Compliance Monitoring Platform**.

---

## 1. Directory Tree Overview

```text
kyc-compliance-platform/
├── backend/
│   ├── app/
│   │   ├── generator/
│   │   │   ├── __init__.py            # Generator module exports
│   │   │   ├── constants.py           # Fixed seed 20261022, reference date 2026-10-22, presets, rules
│   │   │   ├── rules.py               # Deterministic business calculation rules
│   │   │   ├── generator.py           # 10-step sequential synthetic data generator
│   │   │   ├── exporter.py            # Multi-format exporter (CSV, JSON, SQL seed script)
│   │   │   └── loader.py              # Relational database loader
│   │   ├── models/
│   │   │   ├── __init__.py            # SQLAlchemy models registry
│   │   │   ├── customer.py            # Customer entity model (CUS-000001)
│   │   │   ├── customer_type.py       # CustomerType entity model
│   │   │   ├── kyc_requirement.py     # KYCRequirement entity model (KYC-2026-000001)
│   │   │   ├── document.py            # Document entity model (DOC-CUS-000001-001)
│   │   │   ├── verification.py        # Verification entity model (VER-DOC-...)
│   │   │   ├── risk_rating.py         # RiskRating entity model (RSK-CUS-...)
│   │   │   ├── review_case.py         # ReviewCase entity model (REV-CUS-000001-2026)
│   │   │   ├── beneficial_owner.py    # BeneficialOwner entity model (OWN-CUS-...)
│   │   │   ├── alert.py               # Alert entity model (ALT-2026-000001)
│   │   │   └── audit_event.py         # AuditEvent entity model (AUD-2026-000001)
│   │   ├── routes/
│   │   │   ├── __init__.py            # FastAPI APIRouter exports
│   │   │   ├── customers.py           # Customer CRUD and completeness endpoints
│   │   │   ├── documents.py           # Document evidence and verification endpoints
│   │   │   ├── compliance.py          # Governance, risk rating, UBO, and reviews endpoints
│   │   │   ├── alerts.py              # Expiry monitoring and alert management endpoints
│   │   │   ├── audit.py               # Immutable audit event ledger endpoints
│   │   │   └── analytics.py           # Dashboard KPIs, exception detection, evaluation, validation, repro
│   │   ├── schemas/
│   │   │   ├── __init__.py            # Pydantic schemas registry
│   │   │   ├── customer.py            # Customer request/response schemas
│   │   │   ├── customer_type.py       # CustomerType schemas
│   │   │   ├── kyc_requirement.py     # KYCRequirement schemas
│   │   │   ├── document.py            # Document schemas
│   │   │   ├── verification.py        # Verification schemas
│   │   │   ├── risk_rating.py         # RiskRating schemas
│   │   │   ├── review_case.py         # ReviewCase schemas
│   │   │   ├── beneficial_owner.py    # BeneficialOwner schemas
│   │   │   ├── alert.py               # Alert schemas
│   │   │   ├── audit_event.py         # AuditEvent schemas
│   │   │   └── metrics.py             # Dashboard, Evaluation, and Validation metrics schemas
│   │   ├── services/
│   │   │   ├── __init__.py            # Service layer exports
│   │   │   ├── audit_service.py       # Immutable audit event logger
│   │   │   ├── compliance_service.py  # Completeness, risk assessment, verification, reviews, expiry scanner
│   │   │   ├── detection_service.py   # Pure business-rule exception engine (zero ground truth leakage)
│   │   │   └── evaluation_service.py  # Ground truth benchmark engine (TP, FP, FN, TN, precision, recall)
│   │   ├── validators/
│   │   │   ├── __init__.py            # Validator exports
│   │   │   └── data_validator.py      # Automated 12-point data quality and referential integrity auditor
│   │   ├── config.py                  # Pydantic settings and environment configuration
│   │   ├── database.py                # SQLAlchemy engine, sessionmaker, and Base
│   │   └── main.py                    # FastAPI application, CORS, static SPA serving
│   ├── tests/
│   │   ├── conftest.py                # Pytest fixtures and in-memory test DB
│   │   ├── test_database.py           # Entity existence, PK uniqueness, FK referential integrity
│   │   ├── test_rules.py              # Completeness derivation, risk score, expiry states, review dates
│   │   ├── test_scenarios.py          # All 5 mandatory edge cases, ground truth isolation, recall check
│   │   ├── test_api.py                # REST API endpoints verification
│   │   └── test_reproducibility.py    # Fixed-seed bit-for-bit check and ID formatting
│   └── requirements.txt               # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Badge.tsx              # Color-coded status badge component
│   │   │   └── StatCard.tsx           # KPI stat card component with icons and trends
│   │   ├── layouts/
│   │   │   ├── Navbar.tsx             # Top bar with actor role switcher, data generation, refresh
│   │   │   └── Sidebar.tsx            # Left navigation with 13 compliance screens, seed badge
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx      # Screen 1: Overview KPIs, Recharts risk & completeness charts
│   │   │   ├── CustomersPage.tsx      # Screen 2: Filterable customer master directory
│   │   │   ├── CustomerDetailPage.tsx  # Screen 3: Full customer dossier, evidence list, risk factors, UBOs
│   │   │   ├── DocumentsPage.tsx      # Screen 4: Document evidence register and lifecycle states
│   │   │   ├── VerificationsPage.tsx  # Screen 5: Operations analyst verification review console
│   │   │   ├── KYCCompletenessPage.tsx# Screen 6: Regulatory requirement matrix and satisfaction formula
│   │   │   ├── RiskRatingsPage.tsx    # Screen 7: Risk governance, scoring breakdown, review SLAs
│   │   │   ├── BeneficialOwnersPage.tsx# Screen 8: UBO cap table and corporate reconciliation (>100% check)
│   │   │   ├── ReviewCasesPage.tsx    # Screen 9: Periodic review cases, overdue tracking, resolution modal
│   │   │   ├── ExpiryAlertsPage.tsx   # Screen 10: Document expiry monitoring console & scanner
│   │   │   ├── ExceptionsEvaluationPage.tsx # Screen 11: 5 mandatory scenarios, benchmark confusion matrix
│   │   │   ├── AuditEventsPage.tsx    # Screen 12: Immutable chronological audit trail
│   │   │   └── DataValidationPage.tsx # Screen 13: 12 automated checks & fixed-seed reproducibility test
│   │   ├── services/
│   │   │   └── api.ts                 # Axios REST API client for backend communication
│   │   ├── types/
│   │   │   └── index.ts               # Complete TypeScript interfaces for all entities & responses
│   │   ├── App.tsx                    # Main React application routing and state container
│   │   ├── index.css                  # Tailwind directives and dark corporate compliance theme
│   │   └── main.tsx                   # React root mount
│   ├── index.html                     # HTML5 entrypoint with Google Fonts
│   ├── package.json                   # Frontend npm dependencies
│   ├── postcss.config.js              # PostCSS configuration
│   ├── tailwind.config.js             # Tailwind CSS theme configuration
│   ├── tsconfig.json                  # TypeScript compiler configuration
│   └── vite.config.ts                 # Vite bundler and API proxy configuration
├── data/
│   ├── starter/                       # Starter dataset (200 customers, 500 docs, CSVs, JSONs, SQL)
│   ├── generated/                     # Full benchmark dataset (8,000 customers, 20,000 docs, CSVs, JSONs, SQL)
│   └── ground_truth/                  # Strictly isolated ground truth datasets (ground_truth.csv & .json)
├── docs/
│   ├── data_dictionary.md             # Complete data dictionary for all 10 core entities
│   ├── database_schema.md             # Mermaid ER diagram, cardinalities, constraints
│   ├── technical_decisions.md         # Architecture, design choices, stack justifications
│   ├── assumptions.md                 # Business rules, actor roles, edge cases, formula specs
│   ├── validation_summary.md          # 12-point automated data quality audit report
│   ├── testing_report.md              # Pytest execution report (22 test cases, 100% pass)
│   └── source_manifest.md             # This source code manifest
├── prompts/
│   └── AI_PROMPT_HISTORY.md           # Authentic log of all AI prompts and actions
├── scripts/
│   ├── generate_datasets.py           # CLI script to generate starter or full datasets
│   └── verify_reproducibility.py      # CLI script verifying bit-for-bit reproducibility
├── .env.example                       # Environment configuration template
├── .gitignore                         # Git ignore configuration
└── README.md                          # Master project documentation
```
