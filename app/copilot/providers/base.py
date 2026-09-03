from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field
from app.copilot.schemas import CopilotCitation, CopilotFollowUpAction


class ProviderResponse(BaseModel):
    message_id: str = "msg_001"
    session_id: str = "cop_001"
    run_id: str = "run_001"
    answer: str
    mode: str = "llm_grounded"
    grounded: bool = True
    confidence: str = "high"
    used_tools: list[str] = Field(default_factory=list)
    citations: list[CopilotCitation] = Field(default_factory=list)
    suggested_actions: list[CopilotFollowUpAction] = Field(default_factory=list)
    safety_note: str = "Audit review priority only; not a fraud determination."
    duration_ms: float = 0.0


class BaseLLMProvider(ABC):
    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    async def generate_response(
        self,
        session_id: str,
        run_id: str,
        user_message: str,
        system_context: str,
        tool_results: list[dict[str, Any]],
        citations: list[CopilotCitation],
    ) -> ProviderResponse:
        pass

    async def generate(
        self,
        user_message: str,
        system_prompt: str,
        tool_results: list[dict[str, Any]],
        context_data: dict[str, Any],
        temperature: float = 0.1,
    ) -> ProviderResponse:
        return await self.generate_response(
            session_id="cop_default",
            run_id="run_default",
            user_message=user_message,
            system_context=system_prompt,
            tool_results=tool_results,
            citations=[],
        )
