import json
import os
from decimal import Decimal
from pathlib import Path
from typing import Any
from app.config import settings


def _json_serializer(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        return float(obj)
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    return str(obj)


class RecoveryStore:
    def __init__(self, recovery_dir: str = settings.RECOVERY_DIR):
        self.recovery_dir = Path(recovery_dir)
        self.recovery_dir.mkdir(parents=True, exist_ok=True)

    def _build_key(self, dataset_sha256: str, pipeline_version: str, scoring_config_version: str) -> str:
        return f"{dataset_sha256}_{pipeline_version}_{scoring_config_version}.json".replace("+", "_").replace(" ", "_")

    def save_snapshot(
        self,
        dataset_sha256: str,
        pipeline_version: str,
        scoring_config_version: str,
        result_data: dict[str, Any],
    ):
        filename = self._build_key(dataset_sha256, pipeline_version, scoring_config_version)
        target_path = self.recovery_dir / filename

        meta = {
            "dataset_sha256": dataset_sha256,
            "pipeline_version": pipeline_version,
            "scoring_config_version": scoring_config_version,
            "result_data": result_data,
        }

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, default=_json_serializer)

    def get_verified_snapshot(
        self,
        dataset_sha256: str,
        pipeline_version: str,
        scoring_config_version: str,
    ) -> dict[str, Any] | None:
        """
        Retrieve verified recovery snapshot.
        MUST match dataset_sha256, pipeline_version, AND scoring_config_version exactly.
        """
        filename = self._build_key(dataset_sha256, pipeline_version, scoring_config_version)
        target_path = self.recovery_dir / filename

        if not target_path.exists():
            return None

        try:
            with open(target_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if (
                data.get("dataset_sha256") == dataset_sha256
                and data.get("pipeline_version") == pipeline_version
                and data.get("scoring_config_version") == scoring_config_version
            ):
                return data.get("result_data")
        except Exception:
            return None

        return None


recovery_store = RecoveryStore()
