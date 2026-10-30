"""Constants and rule matrices for KYC data generation."""

from datetime import date

EVALUATION_DATE = date(2026, 10, 22)
FIXED_SEED = 20261022

# Preset volumes
PRESET_VOLUMES = {
    "starter": {
        "num_customers": 200,
        "num_businesses": 25,
        "num_documents": 500,
        "num_reviews": 75,
        "num_anomalies_per_type": 5,
    },
    "full": {
        "num_customers": 8000,
        "num_businesses": 1000,
        "num_documents": 20000,
        "num_reviews": 3000,
        "num_anomalies_per_type": 30,
    }
}

CUSTOMER_TYPES = [
    {
        "code": "INDIVIDUAL",
        "name": "Natural Person / Individual",
        "description": "Standard retail individual account holder subject to CDD requirements",
        "requires_ubo": False
    },
    {
        "code": "BUSINESS_SME",
        "name": "Small & Medium Enterprise",
        "description": "Commercial business entity requiring corporate registry and UBO identification",
        "requires_ubo": True
    },
    {
        "code": "BUSINESS_CORPORATE",
        "name": "Large Corporate Entity",
        "description": "Multinational or high-tier corporate customer requiring enhanced UBO and source of funds",
        "requires_ubo": True
    }
]

# Baseline KYC Requirements
KYC_REQUIREMENTS_DEF = [
    # Individual Requirements
    {"id": "KYC-2026-000001", "customer_type_code": "INDIVIDUAL", "risk_level": "ALL", "document_type": "GOVERNMENT_ID", "is_mandatory": True, "validity_period_days": 1825},
    {"id": "KYC-2026-000002", "customer_type_code": "INDIVIDUAL", "risk_level": "ALL", "document_type": "PROOF_OF_ADDRESS", "is_mandatory": True, "validity_period_days": 365},
    {"id": "KYC-2026-000003", "customer_type_code": "INDIVIDUAL", "risk_level": "HIGH", "document_type": "PROOF_OF_WEALTH", "is_mandatory": True, "validity_period_days": 730},
    {"id": "KYC-2026-000004", "customer_type_code": "INDIVIDUAL", "risk_level": "LOW", "document_type": "TAX_DECLARATION", "is_mandatory": False, "validity_period_days": 365},
    
    # Business SME Requirements
    {"id": "KYC-2026-000005", "customer_type_code": "BUSINESS_SME", "risk_level": "ALL", "document_type": "CERT_INCORPORATION", "is_mandatory": True, "validity_period_days": 3650},
    {"id": "KYC-2026-000006", "customer_type_code": "BUSINESS_SME", "risk_level": "ALL", "document_type": "ARTICLES_OF_ASSOC", "is_mandatory": True, "validity_period_days": 3650},
    {"id": "KYC-2026-000007", "customer_type_code": "BUSINESS_SME", "risk_level": "ALL", "document_type": "PROOF_OF_ADDRESS", "is_mandatory": True, "validity_period_days": 365},
    {"id": "KYC-2026-000008", "customer_type_code": "BUSINESS_SME", "risk_level": "ALL", "document_type": "UBO_DECLARATION", "is_mandatory": True, "validity_period_days": 730},
    {"id": "KYC-2026-000009", "customer_type_code": "BUSINESS_SME", "risk_level": "HIGH", "document_type": "AUDITED_FINANCIALS", "is_mandatory": True, "validity_period_days": 365},
    
    # Business Corporate Requirements
    {"id": "KYC-2026-000010", "customer_type_code": "BUSINESS_CORPORATE", "risk_level": "ALL", "document_type": "CERT_INCORPORATION", "is_mandatory": True, "validity_period_days": 3650},
    {"id": "KYC-2026-000011", "customer_type_code": "BUSINESS_CORPORATE", "risk_level": "ALL", "document_type": "ARTICLES_OF_ASSOC", "is_mandatory": True, "validity_period_days": 3650},
    {"id": "KYC-2026-000012", "customer_type_code": "BUSINESS_CORPORATE", "risk_level": "ALL", "document_type": "PROOF_OF_ADDRESS", "is_mandatory": True, "validity_period_days": 365},
    {"id": "KYC-2026-000013", "customer_type_code": "BUSINESS_CORPORATE", "risk_level": "ALL", "document_type": "UBO_DECLARATION", "is_mandatory": True, "validity_period_days": 730},
    {"id": "KYC-2026-000014", "customer_type_code": "BUSINESS_CORPORATE", "risk_level": "ALL", "document_type": "DIRECTORS_REGISTER", "is_mandatory": True, "validity_period_days": 730},
    {"id": "KYC-2026-000015", "customer_type_code": "BUSINESS_CORPORATE", "risk_level": "HIGH", "document_type": "SOURCE_OF_FUNDS", "is_mandatory": True, "validity_period_days": 365},
]

JURISDICTIONS = [
    {"code": "US", "risk_weight": 10},
    {"code": "GB", "risk_weight": 10},
    {"code": "DE", "risk_weight": 10},
    {"code": "SG", "risk_weight": 15},
    {"code": "CH", "risk_weight": 15},
    {"code": "IN", "risk_weight": 25},
    {"code": "BR", "risk_weight": 35},
    {"code": "ZA", "risk_weight": 40},
    {"code": "AE", "risk_weight": 45},
    {"code": "PA", "risk_weight": 75},  # Elevated risk jurisdiction
    {"code": "KY", "risk_weight": 70},  # Elevated risk jurisdiction
    {"code": "VG", "risk_weight": 70},  # British Virgin Islands
    {"code": "CY", "risk_weight": 55},  # Cyprus
]

SECTORS = [
    {"name": "TECHNOLOGY", "risk_weight": 15},
    {"name": "HEALTHCARE", "risk_weight": 15},
    {"name": "MANUFACTURING", "risk_weight": 20},
    {"name": "RETAIL_COMMERCE", "risk_weight": 20},
    {"name": "PROFESSIONAL_SERVICES", "risk_weight": 25},
    {"name": "FINANCIAL_SERVICES", "risk_weight": 45},
    {"name": "REAL_ESTATE", "risk_weight": 65},
    {"name": "COMMODITIES_MINING", "risk_weight": 70},
    {"name": "GAMBLING_CASINOS", "risk_weight": 85},
    {"name": "CRYPTO_DIGITAL_ASSETS", "risk_weight": 90},
]
