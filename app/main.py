import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.router import api_router
from app.domain.errors import AuditGraphException
from app.persistence.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await init_db()
    yield
    # Shutdown actions


app = FastAPI(
    title="AuditGraph API",
    description="Explainable Multi-Engine Financial Anomaly Triage Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Custom Exception Handler for Standardized Error Envelope
@app.exception_handler(AuditGraphException)
async def auditgraph_exception_handler(request: Request, exc: AuditGraphException):
    req_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
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


# General Exception Handler (No raw stack trace leaks to client)
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"An internal error occurred: {str(exc)}",
                "request_id": req_id,
            }
        },
    )


# Middleware for request ID and duration logging
@app.middleware("http")
async def add_request_context(request: Request, call_next):
    req_id = f"req_{uuid.uuid4().hex[:12]}"
    request.state.request_id = req_id
    t0 = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - t0) * 1000, 2)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Process-Time-MS"] = str(duration_ms)
    return response


# Mount API Router
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.APP_PORT, reload=True)
