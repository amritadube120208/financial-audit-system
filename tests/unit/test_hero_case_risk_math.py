import pytest
from app.domain.enums import DetectorFamily, Severity
from app.scoring.fusion import fuse_risk_scores


def test_hero_case_risk_math_exact():
    """Verify Hero Case risk score formula matches 92.1 CRITICAL within exact tolerance."""
    detector_scores = {
        "rules": 0.90,
        "ml": 0.85,
        "graph": 0.98,
    }
    materiality_score = 0.99  # Exposure ₹495,000 / ₹500,000 threshold

    score, severity, breakdown = fuse_risk_scores(
        detector_scores=detector_scores,
        materiality_score=materiality_score,
    )

    # 0.35(90.0) + 0.25(85.0) + 0.25(98.0) + 0.15(99.0) = 0.315 + 0.2125 + 0.245 + 0.1485 = 0.921 => 92.1 / 100
    assert abs(score - 92.1) < 0.1
    assert severity == Severity.CRITICAL
    assert breakdown["renormalized"] is False


def test_risk_fusion_dynamic_renormalization_missing_graph():
    """Verify dynamic weight renormalization when graph engine is missing."""
    detector_scores = {
        "rules": 0.90,
        "ml": 0.85,
    }
    materiality_score = 0.99

    score, severity, breakdown = fuse_risk_scores(
        detector_scores=detector_scores,
        materiality_score=materiality_score,
    )

    # Weights: Rules 0.35, ML 0.25, Materiality 0.15 => Total 0.75
    # Weighted sum: 0.35(0.90) + 0.25(0.85) + 0.15(0.99) = 0.315 + 0.2125 + 0.1485 = 0.676
    # Score = (0.676 / 0.75) * 100 = 90.13 => 90.1 CRITICAL
    assert abs(score - 90.1) < 0.2
    assert severity == Severity.CRITICAL
    assert breakdown["renormalized"] is True


def test_risk_fusion_zero_materiality():
    """Verify risk fusion with zero materiality."""
    detector_scores = {
        "rules": 0.80,
        "ml": 0.80,
        "graph": 0.80,
    }

    score, severity, breakdown = fuse_risk_scores(
        detector_scores=detector_scores,
        materiality_score=0.0,
    )

    assert abs(score - 80.0) < 0.1
    assert severity == Severity.HIGH


def test_risk_fusion_boundary_min_max():
    """Verify risk fusion min (0.0) and max (100.0) bounds."""
    min_score, min_sev, _ = fuse_risk_scores(detector_scores={"rules": 0.0, "ml": 0.0, "graph": 0.0}, materiality_score=0.0)
    assert min_score == 0.0
    assert min_sev == Severity.LOW

    max_score, max_sev, _ = fuse_risk_scores(detector_scores={"rules": 1.0, "ml": 1.0, "graph": 1.0}, materiality_score=1.0)
    assert max_score == 100.0
    assert max_sev == Severity.CRITICAL
