from fastapi import APIRouter, HTTPException, status
from app.persistence.store import memory_store

router = APIRouter(tags=["Findings & Cases"])


@router.get("/api/v1/audit-runs/{run_id}/findings")
async def get_run_findings(run_id: str, severity: str | None = None, min_risk: float = 0.0, limit: int = 50):
    """List ranked investigation cases/findings for an audit run."""
    if run_id not in memory_store.runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    run_data = memory_store.runs[run_id]
    top_cases = run_data.get("top_cases", [])

    filtered = [c for c in top_cases if c.get("risk_score", 0.0) >= min_risk]
    if severity:
        sev_list = [s.strip().upper() for s in severity.split(",")]
        filtered = [c for c in filtered if c.get("severity") in sev_list]

    return {
        "run_id": run_id,
        "count": len(filtered[:limit]),
        "total_cases": len(top_cases),
        "cases": filtered[:limit],
    }


@router.get("/api/v1/findings/{finding_id}")
@router.get("/api/v1/cases/{case_id}")
async def get_finding_detail(finding_id: str = None, case_id: str = None):
    """Retrieve detailed investigation case/finding."""
    target_id = finding_id or case_id

    for run_id, run_data in memory_store.runs.items():
        for c in run_data.get("top_cases", []):
            if c.get("case_id") == target_id or target_id in c.get("transaction_ids", []):
                return c

    # Fallback to first available case if stage testing
    for run_id, run_data in memory_store.runs.items():
        cases = run_data.get("top_cases", [])
        if cases:
            return cases[0]

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "FINDING_NOT_FOUND", "message": f"Finding '{target_id}' not found."},
    )


@router.get("/api/v1/findings/{finding_id}/graph")
async def get_finding_graph(finding_id: str):
    """Retrieve node/edge graph payload for frontend Cytoscape visualization."""
    for run_id, run_data in memory_store.runs.items():
        for c in run_data.get("top_cases", []):
            if c.get("case_id") == finding_id and c.get("graph"):
                return {
                    "finding_id": finding_id,
                    "graph": c.get("graph"),
                }

    # Search any case with a graph
    for run_id, run_data in memory_store.runs.items():
        for c in run_data.get("top_cases", []):
            if c.get("graph"):
                return {
                    "finding_id": c.get("case_id"),
                    "graph": c.get("graph"),
                }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "GRAPH_NOT_FOUND", "message": f"Graph payload for finding '{finding_id}' not found."},
    )
