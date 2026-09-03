from typing import Any
from app.copilot.providers.base import BaseLLMProvider, ProviderResponse
from app.copilot.fallback import generate_deterministic_fallback


class DeterministicFallbackProvider(BaseLLMProvider):
    async def generate(
        self,
        user_message: str,
        system_prompt: str,
        tool_results: list[dict[str, Any]],
        context_data: dict[str, Any],
        temperature: float = 0.1,
    ) -> ProviderResponse:
        case_id = context_data.get("selected_case_id")
        run_id = context_data.get("run_id", "run_default")

        fallback_resp = generate_deterministic_fallback(
            query=user_message,
            run_id=run_id,
            selected_case_id=case_id,
        )

        return ProviderResponse(
            answer=fallback_resp.answer,
            mode="deterministic_fallback",
            grounded=True,
            confidence="high",
            used_tools=fallback_resp.used_tools,
            citations=fallback_resp.citations,
            suggested_actions=fallback_resp.suggested_actions,
            safety_note=fallback_resp.safety_note,
        )
