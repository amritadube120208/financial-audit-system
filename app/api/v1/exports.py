from fastapi import APIRouter, HTTPException, status
from app.persistence.store import memory_store

router = APIRouter(prefix="/api/v1/exports", tags=["Exports"])


@router.get("/{run_id}")
async def export_audit_report(run_id: str):
    """Export authoritative audit triage report."""
    if run_id not in memory_store.runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    run_data = memory_store.runs[run_id]

    report = {
        "report_title": "AuditGraph Financial Anomaly Triage Report",
        "disclaimer": "This report prioritizes evidence for human auditor investigation and does not make a fraud determination.",
        "run_id": run_id,
        "pipeline_version": run_data.get("pipeline_version"),
        "analysis_mode": run_data.get("analysis_mode"),
        "summary": run_data.get("summary"),
        "detectors_status": run_data.get("detectors"),
        "prioritized_cases": run_data.get("top_cases", []),
    }

    return report
