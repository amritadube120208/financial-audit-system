from decimal import Decimal
from typing import Any
from app.domain.enums import DetectorFamily, Severity
from app.domain.models import DetectorFinding
from app.cases.clustering import EvidenceCluster
from app.scoring.fusion import fuse_risk_scores


def calculate_case_risk_score(
    cluster: EvidenceCluster,
    materiality_threshold: Decimal = Decimal("500000.00"),
    active_families: list[DetectorFamily] | None = None,
) -> tuple[float, Severity, dict[str, float]]:
    """
    Computes case-level risk score across multiple detector families.
    Aggregates rule evidence, ML anomaly score, and Graph risk score, plus materiality.
    Applies dynamic missing-detector weight renormalization.
    """
    if active_families is None:
        active_families = [DetectorFamily.RULES, DetectorFamily.ANOMALY, DetectorFamily.GRAPH]

    # Extract max score per detector family present in the cluster
    rule_scores = [f.normalized_score for f in cluster.findings if f.detector_family in (DetectorFamily.RULES, DetectorFamily.RULE)]
    ml_scores = [f.normalized_score for f in cluster.findings if f.detector_family in (DetectorFamily.ANOMALY, DetectorFamily.STATISTICAL, DetectorFamily.ML)]
    graph_scores = [f.normalized_score for f in cluster.findings if f.detector_family == DetectorFamily.GRAPH]

    family_scores: dict[DetectorFamily, float] = {}

    if rule_scores:
        family_scores[DetectorFamily.RULES] = max(rule_scores)

    if ml_scores:
        family_scores[DetectorFamily.ANOMALY] = max(ml_scores)

    if graph_scores:
        family_scores[DetectorFamily.GRAPH] = max(graph_scores)

    # Compute materiality score Q_i
    exposure = float(cluster.monetary_exposure)
    thresh = float(materiality_threshold) if materiality_threshold > 0 else 500000.0
    materiality_score = min(1.0, max(0.0, exposure / thresh))

    # Fuse scores at CASE level
    risk_score, severity, score_breakdown = fuse_risk_scores(
        detector_scores=family_scores,
        materiality_score=materiality_score,
        available_families=active_families,
    )

    full_breakdown = {
        "rules": family_scores.get(DetectorFamily.RULES, 0.0),
        "ml": family_scores.get(DetectorFamily.ANOMALY, 0.0),
        "graph": family_scores.get(DetectorFamily.GRAPH, 0.0),
        "materiality": materiality_score,
        "final_risk_score": risk_score,
    }

    return risk_score, severity, full_breakdown
