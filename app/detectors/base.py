from abc import ABC, abstractmethod
from typing import Any
from app.domain.models import CanonicalTransaction, DetectorFinding
from app.domain.enums import DetectorFamily


class BaseDetector(ABC):
    name: str
    family: DetectorFamily
    version: str = "1.0.0"

    @abstractmethod
    def run(
        self,
        transactions: list[CanonicalTransaction],
        run_id: str,
        context: dict[str, Any] | None = None,
    ) -> list[DetectorFinding]:
        """Execute detector over canonical transactions and return standardized findings."""
        pass
