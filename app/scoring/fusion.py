import math
from decimal import Decimal
from typing import Any
from app.domain.enums import DetectorFamily, Severity
from app.domain.models import DetectorFinding


DEFAULT_WEIGHTS = {
    DetectorFamily.RULE: 0.35,
    DetectorFamily.ML: 0.25,
    DetectorFamily.GRAPH: 0.25,
    "materiality": 0.15,
}


def calculate_materiality_score(amount: Decimal, materiality_threshold: Decimal) -> float:
    """
    Calculate materiality score Q_i = min(1.0, log(1 + amount) / log(1 + 2 * materiality)).
    """
    amt_val = float(abs(amount))
    thresh_val = float(materiality_threshold) if float(materiality_threshold) > 0 else 50000.0

    if amt_val <= 0:
        return 0.0

    num = math.log1p(amt_val)
    den = math.log1p(2.0 * thresh_val)

    if den <= 0:
        return 0.0

    return min(1.0, max(0.0, num / den))


def compute_severity(risk_score: float) -> Severity:
    """Classify numerical risk score into standardized severity band."""
    if risk_score >= 85.0:
        return Severity.CRITICAL
    elif risk_score >= 70.0:
        return Severity.HIGH
    elif risk_score >= 40.0:
        return Severity.MEDIUM
    return Severity.LOW


def fuse_risk_scores(
    detector_scores: dict[str, float | None],
    amount: Decimal,
    materiality_threshold: Decimal,
    custom_weights: dict[str, float] | None = None,
) -> tuple[float, Severity, dict[str, Any]]:
    """
    Fuse detector scores with dynamic missing-detector weight renormalization.

    Args:
        detector_scores: { "RULE": 0.90, "ML": 0.82, "GRAPH": 0.96 } or None for unavailable
        amount: Transaction / finding monetary exposure
        materiality_threshold: Configured audit materiality threshold
        custom_weights: Optional override weights

    Returns:
        fused_risk_score (0.0 to 100.0)
        severity (Severity enum)
        risk_breakdown dict explaining weights, availability, and components
    """
    weights = custom_weights or {
        "RULE": 0.35,
        "ML": 0.25,
        "GRAPH": 0.25,
        "materiality": 0.15,
    }

    # Compute materiality score component
    mat_score = calculate_materiality_score(amount, materiality_threshold)
    scores_map = dict(detector_scores)
    scores_map["materiality"] = mat_score

    # Determine active available detectors
    active_items = []
    total_active_weight = 0.0

    breakdown = {}

    for key, weight in weights.items():
        score = scores_map.get(key)
        available = (score is not None)

        if available and score is not None:
            active_items.append((key, score, weight))
            total_active_weight += weight

        breakdown[key.lower()] = {
            "available": available,
            "weight": weight,
            "score": round(score, 4) if available and score is not None else None,
        }

    if total_active_weight == 0.0:
        return 0.0, Severity.LOW, breakdown

    # Renormalize weights across available detectors
    weighted_sum = sum(weight * score for _, score, weight in active_items)
    fused_score = 100.0 * (weighted_sum / total_active_weight)
    fused_score = min(100.0, max(0.0, round(fused_score, 1)))

    severity = compute_severity(fused_score)

    breakdown["effective_weights"] = {
        key.lower(): round(weight / total_active_weight, 4)
        for key, _, weight in active_items
    }
    breakdown["renormalized"] = (total_active_weight < sum(weights.values()))

    return fused_score, severity, breakdown
