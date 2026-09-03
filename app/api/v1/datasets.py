import time
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.domain.models import DatasetRef
from app.ingest.loader import load_dataset
from app.persistence.store import memory_store

router = APIRouter(prefix="/api/v1/datasets", tags=["Datasets"])


@router.post("", response_model=DatasetRef)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload CSV or XLSX financial ledger dataset."""
    filename = file.filename or "uploaded_ledger.csv"
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DATASET_EMPTY", "message": "Uploaded dataset file is empty."},
        )

    dataset_id = f"ds_{int(time.time()*1000)}"
    dataset_ref, transactions = load_dataset(content=content, filename=filename, dataset_id=dataset_id)

    # Store in memory store
    memory_store.datasets[dataset_id] = dataset_ref
    memory_store.dataset_bytes[dataset_id] = content
    memory_store.dataset_transactions[dataset_id] = transactions

    return dataset_ref


@router.get("/{dataset_id}", response_model=DatasetRef)
async def get_dataset(dataset_id: str):
    """Retrieve metadata for a dataset."""
    if dataset_id not in memory_store.datasets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DATASET_NOT_FOUND", "message": f"Dataset '{dataset_id}' not found."},
        )
    return memory_store.datasets[dataset_id]
