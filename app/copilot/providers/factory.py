from app.config import settings
from app.copilot.providers.base import BaseLLMProvider
from app.copilot.providers.openai_provider import OpenAIProvider
from app.copilot.providers.fallback_provider import DeterministicFallbackProvider


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory function to retrieve active Copilot LLM Provider based on config & environment.
    Defaults gracefully to DeterministicFallbackProvider when LLM API keys are absent or DEMO_FAIL_LLM=1.
    """
    if settings.DEMO_FAIL_LLM == 1:
        return DeterministicFallbackProvider()

    provider_name = settings.COPILOT_PROVIDER.lower() if hasattr(settings, "COPILOT_PROVIDER") else "fallback"

    if provider_name == "openai" and settings.OPENAI_API_KEY:
        try:
            return OpenAIProvider()
        except Exception:
            return DeterministicFallbackProvider()

    return DeterministicFallbackProvider()
