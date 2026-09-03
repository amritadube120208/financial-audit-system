from datetime import date
from decimal import Decimal
from app.domain.models import CanonicalTransaction
from app.detectors.graph.graph_cycles import GraphCycleDetector


def test_graph_cycle_detector_hero_roundtrip():
    detector = GraphCycleDetector()

    # Create 3-entity circular transfer path
    # Company A -> Vendor X -> Vendor Y -> Company A
    t1 = CanonicalTransaction(
        transaction_id="TX-ROUND-1",
        posting_date=date(2026, 3, 29),
        amount=Decimal("495000.00"),
        debit_account="Company A",
        credit_account="Vendor X",
        entity_id="Vendor X",
        counterparty_name="Vendor X",
    )
    t2 = CanonicalTransaction(
        transaction_id="TX-ROUND-2",
        posting_date=date(2026, 3, 30),
        amount=Decimal("490000.00"),
        debit_account="Vendor X",
        credit_account="Vendor Y",
        entity_id="Vendor Y",
        counterparty_name="Vendor Y",
    )
    t3 = CanonicalTransaction(
        transaction_id="TX-ROUND-3",
        posting_date=date(2026, 3, 30),
        amount=Decimal("487500.00"),
        debit_account="Vendor Y",
        credit_account="Company A",
        entity_id="Company A",
        counterparty_name="Company A",
    )

    findings = detector.run([t1, t2, t3], run_id="run_test")
    roundtrip_findings = [f for f in findings if f.anomaly_type == "ROUND_TRIP"]

    assert len(roundtrip_findings) >= 1
    f = roundtrip_findings[0]
    assert f.normalized_score >= 0.80
    assert set(f.transaction_ids) == {"TX-ROUND-1", "TX-ROUND-2", "TX-ROUND-3"}
    assert "graph_payload" in f.metadata
