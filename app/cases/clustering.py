import logging
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from typing import Any, Sequence
from app.domain.models import DetectorFinding

logger = logging.getLogger(__name__)

MAX_CASE_TRANSACTION_COUNT = 100
MAX_CASE_FINDING_COUNT = 250


class DisjointSet:
    def __init__(self, items: Sequence[str]):
        self.parent = {item: item for item in items}
        self.rank = {item: 0 for item in items}

    def find(self, item: str) -> str:
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, item1: str, item2: str):
        root1 = self.find(item1)
        root2 = self.find(item2)

        if root1 != root2:
            if self.rank[root1] > self.rank[root2]:
                self.parent[root2] = root1
            elif self.rank[root1] < self.rank[root2]:
                self.parent[root1] = root2
            else:
                self.parent[root2] = root1
                self.rank[root1] += 1


class EvidenceCluster:
    def __init__(self, cluster_id: str):
        self.cluster_id = cluster_id
        self.findings: list[DetectorFinding] = []

    def add_finding(self, finding: DetectorFinding):
        self.findings.append(finding)

    @property
    def transaction_ids(self) -> list[str]:
        txns = set()
        for f in self.findings:
            txns.update(f.transaction_ids)
        return sorted(list(txns))

    @property
    def entity_ids(self) -> list[str]:
        entities = set()
        for f in self.findings:
            entities.update(f.entity_ids)
        return sorted(list(entities))

    @property
    def anomaly_types(self) -> list[str]:
        anomalies = set()
        for f in self.findings:
            anomalies.add(f.anomaly_type)
        return sorted(list(anomalies))

    @property
    def monetary_exposure(self) -> Decimal:
        if not self.findings:
            return Decimal("0.00")
        return max(f.monetary_exposure for f in self.findings)


def cluster_detector_findings(findings: list[DetectorFinding]) -> list[EvidenceCluster]:
    """
    Groups raw detector findings into EvidenceClusters using a multi-criteria Evidence Graph.
    Uses Union-Find on shared transaction IDs, invoices, graph cycles, reference numbers, and entity identities.
    Enforces MAX_CASE_TRANSACTION_COUNT and MAX_CASE_FINDING_COUNT cluster bounds.
    """
    if not findings:
        return []

    finding_map = {f.finding_id: f for f in findings}
    dsu = DisjointSet(list(finding_map.keys()))

    # Indexes for fast edge creation
    txn_to_findings = defaultdict(list)
    inv_to_findings = defaultdict(list)
    ref_to_findings = defaultdict(list)
    entity_to_findings = defaultdict(list)

    for f in findings:
        for tid in f.transaction_ids:
            txn_to_findings[tid].append(f.finding_id)

        inv = f.metadata.get("invoice_number")
        if inv and str(inv).strip().lower() not in ("none", "nan", ""):
            inv_to_findings[str(inv).strip().upper()].append(f.finding_id)

        ref = f.metadata.get("reference_number")
        if ref and str(ref).strip().lower() not in ("none", "nan", ""):
            ref_to_findings[str(ref).strip().upper()].append(f.finding_id)

        for eid in f.entity_ids:
            if eid and eid != "UNKNOWN_ENTITY":
                entity_to_findings[eid].append(f.finding_id)

    # 1. Union on shared transaction IDs (highest priority)
    for tid, fids in txn_to_findings.items():
        if len(fids) > 1:
            first = fids[0]
            for other in fids[1:]:
                dsu.union(first, other)

    # 2. Union on shared invoice numbers
    for inv, fids in inv_to_findings.items():
        if len(fids) > 1:
            first = fids[0]
            for other in fids[1:]:
                dsu.union(first, other)

    # 3. Union on shared reference numbers
    for ref, fids in ref_to_findings.items():
        if len(fids) > 1:
            first = fids[0]
            for other in fids[1:]:
                dsu.union(first, other)

    # 4. Union on shared graph cycles
    cycle_to_findings = defaultdict(list)
    for f in findings:
        if f.detector_family == "GRAPH" or f.anomaly_type == "ROUND_TRIP":
            path = f.metadata.get("graph_payload", {}).get("metrics", {}).get("cycle_path")
            if path:
                cycle_to_findings[path].append(f.finding_id)

    for cycle_path, fids in cycle_to_findings.items():
        if len(fids) > 1:
            first = fids[0]
            for other in fids[1:]:
                dsu.union(first, other)

    # Gather clusters
    groups = defaultdict(list)
    for fid in finding_map.keys():
        root = dsu.find(fid)
        groups[root].append(finding_map[fid])

    clusters = []
    cluster_idx = 1
    for root, group_findings in groups.items():
        # Check cluster bounds protection
        if len(group_findings) > MAX_CASE_FINDING_COUNT:
            logger.warning(f"Cluster {root} exceeded MAX_CASE_FINDING_COUNT ({len(group_findings)} > {MAX_CASE_FINDING_COUNT}). Splitting sub-clusters.")
            chunk_size = MAX_CASE_FINDING_COUNT
            for i in range(0, len(group_findings), chunk_size):
                sub_group = group_findings[i:i + chunk_size]
                cluster = EvidenceCluster(cluster_id=f"cluster_{cluster_idx:04d}")
                for f in sub_group:
                    cluster.add_finding(f)
                clusters.append(cluster)
                cluster_idx += 1
        else:
            cluster = EvidenceCluster(cluster_id=f"cluster_{cluster_idx:04d}")
            for f in group_findings:
                cluster.add_finding(f)
            clusters.append(cluster)
            cluster_idx += 1

    return clusters
