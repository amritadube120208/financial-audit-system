import time
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.copilot.schemas import CopilotSession, CopilotMessageRequest, CopilotMessageResponse
from app.copilot.service import copilot_service
from app.persistence.store import stage_store

router = APIRouter(prefix="/copilot", tags=["copilot"])


class CreateSessionRequest(BaseModel):
    run_id: str


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
    response = await copilot_service.process_message(
        session_id=session_id,
        run_id=run_id,
        request=request,
    )

    stage_store.add_copilot_message(session_id, response.model_dump())
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
