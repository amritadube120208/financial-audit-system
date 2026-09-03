from decimal import Decimal
from typing import Any
import numpy as np
from sklearn.ensemble import IsolationForest

from app.domain.enums import DetectorFamily, Severity, EvidenceSource
from app.domain.evidence import EvidenceItem
from app.domain.models import CanonicalTransaction, DetectorFinding
from app.detectors.base import BaseDetector
from app.features.builder import build_feature_matrix, FEATURE_NAMES


class IsolationForestDetector(BaseDetector):
    name = "isolation_forest"
    family = DetectorFamily.ML
    version = "1.0.0"

    def run(
        self,
        transactions: list[CanonicalTransaction],
        run_id: str,
        context: dict[str, Any] | None = None,
    ) -> list[DetectorFinding]:
        if not transactions or len(transactions) < 5:
            return []

        X, txn_ids, feat_names = build_feature_matrix(transactions)
        if X.shape[0] == 0:
            return []

        # Fit IsolationForest with fixed seed = 42
        model = IsolationForest(
            n_estimators=200,
            contamination="auto",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X)

        # Raw decision function scores (lower/more negative = more anomalous)
        raw_scores = model.decision_function(X)

        # Invert so higher value = more anomalous
        inverted_scores = -raw_scores

        # Normalize using robust quantiles
        p05 = np.quantile(inverted_scores, 0.05)
        p95 = np.quantile(inverted_scores, 0.95)

        if p95 > p05:
            norm_scores = np.clip((inverted_scores - p05) / (p95 - p05), 0.0, 1.0)
        else:
            norm_scores = np.zeros_like(inverted_scores)

        findings: list[DetectorFinding] = []
        count = 0

        # Map transaction list by id for quick lookup
        txn_map = {t.transaction_id: t for t in transactions}

        for i, t_id in enumerate(txn_ids):
            norm_score = float(norm_scores[i])

            # Only flag rows with elevated anomaly score (>= 0.65)
            if norm_score >= 0.65:
                count += 1
                t = txn_map[t_id]

                if norm_score >= 0.85:
                    sev = Severity.HIGH
                elif norm_score >= 0.75:
                    sev = Severity.MEDIUM
                else:
                    sev = Severity.LOW

                # Extract key feature deviations
                log_amt_idx = feat_names.index("log_abs_amount")
                z_idx = feat_names.index("vendor_amount_robust_z")
                rarity_idx = feat_names.index("counterparty_rarity")

                robust_z_val = float(X[i, z_idx])
                rarity_val = float(X[i, rarity_idx])

                evidence = [
                    EvidenceItem(
                        key="ml_anomaly_score",
                        label="IsolationForest Anomaly Score",
                        value=f"{norm_score:.3f}",
                        source=EvidenceSource.MODEL,
                    ),
                    EvidenceItem(
                        key="transaction_amount",
                        label="Transaction Amount",
                        value=f"₹{abs(t.amount):,.2f}",
                        source=EvidenceSource.LEDGER,
                    ),
                    EvidenceItem(
                        key="counterparty_rarity",
                        label="Counterparty Rarity",
                        value=f"{rarity_val * 100:.1f}%",
                        source=EvidenceSource.DERIVED,
                    ),
                    EvidenceItem(
                        key="robust_z_score",
                        label="Vendor Amount Z-Score",
                        value=f"{robust_z_val:.2f}",
                        source=EvidenceSource.DERIVED,
                    ),
                ]

                findings.append(
                    DetectorFinding(
                        finding_id=f"ml_iforest_{run_id[:6]}_{count:04d}",
                        run_id=run_id,
                        detector_family=DetectorFamily.ML,
                        detector_name="isolation_forest",
                        anomaly_type="MULTIVARIATE_ANOMALY",
                        transaction_ids=[t.transaction_id],
                        entity_ids=[t.entity_id] if t.entity_id else [],
                        raw_score=float(inverted_scores[i]),
                        normalized_score=norm_score,
                        severity=sev,
                        monetary_exposure=abs(t.amount),
                        evidence=evidence,
                        metadata={
                            "random_state": 42,
                            "n_estimators": 200,
                            "robust_z": robust_z_val,
                        },
                    )
                )

        return findings
