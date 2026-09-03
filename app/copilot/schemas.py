from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class CopilotSessionCreate(BaseModel):
    run_id: str
    title: str | None = "Audit Review Session"


class CopilotSession(BaseModel):
    session_id: str
    run_id: str
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CopilotCitation(BaseModel):
    type: Literal["finding", "transaction", "entity", "case"]
    id: str
    label: str


class CopilotFollowUpAction(BaseModel):
    action_id: str
    type: str
    label: str
    payload: dict[str, Any] = Field(default_factory=dict)
    requires_confirmation: bool = False


class CopilotMessageRequest(BaseModel):
    message: str
    selected_finding_id: str | None = None
    selected_case_id: str | None = None
    client_context: dict[str, Any] = Field(default_factory=dict)


class CopilotMessageResponse(BaseModel):
    message_id: str
    session_id: str
    run_id: str
    answer: str
    confidence: Literal["high", "medium", "low"] = "high"
    grounded: bool = True
    mode: Literal["llm_grounded", "deterministic_fallback"] = "llm_grounded"
    citations: list[CopilotCitation] = Field(default_factory=list)
    used_tools: list[str] = Field(default_factory=list)
    follow_up_actions: list[CopilotFollowUpAction] = Field(default_factory=list)
    safety_note: str = "This is an audit review signal, not a fraud determination."
    latency_ms: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
