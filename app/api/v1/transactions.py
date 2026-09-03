from fastapi import APIRouter, HTTPException, status
from app.persistence.store import memory_store

router = APIRouter(tags=["Transactions"])


@router.get("/transactions/{transaction_id}")
async def get_transaction_detail(transaction_id: str, run_id: str):
    """Retrieve single canonical transaction details."""
    result = memory_store.get_run_result(run_id)
    if result is None:
        raise HTTPException(404, detail={"code": "RUN_NOT_FOUND"})
    for txns in [memory_store.get_transactions_for_dataset(result.get("dataset_id"))]:
        for t in txns:
            if t.transaction_id == transaction_id:
                return t.model_dump()

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "TRANSACTION_NOT_FOUND", "message": f"Transaction '{transaction_id}' not found."},
    )
