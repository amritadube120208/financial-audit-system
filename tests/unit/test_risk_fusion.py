from decimal import Decimal
from app.domain.enums import Severity
from app.scoring.fusion import fuse_risk_scores


def test_fuse_risk_scores_full():
    scores = {
        "RULE": 0.90,
        "ML": 0.82,
        "GRAPH": 0.96,
    }
    amount = Decimal("495000.00")
    thresh = Decimal("50000.00")

    score, severity, breakdown = fuse_risk_scores(scores, amount, thresh)

    assert score >= 85.0
    assert severity == Severity.CRITICAL
    assert breakdown["renormalized"] is False


def test_fuse_risk_scores_missing_detector_renormalization():
    # Graph is missing (None)
    scores = {
        "RULE": 0.90,
        "ML": 0.82,
        "GRAPH": None,
    }
    amount = Decimal("495000.00")
    thresh = Decimal("50000.00")

    score, severity, breakdown = fuse_risk_scores(scores, amount, thresh)

    # Risk should renormalize across RULE (0.35), ML (0.25), Materiality (0.15)
    assert score > 0.0
    assert breakdown["renormalized"] is True
    assert breakdown["effective_weights"]["rule"] > 0.35
