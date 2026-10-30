"""Exporter for CSV, JSON, and PostgreSQL SQL seed data."""

import json
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd

def json_serial(obj):
    """JSON serializer for date and datetime objects."""
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

class DataExporter:
    def __init__(self, output_dir: Path, ground_truth_dir: Path):
        self.output_dir = Path(output_dir)
        self.ground_truth_dir = Path(ground_truth_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.ground_truth_dir.mkdir(parents=True, exist_ok=True)

    def export_all(self, datasets: Dict[str, List[Dict[str, Any]]]):
        """Exports all datasets to CSV, JSON, and SQL seed files."""
        # 1. Export Ground Truth separately
        gt_data = datasets.get("ground_truth", [])
        self._export_ground_truth(gt_data)

        # 2. Export 10 Core Application Entities to CSV and JSON
        entities = [
            "customer_types",
            "kyc_requirements",
            "customers",
            "documents",
            "verifications",
            "risk_ratings",
            "review_cases",
            "beneficial_owners",
            "alerts",
            "audit_events",
        ]

        for entity in entities:
            records = datasets.get(entity, [])
            # CSV export
            df = pd.DataFrame(records)
            csv_path = self.output_dir / f"{entity}.csv"
            df.to_csv(csv_path, index=False)

            # JSON export
            json_path = self.output_dir / f"{entity}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(records, f, default=json_serial, indent=2)

        # 3. Export PostgreSQL SQL Seed Data
        self._export_sql_seed(datasets)

    def _export_ground_truth(self, ground_truth_records: List[Dict[str, Any]]):
        """Saves ground truth in ground_truth directory and active preset output_dir."""
        gt_csv = self.ground_truth_dir / "ground_truth.csv"
        df = pd.DataFrame(ground_truth_records)
        df.to_csv(gt_csv, index=False)

        gt_json = self.ground_truth_dir / "ground_truth.json"
        with open(gt_json, "w", encoding="utf-8") as f:
            json.dump(ground_truth_records, f, default=json_serial, indent=2)

        # Also store with dataset preset folder for matching evaluation
        out_gt_json = self.output_dir / "ground_truth.json"
        with open(out_gt_json, "w", encoding="utf-8") as f:
            json.dump(ground_truth_records, f, default=json_serial, indent=2)

    def _export_sql_seed(self, datasets: Dict[str, List[Dict[str, Any]]]):
        """Generates PostgreSQL-compatible SQL insert script."""
        sql_path = self.output_dir / "seed_data.sql"
        with open(sql_path, "w", encoding="utf-8") as f:
            f.write("-- ====================================================================\n")
            f.write("-- KYC COMPLIANCE PLATFORM: POSTGRESQL SEED SCRIPT\n")
            f.write("-- Deterministically generated with seed 20261022\n")
            f.write("-- ====================================================================\n\n")
            f.write("BEGIN;\n\n")

            # Sequence of tables respecting foreign key relationships
            table_order = [
                ("customer_types", "customer_types"),
                ("kyc_requirements", "kyc_requirements"),
                ("customers", "customers"),
                ("documents", "documents"),
                ("verifications", "verifications"),
                ("risk_ratings", "risk_ratings"),
                ("review_cases", "review_cases"),
                ("beneficial_owners", "beneficial_owners"),
                ("alerts", "alerts"),
                ("audit_events", "audit_events"),
            ]

            for key, table_name in table_order:
                records = datasets.get(key, [])
                if not records:
                    continue
                f.write(f"-- Table: {table_name} ({len(records)} records)\n")
                columns = list(records[0].keys())
                col_names = ", ".join(columns)

                # Write in batches
                batch_size = 100
                for i in range(0, len(records), batch_size):
                    batch = records[i:i + batch_size]
                    values_list = []
                    for row in batch:
                        row_vals = []
                        for col in columns:
                            val = row.get(col)
                            if val is None:
                                row_vals.append("NULL")
                            elif isinstance(val, bool):
                                row_vals.append("TRUE" if val else "FALSE")
                            elif isinstance(val, (int, float)):
                                row_vals.append(str(val))
                            else:
                                escaped = str(val).replace("'", "''")
                                row_vals.append(f"'{escaped}'")
                        values_list.append(f"({', '.join(row_vals)})")
                    
                    values_stmt = ",\n  ".join(values_list)
                    f.write(f"INSERT INTO {table_name} ({col_names}) VALUES\n  {values_stmt}\n  ON CONFLICT DO NOTHING;\n\n")

            f.write("COMMIT;\n")
