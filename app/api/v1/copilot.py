import os
import time
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.copilot.schemas import CopilotSession, CopilotMessageRequest, CopilotMessageResponse
from app.copilot.service import copilot_service
from app.persistence.store import stage_store

router = APIRouter(prefix="/copilot", tags=["copilot"])


class CreateSessionRequest(BaseModel):
    run_id: str


from app.config import settings


@router.get("/provider-health")
async def get_copilot_provider_health():
    """Retrieve safe metadata on active Copilot LLM providers and fallbacks."""
    gemini_avail = bool((settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")).strip())
    groq_avail = bool((settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip())
    openrouter_avail = bool((settings.OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY", "")).strip())
    openai_avail = bool((settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")).strip())

    if gemini_avail:
        active = "gemini"
    elif groq_avail:
        active = "groq"
    elif openrouter_avail:
        active = "openrouter"
    elif openai_avail:
        active = "openai"
    else:
        active = "deterministic_fallback"

    return {
        "active_provider": active,
        "status": "available",
        "providers": {
            "gemini": "configured" if gemini_avail else "not_configured",
            "groq": "configured" if groq_avail else "not_configured",
            "openrouter": "configured" if openrouter_avail else "not_configured",
            "openai": "configured" if openai_avail else "not_configured",
            "deterministic_fallback": "available",
        },
    }


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
@router.post("/sessions/", status_code=status.HTTP_201_CREATED)
async def create_copilot_session(request: CreateSessionRequest):
    """Create interactive audit copilot session."""
    result = stage_store.get_run_result(request.run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{request.run_id}' not found."},
        )

    session_id = f"cop_{int(time.time()*1000)}"
    stage_store.save_copilot_session(session_id, request.run_id)

    return CopilotSession(
        session_id=session_id,
        run_id=request.run_id,
    )


@router.post("/sessions/{session_id}/messages", response_model=CopilotMessageResponse)
async def post_copilot_message(session_id: str, request: CopilotMessageRequest):
    """Post prompt to copilot session and retrieve grounded evidence answer."""
    session = stage_store.get_copilot_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SESSION_NOT_FOUND", "message": f"Copilot session '{session_id}' not found."},
        )

    run_id = session.get("run_id", "run_default")

    # 1. Save user message to session history
    user_msg = {
        "message_id": f"msg_usr_{int(time.time()*1000)}",
        "session_id": session_id,
        "run_id": run_id,
        "role": "user",
        "content": request.message,
        "message": request.message,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    stage_store.add_copilot_message(session_id, user_msg)

    # 2. Process AI Copilot response
    response = await copilot_service.process_message(
        session_id=session_id,
        run_id=run_id,
        request=request,
    )

    # 3. Save assistant response to session history
    assistant_dict = response.model_dump()
    assistant_dict["role"] = "assistant"
    assistant_dict["content"] = response.answer
    stage_store.add_copilot_message(session_id, assistant_dict)

    return response


@router.get("/sessions/{session_id}/messages")
async def get_copilot_messages(session_id: str):
    """Retrieve message history of copilot session."""
    session = stage_store.get_copilot_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SESSION_NOT_FOUND", "message": f"Copilot session '{session_id}' not found."},
        )
    return {"session_id": session_id, "messages": session.get("messages", [])}
