import asyncio
import time
from typing import Any
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.domain.enums import RunState
from app.orchestration.pipeline import pipeline_orchestrator, event_bus
from app.persistence.store import stage_store

router = APIRouter(prefix="/audit-runs", tags=["audit-runs"])


class CreateAuditRunRequest(BaseModel):
    dataset_id: str


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_audit_run(request: CreateAuditRunRequest):
    """Start multi-engine financial audit run over uploaded dataset."""
    dataset_ref = stage_store.get_dataset(request.dataset_id)
    if not dataset_ref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DATASET_NOT_FOUND", "message": f"Dataset '{request.dataset_id}' not found."},
        )

    transactions = stage_store.get_transactions_for_dataset(request.dataset_id)
    run_id = f"run_{int(time.time()*1000)}"

    result = await pipeline_orchestrator.run_pipeline(
        run_id=run_id,
        dataset_sha256=dataset_ref.sha256,
        transactions=transactions,
    )

    return result


@router.get("/{run_id}")
async def get_audit_run(run_id: str):
    """Retrieve audit run status & result."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )
    return result


@router.get("/{run_id}/summary")
async def get_audit_run_summary(run_id: str):
    """Retrieve summary metrics of audit run."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )
    return {
        "run_id": run_id,
        "summary": {
            "transactions_analyzed": result.get("transactions_analyzed", 0),
            "total_cases": result.get("total_cases", 0),
            "critical_findings": result.get("critical_cases", 0),
            "high_findings": result.get("high_cases", 0),
            "review_surface_reduction_pct": result.get("review_surface_reduction_pct", 0.0),
            "duration_ms": result.get("duration_ms", 0.0),
        },
    }
