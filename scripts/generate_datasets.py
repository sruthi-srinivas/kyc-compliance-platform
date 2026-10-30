"""CLI script to generate starter or full KYC compliance datasets."""

import argparse
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.config import settings
from backend.app.generator import KYCDataGenerator, DataExporter, load_dataset_into_db, FIXED_SEED
from backend.app.database import SessionLocal, init_db

def main():
    parser = argparse.ArgumentParser(description="KYC Synthetic Data Generator")
    parser.add_argument("--preset", choices=["starter", "full"], default="starter", help="Dataset volume preset")
    parser.add_argument("--seed", type=int, default=FIXED_SEED, help="Random seed (default: 20261022)")
    parser.add_argument("--seed-db", action="store_true", help="Load generated records into active database")
    args = parser.parse_args()

    print(f"============================================================")
    print(f"Generating KYC Compliance Dataset: preset='{args.preset}', seed={args.seed}")
    print(f"============================================================")

    generator = KYCDataGenerator(seed=args.seed, preset=args.preset)
    data = generator.generate_all()

    print("\nDataset Generation Complete. Record Counts:")
    for entity, records in data.items():
        print(f"  - {entity:20s}: {len(records):6d} records")

    target_dir = settings.DATA_DIR / ("generated" if args.preset == "full" else "starter")
    print(f"\nExporting files to {target_dir} and {settings.GROUND_TRUTH_DIR}...")
    exporter = DataExporter(output_dir=target_dir, ground_truth_dir=settings.GROUND_TRUTH_DIR)
    exporter.export_all(data)
    print("CSV, JSON, and PostgreSQL seed_data.sql files exported successfully.")

    if args.seed_db:
        print("\nLoading dataset into active database...")
        init_db()
        db = SessionLocal()
        try:
            load_dataset_into_db(db, data)
            print("Database population complete.")
        finally:
            db.close()

if __name__ == "__main__":
    main()
