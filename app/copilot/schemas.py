from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class CopilotCitation(BaseModel):
    source_type: str
    source_id: str
    field: str | None = None
    value: Any = None


class CopilotFollowUpAction(BaseModel):
    action_id: str
    label: str
    case_id: str | None = None


class CopilotSession(BaseModel):
    session_id: str
    run_id: str
    title: str = "Financial Audit Copilot Session"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CopilotMessageRequest(BaseModel):
    message: str
    selected_case_id: str | None = None
    selected_entity_id: str | None = None


class CopilotMessageResponse(BaseModel):
    message_id: str
    session_id: str
    run_id: str
    answer: str
    mode: str = "llm_grounded"
    grounded: bool = True
    confidence: str = "high"
    used_tools: list[str] = Field(default_factory=list)
    citations: list[CopilotCitation] = Field(default_factory=list)
    suggested_actions: list[CopilotFollowUpAction] = Field(default_factory=list)
    safety_note: str = "Audit review priority only; not a fraud determination."
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
