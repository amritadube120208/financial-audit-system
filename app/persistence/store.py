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

    def get_run_result(self, run_id: str) -> dict[str, Any] | None:
        return self._runs.get(run_id)

    def save_copilot_session(self, session_id: str, run_id: str):
        self._copilot_sessions[session_id] = {
            "session_id": session_id,
            "run_id": run_id,
            "messages": [],
        }

    def get_copilot_session(self, session_id: str) -> dict[str, Any] | None:
        return self._copilot_sessions.get(session_id)

    def add_copilot_message(self, session_id: str, message: dict[str, Any]):
        if session_id in self._copilot_sessions:
            self._copilot_sessions[session_id]["messages"].append(message)


stage_store = StageStore()
memory_store = stage_store
