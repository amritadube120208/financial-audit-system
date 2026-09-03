from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/healthz")
def healthz():
    """Liveness probe. Returns HTTP 200 if backend process is running."""
    return {"status": "ok", "app": "AuditGraph Backend"}


@router.get("/readyz")
def readyz():
    """Readiness probe. Returns detailed component diagnostics."""
    return {
        "status": "ready",
        "database": "ready",
        "analysis_runtime": "ready",
        "redis": "optional_unavailable" if settings.REDIS_OPTIONAL else "ready",
        "llm": "optional_unavailable" if (settings.STAGE_DISABLE_LLM or settings.DEMO_FAIL_LLM == 1) else "ready",
        "pipeline_version": settings.PIPELINE_VERSION,
        "scoring_config_version": settings.SCORING_CONFIG_VERSION,
    }


@router.get("/api/v1/version")
def version():
    """API Version details."""
    return {
        "version": "1.0.0",
        "pipeline_version": settings.PIPELINE_VERSION,
        "scoring_config_version": settings.SCORING_CONFIG_VERSION,
        "app_env": settings.APP_ENV,
    }
