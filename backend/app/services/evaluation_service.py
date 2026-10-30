"""Evaluation Service: Benchmarks ExceptionDetectionEngine findings against isolated Ground Truth."""

import json
from pathlib import Path
from typing import Dict, List, Any
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.services.detection_service import ExceptionDetectionEngine

class EvaluationService:
    @staticmethod
    def load_ground_truth(db: Session = None) -> List[Dict[str, Any]]:
        """Loads isolated ground truth dataset matching the active database scale."""
        gt_path = settings.GROUND_TRUTH_DIR / "ground_truth.json"
        
        if db is not None:
            from backend.app.models import Customer
            cus_count = db.query(Customer).count()
            if cus_count <= 500:
                starter_gt = settings.BASE_DIR / "data" / "starter" / "ground_truth.json"
                if starter_gt.exists():
                    gt_path = starter_gt
            else:
                full_gt = settings.BASE_DIR / "data" / "generated" / "ground_truth.json"
                if full_gt.exists():
                    gt_path = full_gt

        if not gt_path.exists():
            return []

        with open(gt_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def evaluate_model(db: Session) -> Dict[str, Any]:
        """
        Executes ExceptionDetectionEngine, matches against ground truth by related_entity_id & issue_type,
        and computes TP, FP, FN, TN, Precision, Recall, F1, and per-scenario metrics.
        """
        ground_truth_records = EvaluationService.load_ground_truth(db)
        detected_anomalies = ExceptionDetectionEngine.detect_all_exceptions(db)

        # Build ground truth key set: (issue_type, related_entity_id)
        gt_map = {
            (r["issue_type"], r["related_entity_id"]): r
            for r in ground_truth_records
        }

        # Build detected key set: (issue_type, related_entity_id)
        detected_map = {
            (d["issue_type"], d["related_entity_id"]): d
            for d in detected_anomalies
        }

        matched_gt_keys = set()
        tp_list = []
        fp_list = []

        for key, det in detected_map.items():
            if key in gt_map:
                matched_gt_keys.add(key)
                tp_list.append(det)
            else:
                # Flagged by engine but not in injected ground truth
                fp_list.append(det)

        fn_list = [
            gt for key, gt in gt_map.items()
            if key not in matched_gt_keys
        ]

        tp = len(tp_list)
        fp = len(fp_list)
        fn = len(fn_list)
        # Approximate true negative: non-anomalous entities correctly unflagged
        total_eval_population = len(ground_truth_records) * 10
        tn = max(0, total_eval_population - (tp + fp + fn))

        precision = (tp / (tp + fp)) if (tp + fp) > 0 else 1.0
        recall = (tp / (tp + fn)) if (tp + fn) > 0 else 1.0
        f1_score = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
        detection_rate = (tp / len(ground_truth_records) * 100.0) if ground_truth_records else 100.0

        # Scenario breakdown
        issue_types = [
            "EXPIRED_DOCUMENT_MARKED_VALID",
            "APPROVED_WITHOUT_MANDATORY_KYC",
            "UBO_PERCENTAGE_EXCEEDS_100",
            "REVIEW_CLOSED_WITHOUT_RESOLUTION",
            "DUPLICATE_DOCUMENT_CROSS_CUSTOMER",
        ]

        breakdown = {}
        for it in issue_types:
            sub_gt = [r for r in ground_truth_records if r["issue_type"] == it]
            sub_det = [d for d in detected_anomalies if d["issue_type"] == it]
            sub_tp = sum(1 for d in sub_det if (it, d["related_entity_id"]) in gt_map)
            sub_fp = len(sub_det) - sub_tp
            sub_fn = len(sub_gt) - sub_tp

            sub_prec = (sub_tp / (sub_tp + sub_fp)) if (sub_tp + sub_fp) > 0 else 1.0
            sub_rec = (sub_tp / (sub_tp + sub_fn)) if (sub_tp + sub_fn) > 0 else 1.0

            breakdown[it] = {
                "injected_ground_truth_count": len(sub_gt),
                "detected_count": len(sub_det),
                "true_positives": sub_tp,
                "false_positives": sub_fp,
                "false_negatives": sub_fn,
                "precision": round(sub_prec, 4),
                "recall": round(sub_rec, 4),
            }

        return {
            "summary": {
                "ground_truth_total": len(ground_truth_records),
                "total_detected": len(detected_anomalies),
                "true_positives": tp,
                "false_positives": fp,
                "false_negatives": fn,
                "true_negatives": tn,
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1_score": round(f1_score, 4),
                "exception_detection_rate_pct": round(detection_rate, 2),
            },
            "scenario_breakdown": breakdown,
            "detected_exceptions": detected_anomalies,
        }
