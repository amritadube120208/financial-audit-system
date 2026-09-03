from fastapi import APIRouter, HTTPException, status
from app.persistence.store import memory_store

router = APIRouter(tags=["Transactions"])


@router.get("/api/v1/audit-runs/{run_id}/transactions")
async def get_run_transactions(run_id: str, limit: int = 50, offset: int = 0):
    """Retrieve raw transactions for an audit run."""
    if run_id not in memory_store.runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    run_data = memory_store.runs[run_id]
    dataset_id = run_data.get("dataset_id")
    txns = memory_store.dataset_transactions.get(dataset_id, [])

    sliced = txns[offset : offset + limit]

    return {
        "run_id": run_id,
        "total_count": len(txns),
        "limit": limit,
        "offset": offset,
        "transactions": [t.model_dump() for t in sliced],
    }


@router.get("/api/v1/transactions/{transaction_id}")
async def get_transaction_detail(transaction_id: str):
    """Retrieve single canonical transaction details."""
    for dataset_id, txns in memory_store.dataset_transactions.items():
        for t in txns:
            if t.transaction_id == transaction_id:
                return t.model_dump()

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "TRANSACTION_NOT_FOUND", "message": f"Transaction '{transaction_id}' not found."},
    )
