import asyncio
import json
import time
from typing import Any
from fastapi import APIRouter, Header, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.domain.enums import RunState, AnalysisMode
from app.orchestration.pipeline import pipeline_orchestrator, event_bus
from app.persistence.store import memory_store

router = APIRouter(prefix="/api/v1/audit-runs", tags=["Audit Runs"])


class CreateRunRequest(BaseModel):
    dataset_id: str
    gst_dataset_id: str | None = None
    configuration: dict[str, Any] = Field(default_factory=dict)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_audit_run(
    request: CreateRunRequest,
    background_tasks: BackgroundTasks,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    """Start multi-engine analysis run for a dataset."""
    # Check Idempotency-Key
    if idempotency_key:
        if idempotency_key in memory_store.idempotency_keys:
            existing_run_id = memory_store.idempotency_keys[idempotency_key]
            if existing_run_id in memory_store.runs:
                return memory_store.runs[existing_run_id]

    if request.dataset_id not in memory_store.datasets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DATASET_NOT_FOUND", "message": f"Dataset '{request.dataset_id}' not found."},
        )

    dataset_ref = memory_store.datasets[request.dataset_id]
    transactions = memory_store.dataset_transactions[request.dataset_id]
    run_id = f"run_{int(time.time()*1000)}"

    if idempotency_key:
        memory_store.idempotency_keys[idempotency_key] = run_id

    # Create initial run metadata
    run_meta = {
        "run_id": run_id,
        "dataset_id": request.dataset_id,
        "status": RunState.CREATED.value,
        "analysis_mode": AnalysisMode.LIVE_FULL.value,
        "pipeline_version": settings.PIPELINE_VERSION,
        "scoring_config_version": settings.SCORING_CONFIG_VERSION,
        "events_url": f"/api/v1/audit-runs/{run_id}/events",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    memory_store.runs[run_id] = run_meta

    # Execute pipeline synchronously for fast stage turnaround or as task
    result = await pipeline_orchestrator.run_pipeline(
        run_id=run_id,
        dataset_sha256=dataset_ref.sha256,
        transactions=transactions,
        config=request.configuration,
    )
    memory_store.runs[run_id] = result

    return result


@router.get("/{run_id}")
async def get_audit_run(run_id: str):
    """Retrieve complete audit run result."""
    if run_id not in memory_store.runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )
    return memory_store.runs[run_id]


@router.get("/{run_id}/summary")
async def get_audit_run_summary(run_id: str):
    """Retrieve compact audit run metrics summary."""
    if run_id not in memory_store.runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )
    run_data = memory_store.runs[run_id]
    return {
        "run_id": run_id,
        "status": run_data.get("status"),
        "analysis_mode": run_data.get("analysis_mode"),
        "summary": run_data.get("summary", {}),
        "detectors": run_data.get("detectors", []),
    }


@router.get("/{run_id}/events")
async def stream_run_events(run_id: str):
    """Server-Sent Events (SSE) endpoint for real-time progress updates."""
    # Check DEMO_FORCE_SSE_FAILURE
    if settings.DEMO_FORCE_SSE_FAILURE == 1:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "SSE_UNAVAILABLE", "message": "SSE stream disabled by DEMO_FORCE_SSE_FAILURE switch."},
        )

    queue = event_bus.subscribe(run_id)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=15.0)
                data_str = json.dumps(event.to_dict())
                yield f"event: progress\ndata: {data_str}\n\n"
                if event.state in (RunState.READY, RunState.DEGRADED, RunState.FAILED):
                    break
        except asyncio.TimeoutError:
            yield "event: ping\ndata: {}\n\n"
        finally:
            event_bus.unsubscribe(run_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
