from decimal import Decimal
from typing import Any
import numpy as np
from sklearn.ensemble import IsolationForest

from app.domain.enums import DetectorFamily, Severity, EvidenceSource
from app.domain.evidence import EvidenceItem
from app.domain.models import CanonicalTransaction, DetectorFinding
from app.features.builder import build_feature_matrix, FEATURE_NAMES
from app.detectors.base import BaseDetector


class IsolationForestDetector(BaseDetector):
    name = "isolation_forest"
    family = DetectorFamily.ANOMALY
    version = "1.0.0"

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
        if not transactions or len(transactions) < 20:
            return []

        # 1. Build Feature Matrix
        X, transaction_ids, feat_names = build_feature_matrix(transactions)
        if X.shape[0] < 20:
            return []

        # Replace NaN/Inf if any
        X = np.nan_to_num(X, nan=0.0, posinf=1e6, neginf=-1e6)

        # 2. Intelligent Subsampling for Fast Fitting (25,000 representative rows max)
        n_samples = X.shape[0]
        if n_samples > 25000:
            rng = np.random.RandomState(self.random_state)
            fit_indices = rng.choice(n_samples, size=25000, replace=False)
            X_fit = X[fit_indices]
        else:
            X_fit = X

        # 3. Fit IsolationForest Model
        clf = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            random_state=self.random_state,
            max_samples=min(1024, X_fit.shape[0]),
            n_jobs=-1,
        )
        clf.fit(X_fit)

        # 4. Vectorized Decision Function Scoring across Full Matrix
        raw_scores = -clf.decision_function(X)

        # Quantile normalization to [0.0, 1.0]
        p_min = np.percentile(raw_scores, 5)
        p_max = np.percentile(raw_scores, 98)

        if p_max > p_min:
            norm_scores = (raw_scores - p_min) / (p_max - p_min)
            norm_scores = np.clip(norm_scores, 0.0, 1.0)
        else:
            norm_scores = np.zeros_like(raw_scores)

        findings: list[DetectorFinding] = []

        # Calculate feature importances / means for evidence generation
        feature_means = np.mean(X_fit, axis=0)
        feature_stds = np.std(X_fit, axis=0) + 1e-6

        # Generate findings for elevated anomaly scores (>= 0.65)
        for i, score in enumerate(norm_scores):
            if score >= 0.65:
                txn = transactions[i]
                row_vec = X[i]

                # Identify top contributing features (z-score > 2.0)
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
                    normalized_score=min(0.85, float(score)),
                    severity=sev,
                    monetary_exposure=abs(txn.amount),
                    evidence=evidence,
                    metadata={
                        "invoice_number": txn.invoice_number,
                        "reference_number": txn.reference_number,
                        "top_features": [FEATURE_NAMES[idx] for idx in top_feat_indices],
                    },
                )
                findings.append(finding)

        return findings
