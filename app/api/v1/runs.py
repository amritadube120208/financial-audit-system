import asyncio
import time
import uuid
import json
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


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_audit_runs():
    """List all available audit runs in database / stage store."""
    runs = []
    for run_id, res in stage_store._runs.items():
        runs.append({
            "run_id": run_id,
            "dataset_id": res.get("dataset_id", "ds_unknown"),
            "status": res.get("status", "READY"),
            "analysis_mode": res.get("analysis_mode", "LIVE"),
            "created_at": res.get("created_at"),
            "transactions_analyzed": res.get("transactions_analyzed", 0),
            "total_cases": res.get("total_cases", 0),
            "critical_cases": res.get("critical_cases", 0),
        })
    return runs


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
    run_id = f"run_{uuid.uuid4().hex}"

    result = await pipeline_orchestrator.run_pipeline(
        run_id=run_id,
        dataset_sha256=dataset_ref.sha256,
        transactions=transactions,
    )

    result["dataset_id"] = request.dataset_id
    result["total_value_inr"] = sum(float(abs(t.amount)) for t in transactions)
    flagged = {tid for case in result.get("cases", []) for tid in case.get("transaction_ids", [])}
    result["unique_flagged_transactions"] = len(flagged)
    result["total_exposure"] = sum(float(abs(t.amount)) for t in transactions if t.transaction_id in flagged)
    stage_store.save_run_result(run_id, result)

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

    cases = result.get("cases", [])
    total_exp = result.get("total_exposure") or sum(float(c.get("monetary_exposure", 0)) for c in cases)
    total_val = result.get("total_value_inr") or sum(float(c.get("monetary_exposure", 0)) for c in cases)

    summary_obj = {
        "suspicious_transactions": result.get("unique_flagged_transactions", 0),
        "raw_detector_flags": result.get("total_raw_flags", 0),
        "execution_duration_ms": result.get("duration_ms", 0),
        "transactions_analyzed": result.get("transactions_analyzed", 0),
        "total_transactions": result.get("transactions_analyzed", 0),
        "total_cases": result.get("total_cases", len(cases)),
        "critical_findings": result.get("critical_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "CRITICAL")),
        "critical_cases": result.get("critical_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "CRITICAL")),
        "high_findings": result.get("high_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "HIGH")),
        "high_cases": result.get("high_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "HIGH")),
        "medium_findings": result.get("medium_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "MEDIUM")),
        "medium_cases": result.get("medium_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "MEDIUM")),
        "low_findings": result.get("low_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "LOW")),
        "low_cases": result.get("low_cases", sum(1 for c in cases if str(c.get("severity", "")).upper() == "LOW")),
        "review_surface_reduction_pct": result.get("review_surface_reduction_pct", 0.0),
        "duration_ms": result.get("duration_ms", 0.0),
        "total_value_inr": total_val,
        "initial_flags": result.get("total_raw_flags", 0),
        "unique_flagged_transactions": result.get("unique_flagged_transactions", len(cases)),
        "total_exposure": total_exp,
        "monetary_exposure": total_exp,
    }

    return {
        "run_id": run_id,
        "summary": summary_obj,
        "metrics": summary_obj,
        "status": result.get("status"),
        "analysis_mode": result.get("analysis_mode"),
        "dataset": stage_store.get_dataset(result.get("dataset_id")).model_dump() if stage_store.get_dataset(result.get("dataset_id")) else None,
        "detectors": result.get("detectors", {}),
    }


@router.get("/{run_id}/events")
async def get_audit_events(run_id: str):
    result = await get_audit_run(run_id)
    async def events():
        payload = {"run_id": run_id, "state": result["status"], "stage": result["status"],
                   "progress": 100, "message": "Audit analysis complete"}
        yield "data: " + json.dumps(payload) + "\n\n"
    return StreamingResponse(events(), media_type="text/event-stream")


@router.get("/{run_id}/gst-reconciliation")
@router.get("/{run_id}/gst")
async def get_gst_reconciliation(run_id: str):
    """Retrieve dynamic Purchase Register vs GSTR-2B Input Tax Credit reconciliation items."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    rows = stage_store.get_transactions_for_dataset(result.get("dataset_id"))
    marked = [t for t in rows if t.narration and "GST_MISMATCH" in t.narration.upper()]
    return {
        "run_id": run_id,
        "enabled": True,
        "reconciliation_performed": False,
        "method": "Explicit ledger-reported GST mismatch markers only",
        "total_matched": None,
        "total_mismatched": len(marked),
        "total_discrepancy_inr": None,
        "items": [{"transaction_id": t.transaction_id, "invoice_number": t.invoice_number,
                   "vendor_name": t.counterparty_name, "gstin": t.gstin,
                   "books_amount": float(t.amount), "tax_amount": float(t.gst_amount) if t.gst_amount is not None else None,
                   "gst_snapshot_amount": None, "difference": None, "difference_pct": None,
                   "status": "LEDGER_REPORTED_MISMATCH"} for t in marked],
    }


@router.get("/{run_id}/transactions")
async def get_audit_run_transactions(run_id: str, limit: int = 25, offset: int = 0, search: str | None = None, vendor: str | None = None, suspicious_only: bool = False):
    """Retrieve canonical transactions for audit run with optional live search filter."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    dataset_id = result.get("dataset_id")
    txs = stage_store.get_transactions_for_dataset(dataset_id) if dataset_id else []
    flags_by_transaction: dict[str, set[str]] = {}
    for case in result.get("cases", []):
        for transaction_id in case.get("transaction_ids", []):
            flags_by_transaction.setdefault(transaction_id, set()).update(case.get("anomaly_types", []))
    if suspicious_only:
        txs = [t for t in txs if t.transaction_id in flags_by_transaction]
    if vendor:
        txs = [t for t in txs if vendor.lower() in str(t.counterparty_name or t.counterparty_id).lower()]

    if search:
        s_lower = search.lower()
        txs = [
            t for t in txs
            if s_lower in str(t.transaction_id).lower()
            or s_lower in str(t.debit_account).lower()
            or s_lower in str(t.credit_account).lower()
            or s_lower in str(t.counterparty_name).lower()
            or s_lower in str(t.counterparty_id).lower()
            or s_lower in str(t.narration).lower()
        ]

    limit, offset = max(1, min(limit, 1000)), max(0, offset)
    sliced = txs[offset : offset + limit]
    items = [{**t.model_dump(), "is_suspicious": t.transaction_id in flags_by_transaction,
              "flags": sorted(flags_by_transaction.get(t.transaction_id, set()))} for t in sliced]
    return {
        "run_id": run_id,
        "total": len(txs),
        "limit": limit,
        "offset": offset,
        "items": items,
        "transactions": items,
        "total_returned": len(sliced),
    }
