import pytest
from app.copilot.providers.factory import ProviderCascadeRouter, get_llm_provider
from app.copilot.providers.fallback_provider import DeterministicFallbackProvider
from app.copilot.schemas import CopilotCitation


@pytest.mark.asyncio
async def test_provider_cascade_fallback_graceful(monkeypatch):
    """Verify ProviderCascadeRouter gracefully falls back to Deterministic Provider when LLM switches fail."""
    monkeypatch.setenv("DEMO_FAIL_LLM", "1")

    router = ProviderCascadeRouter()
    resp = await router.generate_response(
        session_id="cop_test_casc",
        run_id="run_test_casc",
        user_message="Why is this critical?",
        system_context="Context",
        tool_results=[{"tool_name": "get_finding", "result": {"case_id": "case_inv_001", "risk_score": 100.0, "severity": "CRITICAL"}}],
        citations=[CopilotCitation(source_type="investigation", source_id="case_inv_001", field="risk_score", value=100.0)],
    )

    assert resp.grounded is True
    assert resp.mode == "deterministic_evidence_fallback"
    assert "case_inv_001" in resp.answer
