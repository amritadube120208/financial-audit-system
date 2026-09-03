from fastapi import APIRouter
from app.api.v1 import health, datasets, runs, findings, transactions, entities, copilot, exports

api_router = APIRouter(prefix="/api/v1")

# Mount v1 routers
api_router.include_router(datasets.router)
api_router.include_router(runs.router)
api_router.include_router(findings.router)
api_router.include_router(transactions.router)
api_router.include_router(entities.router)
api_router.include_router(copilot.router)
api_router.include_router(exports.router)
