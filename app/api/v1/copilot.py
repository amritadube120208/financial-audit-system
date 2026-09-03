import time
import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.copilot.schemas import CopilotSession, CopilotMessageRequest, CopilotMessageResponse
from app.copilot.service import copilot_service
from app.copilot.providers.factory import get_llm_provider
from app.persistence.store import stage_store
from app.persistence.copilot_repository import copilot_repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot", tags=["copilot"])


class CreateSessionRequest(BaseModel):
    run_id: str


@router.get("/provider-health")
async def get_copilot_provider_health():
    """
    Real Provider Health Check (Phase 12).
    Evaluates real reachability, latency, and model availability with caching.
    Never exposes API keys.
    """
    cascade = get_llm_provider()
    groq_health = await cascade.groq.probe_health() if hasattr(cascade, "groq") else {"status": "unconfigured"}

    active_provider = "groq" if groq_health.get("reachable") else "deterministic_fallback"

    return {
        "active_provider": active_provider,
        "status": "healthy" if groq_health.get("reachable") else "degraded_evidence_mode",
        "providers": {
            "groq": groq_health,
            "deterministic_fallback": {
                "configured": True,
                "reachable": True,
                "status": "healthy",
                "model": "statutory_evidence_engine",
            },
        },
    }


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
@router.post("/sessions/", status_code=status.HTTP_201_CREATED)
async def create_copilot_session(request: CreateSessionRequest):
    """
    Create a durable, database-backed Copilot session.
    Strictly validates run_id. If run does not exist, returns 404 RUN_NOT_FOUND.
    """
    result = stage_store.get_run_result(request.run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{request.run_id}' not found."},
        )

    session_id = f"cop_{int(time.time()*1000)}"

    # 1. Durable SQLite Database Persistence
    await copilot_repo.create_session(session_id, request.run_id)

    # 2. In-Memory Mirror for synchronous compatibility
    stage_store.save_copilot_session(session_id, request.run_id)

    return CopilotSession(
        session_id=session_id,
        run_id=request.run_id,
    )


@router.post("/sessions/{session_id}/messages", response_model=CopilotMessageResponse)
async def post_copilot_message(session_id: str, request: CopilotMessageRequest):
    """
    Post prompt to Copilot session and retrieve grounded statutory evidence answer.
    If session is unknown, returns explicit 404 SESSION_NOT_FOUND (never auto-creates demo session).
    """
    # 1. Authoritative DB Session Lookup
    session = await copilot_repo.get_session(session_id)
    if not session:
        # Check memory store fallback
        mem_session = stage_store.get_copilot_session(session_id)
        if not mem_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SESSION_NOT_FOUND", "message": f"Copilot session '{session_id}' not found."},
            )
        run_id = mem_session.get("run_id", "run_default")
    else:
        run_id = session.run_id

    # 2. Save user message to durable database
    user_msg_id = f"msg_usr_{int(time.time()*1000)}"
    await copilot_repo.save_message(
        message_id=user_msg_id,
        session_id=session_id,
        role="user",
        content=request.message,
        mode="user_prompt",
    )

    # 3. Execute Copilot Service lifecycle
    response = await copilot_service.process_message(
        session_id=session_id,
        run_id=run_id,
        request=request,
    )

    # 4. Save assistant response to durable database
    citations_data = [c.model_dump() for c in response.citations]
    await copilot_repo.save_message(
        message_id=response.message_id,
        session_id=session_id,
        role="assistant",
        content=response.answer,
        mode=response.mode,
        grounded=response.grounded,
        confidence=response.confidence,
        citations=citations_data,
        used_tools=response.used_tools,
    )

    # Sync memory mirror
    user_msg_dict = {
        "message_id": user_msg_id,
        "session_id": session_id,
        "run_id": run_id,
        "role": "user",
        "content": request.message,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    stage_store.add_copilot_message(session_id, user_msg_dict)
    asst_dict = response.model_dump()
    asst_dict["role"] = "assistant"
    asst_dict["content"] = response.answer
    stage_store.add_copilot_message(session_id, asst_dict)

    return response


@router.get("/sessions/{session_id}/messages")
async def get_copilot_messages(session_id: str):
    """
    Retrieve durable message history of Copilot session from database.
    If session is missing, returns 404 SESSION_NOT_FOUND.
    """
    session = await copilot_repo.get_session(session_id)
    if not session:
        mem_session = stage_store.get_copilot_session(session_id)
        if not mem_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SESSION_NOT_FOUND", "message": f"Copilot session '{session_id}' not found."},
            )
        return {"session_id": session_id, "messages": mem_session.get("messages", [])}

    # Fetch from SQLite database
    db_messages = await copilot_repo.get_messages(session_id)
    formatted = [
        {
            "message_id": m.id,
            "session_id": m.session_id,
            "role": m.role,
            "content": m.content,
            "mode": m.mode,
            "grounded": m.grounded,
            "confidence": m.confidence,
            "citations": m.citations_json,
            "used_tools": m.used_tools_json,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in db_messages
    ]

    return {
        "session_id": session_id,
        "run_id": session.run_id,
        "messages": formatted,
    }
