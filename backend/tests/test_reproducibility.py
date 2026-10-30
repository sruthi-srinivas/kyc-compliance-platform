import json
import hashlib
from backend.app.generator import KYCDataGenerator, FIXED_SEED

def test_fixed_seed_reproducibility():
    """Verify identical datasets generated across runs with seed 20261022."""
    gen1 = KYCDataGenerator(seed=FIXED_SEED, preset="starter")
    data1 = gen1.generate_all()

    gen2 = KYCDataGenerator(seed=FIXED_SEED, preset="starter")
    data2 = gen2.generate_all()

    # Compare entity lengths
    for k in data1.keys():
        assert len(data1[k]) == len(data2[k]), f"Mismatch in entity {k}"

    def compute_sha256(dataset):
        dump = json.dumps(dataset, default=str, sort_keys=True)
        return hashlib.sha256(dump.encode("utf-8")).hexdigest()

    assert compute_sha256(data1) == compute_sha256(data2)

def test_deterministic_id_formatting():
    """Verify deterministic zero-padded IDs conform to specifications."""
    gen = KYCDataGenerator(seed=FIXED_SEED, preset="starter")
    data = gen.generate_all()

    # Customer ID format: CUS-000001
    assert data["customers"][0]["id"] == "CUS-000001"
    assert data["customers"][-1]["id"] == "CUS-000200"

    # KYC Requirement ID format: KYC-2026-000001
    assert data["kyc_requirements"][0]["id"] == "KYC-2026-000001"

    # Document ID format: DOC-CUS-000001-001
    assert data["documents"][0]["id"] == "DOC-CUS-000001-001"

    # Review Case ID format: REV-CUS-000001-2026
    assert data["review_cases"][0]["id"] == "REV-CUS-000001-2026"

    # Alert ID format: ALT-2026-000001
    assert data["alerts"][0]["id"] == "ALT-2026-000001"
