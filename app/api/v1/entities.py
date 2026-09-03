from fastapi import APIRouter, HTTPException, status
from app.persistence.store import memory_store

router = APIRouter(tags=["Entities"])


@router.get("/entities/{entity_id}")
async def get_entity_profile(entity_id: str, run_id: str):
    """Retrieve entity profile, risk score, and transaction metrics."""
    result = memory_store.get_run_result(run_id)
    if result is None:
        raise HTTPException(404, detail={"code": "RUN_NOT_FOUND"})
    matching_txns = []
    for txns in [memory_store.get_transactions_for_dataset(result.get("dataset_id"))]:
        for t in txns:
            if entity_id.casefold() in {(t.entity_id or "").casefold(), (t.counterparty_name or "").casefold()}:
                matching_txns.append(t)

    if not matching_txns:
        return {
            "entity_id": entity_id,
            "canonical_name": entity_id,
            "transaction_count": 0,
            "total_amount_inr": 0.0,
            "cases": [],
        }

    total_amount = sum(float(abs(t.amount)) for t in matching_txns)

    return {
        "entity_id": entity_id,
        "canonical_name": matching_txns[0].counterparty_name or entity_id,
        "transaction_count": len(matching_txns),
        "total_amount_inr": round(total_amount, 2),
        "sample_transactions": [t.transaction_id for t in matching_txns[:10]],
    }
