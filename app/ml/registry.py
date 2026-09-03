"""
AuditGraph ML Model Registry
Manages singleton lifecycle of persistent pre-trained models loaded once at FastAPI startup.
"""

import json
import logging
import os
from typing import Any
import joblib
import numpy as np

from app.ml.model import AuditAnomalyModel
from app.ml.feature_schema import FEATURE_NAMES, FEATURE_SCHEMA_VERSION

logger = logging.getLogger(__name__)

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "models",
    "auditgraph_anomaly_model.joblib",
)
DEFAULT_METADATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "models",
    "auditgraph_model_metadata.json",
)


class ModelRegistry:
    def __init__(self):
        self._model: AuditAnomalyModel | None = None
        self._is_ready: bool = False
        self._status: str = "UNINITIALIZED"
        self._metadata: dict[str, Any] = {}

    def load_default_model(
        self,
        model_path: str | None = None,
        metadata_path: str | None = None,
    ) -> bool:
        """Load persistent model artifact from disk once at startup."""
        m_path = model_path or DEFAULT_MODEL_PATH
        meta_path = metadata_path or DEFAULT_METADATA_PATH
        self._model = None
        self._metadata = {}

        if not os.path.exists(m_path):
            logger.warning("ML Model artifact not found at %s. ML inference will run in fallback mode.", m_path)
            self._status = "UNAVAILABLE"
            self._is_ready = False
            return False

        try:
            artifact = joblib.load(m_path)
            metadata = {}
            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    metadata = json.load(f)

            estimator = artifact.get("estimator") if isinstance(artifact, dict) else artifact
            if metadata.get("feature_schema_version") != FEATURE_SCHEMA_VERSION:
                raise ValueError("ML feature schema version mismatch")
            if metadata.get("feature_names", metadata.get("features")) != FEATURE_NAMES:
                raise ValueError("ML feature names/order mismatch")
            if getattr(estimator, "n_features_in_", None) != len(FEATURE_NAMES):
                raise ValueError("ML estimator feature count mismatch")
            threshold = artifact.get("threshold", metadata.get("model_threshold", 0.65)) if isinstance(artifact, dict) else 0.65
            p_min = artifact.get("p_min", -0.20) if isinstance(artifact, dict) else -0.20
            p_max = artifact.get("p_max", 0.35) if isinstance(artifact, dict) else 0.35
            f_means = artifact.get("feature_means") if isinstance(artifact, dict) else None
            f_stds = artifact.get("feature_stds") if isinstance(artifact, dict) else None

            self._model = AuditAnomalyModel(
                estimator=estimator,
                threshold=float(threshold),
                p_min=float(p_min),
                p_max=float(p_max),
                feature_means=np.array(f_means) if f_means is not None else None,
                feature_stds=np.array(f_stds) if f_stds is not None else None,
                metadata=metadata,
            )
            self._metadata = metadata
            self._is_ready = True
            self._status = "READY"
            logger.info("Successfully loaded pre-trained ML anomaly model version %s.", self._model.model_version)
            return True
        except Exception as exc:
            logger.error("Failed to load pre-trained ML anomaly model: %s", exc)
            self._status = "ERROR"
            self._is_ready = False
            self._model = None
            return False

    def get_model(self) -> AuditAnomalyModel | None:
        return self._model

    def is_ready(self) -> bool:
        return self._is_ready

    def get_status(self) -> dict[str, Any]:
        return {
            "ml_model": self._status,
            "model_name": self._metadata.get("model_name", "auditgraph_isolation_forest"),
            "model_version": self._metadata.get("model_version", "1.0.0"),
            "feature_schema_version": self._metadata.get("feature_schema_version", "1.0.0"),
            "inference": "READY" if self._is_ready else "UNAVAILABLE",
            "training": "OFFLINE",
            "model_threshold": self._metadata.get("model_threshold", 0.65),
        }


model_registry = ModelRegistry()
