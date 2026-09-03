import time
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from app.domain.models import DatasetRef
from app.ingest.loader import load_dataset
from app.persistence.store import memory_store

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("", response_model=DatasetRef, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DatasetRef, status_code=status.HTTP_201_CREATED)
@router.post("/upload", response_model=DatasetRef, status_code=status.HTTP_201_CREATED)
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

    memory_store.save_dataset(dataset_ref, transactions)
    return dataset_ref


@router.get("/{dataset_id}", response_model=DatasetRef)
async def get_dataset(dataset_id: str):
    """Retrieve metadata of uploaded dataset."""
    ds = memory_store.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DATASET_NOT_FOUND", "message": f"Dataset '{dataset_id}' not found."},
        )
    return ds
