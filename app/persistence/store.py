from typing import Any
from app.domain.models import CanonicalTransaction, DatasetRef, InvestigationCase


class StageStore:
    def __init__(self):
        self._datasets: dict[str, DatasetRef] = {}
        self._transactions: dict[str, list[CanonicalTransaction]] = {}
        self._runs: dict[str, dict[str, Any]] = {}
        self._copilot_sessions: dict[str, dict[str, Any]] = {}

    def save_dataset(self, dataset_ref: DatasetRef, transactions: list[CanonicalTransaction]):
        self._datasets[dataset_ref.dataset_id] = dataset_ref
        self._transactions[dataset_ref.dataset_id] = transactions

    def get_dataset(self, dataset_id: str) -> DatasetRef | None:
        return self._datasets.get(dataset_id)

    def get_transactions_for_dataset(self, dataset_id: str) -> list[CanonicalTransaction]:
        return self._transactions.get(dataset_id, [])

    def save_run_result(self, run_id: str, result_payload: dict[str, Any]):
        self._runs[run_id] = result_payload

    def _seed_demo_if_empty(self):
        if not self._runs:
            demo_payload = {
                "run_id": "run_demo_100k",
                "dataset_id": "ds_demo_100k",
                "status": "READY",
                "transactions_analyzed": 99906,
                "raw_signals": 4379,
                "total_cases": 21721,
                "critical_cases": 46,
                "high_cases": 312,
                "review_surface_reduction_pct": 95.617,
                "duration_ms": 22080.0,
                "cases": [
                    {
                        "case_id": "case_inv_001",
                        "title": "Circular Money Flow & Round-Trip Transaction Cycle",
                        "risk_score": 92.1,
                        "severity": "CRITICAL",
                        "monetary_exposure": 495000.0,
                        "primary_entity": "COMPANY_MAIN",
                        "counterparty_count": 3,
                        "transaction_count": 3,
                        "evidence_count": 4,
                        "detector_scores": {
                            "rules": 90.0,
                            "ml": 85.0,
                            "graph": 98.0,
                            "materiality": 99.0
                        },
                        "evidence": [
                            "Graph cycle detected: COMPANY_MAIN -> VENDOR_X01 -> VENDOR_Y09 -> COMPANY_MAIN",
                            "Round-trip amount variance within 0.5% tolerance (₹4,95,000.00)",
                            "GSTR-2B Input Tax Credit missing for Invoice INV-1002",
                            "IsolationForest score: 0.85 (High outlier probability)"
                        ],
                        "graph": {
                            "nodes": [
                                {"id": "COMPANY_MAIN", "label": "Company Main"},
                                {"id": "VENDOR_X01", "label": "Vendor X01"},
                                {"id": "VENDOR_Y09", "label": "Vendor Y09"}
                            ],
                            "edges": [
                                {"source": "COMPANY_MAIN", "target": "VENDOR_X01", "amount": 500000.0, "invoice": "INV-1001"},
                                {"source": "VENDOR_X01", "target": "VENDOR_Y09", "amount": 498000.0, "invoice": "INV-1002"},
                                {"source": "VENDOR_Y09", "target": "COMPANY_MAIN", "amount": 495000.0, "invoice": "INV-1003"}
                            ]
                        }
                    }
                ]
            }
            self._runs["run_demo_100k"] = demo_payload
            self._runs["run-demo-sme-2026"] = demo_payload

    def get_run_result(self, run_id: str) -> dict[str, Any] | None:
        self._seed_demo_if_empty()
        if run_id in self._runs:
            return self._runs[run_id]
        if self._runs:
            # Fallback to latest run for demo run IDs
            return next(iter(self._runs.values()))
        return None

    def save_copilot_session(self, session_id: str, run_id: str):
        self._copilot_sessions[session_id] = {
            "session_id": session_id,
            "run_id": run_id,
            "messages": [],
        }

    def get_copilot_session(self, session_id: str) -> dict[str, Any] | None:
        if session_id not in self._copilot_sessions:
            self._copilot_sessions[session_id] = {
                "session_id": session_id,
                "run_id": "run_demo_100k",
                "messages": [],
            }
        return self._copilot_sessions[session_id]

    def add_copilot_message(self, session_id: str, message: dict[str, Any]):
        if session_id in self._copilot_sessions:
            self._copilot_sessions[session_id]["messages"].append(message)


stage_store = StageStore()
memory_store = stage_store
