from decimal import Decimal
from typing import Sequence, Any
from app.domain.enums import DetectorFamily, Severity

BASE_WEIGHTS: dict[DetectorFamily, float] = {
    DetectorFamily.RULES: 0.35,
    DetectorFamily.ANOMALY: 0.25,
    DetectorFamily.STATISTICAL: 0.25,
    DetectorFamily.GRAPH: 0.25,
    DetectorFamily.GST: 0.15,
}

WEIGHT_MATERIALITY = 0.15


def fuse_risk_scores(
    detector_scores: dict[Any, float],
    materiality_score: float | Decimal = 0.0,
    available_families: Sequence[DetectorFamily] | Decimal | float | None = None,
    materiality_threshold: Decimal | float = Decimal("500000.00"),
) -> tuple[float, Severity, dict[str, Any]]:
    """
    Computes weighted multi-detector risk score with dynamic weight renormalization for missing detector families.
    Flexible signature accepting detector_scores, materiality_score/amount, and available_families/thresholds.
    """
    # If caller passed (detector_scores, amount, threshold)
    if isinstance(materiality_score, Decimal) or (isinstance(available_families, (Decimal, float))):
        amount = Decimal(str(materiality_score))
        thresh = Decimal(str(available_families)) if isinstance(available_families, (Decimal, float)) else Decimal("500000.00")
        mat_ratio = float(min(Decimal("1.0"), max(Decimal("0.0"), amount / thresh)))
        available_families = [DetectorFamily.RULES, DetectorFamily.ANOMALY, DetectorFamily.GRAPH]
    else:
        mat_ratio = float(materiality_score)
        if available_families is None:
            available_families = [DetectorFamily.RULES, DetectorFamily.ANOMALY, DetectorFamily.GRAPH]

    mapped_scores: dict[DetectorFamily, float] = {}
    for k, v in detector_scores.items():
        if v is None:
            continue
        k_str = str(k).upper()
        if k_str in ("RULES", "RULE"):
            mapped_scores[DetectorFamily.RULES] = float(v)
        elif k_str in ("ANOMALY", "STATISTICAL", "ML"):
            mapped_scores[DetectorFamily.ANOMALY] = float(v)
        elif k_str in ("GRAPH",):
            mapped_scores[DetectorFamily.GRAPH] = float(v)
        elif k_str in ("GST",):
            mapped_scores[DetectorFamily.GST] = float(v)

    valid_families = set(available_families) if isinstance(available_families, (list, set, tuple)) else {DetectorFamily.RULES, DetectorFamily.ANOMALY, DetectorFamily.GRAPH}

    total_weight = 0.0
    weighted_sum = 0.0

    score_breakdown: dict[str, Any] = {}
    effective_weights: dict[str, float] = {}

    for family, score in mapped_scores.items():
        w = BASE_WEIGHTS.get(family, 0.25)
        total_weight += w
        weighted_sum += w * score
        key_str = "rule" if family == DetectorFamily.RULES else family.value.lower()
        score_breakdown[key_str] = score

    if mat_ratio > 0:
        total_weight += WEIGHT_MATERIALITY
        weighted_sum += WEIGHT_MATERIALITY * mat_ratio
        score_breakdown["materiality"] = mat_ratio

    if total_weight > 0:
        final_score = (weighted_sum / total_weight) * 100.0
        for family, score in mapped_scores.items():
            w = BASE_WEIGHTS.get(family, 0.25)
            key_str = "rule" if family == DetectorFamily.RULES else family.value.lower()
            effective_weights[key_str] = w / total_weight
        if mat_ratio > 0:
            effective_weights["materiality"] = WEIGHT_MATERIALITY / total_weight
    else:
        final_score = 0.0

    final_score = min(100.0, max(0.0, final_score))

    if final_score >= 85.0:
        severity = Severity.CRITICAL
    elif final_score >= 70.0:
        severity = Severity.HIGH
    elif final_score >= 40.0:
        severity = Severity.MEDIUM
    else:
        severity = Severity.LOW

    score_breakdown["renormalized"] = (len(mapped_scores) < 3)
    score_breakdown["effective_weights"] = effective_weights

    return final_score, severity, score_breakdown
