from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "auditgraph", "version": settings.PIPELINE_VERSION}


@router.get("/readyz")
async def readyz():
    return {
        "status": "ready",
        "service": "auditgraph",
        "pipeline_version": settings.PIPELINE_VERSION,
        "database": "sqlite_async",
        "redis": "fallback_in_memory",
    }


@router.get("/api/v1/version")
async def version():
    return {
        "version": settings.PIPELINE_VERSION,
        "scoring_config_version": settings.SCORING_CONFIG_VERSION,
        "detector_config_version": settings.DETECTOR_CONFIG_VERSION,
    }
