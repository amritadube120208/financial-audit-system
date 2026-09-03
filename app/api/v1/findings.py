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

    formatted = []
    for c in sliced:
        item = dict(c) if isinstance(c, dict) else c.model_dump()
        item["finding_id"] = item.get("case_id") or item.get("finding_id")
        item["severity"] = str(item.get("severity", "LOW")).lower()
        item["explanation"] = item.get("explanation") or item.get("description", "")
        item["detector_family"] = ", ".join(k for k, v in item.get("detector_scores", {}).items() if v)
        item["has_graph"] = bool(item.get("graph_payload"))
        item["transaction_count"] = len(item.get("transaction_ids", []))
        item["primary_entity"] = (item.get("entity_ids") or [None])[0]
        item["anomaly_type"] = (item.get("anomaly_types") or ["ANOMALY"])[0]
        formatted.append(item)

    return {
        "run_id": run_id,
        "total": len(cases),
        "limit": limit,
        "offset": offset,
        "items": formatted,
        "total_cases": len(cases),
        "cases": formatted,
        "findings": formatted,
    }


@router.get("/findings/{finding_id}")
@router.get("/investigations/{finding_id}")
async def get_finding(finding_id: str):
    """Retrieve individual investigation case by ID."""
    for run_id, result in stage_store._runs.items():
        for case in result.get("cases", []):
            if case.get("case_id") == finding_id or case.get("finding_id") == finding_id:
                return case

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

    if not graph_payload or not graph_payload.get("nodes"):
        return {
            "finding_id": finding_id,
            "nodes": [],
            "edges": [],
            "cycle_info": {
                "is_cycle": False,
                "cycle_length": 0,
                "total_flow_amount": 0.0,
                "message": "No circular money-flow evidence for this investigation.",
            },
        }

    raw_nodes = graph_payload.get("nodes", [])
    raw_edges = graph_payload.get("edges", [])

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

    flow_amt = float(finding.get("monetary_exposure") or finding.get("amount") or 0.0)

    return {
        "finding_id": finding_id,
        "nodes": cy_nodes,
        "edges": cy_edges,
        "cycle_info": {
            "is_cycle": len(cy_edges) >= 2,
            "cycle_length": len(cy_nodes),
            "total_flow_amount": flow_amt,
        },
    }
