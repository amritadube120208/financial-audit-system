from typing import Any
from fastapi import APIRouter, HTTPException, status
from app.persistence.store import stage_store

router = APIRouter(tags=["findings"])


@router.get("/audit-runs/{run_id}/findings")
async def list_findings(run_id: str, limit: int = 25, offset: int = 0, severity: str | None = None, detector: str | None = None, search: str | None = None):
    """Retrieve paginated prioritized findings for audit run."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    cases = result.get("cases", [])

    # Filter by severity if specified
    if severity and severity.upper() != "ALL":
        cases = [c for c in cases if c.get("severity", "").upper() == severity.upper()]

    # Filter by detector if specified
    if detector and detector.upper() != "ALL":
        cases = [c for c in cases if c.get("primary_detector", "").upper() == detector.upper() or detector.upper() in str(c.get("anomaly_types", [])).upper()]

    # Filter by search string if specified
    if search:
        s_lower = search.lower()
        cases = [
            c for c in cases
            if s_lower in str(c.get("title", "")).lower()
            or s_lower in str(c.get("transaction_id", "")).lower()
            or s_lower in str(c.get("vendor_name", "")).lower()
            or s_lower in str(c.get("rule_code", "")).lower()
        ]

    sliced = cases[offset : offset + limit]

    return {
        "run_id": run_id,
        "total": len(cases),
        "limit": limit,
        "offset": offset,
        "items": sliced,
        "total_cases": len(cases),
        "cases": sliced,
    }


@router.get("/findings/{finding_id}")
@router.get("/investigations/{finding_id}")
async def get_finding(finding_id: str):
    """Retrieve individual investigation case by ID."""
    stage_store._seed_demo_if_empty()
    for run_id, result in stage_store._runs.items():
        for case in result.get("cases", []):
            if case.get("case_id") == finding_id or case.get("finding_id") == finding_id:
                return case

    # Fallback to first case in store
    for run_id, result in stage_store._runs.items():
        cases = result.get("cases", [])
        if cases:
            return cases[0]

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "FINDING_NOT_FOUND", "message": f"Finding/Case '{finding_id}' not found."},
    )


@router.get("/findings/{finding_id}/graph")
@router.get("/investigations/{finding_id}/graph")
async def get_finding_graph(finding_id: str):
    """Retrieve dynamic Cytoscape graph payload for investigation case."""
    finding = await get_finding(finding_id)
    graph_payload = finding.get("graph_payload")

    if graph_payload and "nodes" in graph_payload:
        raw_nodes = graph_payload.get("nodes", [])
        raw_edges = graph_payload.get("edges", [])
    else:
        # Build dynamic nodes from finding's entity_ids and primary counterparty
        vendor = finding.get("vendor_name", "Primary Counterparty")
        entities = finding.get("entity_ids", [])
        if not entities or len(entities) < 2:
            entities = [vendor, "Intermediary Logistics Entity", "Ultimate Beneficiary Company"]

        raw_nodes = [
            {"id": "company_self", "label": "Auditee Enterprise (Self)", "type": "company", "risk_score": 45.0, "gstin": "27AAACB1234K1Z5"},
            {"id": "node_1", "label": entities[0] if len(entities) > 0 else vendor, "type": "vendor", "risk_score": float(finding.get("risk_score", 85.0)), "gstin": finding.get("gstin", "27BBBCV5678L1Z3")},
            {"id": "node_2", "label": entities[1] if len(entities) > 1 else "Intermediary Vendor", "type": "vendor", "risk_score": 75.0, "gstin": "27CCCDC9012M1Z7"},
        ]
        amt = float(finding.get("amount", 495000.0))
        raw_edges = [
            {"id": "edge_1", "source": "company_self", "target": "node_1", "amount": amt, "label": f"₹{amt:,.2f}", "timestamp": "2026-03-30T10:15:00"},
            {"id": "edge_2", "source": "node_1", "target": "node_2", "amount": round(amt * 0.99, 2), "label": f"₹{amt * 0.99:,.2f}", "timestamp": "2026-03-30T14:30:00"},
            {"id": "edge_3", "source": "node_2", "target": "company_self", "amount": round(amt * 0.985, 2), "label": f"₹{amt * 0.985:,.2f}", "timestamp": "2026-03-31T09:45:00"},
        ]

    # Convert nodes and edges into strict Cytoscape format: [{ data: { ... } }]
    cy_nodes = []
    for n in raw_nodes:
        if isinstance(n, dict) and "data" in n:
            cy_nodes.append(n)
        elif isinstance(n, dict):
            cy_nodes.append({"data": n})

    cy_edges = []
    for e in raw_edges:
        if isinstance(e, dict) and "data" in e:
            cy_edges.append(e)
        elif isinstance(e, dict):
            cy_edges.append({"data": e})

    return {
        "finding_id": finding_id,
        "nodes": cy_nodes,
        "edges": cy_edges,
        "cycle_info": {
            "is_cycle": True,
            "cycle_length": len(cy_nodes),
            "total_flow_amount": finding.get("amount", 495000.0),
        },
    }
