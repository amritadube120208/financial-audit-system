from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field
from app.copilot.schemas import CopilotCitation, CopilotFollowUpAction


class ProviderResponse(BaseModel):
    answer: str
    mode: str = "llm_grounded"
    grounded: bool = True
    confidence: str = "high"
    used_tools: list[str] = Field(default_factory=list)
    citations: list[CopilotCitation] = Field(default_factory=list)
    suggested_actions: list[CopilotFollowUpAction] = Field(default_factory=list)
    safety_note: str = "Audit review priority only; not a fraud determination."


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        user_message: str,
        system_prompt: str,
        tool_results: list[dict[str, Any]],
        context_data: dict[str, Any],
        temperature: float = 0.1,
    ) -> ProviderResponse:
        """
        Generate grounded audit copilot response based on tool results and system context.
        """
        pass
