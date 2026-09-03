import math
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from typing import Any
import numpy as np
from rapidfuzz import fuzz

from app.domain.enums import DetectorFamily, Severity, EvidenceSource
from app.domain.evidence import EvidenceItem
from app.domain.models import CanonicalTransaction, DetectorFinding
from app.detectors.base import BaseDetector


class RulesDetector(BaseDetector):
    name = "rules"
    family = DetectorFamily.RULE
    version = "1.0.0"

    def run(
        self,
        transactions: list[CanonicalTransaction],
        run_id: str,
        context: dict[str, Any] | None = None,
    ) -> list[DetectorFinding]:
        if not transactions:
            return []

        context = context or {}
        materiality = Decimal(str(context.get("materiality_amount_inr", 50000)))

        findings: list[DetectorFinding] = []

        findings.extend(self._detect_exact_duplicates(transactions, run_id))
        findings.extend(self._detect_near_duplicates(transactions, run_id))
        findings.extend(self._detect_backdated_entries(transactions, run_id))
        findings.extend(self._detect_period_end_spikes(transactions, run_id))
        findings.extend(self._detect_suspicious_round_amounts(transactions, run_id, materiality))
        findings.extend(self._detect_rapid_reversals(transactions, run_id))
        findings.extend(self._detect_rare_counterparties(transactions, run_id, materiality))
        findings.extend(self._detect_high_value_outliers(transactions, run_id, materiality))
        findings.extend(self._detect_gst_mismatches(transactions, run_id, context))

        return findings

    # 1. Exact Duplicate Rule
    def _detect_exact_duplicates(
        self, txns: list[CanonicalTransaction], run_id: str
    ) -> list[DetectorFinding]:
        findings = []
        groups = defaultdict(list)

        for t in txns:
            # Group key: (counterparty, invoice_number or reference, amount, posting_date)
            inv_key = (t.invoice_number or t.reference_number or "").strip().lower()
            cp_key = (t.counterparty_name or t.entity_id or "").strip().lower()
            key = (cp_key, inv_key, abs(t.amount), t.posting_date)
            groups[key].append(t)

        count = 0
        for (cp_key, inv_key, amt, p_date), group in groups.items():
            if len(group) > 1 and cp_key and amt > Decimal("1000"):
                count += 1
                t_ids = [t.transaction_id for t in group]
                entities = list({t.entity_id for t in group if t.entity_id})

                evidence = [
                    EvidenceItem(
                        key="duplicate_count",
                        label="Duplicate instance count",
                        value=len(group),
                        unit="transactions",
                        source=EvidenceSource.LEDGER,
                    ),
                    EvidenceItem(
                        key="duplicate_amount",
                        label="Duplicate transaction amount",
                        value=f"₹{amt:,.2f}",
                        source=EvidenceSource.LEDGER,
                    ),
                    EvidenceItem(
                        key="counterparty",
                        label="Counterparty",
                        value=group[0].counterparty_name or cp_key,
                        source=EvidenceSource.LEDGER,
                    ),
                ]

                findings.append(
                    DetectorFinding(
                        finding_id=f"rule_dup_{run_id[:6]}_{count:04d}",
                        run_id=run_id,
                        detector_family=DetectorFamily.RULE,
                        detector_name="rules",
                        anomaly_type="EXACT_DUPLICATE",
                        transaction_ids=t_ids,
                        entity_ids=entities,
                        raw_score=1.0,
                        normalized_score=1.0,
                        severity=Severity.HIGH,
                        monetary_exposure=amt * Decimal(len(group)),
                        evidence=evidence,
                        metadata={"duplicate_group_size": len(group)},
                    )
                )

        return findings

    # 2. Near Duplicate Rule
    def _detect_near_duplicates(
        self, txns: list[CanonicalTransaction], run_id: str
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        # Group by entity/counterparty to avoid O(n^2)
        cp_groups = defaultdict(list)
        for t in txns:
            if t.amount > Decimal("5000") and (t.invoice_number or t.narration):
                cp_key = (t.counterparty_name or t.entity_id or "").strip().lower()
                if cp_key:
                    cp_groups[cp_key].append(t)

        for cp_key, group in cp_groups.items():
            if len(group) < 2 or len(group) > 50:
                continue

            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    t1, t2 = group[i], group[j]

                    # Check date proximity <= 5 days
                    if not t1.posting_date or not t2.posting_date:
                        continue
                    days_diff = abs((t1.posting_date - t2.posting_date).days)
                    if days_diff > 5:
                        continue

                    # Check amount proximity <= 2% difference
                    amt1, amt2 = abs(float(t1.amount)), abs(float(t2.amount))
                    if amt1 == 0 or amt2 == 0:
                        continue

                    pct_diff = abs(amt1 - amt2) / max(amt1, amt2)
                    if pct_diff > 0.02 or (amt1 == amt2 and days_diff == 0):
                        # Skip exact duplicates covered by Rule 1
                        continue

                    # Fuzzy string similarity on invoice or narration
                    str1 = (t1.invoice_number or t1.narration or "").strip().lower()
                    str2 = (t2.invoice_number or t2.narration or "").strip().lower()

                    if not str1 or not str2:
                        continue

                    ratio = fuzz.ratio(str1, str2)
                    if ratio >= 80:
                        count += 1
                        raw_s = min(0.95, (ratio / 100.0) * (1.0 - pct_diff))

                        evidence = [
                            EvidenceItem(
                                key="amount_diff_pct",
                                label="Amount difference percentage",
                                value=f"{pct_diff * 100:.2f}%",
                                source=EvidenceSource.DERIVED,
                            ),
                            EvidenceItem(
                                key="string_similarity",
                                label="Invoice/narration similarity",
                                value=f"{ratio:.1f}%",
                                source=EvidenceSource.DERIVED,
                            ),
                            EvidenceItem(
                                key="date_gap_days",
                                label="Posting date gap",
                                value=days_diff,
                                unit="days",
                                source=EvidenceSource.DERIVED,
                            ),
                        ]

                        findings.append(
                            DetectorFinding(
                                finding_id=f"rule_near_dup_{run_id[:6]}_{count:04d}",
                                run_id=run_id,
                                detector_family=DetectorFamily.RULE,
                                detector_name="rules",
                                anomaly_type="NEAR_DUPLICATE",
                                transaction_ids=[t1.transaction_id, t2.transaction_id],
                                entity_ids=list({t1.entity_id, t2.entity_id}),
                                raw_score=raw_s,
                                normalized_score=raw_s,
                                severity=Severity.HIGH if raw_s > 0.85 else Severity.MEDIUM,
                                monetary_exposure=Decimal(str(max(amt1, amt2))),
                                evidence=evidence,
                                metadata={"similarity_score": ratio, "amount_diff_pct": pct_diff},
                            )
                        )

        return findings

    # 3. Backdated Entry Rule
    def _detect_backdated_entries(
        self, txns: list[CanonicalTransaction], run_id: str
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        for t in txns:
            if t.document_date and t.posting_date:
                delay = (t.posting_date - t.document_date).days
                if delay >= 15 and abs(t.amount) > Decimal("10000"):
                    count += 1
                    raw_s = min(1.0, 0.5 + (delay / 100.0))
                    sev = Severity.HIGH if (delay >= 30 or t.is_manual_entry) else Severity.MEDIUM

                    evidence = [
                        EvidenceItem(
                            key="posting_delay_days",
                            label="Posting delay from document date",
                            value=delay,
                            unit="days",
                            source=EvidenceSource.DERIVED,
                        ),
                        EvidenceItem(
                            key="document_date",
                            label="Document Date",
                            value=t.document_date.isoformat(),
                            source=EvidenceSource.LEDGER,
                        ),
                        EvidenceItem(
                            key="posting_date",
                            label="Posting Date",
                            value=t.posting_date.isoformat(),
                            source=EvidenceSource.LEDGER,
                        ),
                        EvidenceItem(
                            key="is_manual_entry",
                            label="Manual Entry Flag",
                            value=t.is_manual_entry,
                            source=EvidenceSource.LEDGER,
                        ),
                    ]

                    findings.append(
                        DetectorFinding(
                            finding_id=f"rule_backdate_{run_id[:6]}_{count:04d}",
                            run_id=run_id,
                            detector_family=DetectorFamily.RULE,
                            detector_name="rules",
                            anomaly_type="BACKDATED_POSTING",
                            transaction_ids=[t.transaction_id],
                            entity_ids=[t.entity_id] if t.entity_id else [],
                            raw_score=raw_s,
                            normalized_score=raw_s,
                            severity=sev,
                            monetary_exposure=abs(t.amount),
                            evidence=evidence,
                            metadata={"delay_days": delay},
                        )
                    )

        return findings

    # 4. Period-End Spike Rule
    def _detect_period_end_spikes(
        self, txns: list[CanonicalTransaction], run_id: str
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        # Look for transactions within 3 days of March 31 (FY end) or month end with high material amount
        for t in txns:
            p_dt = t.posting_date
            if p_dt is None:
                continue
            # Check if within last 3 days of March (FY end in India context: March 29..31)
            is_fy_end = (p_dt.month == 3 and p_dt.day >= 28)
            is_manual = t.is_manual_entry

            if is_fy_end and abs(t.amount) >= Decimal("100000"):
                count += 1
                days_to_end = 31 - p_dt.day
                raw_s = 0.85 if is_manual else 0.70

                evidence = [
                    EvidenceItem(
                        key="period_end_proximity",
                        label="Days before fiscal year end",
                        value=days_to_end,
                        unit="days",
                        source=EvidenceSource.DERIVED,
                    ),
                    EvidenceItem(
                        key="transaction_amount",
                        label="Transaction Amount",
                        value=f"₹{abs(t.amount):,.2f}",
                        source=EvidenceSource.LEDGER,
                    ),
                ]

                findings.append(
                    DetectorFinding(
                        finding_id=f"rule_spike_{run_id[:6]}_{count:04d}",
                        run_id=run_id,
                        detector_family=DetectorFamily.RULE,
                        detector_name="rules",
                        anomaly_type="PERIOD_END_POSTING",
                        transaction_ids=[t.transaction_id],
                        entity_ids=[t.entity_id] if t.entity_id else [],
                        raw_score=raw_s,
                        normalized_score=raw_s,
                        severity=Severity.HIGH if (raw_s >= 0.8 or is_manual) else Severity.MEDIUM,
                        monetary_exposure=abs(t.amount),
                        evidence=evidence,
                        metadata={"days_to_fy_end": days_to_end},
                    )
                )

        return findings

    # 5. Suspicious Round Amount Rule
    def _detect_suspicious_round_amounts(
        self, txns: list[CanonicalTransaction], run_id: str, materiality: Decimal
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        round_denominations = [Decimal("100000"), Decimal("250000"), Decimal("500000"), Decimal("1000000")]

        for t in txns:
            amt = abs(t.amount)
            if amt >= materiality:
                for denom in round_denominations:
                    if amt % denom == Decimal("0"):
                        count += 1
                        raw_s = 0.55 if t.is_manual_entry else 0.40
                        evidence = [
                            EvidenceItem(
                                key="round_denomination",
                                label="Round denomination divisor",
                                value=f"₹{denom:,.0f}",
                                source=EvidenceSource.DERIVED,
                            ),
                            EvidenceItem(
                                key="transaction_amount",
                                label="Transaction Amount",
                                value=f"₹{amt:,.2f}",
                                source=EvidenceSource.LEDGER,
                            ),
                        ]

                        findings.append(
                            DetectorFinding(
                                finding_id=f"rule_round_{run_id[:6]}_{count:04d}",
                                run_id=run_id,
                                detector_family=DetectorFamily.RULE,
                                detector_name="rules",
                                anomaly_type="SUSPICIOUS_ROUND_AMOUNT",
                                transaction_ids=[t.transaction_id],
                                entity_ids=[t.entity_id] if t.entity_id else [],
                                raw_score=raw_s,
                                normalized_score=raw_s,
                                severity=Severity.MEDIUM if raw_s > 0.5 else Severity.LOW,
                                monetary_exposure=amt,
                                evidence=evidence,
                                metadata={"denomination": float(denom)},
                            )
                        )
                        break

        return findings

    # 6. Rapid Reversal Rule
    def _detect_rapid_reversals(
        self, txns: list[CanonicalTransaction], run_id: str
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        # Sort transactions by date/time
        sorted_txns = sorted((t for t in txns if t.posting_date), key=lambda x: x.posting_date)

        for i in range(len(sorted_txns)):
            t1 = sorted_txns[i]
            amt1 = float(t1.amount)
            if abs(amt1) < 10000:
                continue

            for j in range(i + 1, min(i + 50, len(sorted_txns))):
                t2 = sorted_txns[j]
                days_gap = (t2.posting_date - t1.posting_date).days
                if days_gap > 3:
                    break

                amt2 = float(t2.amount)
                # Check for equal and opposite amount or reverse entity direction
                is_opposite_amount = (amt1 * amt2 < 0 and abs(abs(amt1) - abs(amt2)) / max(abs(amt1), abs(amt2)) <= 0.02)
                is_reverse_entity = (t1.entity_id and t2.entity_id and t1.entity_id == t2.entity_id and abs(abs(amt1) - abs(amt2)) / max(abs(amt1), abs(amt2)) <= 0.02)

                if is_opposite_amount or is_reverse_entity:
                    count += 1
                    raw_s = 0.85

                    evidence = [
                        EvidenceItem(
                            key="reversal_gap_hours",
                            label="Reversal time gap",
                            value=days_gap * 24,
                            unit="hours",
                            source=EvidenceSource.DERIVED,
                        ),
                        EvidenceItem(
                            key="original_amount",
                            label="Original Amount",
                            value=f"₹{abs(amt1):,.2f}",
                            source=EvidenceSource.LEDGER,
                        ),
                        EvidenceItem(
                            key="reversal_amount",
                            label="Reversal Amount",
                            value=f"₹{abs(amt2):,.2f}",
                            source=EvidenceSource.LEDGER,
                        ),
                    ]

                    findings.append(
                        DetectorFinding(
                            finding_id=f"rule_rev_{run_id[:6]}_{count:04d}",
                            run_id=run_id,
                            detector_family=DetectorFamily.RULE,
                            detector_name="rules",
                            anomaly_type="RAPID_REVERSAL",
                            transaction_ids=[t1.transaction_id, t2.transaction_id],
                            entity_ids=list({t1.entity_id, t2.entity_id} - {None}),
                            raw_score=raw_s,
                            normalized_score=raw_s,
                            severity=Severity.HIGH,
                            monetary_exposure=Decimal(str(max(abs(amt1), abs(amt2)))),
                            evidence=evidence,
                            metadata={"gap_days": days_gap},
                        )
                    )

        return findings

    # 7. Rare Counterparty Rule
    def _detect_rare_counterparties(
        self, txns: list[CanonicalTransaction], run_id: str, materiality: Decimal
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        total_count = len(txns)
        if total_count == 0:
            return []

        cp_counts = defaultdict(int)
        for t in txns:
            if t.entity_id:
                cp_counts[t.entity_id] += 1

        for t in txns:
            if not t.entity_id:
                continue
            freq = cp_counts[t.entity_id] / float(total_count)
            # Frequency <= 0.3% of total ledger and material amount
            if freq <= 0.003 and abs(t.amount) >= materiality:
                count += 1
                raw_s = 0.90

                evidence = [
                    EvidenceItem(
                        key="counterparty_frequency_pct",
                        label="Counterparty ledger frequency",
                        value=f"{freq * 100:.3f}%",
                        source=EvidenceSource.DERIVED,
                    ),
                    EvidenceItem(
                        key="transaction_count",
                        label="Total transactions for vendor",
                        value=cp_counts[t.entity_id],
                        unit="transactions",
                        source=EvidenceSource.LEDGER,
                    ),
                    EvidenceItem(
                        key="transaction_amount",
                        label="Transaction Amount",
                        value=f"₹{abs(t.amount):,.2f}",
                        source=EvidenceSource.LEDGER,
                    ),
                ]

                findings.append(
                    DetectorFinding(
                        finding_id=f"rule_rare_{run_id[:6]}_{count:04d}",
                        run_id=run_id,
                        detector_family=DetectorFamily.RULE,
                        detector_name="rules",
                        anomaly_type="RARE_COUNTERPARTY",
                        transaction_ids=[t.transaction_id],
                        entity_ids=[t.entity_id],
                        raw_score=raw_s,
                        normalized_score=raw_s,
                        severity=Severity.MEDIUM,
                        monetary_exposure=abs(t.amount),
                        evidence=evidence,
                        metadata={"frequency": freq, "txn_count": cp_counts[t.entity_id]},
                    )
                )

        return findings

    # 8. High-Value Outlier Rule (Robust Statistics z_robust = (x - median) / (1.4826 * MAD))
    def _detect_high_value_outliers(
        self, txns: list[CanonicalTransaction], run_id: str, materiality: Decimal
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        amounts = np.array([float(abs(t.amount)) for t in txns])
        if len(amounts) < 5:
            return []

        med = np.median(amounts)
        mad = np.median(np.abs(amounts - med))
        scale = 1.4826 * mad if mad > 0 else (np.std(amounts) + 1e-6)

        for t in txns:
            amt_val = float(abs(t.amount))
            z_robust = (amt_val - med) / scale if scale > 0 else 0.0

            if z_robust >= 4.0 and abs(t.amount) >= materiality:
                count += 1
                raw_s = min(0.95, 0.60 + (z_robust / 20.0))

                evidence = [
                    EvidenceItem(
                        key="robust_z_score",
                        label="Robust Amount Z-Score (MAD)",
                        value=f"{z_robust:.2f}",
                        source=EvidenceSource.DERIVED,
                    ),
                    EvidenceItem(
                        key="ledger_median_amount",
                        label="Ledger Median Amount",
                        value=f"₹{med:,.2f}",
                        source=EvidenceSource.DERIVED,
                    ),
                    EvidenceItem(
                        key="transaction_amount",
                        label="Transaction Amount",
                        value=f"₹{abs(t.amount):,.2f}",
                        source=EvidenceSource.LEDGER,
                    ),
                ]

                findings.append(
                    DetectorFinding(
                        finding_id=f"rule_outlier_{run_id[:6]}_{count:04d}",
                        run_id=run_id,
                        detector_family=DetectorFamily.RULE,
                        detector_name="rules",
                        anomaly_type="HIGH_VALUE_OUTLIER",
                        transaction_ids=[t.transaction_id],
                        entity_ids=[t.entity_id] if t.entity_id else [],
                        raw_score=raw_s,
                        normalized_score=raw_s,
                        severity=Severity.HIGH if z_robust >= 8.0 else Severity.MEDIUM,
                        monetary_exposure=abs(t.amount),
                        evidence=evidence,
                        metadata={"z_robust": z_robust, "median": med},
                    )
                )

        return findings

    # 9. GST Mismatch Rule
    def _detect_gst_mismatches(
        self, txns: list[CanonicalTransaction], run_id: str, context: dict[str, Any]
    ) -> list[DetectorFinding]:
        findings = []
        count = 0

        # Check context for gst_mismatch_flags if provided or perform internal check
        gst_records = context.get("gst_records", {})

        for t in txns:
            is_gst_flagged = False
            reason = ""

            if t.narration and "GST_MISMATCH" in t.narration.upper():
                is_gst_flagged = True
                reason = "Purchase register entry flagged with GST reconciliation variance in narration"

            if is_gst_flagged:
                count += 1
                raw_s = 0.90
                evidence = [
                    EvidenceItem(
                        key="gst_mismatch_type",
                        label="GST Reconciliation Finding",
                        value=reason,
                        source=EvidenceSource.GST,
                    ),
                    EvidenceItem(
                        key="invoice_number",
                        label="Invoice Number",
                        value=t.invoice_number or "N/A",
                        source=EvidenceSource.LEDGER,
                    ),
                    EvidenceItem(
                        key="recorded_gst_amount",
                        label="Recorded GST Amount",
                        value=f"₹{t.gst_amount:,.2f}" if t.gst_amount is not None else "N/A",
                        source=EvidenceSource.LEDGER,
                    ),
                ]

                findings.append(
                    DetectorFinding(
                        finding_id=f"rule_gst_{run_id[:6]}_{count:04d}",
                        run_id=run_id,
                        detector_family=DetectorFamily.RULE,
                        detector_name="rules",
                        anomaly_type="GST_BOOK_MISMATCH",
                        transaction_ids=[t.transaction_id],
                        entity_ids=[t.entity_id] if t.entity_id else [],
                        raw_score=raw_s,
                        normalized_score=raw_s,
                        severity=Severity.HIGH,
                        monetary_exposure=abs(t.amount),
                        evidence=evidence,
                        metadata={"gstin": t.gstin},
                    )
                )

        return findings
