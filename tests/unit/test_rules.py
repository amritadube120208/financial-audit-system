from datetime import date
from decimal import Decimal
from app.domain.models import CanonicalTransaction
from app.detectors.rules.rules_suite import RulesDetector


def test_rules_detector_exact_duplicate():
    detector = RulesDetector()

    tx1 = CanonicalTransaction(
        transaction_id="TX-101",
        dataset_id="ds_test",
        posting_date=date(2026, 3, 29),
        amount=Decimal("49500.00"),
        entity_id="VENDOR_A",
        counterparty_name="VENDOR_A",
        invoice_number="INV-8812",
        source_row_number=1,
    )
    tx2 = CanonicalTransaction(
        transaction_id="TX-102",
        dataset_id="ds_test",
        posting_date=date(2026, 3, 29),
        amount=Decimal("49500.00"),
        entity_id="VENDOR_A",
        counterparty_name="VENDOR_A",
        invoice_number="INV-8812",
        source_row_number=2,
    )

    findings = detector.run([tx1, tx2], run_id="run_test")
    dup_findings = [f for f in findings if f.anomaly_type == "EXACT_DUPLICATE"]

    assert len(dup_findings) >= 1
    assert dup_findings[0].normalized_score == 1.0
    assert "TX-101" in dup_findings[0].transaction_ids
    assert "TX-102" in dup_findings[0].transaction_ids


def test_rules_detector_backdated():
    detector = RulesDetector()

    tx = CanonicalTransaction(
        transaction_id="TX-201",
        dataset_id="ds_test",
        posting_date=date(2026, 3, 29),
        document_date=date(2026, 1, 15),
        amount=Decimal("150000.00"),
        entity_id="VENDOR_B",
        is_manual_entry=True,
    )

    findings = detector.run([tx], run_id="run_test")
    backdate_findings = [f for f in findings if f.anomaly_type == "BACKDATED_POSTING"]

    assert len(backdate_findings) == 1
    assert backdate_findings[0].raw_score >= 0.70
