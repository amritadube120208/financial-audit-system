import os
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.domain.errors import AuditGraphException
from app.persistence.database import init_db
from app.api.router import api_router
from app.api.v1.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lifecycle startup
    await init_db()
    yield
    # Lifecycle shutdown


app = FastAPI(
    title="AuditGraph API",
    description="Production-shaped AuditGraph Financial Audit Backend & Investigation Platform",
    version=settings.PIPELINE_VERSION,
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_context(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:10]}"
    t0 = time.time()

    response: Response = await call_next(request)

    duration_ms = (time.time() - t0) * 1000.0
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
    return response


# Global Exception Handler for AuditGraph Domain Exceptions
@app.exception_handler(AuditGraphException)
async def auditgraph_exception_handler(request: Request, exc: AuditGraphException):
    req_id = request.headers.get("X-Request-ID", "req_unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": req_id,
                "details": exc.details,
            }
        },
    )


# Serve root index HTML demo page
@app.get("/", include_in_schema=False)
async def serve_demo_frontend():
    static_html = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(static_html):
        return FileResponse(static_html)
    return JSONResponse({"message": "AuditGraph API Running"})


# Mount health endpoints at root level (/healthz, /readyz)
app.include_router(health_router)

# Mount API v1 router
app.include_router(api_router)
