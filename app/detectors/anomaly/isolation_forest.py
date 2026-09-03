from decimal import Decimal
from typing import Any
import logging
import numpy as np

from app.domain.enums import DetectorFamily, Severity, EvidenceSource
from app.domain.evidence import EvidenceItem
from app.domain.models import CanonicalTransaction, DetectorFinding
from app.ml.feature_schema import FEATURE_NAMES
from app.ml.preprocessing import extract_feature_matrix
from app.ml.registry import model_registry
from app.detectors.base import BaseDetector

logger = logging.getLogger(__name__)


class IsolationForestDetector(BaseDetector):
    name = "isolation_forest"
    family = DetectorFamily.ANOMALY
    version = "2.0.0"

    def __init__(self, contamination: float = 0.05, n_estimators: int = 100, random_state: int = 42):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.random_state = random_state

    def run(
        self,
        transactions: list[CanonicalTransaction],
        run_id: str,
        context: dict[str, Any] | None = None,
    ) -> list[DetectorFinding]:
        if not transactions or len(transactions) < 5:
            return []

        # 1. Unified Shared Feature Extraction (0 model mutation)
        X, transaction_ids = extract_feature_matrix(transactions)
        if X.shape[0] == 0:
            return []

        # 2. Retrieve persistent pre-trained model from registry
        model = model_registry.get_model()
        if not model:
            logger.warning("No pre-trained ML anomaly model available; skipping ML detector.")
            return []

        # 3. Pure inference scoring - STRICTLY ZERO .fit() calls
        raw_scores, norm_scores = model.score(X)

        findings: list[DetectorFinding] = []
        threshold = model.threshold

        # Benchmark feature averages for explainability
        if model.feature_means is not None and model.feature_stds is not None:
            feature_means = model.feature_means
            feature_stds = model.feature_stds
        else:
            feature_means = np.mean(X, axis=0)
            feature_stds = np.std(X, axis=0) + 1e-6

        # 4. Generate explainable findings for transactions exceeding anomaly threshold
        for i, score in enumerate(norm_scores):
            if score >= threshold:
                txn = transactions[i]
                row_vec = X[i]

                # Identify top 2 contributing features by deviation
                z_scores = np.abs((row_vec - feature_means) / feature_stds)
                top_feat_indices = np.argsort(z_scores)[::-1][:2]

                evidence: list[EvidenceItem] = [
                    EvidenceItem(
                        key="ml_isolation_score",
                        label="IsolationForest Anomaly Score",
                        value=f"{score * 100:.1f}%",
                        source=EvidenceSource.ML,
                    )
                ]

                for feat_idx in top_feat_indices:
                    f_name = FEATURE_NAMES[feat_idx]
                    f_val = row_vec[feat_idx]
                    evidence.append(
                        EvidenceItem(
                            key=f"feat_dev_{f_name}",
                            label=f"Statistical Deviation ({f_name.replace('_', ' ').title()})",
                            value=f"{f_val:.2f}",
                            source=EvidenceSource.DERIVED,
                        )
                    )

                sev = Severity.HIGH if score >= 0.85 else Severity.MEDIUM

                finding = DetectorFinding(
                    finding_id=f"ml_iforest_{run_id[:6]}_{i+1:05d}",
                    run_id=run_id,
                    detector_family=DetectorFamily.ANOMALY,
                    detector_name="isolation_forest",
                    anomaly_type="STATISTICAL_OUTLIER",
                    transaction_ids=[txn.transaction_id],
                    entity_ids=[txn.entity_id] if txn.entity_id else [],
                    raw_score=float(raw_scores[i]),
                    normalized_score=min(0.95, float(score)),
                    severity=sev,
                    monetary_exposure=abs(txn.amount),
                    evidence=evidence,
                    metadata={
                        "invoice_number": txn.invoice_number,
                        "reference_number": txn.reference_number,
                        "model_version": model.model_version,
                        "top_features": [FEATURE_NAMES[idx] for idx in top_feat_indices],
                    },
                )
                findings.append(finding)

        return findings
