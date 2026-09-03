from fastapi import APIRouter, HTTPException, status
from app.persistence.store import stage_store

router = APIRouter(tags=["findings"])


@router.get("/audit-runs/{run_id}/findings")
async def get_audit_run_findings(run_id: str):
    """Retrieve prioritized investigation cases for run."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    cases = result.get("cases", [])
    return {
        "run_id": run_id,
        "total_cases": len(cases),
        "cases": cases,
    }


@router.get("/findings/{finding_id}")
@router.get("/investigations/{finding_id}")
async def get_finding(finding_id: str):
    """Retrieve individual investigation case by ID."""
    for run_id, result in stage_store._runs.items():
        for case in result.get("cases", []):
            if case.get("case_id") == finding_id:
                return case

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "FINDING_NOT_FOUND", "message": f"Finding/Case '{finding_id}' not found."},
    )


@router.get("/findings/{finding_id}/graph")
@router.get("/investigations/{finding_id}/graph")
async def get_finding_graph(finding_id: str):
    """Retrieve Cytoscape graph payload for investigation case."""
    finding = await get_finding(finding_id)
    graph_payload = finding.get("graph_payload")

    if not graph_payload:
        # Construct fallback 2-node graph if explicit graph cycle payload absent
        txns = finding.get("transaction_ids", [])
        entities = finding.get("entity_ids", ["COMPANY_SELF", "VENDOR_X"])
        src = entities[0] if entities else "COMPANY_SELF"
        dst = entities[1] if len(entities) > 1 else "VENDOR_X"

        graph_payload = {
            "nodes": [
                {"id": src, "label": src, "kind": "company"},
                {"id": dst, "label": dst, "kind": "vendor"},
            ],
            "edges": [
                {
                    "id": "edge-1",
                    "source": src,
                    "target": dst,
                    "transaction_id": txns[0] if txns else None,
                    "amount_inr": finding.get("monetary_exposure", 0.0),
                }
            ],
            "metrics": {},
        }

    return {
        "finding_id": finding_id,
        "graph": graph_payload,
    }
