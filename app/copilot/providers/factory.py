import os
import logging
from app.copilot.providers.base import BaseLLMProvider, ProviderResponse, CopilotCitation
from app.copilot.providers.gemini import GeminiProvider
from app.copilot.providers.groq import GroqProvider
from app.copilot.providers.openrouter import OpenRouterProvider
from app.copilot.providers.fallback_provider import DeterministicFallbackProvider
from app.copilot.providers.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)


class ProviderCascadeRouter(BaseLLMProvider):
    """
    Multi-Provider Failover Router:
    Gemini Developer API (Primary) -> GroqCloud (Secondary) -> OpenRouter (Tertiary) -> Deterministic Fallback
    A single provider failure never breaks Copilot.
    """

    def __init__(self):
        self.gemini = GeminiProvider()
        self.groq = GroqProvider()
        self.openrouter = OpenRouterProvider()
        self.openai = OpenAIProvider()
        self.fallback = DeterministicFallbackProvider()

    def is_available(self) -> bool:
        return True

    async def generate_response(
        self,
        session_id: str,
        run_id: str,
        user_message: str,
        system_context: str,
        tool_results: list[dict],
        citations: list[CopilotCitation],
    ) -> ProviderResponse:
        # Check override switch
        if os.environ.get("DEMO_FAIL_LLM") == "1":
            logger.info("DEMO_FAIL_LLM switch set. Routing directly to Deterministic Fallback Provider.")
            return await self.fallback.generate_response(session_id, run_id, user_message, system_context, tool_results, citations)

        # 1. Try Gemini Provider
        if self.gemini.is_available():
            try:
                logger.info("Attempting Gemini Developer API Provider...")
                return await self.gemini.generate_response(session_id, run_id, user_message, system_context, tool_results, citations)
            except Exception as e:
                logger.warning(f"Gemini Provider failed: {e}. Cascading to Groq...")

        # 2. Try Groq Provider
        if self.groq.is_available():
            try:
                logger.info("Attempting GroqCloud API Provider...")
                return await self.groq.generate_response(session_id, run_id, user_message, system_context, tool_results, citations)
            except Exception as e:
                logger.warning(f"Groq Provider failed: {e}. Cascading to OpenRouter...")

        # 3. Try OpenRouter Provider
        if self.openrouter.is_available():
            try:
                logger.info("Attempting OpenRouter API Provider...")
                return await self.openrouter.generate_response(session_id, run_id, user_message, system_context, tool_results, citations)
            except Exception as e:
                logger.warning(f"OpenRouter Provider failed: {e}. Cascading to OpenAI...")

        # 4. Try OpenAI Provider
        if self.openai.is_available():
            try:
                logger.info("Attempting OpenAI Provider...")
                return await self.openai.generate_response(session_id, run_id, user_message, system_context, tool_results, citations)
            except Exception as e:
                logger.warning(f"OpenAI Provider failed: {e}. Cascading to Fallback...")

        # 5. Ultimate Fallback
        logger.info("Using Deterministic Evidence Fallback Provider.")
        return await self.fallback.generate_response(session_id, run_id, user_message, system_context, tool_results, citations)


_provider_cascade = ProviderCascadeRouter()


def get_llm_provider() -> BaseLLMProvider:
    return _provider_cascade
