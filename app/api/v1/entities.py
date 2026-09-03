from fastapi import APIRouter, HTTPException, status
from app.persistence.store import memory_store

router = APIRouter(tags=["Entities"])


@router.get("/api/v1/entities/{entity_id}")
async def get_entity_profile(entity_id: str):
    """Retrieve entity profile, risk score, and transaction metrics."""
    matching_txns = []
    for dataset_id, txns in memory_store.dataset_transactions.items():
        for t in txns:
            if entity_id.lower() in (t.entity_id or "").lower() or entity_id.lower() in (t.counterparty_name or "").lower():
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
