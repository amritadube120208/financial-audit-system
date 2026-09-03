from collections import defaultdict
from decimal import Decimal
from typing import Any
from app.domain.enums import Severity
from app.domain.models import DetectorFinding, InvestigationCase, GraphPayload
from app.scoring.fusion import fuse_risk_scores


def build_investigation_cases(
    findings: list[DetectorFinding],
    run_id: str,
    materiality_threshold: Decimal = Decimal("50000"),
) -> list[InvestigationCase]:
    """
    Cluster raw detector findings into ranked InvestigationCase instances.
    """
    if not findings:
        return []

    # Map transaction ID -> list of findings
    txn_to_findings = defaultdict(list)
    graph_findings = []
    other_findings = []

    for f in findings:
        if f.anomaly_type == "ROUND_TRIP" or f.detector_family.value == "GRAPH":
            graph_findings.append(f)
        else:
            other_findings.append(f)
            for t_id in f.transaction_ids:
                txn_to_findings[t_id].append(f)

    cases: list[InvestigationCase] = []
    processed_findings: set[str] = set()

    case_counter = 0

    # 1. First, create cases for Graph Round-Trip findings (Hero Investigations)
    for g_finding in graph_findings:
        if g_finding.finding_id in processed_findings:
            continue

        case_counter += 1
        processed_findings.add(g_finding.finding_id)

        # Collect related transaction IDs and entity IDs
        t_ids = list(g_finding.transaction_ids)
        e_ids = list(g_finding.entity_ids)

        # Gather related findings for these transactions
        related_findings = [g_finding]
        for t_id in t_ids:
            for f in txn_to_findings.get(t_id, []):
                if f.finding_id not in processed_findings:
                    related_findings.append(f)
                    processed_findings.add(f.finding_id)

        # Determine scores across detector families for risk fusion
        scores_by_family = {}
        for f in related_findings:
            fam_key = f.detector_family.value
            current = scores_by_family.get(fam_key, 0.0)
            scores_by_family[fam_key] = max(current, f.normalized_score)

        exposure = max((f.monetary_exposure for f in related_findings), default=g_finding.monetary_exposure)

        fused_score, severity, breakdown = fuse_risk_scores(
            detector_scores=scores_by_family,
            amount=exposure,
            materiality_threshold=materiality_threshold,
        )

        # Extract graph payload if present in metadata
        graph_data = g_finding.metadata.get("graph_payload")
        graph_payload = GraphPayload(**graph_data) if graph_data else None

        # Consolidate evidence
        all_evidence = []
        seen_keys = set()
        for f in related_findings:
            for ev in f.evidence:
                if ev.key not in seen_keys:
                    seen_keys.add(ev.key)
                    all_evidence.append(ev)

        anomaly_types = list({f.anomaly_type for f in related_findings})

        title = f"Three-entity circular payment near year end" if "ROUND_TRIP" in anomaly_types else f"Circular payment investigation ({len(e_ids)} entities)"

        case = InvestigationCase(
            case_id=f"case_roundtrip_{case_counter:03d}",
            run_id=run_id,
            title=title,
            severity=severity,
            risk_score=fused_score,
            primary_transaction_id=t_ids[0] if t_ids else None,
            transaction_ids=t_ids,
            entity_ids=e_ids,
            anomaly_types=anomaly_types,
            monetary_exposure=exposure,
            evidence=all_evidence,
            risk_breakdown=breakdown,
            explanation="",  # Attached by explanation engine
            graph=graph_payload,
        )
        cases.append(case)

    # 2. Next, group remaining findings by transaction or entity cluster
    remaining_findings = [f for f in findings if f.finding_id not in processed_findings]

    # Cluster by primary transaction ID
    clusters = defaultdict(list)
    for f in remaining_findings:
        key = f.transaction_ids[0] if f.transaction_ids else f.finding_id
        clusters[key].append(f)

    for cluster_key, cluster_findings in clusters.items():
        case_counter += 1
        for f in cluster_findings:
            processed_findings.add(f.finding_id)

        t_ids = list({t for f in cluster_findings for t in f.transaction_ids})
        e_ids = list({e for f in cluster_findings for e in f.entity_ids})
        anomaly_types = list({f.anomaly_type for f in cluster_findings})

        scores_by_family = {}
        for f in cluster_findings:
            fam_key = f.detector_family.value
            current = scores_by_family.get(fam_key, 0.0)
            scores_by_family[fam_key] = max(current, f.normalized_score)

        exposure = max((f.monetary_exposure for f in cluster_findings), default=Decimal("0.00"))

        fused_score, severity, breakdown = fuse_risk_scores(
            detector_scores=scores_by_family,
            amount=exposure,
            materiality_threshold=materiality_threshold,
        )

        all_evidence = []
        seen_keys = set()
        for f in cluster_findings:
            for ev in f.evidence:
                if ev.key not in seen_keys:
                    seen_keys.add(ev.key)
                    all_evidence.append(ev)

        # Title creation
        first_type = anomaly_types[0] if anomaly_types else "ANOMALY"
        title = f"{first_type.replace('_', ' ').title()} investigation"
        if "EXACT_DUPLICATE" in anomaly_types:
            title = "Exact duplicate transaction pair detected"
        elif "BACKDATED_POSTING" in anomaly_types:
            title = "Backdated journal entry near period close"
        elif "PERIOD_END_POSTING" in anomaly_types:
            title = "High-value period-end posting anomaly"
        elif "GST_BOOK_MISMATCH" in anomaly_types:
            title = "Purchase register vs GSTR-2B mismatch"

        case = InvestigationCase(
            case_id=f"case_inv_{case_counter:03d}",
            run_id=run_id,
            title=title,
            severity=severity,
            risk_score=fused_score,
            primary_transaction_id=t_ids[0] if t_ids else None,
            transaction_ids=t_ids,
            entity_ids=e_ids,
            anomaly_types=anomaly_types,
            monetary_exposure=exposure,
            evidence=all_evidence,
            risk_breakdown=breakdown,
            explanation="",
            graph=None,
        )
        cases.append(case)

    # Sort cases by risk score descending
    cases.sort(key=lambda c: c.risk_score, reverse=True)
    return cases
