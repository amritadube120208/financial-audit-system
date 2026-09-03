from typing import Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.copilot.schemas import CopilotSessionCreate, CopilotSession, CopilotMessageRequest, CopilotMessageResponse
from app.copilot.service import copilot_service
from app.persistence.store import memory_store

router = APIRouter(prefix="/api/v1/copilot", tags=["AI Audit Copilot"])

# In-memory session and chat history cache
sessions_cache: dict[str, CopilotSession] = {}
messages_cache: dict[str, list[dict[str, Any]]] = {}


@router.post("/sessions", response_model=CopilotSession, status_code=status.HTTP_201_CREATED)
async def create_copilot_session(request: CopilotSessionCreate):
    """Create new Audit Copilot chat session bound to run_id."""
    session = copilot_service.create_session(run_id=request.run_id, title=request.title or "Audit Review Session")
    sessions_cache[session.session_id] = session
    messages_cache[session.session_id] = []
    return session


@router.post("/sessions/{session_id}/messages", response_model=CopilotMessageResponse)
async def send_copilot_message(session_id: str, request: CopilotMessageRequest):
    """Send question to Audit Copilot and receive evidence-grounded response."""
    if session_id not in sessions_cache:
        # Create session dynamically if missing
        session = CopilotSession(session_id=session_id, run_id="run_stage_default", title="Stage Review Session")
        sessions_cache[session_id] = session
        messages_cache[session_id] = []

    session = sessions_cache[session_id]
    run_id = session.run_id

    # Retrieve cases, findings, transactions for current run
    run_data = memory_store.runs.get(run_id, {})
    if not run_data and memory_store.runs:
        # Fallback to last available run for stage mode
        run_id = list(memory_store.runs.keys())[-1]
        run_data = memory_store.runs[run_id]

    raw_cases = run_data.get("top_cases", [])
    cases = []
    from app.domain.models import InvestigationCase
    for c in raw_cases:
        try:
            cases.append(InvestigationCase(**c))
        except Exception:
            pass

    dataset_id = run_data.get("dataset_id")
    transactions = memory_store.dataset_transactions.get(dataset_id, [])

    response = copilot_service.process_message(
        session=session,
        request=request,
        cases=cases,
        findings=[],
        transactions=transactions,
        run_summary=run_data.get("summary", {}),
    )

    # Cache message history
    messages_cache[session_id].append({"role": "user", "content": request.message})
    messages_cache[session_id].append({"role": "assistant", "response": response.model_dump()})

    return response


@router.get("/sessions/{session_id}/messages")
async def get_copilot_messages(session_id: str):
    """Retrieve chat message history for session."""
    if session_id not in messages_cache:
        return {"session_id": session_id, "messages": []}
    return {"session_id": session_id, "messages": messages_cache[session_id]}


@router.post("/sessions/{session_id}/actions/{action_id}/confirm")
async def confirm_copilot_action(session_id: str, action_id: str):
    """Confirm client UI action suggested by Copilot."""
    return {"status": "confirmed", "session_id": session_id, "action_id": action_id}
