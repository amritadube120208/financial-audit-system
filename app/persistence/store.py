from typing import Any
from app.domain.models import DatasetRef, CanonicalTransaction


class MemoryStore:
    def __init__(self):
        self.datasets: dict[str, DatasetRef] = {}
        self.dataset_bytes: dict[str, bytes] = {}
        self.dataset_transactions: dict[str, list[CanonicalTransaction]] = {}
        self.runs: dict[str, dict[str, Any]] = {}
        self.idempotency_keys: dict[str, str] = {}


memory_store = MemoryStore()
