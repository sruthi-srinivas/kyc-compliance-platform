"""CLI script to demonstrate fixed-seed reproducibility."""

import hashlib
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.generator import KYCDataGenerator, FIXED_SEED

def compute_hash(data_dict):
    dump = json.dumps(data_dict, default=str, sort_keys=True)
    return hashlib.sha256(dump.encode("utf-8")).hexdigest()

def main():
    seed = FIXED_SEED
    print(f"============================================================")
    print(f"DEMONSTRATING FIXED-SEED REPRODUCIBILITY (Seed: {seed})")
    print(f"============================================================")

    print("\n[Run 1] Generating dataset with seed 20261022...")
    gen1 = KYCDataGenerator(seed=seed, preset="starter")
    data1 = gen1.generate_all()
    hash1 = compute_hash(data1)
    print(f"Run 1 SHA-256 Checksum: {hash1}")

    print("\n[Run 2] Generating dataset with seed 20261022...")
    gen2 = KYCDataGenerator(seed=seed, preset="starter")
    data2 = gen2.generate_all()
    hash2 = compute_hash(data2)
    print(f"Run 2 SHA-256 Checksum: {hash2}")

    print("\nComparing Counts Across Entities:")
    all_match = True
    for key in data1.keys():
        c1 = len(data1[key])
        c2 = len(data2[key])
        match = (c1 == c2)
        if not match:
            all_match = False
        print(f"  - {key:20s}: Run 1 = {c1:5d} | Run 2 = {c2:5d} | {'MATCH' if match else 'MISMATCH'}")

    print("\nComparing Generated IDs & Contents:")
    for key in ["customers", "documents", "risk_ratings", "review_cases", "alerts"]:
        ids1 = [r["id"] for r in data1[key]]
        ids2 = [r["id"] for r in data2[key]]
        id_match = (ids1 == ids2)
        print(f"  - {key} IDs match: {id_match}")
        if not id_match:
            all_match = False

    hash_match = (hash1 == hash2)
    print("\nChecksum Comparison:")
    print(f"  - SHA-256 Hash Match: {hash_match}")

    print("\n" + "=" * 60)
    if all_match and hash_match:
        print("VERIFICATION RESULT: SUCCESS (100% Bit-for-Bit Reproducibility)")
    else:
        print("VERIFICATION RESULT: FAILED (Discrepancy detected)")
    print("=" * 60)

if __name__ == "__main__":
    main()
