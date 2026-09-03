import math
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any
import networkx as nx

from app.domain.enums import DetectorFamily, Severity, EvidenceSource
from app.domain.evidence import EvidenceItem
from app.domain.models import CanonicalTransaction, DetectorFinding, GraphNode, GraphEdge, GraphPayload
from app.detectors.base import BaseDetector

COMPANY_ACCOUNTS = {
    "company_main_self",
    "vendor advances",
    "hdfc current account",
    "icici bank account",
    "sbi corporate account",
    "accounts payable",
    "operating expenses",
    "raw material purchases",
    "capital expenditure",
}


def _normalize_node_name(name: str | None, is_debit: bool) -> str:
    if not name:
        return "COMPANY_MAIN_SELF"
    norm = name.strip()
    if norm.lower() in COMPANY_ACCOUNTS or "company" in norm.lower() or "self" in norm.lower():
        return "COMPANY_MAIN_SELF"
    return norm


class GraphCycleDetector(BaseDetector):
    name = "graph_cycles"
    family = DetectorFamily.GRAPH
    version = "1.0.0"

    def run(
        self,
        transactions: list[CanonicalTransaction],
        run_id: str,
        context: dict[str, Any] | None = None,
    ) -> list[DetectorFinding]:
        if not transactions or len(transactions) < 3:
            return []

        # Filter to material transactions (>= 10,000) for graph search efficiency
        material_txns = [t for t in transactions if abs(t.amount) >= Decimal("10000")]
        if len(material_txns) < 3:
            material_txns = transactions

        # Build directed multigraph
        G = nx.DiGraph()

        # Add nodes and edges
        for t in material_txns:
            # Determine source/target entities
            raw_src = t.debit_account or "COMPANY_MAIN_SELF"
            raw_dst = t.counterparty_name or t.credit_account or t.entity_id or "UNKNOWN_VENDOR"

            src = _normalize_node_name(raw_src, is_debit=True)
            dst = _normalize_node_name(raw_dst, is_debit=False)

            # Skip self-loops
            if src == dst:
                continue

            G.add_node(src, label=src, kind="company" if src == "COMPANY_MAIN_SELF" else "account")
            G.add_node(dst, label=dst, kind="company" if dst == "COMPANY_MAIN_SELF" else "vendor")

            # Store edge attributes
            G.add_edge(
                src,
                dst,
                transaction_id=t.transaction_id,
                amount=float(abs(t.amount)),
                amount_decimal=abs(t.amount),
                posted_at=t.posting_date.isoformat(),
                posting_date=t.posting_date,
                is_manual=t.is_manual_entry,
            )

        findings: list[DetectorFinding] = []
        count = 0

        # Find simple cycles up to 4 hops
        try:
            cycles = [c for c in nx.simple_cycles(G) if 2 <= len(c) <= 4]
        except Exception:
            return []

        seen_txn_sets = set()

        for cycle in cycles:
            # Reconstruct edges along the cycle path
            cycle_edges = []
            cycle_txns = []
            amounts = []
            dates = []

            valid_cycle = True
            for u, v in zip(cycle, cycle[1:] + [cycle[0]]):
                if G.has_edge(u, v):
                    edge_data = G[u][v]
                    cycle_edges.append((u, v, edge_data))
                    cycle_txns.append(edge_data["transaction_id"])
                    amounts.append(edge_data["amount"])
                    dates.append(edge_data["posting_date"])
                else:
                    valid_cycle = False
                    break

            if not valid_cycle or len(cycle_txns) < 2:
                continue

            # Deduplicate by set of transaction IDs
            txn_key = tuple(sorted(cycle_txns))
            if txn_key in seen_txn_sets:
                continue
            seen_txn_sets.add(txn_key)

            # Metrics calculation
            max_amt = max(amounts) if amounts else 1.0
            min_amt = min(amounts) if amounts else 1.0
            amount_sim = 1.0 - ((max_amt - min_amt) / (max_amt + 1e-6))

            min_date = min(dates)
            max_date = max(dates)
            elapsed_days = max(0, (max_date - min_date).days)
            elapsed_hours = max(1, elapsed_days * 24)

            # Temporal compactness T
            T = math.exp(-elapsed_hours / 72.0)

            # Year-end proximity Y
            Y = 1.0 if any(d.month == 3 and d.day >= 25 for d in dates) else 0.5

            # Rarity R
            R = 0.9 if len(cycle) == 3 else 0.75

            # Graph Cycle Score G(C)
            graph_score = float(0.35 * T + 0.35 * amount_sim + 0.15 * R + 0.15 * Y)
            graph_score = min(1.0, max(0.0, graph_score))

            if graph_score >= 0.50:
                count += 1
                sev = Severity.CRITICAL if (graph_score >= 0.80 and Y == 1.0) else Severity.HIGH

                amt_strs = [f"₹{a:,.2f}" for a in amounts]

                evidence = [
                    EvidenceItem(
                        key="cycle_length",
                        label="Circular flow length",
                        value=len(cycle),
                        unit="entities",
                        source=EvidenceSource.GRAPH,
                    ),
                    EvidenceItem(
                        key="cycle_path",
                        label="Circular payment path",
                        value=" → ".join(cycle + [cycle[0]]),
                        source=EvidenceSource.GRAPH,
                    ),
                    EvidenceItem(
                        key="cycle_duration_hours",
                        label="Cycle completed within",
                        value=elapsed_hours,
                        unit="hours",
                        source=EvidenceSource.GRAPH,
                    ),
                    EvidenceItem(
                        key="amount_similarity",
                        label="Transfer amount similarity",
                        value=f"{amount_sim * 100:.1f}%",
                        source=EvidenceSource.DERIVED,
                    ),
                    EvidenceItem(
                        key="cycle_amounts",
                        label="Transfer amounts",
                        value=", ".join(amt_strs),
                        source=EvidenceSource.LEDGER,
                    ),
                ]

                nodes_payload = [
                    GraphNode(id=n, label=G.nodes[n].get("label", n), kind=G.nodes[n].get("kind", "entity"))
                    for n in cycle
                ]
                edges_payload = [
                    GraphEdge(
                        id=f"edge-{idx+1}",
                        source=u,
                        target=v,
                        transaction_id=ed["transaction_id"],
                        amount_inr=Decimal(str(ed["amount"])),
                        posted_at=ed["posted_at"],
                    )
                    for idx, (u, v, ed) in enumerate(cycle_edges)
                ]

                graph_payload = GraphPayload(
                    nodes=nodes_payload,
                    edges=edges_payload,
                    metrics={
                        "cycle_length": len(cycle),
                        "elapsed_hours": elapsed_hours,
                        "amount_similarity": amount_sim,
                        "temporal_compactness": T,
                    },
                )

                findings.append(
                    DetectorFinding(
                        finding_id=f"graph_cycle_{run_id[:6]}_{count:04d}",
                        run_id=run_id,
                        detector_family=DetectorFamily.GRAPH,
                        detector_name="graph_cycles",
                        anomaly_type="ROUND_TRIP",
                        transaction_ids=cycle_txns,
                        entity_ids=cycle,
                        raw_score=graph_score,
                        normalized_score=min(0.98, float(graph_score)),
                        severity=sev,
                        monetary_exposure=Decimal(str(max_amt)),
                        evidence=evidence,
                        metadata={
                            "graph_payload": graph_payload.model_dump(),
                            "amount_similarity": amount_sim,
                            "elapsed_hours": elapsed_hours,
                        },
                    )
                )

        return findings
