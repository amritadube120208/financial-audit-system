"""
AuditGraph Persistent ML Anomaly Model
Production model wrapper providing calibrated statistical outlier scoring with zero runtime fit calls.
"""

from typing import Any
import numpy as np


class AuditAnomalyModel:
    """
    Trained IsolationForest model wrapper.
    Evaluates new audit ledger feature matrices using pre-fitted trees and calibrated quantiles.
    """

    def __init__(
        self,
        estimator: Any,
        threshold: float = 0.65,
        p_min: float = -0.20,
        p_max: float = 0.35,
        feature_means: np.ndarray | None = None,
        feature_stds: np.ndarray | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        self.estimator = estimator
        self.threshold = threshold
        self.p_min = p_min
        self.p_max = p_max
        self.feature_means = feature_means
        self.feature_stds = feature_stds
        self.metadata = metadata or {}

    def score(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """
        Pure inference scoring across feature matrix X.
        Strictly calls decision_function - zero .fit() calls.
        Returns:
            raw_scores: raw negative decision function (higher = more anomalous)
            norm_scores: calibrated anomaly scores in [0.0, 1.0]
        """
        if X.shape[0] == 0:
            return np.empty((0,), dtype=np.float64), np.empty((0,), dtype=np.float64)

        # Scikit-learn IsolationForest: lower decision_function = more abnormal
        raw_scores = -self.estimator.decision_function(X)

        if self.p_max > self.p_min:
            norm_scores = (raw_scores - self.p_min) / (self.p_max - self.p_min)
            norm_scores = np.clip(norm_scores, 0.0, 1.0)
        else:
            norm_scores = np.zeros_like(raw_scores)

        return raw_scores, norm_scores

    @property
    def model_version(self) -> str:
        return self.metadata.get("model_version", "1.0.0")

    @property
    def model_name(self) -> str:
        return self.metadata.get("model_name", "auditgraph_isolation_forest")

    @property
    def feature_schema_version(self) -> str:
        return self.metadata.get("feature_schema_version", "1.0.0")
