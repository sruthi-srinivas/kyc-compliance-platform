"""Deterministic Synthetic Data Generator for KYC Compliance Platform.

Generates complete datasets with fixed random seed 20261022, zero-padded deterministic IDs,
reproducible relationships, deliberate labelled edge cases, and separated ground truth.
"""

import random
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple
import numpy as np
from faker import Faker

from backend.app.generator.constants import (
    FIXED_SEED,
    EVALUATION_DATE,
    PRESET_VOLUMES,
    CUSTOMER_TYPES,
    KYC_REQUIREMENTS_DEF,
    JURISDICTIONS,
    SECTORS
)
from backend.app.generator.rules import (
    calculate_kyc_completeness,
    calculate_risk_rating,
    calculate_review_due_date,
    evaluate_document_expiry_state
)

class KYCDataGenerator:
    def __init__(self, seed: int = FIXED_SEED, preset: str = "starter"):
        self.seed = seed
        self.preset = preset
        self.volumes = PRESET_VOLUMES.get(preset, PRESET_VOLUMES["starter"])
        
        # Initialize deterministic RNGs
        self.rng = random.Random(self.seed)
        np.random.seed(self.seed)
        self.fake = Faker()
        Faker.seed(self.seed)
        self.fake.seed_instance(self.seed)

        # Output collections
        self.customer_types: List[Dict[str, Any]] = []
        self.kyc_requirements: List[Dict[str, Any]] = []
        self.customers: List[Dict[str, Any]] = []
        self.documents: List[Dict[str, Any]] = []
        self.verifications: List[Dict[str, Any]] = []
        self.risk_ratings: List[Dict[str, Any]] = []
        self.review_cases: List[Dict[str, Any]] = []
        self.beneficial_owners: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self.audit_events: List[Dict[str, Any]] = []
        self.ground_truth: List[Dict[str, Any]] = []

        # Internal counters
        self.alert_counter = 0
        self.audit_counter = 0
        self.anomaly_counter = 0

    def next_alert_id(self) -> str:
        self.alert_counter += 1
        return f"ALT-2026-{self.alert_counter:06d}"

    def next_audit_id(self) -> str:
        self.audit_counter += 1
        return f"AUD-2026-{self.audit_counter:06d}"

    def next_anomaly_id(self) -> str:
        self.anomaly_counter += 1
        return f"ANO-2026-{self.anomaly_counter:05d}"

    def generate_all(self) -> Dict[str, List[Dict[str, Any]]]:
        """Executes the 10-step sequential generation workflow."""
        # Reset state with seed
        self.rng = random.Random(self.seed)
        np.random.seed(self.seed)
        self.fake.seed_instance(self.seed)
        self.alert_counter = 0
        self.audit_counter = 0
        self.anomaly_counter = 0

        # Step 1: Master Customer Types
        self._step1_customer_types()

        # Step 2: KYC Requirements
        self._step2_kyc_requirements()

        # Step 3: Customers (Individuals & Businesses)
        self._step3_customers()

        # Step 4: Documents & Verifications
        self._step4_documents_and_verifications()

        # Step 5: Beneficial Owners
        self._step5_beneficial_owners()

        # Step 6: Completeness Calculations
        self._step6_kyc_completeness()

        # Step 7: Risk Ratings
        self._step7_risk_ratings()

        # Step 8: Periodic Reviews
        self._step8_periodic_reviews()

        # Deliberate Edge Cases Injection
        self._inject_edge_cases()

        # Re-derive completeness & risk for modified records
        self._post_injection_sync()

        # Step 9: Alerts
        self._step9_alerts()

        # Step 10: Audit Events
        self._step10_audit_events()

        return {
            "customer_types": self.customer_types,
            "kyc_requirements": self.kyc_requirements,
            "customers": self.customers,
            "documents": self.documents,
            "verifications": self.verifications,
            "risk_ratings": self.risk_ratings,
            "review_cases": self.review_cases,
            "beneficial_owners": self.beneficial_owners,
            "alerts": self.alerts,
            "audit_events": self.audit_events,
            "ground_truth": self.ground_truth,
        }

    def _step1_customer_types(self):
        created_dt = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        self.customer_types = [
            {**ct, "created_at": created_dt} for ct in CUSTOMER_TYPES
        ]

    def _step2_kyc_requirements(self):
        created_dt = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        self.kyc_requirements = [
            {**req, "created_at": created_dt} for req in KYC_REQUIREMENTS_DEF
        ]

    def _step3_customers(self):
        total_customers = self.volumes["num_customers"]
        num_businesses = self.volumes["num_businesses"]
        num_individuals = total_customers - num_businesses

        base_date = datetime(2026, 1, 1, 8, 0, 0, tzinfo=timezone.utc)
        self.customers = []

        # Generate Individuals
        for i in range(1, num_individuals + 1):
            cus_id = f"CUS-{i:06d}"
            name = self.fake.name()
            jurisdiction = self.rng.choice(JURISDICTIONS)["code"]
            created_at = base_date + timedelta(minutes=i * 7)
            self.customers.append({
                "id": cus_id,
                "customer_type_code": "INDIVIDUAL",
                "full_name": name,
                "registration_number": f"TAX-IND-{self.rng.randint(100000, 999999)}",
                "jurisdiction": jurisdiction,
                "industry_sector": None,
                "onboarding_status": "APPROVED",
                "kyc_completeness": 0.0,
                "current_risk_level": "LOW",
                "created_at": created_at,
                "updated_at": created_at,
            })

        # Generate Businesses
        for j in range(1, num_businesses + 1):
            idx = num_individuals + j
            cus_id = f"CUS-{idx:06d}"
            biz_type = "BUSINESS_CORPORATE" if (j % 3 == 0) else "BUSINESS_SME"
            company_name = f"{self.fake.company()} {self.rng.choice(['Ltd', 'Corp', 'Holdings', 'LLC', 'Inc'])}"
            jurisdiction = self.rng.choice(JURISDICTIONS)["code"]
            sector = self.rng.choice(SECTORS)["name"]
            created_at = base_date + timedelta(minutes=idx * 7)
            self.customers.append({
                "id": cus_id,
                "customer_type_code": biz_type,
                "full_name": company_name,
                "registration_number": f"REG-BIZ-{self.rng.randint(1000000, 9999999)}",
                "jurisdiction": jurisdiction,
                "industry_sector": sector,
                "onboarding_status": "APPROVED",
                "kyc_completeness": 0.0,
                "current_risk_level": "LOW",
                "created_at": created_at,
                "updated_at": created_at,
            })

    def _step4_documents_and_verifications(self):
        self.documents = []
        self.verifications = []
        total_target_docs = self.volumes["num_documents"]
        
        # Calculate standard documents per customer type
        doc_count = 0
        for cus in self.customers:
            c_id = cus["id"]
            c_type = cus["customer_type_code"]
            
            # Determine standard required docs for baseline valid customer
            if c_type == "INDIVIDUAL":
                req_types = ["GOVERNMENT_ID", "PROOF_OF_ADDRESS"]
            elif c_type == "BUSINESS_SME":
                req_types = ["CERT_INCORPORATION", "ARTICLES_OF_ASSOC", "PROOF_OF_ADDRESS", "UBO_DECLARATION"]
            else:  # BUSINESS_CORPORATE
                req_types = ["CERT_INCORPORATION", "ARTICLES_OF_ASSOC", "PROOF_OF_ADDRESS", "UBO_DECLARATION", "DIRECTORS_REGISTER"]

            for doc_seq, doc_type in enumerate(req_types, start=1):
                doc_id = f"DOC-{c_id}-{doc_seq:03d}"
                doc_count += 1
                
                # Issue date 1-3 years before evaluation date
                issue_offset = self.rng.randint(180, 1000)
                issue_d = EVALUATION_DATE - timedelta(days=issue_offset)
                
                # Expiry date 1-5 years after evaluation date (valid baseline)
                expiry_offset = self.rng.randint(180, 1500)
                expiry_d = EVALUATION_DATE + timedelta(days=expiry_offset)

                doc_record = {
                    "id": doc_id,
                    "customer_id": c_id,
                    "document_type": doc_type,
                    "document_number": f"DOCNUM-{self.rng.randint(10000000, 99999999)}",
                    "issuing_country": cus["jurisdiction"],
                    "issuing_authority": f"{cus['jurisdiction']} National Authority",
                    "issue_date": issue_d,
                    "expiry_date": expiry_d,
                    "lifecycle_state": "VALID",
                    "created_at": cus["created_at"] + timedelta(hours=1),
                    "updated_at": cus["created_at"] + timedelta(hours=1),
                }
                self.documents.append(doc_record)

                ver_record = {
                    "id": f"VER-{doc_id}",
                    "document_id": doc_id,
                    "status": "VERIFIED",
                    "verified_by_actor": "OPERATIONS_ANALYST",
                    "analyst_notes": "Identity evidence verified against authoritative registry.",
                    "verified_at": cus["created_at"] + timedelta(hours=3),
                    "created_at": cus["created_at"] + timedelta(hours=3),
                }
                self.verifications.append(ver_record)

        # Distribute additional optional documents if needed to reach volume
        extra_types = ["TAX_DECLARATION", "PROOF_OF_WEALTH", "SOURCE_OF_FUNDS", "BANK_STATEMENT"]
        while len(self.documents) < total_target_docs:
            cus = self.rng.choice(self.customers)
            c_id = cus["id"]
            next_seq = len([d for d in self.documents if d["customer_id"] == c_id]) + 1
            doc_id = f"DOC-{c_id}-{next_seq:03d}"
            
            issue_d = EVALUATION_DATE - timedelta(days=self.rng.randint(60, 400))
            expiry_d = EVALUATION_DATE + timedelta(days=self.rng.randint(180, 700))
            
            doc_record = {
                "id": doc_id,
                "customer_id": c_id,
                "document_type": self.rng.choice(extra_types),
                "document_number": f"DOCNUM-{self.rng.randint(10000000, 99999999)}",
                "issuing_country": cus["jurisdiction"],
                "issuing_authority": f"{cus['jurisdiction']} Regulatory Body",
                "issue_date": issue_d,
                "expiry_date": expiry_d,
                "lifecycle_state": "VALID",
                "created_at": cus["created_at"] + timedelta(days=2),
                "updated_at": cus["created_at"] + timedelta(days=2),
            }
            self.documents.append(doc_record)
            
            ver_record = {
                "id": f"VER-{doc_id}",
                "document_id": doc_id,
                "status": "VERIFIED",
                "verified_by_actor": "OPERATIONS_ANALYST",
                "analyst_notes": "Supplemental evidence verified.",
                "verified_at": cus["created_at"] + timedelta(days=2, hours=2),
                "created_at": cus["created_at"] + timedelta(days=2, hours=2),
            }
            self.verifications.append(ver_record)

    def _step5_beneficial_owners(self):
        self.beneficial_owners = []
        biz_customers = [c for c in self.customers if c["customer_type_code"] in ("BUSINESS_SME", "BUSINESS_CORPORATE")]
        
        for biz in biz_customers:
            c_id = biz["id"]
            # Generate 1 to 3 owners totaling exactly 100.0%
            owner_choice = self.rng.choice([1, 2, 3])
            if owner_choice == 1:
                splits = [100.0]
            elif owner_choice == 2:
                splits = [60.0, 40.0]
            else:
                splits = [40.0, 35.0, 25.0]

            for s_idx, pct in enumerate(splits, start=1):
                owner_id = f"OWN-{c_id}-{s_idx:03d}"
                self.beneficial_owners.append({
                    "id": owner_id,
                    "business_customer_id": c_id,
                    "owner_name": self.fake.name(),
                    "nationality": self.rng.choice(JURISDICTIONS)["code"],
                    "ownership_percentage": pct,
                    "is_controlling_person": (pct >= 50.0 or s_idx == 1),
                    "id_document_number": f"UBO-PASS-{self.rng.randint(100000, 999999)}",
                    "created_at": biz["created_at"] + timedelta(hours=2),
                })

    def _step6_kyc_completeness(self):
        # Index documents and verifications by customer
        docs_by_customer: Dict[str, List[Dict[str, Any]]] = {}
        for d in self.documents:
            docs_by_customer.setdefault(d["customer_id"], []).append(d)
        
        ver_by_doc_id = {v["document_id"]: v for v in self.verifications}

        for cus in self.customers:
            c_id = cus["id"]
            c_docs = docs_by_customer.get(c_id, [])
            completeness = calculate_kyc_completeness(
                customer_type_code=cus["customer_type_code"],
                risk_level=cus["current_risk_level"],
                submitted_docs=c_docs,
                verifications_by_doc_id=ver_by_doc_id
            )
            cus["kyc_completeness"] = completeness

    def _step7_risk_ratings(self):
        self.risk_ratings = []
        for cus in self.customers:
            c_id = cus["id"]
            score, level, interval, breakdown = calculate_risk_rating(
                customer_type_code=cus["customer_type_code"],
                jurisdiction_code=cus["jurisdiction"],
                industry_sector=cus.get("industry_sector") or "RETAIL_COMMERCE",
                past_alert_count=0
            )
            cus["current_risk_level"] = level
            
            rsk_id = f"RSK-{c_id}-2026"
            self.risk_ratings.append({
                "id": rsk_id,
                "customer_id": c_id,
                "risk_score": score,
                "risk_level": level,
                "review_interval_months": interval,
                "assessed_by": "SYSTEM_ENGINE",
                "score_breakdown": str(breakdown),
                "effective_date": cus["created_at"].date(),
                "is_current": True,
                "created_at": cus["created_at"] + timedelta(hours=4),
            })

    def _step8_periodic_reviews(self):
        self.review_cases = []
        target_reviews = self.volumes["num_reviews"]
        
        # Schedule reviews for customers
        selected_customers = self.customers[:target_reviews] if len(self.customers) >= target_reviews else self.customers
        for cus in selected_customers:
            c_id = cus["id"]
            rsk = next(r for r in self.risk_ratings if r["customer_id"] == c_id)
            due_date = calculate_review_due_date(rsk["effective_date"], rsk["review_interval_months"])
            
            # Baseline status: SCHEDULED or RESOLVED
            is_overdue = due_date < EVALUATION_DATE
            if is_overdue:
                # Past due: mark RESOLVED in baseline or keep UNDER_REVIEW
                status = "RESOLVED"
                res_decision = "MAINTAIN_RATING"
                res_notes = "Periodic review completed with evidence refresh."
                completed_d = due_date - timedelta(days=5)
            else:
                status = "SCHEDULED"
                res_decision = None
                res_notes = None
                completed_d = None

            rev_id = f"REV-{c_id}-2026"
            self.review_cases.append({
                "id": rev_id,
                "customer_id": c_id,
                "review_type": "PERIODIC",
                "status": status,
                "assigned_reviewer": "RISK_REVIEWER_01",
                "scheduled_due_date": due_date,
                "completed_date": completed_d,
                "is_overdue": False,
                "resolution_decision": res_decision,
                "resolution_notes": res_notes,
                "created_at": cus["created_at"] + timedelta(days=1),
            })

    def _inject_edge_cases(self):
        """Injects all 5 mandatory labelled edge cases and records them in isolated ground truth."""
        n_anomalies = self.volumes["num_anomalies_per_type"]

        # -------------------------------------------------------------
        # Scenario 1: Document expired but marked valid
        # -------------------------------------------------------------
        # Select documents from customers [100 : 100 + n_anomalies] to ensure zero overlap with Scenario 2
        cus_s1_ids = {c["id"] for c in self.customers[100:100 + n_anomalies]}
        selected_docs_s1 = [d for d in self.documents if d["customer_id"] in cus_s1_ids and d["expiry_date"] is not None][:n_anomalies]
        for doc in selected_docs_s1:
            # Set expiry date to 90 days before evaluation date, but retain lifecycle_state='VALID'
            doc["expiry_date"] = EVALUATION_DATE - timedelta(days=self.rng.randint(30, 180))
            doc["lifecycle_state"] = "VALID"
            
            ano_id = self.next_anomaly_id()
            self.ground_truth.append({
                "anomaly_id": ano_id,
                "issue_type": "EXPIRED_DOCUMENT_MARKED_VALID",
                "expected_classification": "ANOMALY",
                "expected_decision": "FLAG_DOCUMENT_EXPIRATION_EXCEPTION",
                "related_entity_type": "Document",
                "related_entity_id": doc["id"],
                "details": f"Document {doc['id']} has expiry date {doc['expiry_date']} (< {EVALUATION_DATE}) but lifecycle_state is VALID."
            })

        # -------------------------------------------------------------
        # Scenario 2: Customer approved with missing mandatory evidence
        # -------------------------------------------------------------
        # Select active approved customers and remove their primary mandatory document
        selected_cus_s2 = self.customers[10:10 + n_anomalies]
        for cus in selected_cus_s2:
            cus_id = cus["id"]
            # Remove mandatory docs from self.documents for this customer
            c_docs = [d for d in self.documents if d["customer_id"] == cus_id]
            if c_docs:
                target_doc = c_docs[0]
                self.documents = [d for d in self.documents if d["id"] != target_doc["id"]]
                self.verifications = [v for v in self.verifications if v["document_id"] != target_doc["id"]]
            
            # Ensure customer is marked APPROVED
            cus["onboarding_status"] = "APPROVED"
            
            ano_id = self.next_anomaly_id()
            self.ground_truth.append({
                "anomaly_id": ano_id,
                "issue_type": "APPROVED_WITHOUT_MANDATORY_KYC",
                "expected_classification": "ANOMALY",
                "expected_decision": "FLAG_UNAUTHORIZED_APPROVAL_EXCEPTION",
                "related_entity_type": "Customer",
                "related_entity_id": cus_id,
                "details": f"Customer {cus_id} is marked APPROVED while mandatory KYC evidence is missing."
            })

        # -------------------------------------------------------------
        # Scenario 3: Beneficial ownership percentages exceed 100%
        # -------------------------------------------------------------
        biz_with_ubos = sorted(list({b["business_customer_id"] for b in self.beneficial_owners}))
        selected_biz_s3 = biz_with_ubos[:n_anomalies]
        for b_id in selected_biz_s3:
            ubos = [u for u in self.beneficial_owners if u["business_customer_id"] == b_id]
            if ubos:
                # Deliberately boost ownership to exceed 100% (e.g. 135% or 150%)
                ubos[0]["ownership_percentage"] = 75.0
                if len(ubos) > 1:
                    ubos[1]["ownership_percentage"] = 65.0
                else:
                    # Add an extra owner with 60%
                    self.beneficial_owners.append({
                        "id": f"OWN-{b_id}-999",
                        "business_customer_id": b_id,
                        "owner_name": f"{self.fake.name()} (Injected Over-allocation)",
                        "nationality": "US",
                        "ownership_percentage": 60.0,
                        "is_controlling_person": True,
                        "id_document_number": "UBO-ANO-OVER",
                        "created_at": datetime(2026, 1, 15, tzinfo=timezone.utc),
                    })
            
            ano_id = self.next_anomaly_id()
            self.ground_truth.append({
                "anomaly_id": ano_id,
                "issue_type": "UBO_PERCENTAGE_EXCEEDS_100",
                "expected_classification": "ANOMALY",
                "expected_decision": "FLAG_OWNERSHIP_RECONCILIATION_FAILURE",
                "related_entity_type": "BeneficialOwner",
                "related_entity_id": b_id,
                "details": f"Business {b_id} beneficial ownership sum exceeds 100.0%."
            })

        # -------------------------------------------------------------
        # Scenario 4: Review closes without resolution
        # -------------------------------------------------------------
        eligible_revs = [r for r in self.review_cases if r["status"] in ("SCHEDULED", "RESOLVED")]
        selected_revs_s4 = eligible_revs[:n_anomalies]
        for rev in selected_revs_s4:
            rev["status"] = "CLOSED"
            rev["resolution_decision"] = None
            rev["resolution_notes"] = None
            rev["completed_date"] = EVALUATION_DATE - timedelta(days=2)

            ano_id = self.next_anomaly_id()
            self.ground_truth.append({
                "anomaly_id": ano_id,
                "issue_type": "REVIEW_CLOSED_WITHOUT_RESOLUTION",
                "expected_classification": "ANOMALY",
                "expected_decision": "FLAG_INVALID_REVIEW_CLOSURE",
                "related_entity_type": "ReviewCase",
                "related_entity_id": rev["id"],
                "details": f"ReviewCase {rev['id']} has status CLOSED but resolution_decision is NULL."
            })

        # -------------------------------------------------------------
        # Scenario 5: Duplicate document used across unrelated customers
        # -------------------------------------------------------------
        pair_candidates = self.customers[50:50 + (n_anomalies * 2)]
        for k in range(n_anomalies):
            cus_a = pair_candidates[k * 2]
            cus_b = pair_candidates[(k * 2) + 1]
            
            docs_a = [d for d in self.documents if d["customer_id"] == cus_a["id"]]
            if docs_a:
                shared_doc = docs_a[0]
                # Inject a duplicate document on cus_b with the exact same document_number
                dup_doc_id = f"DOC-{cus_b['id']}-777"
                self.documents.append({
                    "id": dup_doc_id,
                    "customer_id": cus_b["id"],
                    "document_type": shared_doc["document_type"],
                    "document_number": shared_doc["document_number"],  # Duplicate!
                    "issuing_country": shared_doc["issuing_country"],
                    "issuing_authority": shared_doc["issuing_authority"],
                    "issue_date": shared_doc["issue_date"],
                    "expiry_date": shared_doc["expiry_date"],
                    "lifecycle_state": "VALID",
                    "created_at": cus_b["created_at"] + timedelta(days=1),
                    "updated_at": cus_b["created_at"] + timedelta(days=1),
                })
                self.verifications.append({
                    "id": f"VER-{dup_doc_id}",
                    "document_id": dup_doc_id,
                    "status": "VERIFIED",
                    "verified_by_actor": "OPERATIONS_ANALYST",
                    "analyst_notes": "Document verified.",
                    "verified_at": cus_b["created_at"] + timedelta(days=1, hours=1),
                    "created_at": cus_b["created_at"] + timedelta(days=1, hours=1),
                })

                ano_id = self.next_anomaly_id()
                self.ground_truth.append({
                    "anomaly_id": ano_id,
                    "issue_type": "DUPLICATE_DOCUMENT_CROSS_CUSTOMER",
                    "expected_classification": "ANOMALY",
                    "expected_decision": "FLAG_DOCUMENT_DUPLICATION_SUSPICION",
                    "related_entity_type": "Document",
                    "related_entity_id": dup_doc_id,
                    "details": f"Document {dup_doc_id} on customer {cus_b['id']} shares duplicate number {shared_doc['document_number']} with customer {cus_a['id']}."
                })

    def _post_injection_sync(self):
        """Re-derives derived values (completeness, overdue flags) after edge-case injection."""
        docs_by_customer: Dict[str, List[Dict[str, Any]]] = {}
        for d in self.documents:
            docs_by_customer.setdefault(d["customer_id"], []).append(d)
        ver_by_doc_id = {v["document_id"]: v for v in self.verifications}

        for cus in self.customers:
            c_id = cus["id"]
            c_docs = docs_by_customer.get(c_id, [])
            completeness = calculate_kyc_completeness(
                customer_type_code=cus["customer_type_code"],
                risk_level=cus["current_risk_level"],
                submitted_docs=c_docs,
                verifications_by_doc_id=ver_by_doc_id
            )
            cus["kyc_completeness"] = completeness

        # Mark review cases overdue if due date < EVALUATION_DATE and not resolved/closed
        for rev in self.review_cases:
            if rev["status"] in ("SCHEDULED", "UNDER_REVIEW") and rev["scheduled_due_date"] < EVALUATION_DATE:
                rev["is_overdue"] = True

    def _step9_alerts(self):
        """Generates standard operational expiry alerts for expiring/expired documents."""
        self.alerts = []
        for doc in self.documents:
            if doc["expiry_date"]:
                state = evaluate_document_expiry_state(doc["expiry_date"], EVALUATION_DATE)
                if state == "EXPIRED":
                    alert_id = self.next_alert_id()
                    self.alerts.append({
                        "id": alert_id,
                        "customer_id": doc["customer_id"],
                        "alert_type": "DOCUMENT_EXPIRED",
                        "severity": "HIGH",
                        "status": "OPEN",
                        "description": f"Document {doc['id']} expired on {doc['expiry_date']}. Immediate refresh required.",
                        "related_entity_type": "Document",
                        "related_entity_id": doc["id"],
                        "created_at": datetime(2026, 10, 22, 10, 0, 0, tzinfo=timezone.utc),
                    })
                elif state == "EXPIRING_SOON":
                    alert_id = self.next_alert_id()
                    self.alerts.append({
                        "id": alert_id,
                        "customer_id": doc["customer_id"],
                        "alert_type": "EXPIRING_SOON",
                        "severity": "MEDIUM",
                        "status": "OPEN",
                        "description": f"Document {doc['id']} expires within 60 days on {doc['expiry_date']}.",
                        "related_entity_type": "Document",
                        "related_entity_id": doc["id"],
                        "created_at": datetime(2026, 10, 22, 10, 0, 0, tzinfo=timezone.utc),
                    })

    def _step10_audit_events(self):
        """Generates immutable historical audit events for onboarding, verification, and reviews."""
        self.audit_events = []
        # Sample audit events for customers
        for cus in self.customers[:500]:
            self.audit_events.append({
                "id": self.next_audit_id(),
                "related_entity_type": "Customer",
                "related_entity_id": cus["id"],
                "event_type": "CUSTOMER_CREATED",
                "actor": "CUSTOMER_ONBOARDING_PORTAL",
                "previous_state": None,
                "new_state": cus["onboarding_status"],
                "event_details": f"Customer {cus['full_name']} registered as {cus['customer_type_code']}.",
                "timestamp": cus["created_at"],
            })

        # Audit events for verifications
        for ver in self.verifications[:1000]:
            self.audit_events.append({
                "id": self.next_audit_id(),
                "related_entity_type": "Verification",
                "related_entity_id": ver["id"],
                "event_type": "DOCUMENT_VERIFIED",
                "actor": ver["verified_by_actor"],
                "previous_state": "PENDING_REVIEW",
                "new_state": ver["status"],
                "event_details": ver["analyst_notes"],
                "timestamp": ver["created_at"],
            })

        # Audit events for review cases
        for rev in self.review_cases[:500]:
            self.audit_events.append({
                "id": self.next_audit_id(),
                "related_entity_type": "ReviewCase",
                "related_entity_id": rev["id"],
                "event_type": "REVIEW_SCHEDULED",
                "actor": "SYSTEM_AUTOMATION",
                "previous_state": None,
                "new_state": rev["status"],
                "event_details": f"Periodic review scheduled for due date {rev['scheduled_due_date']}.",
                "timestamp": rev["created_at"],
            })
