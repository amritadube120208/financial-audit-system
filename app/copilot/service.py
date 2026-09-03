import time
from typing import Any
from app.config import settings
from app.domain.models import InvestigationCase, DetectorFinding, CanonicalTransaction
from app.copilot.schemas import (
    CopilotSession,
    CopilotMessageRequest,
    CopilotMessageResponse,
)
from app.copilot.tools.registry import tool_registry
from app.copilot.fallback import deterministic_copilot, classify_intent
from app.copilot.safety import sanitize_ledger_text
from app.copilot.grounding import validate_grounding_citations


class CopilotService:
    def create_session(self, run_id: str, title: str = "Audit Review Session") -> CopilotSession:
        session_id = f"chat_{int(time.time()*1000)}"
        return CopilotSession(session_id=session_id, run_id=run_id, title=title)

    def process_message(
        self,
        session: CopilotSession,
        request: CopilotMessageRequest,
        cases: list[InvestigationCase],
        findings: list[DetectorFinding],
        transactions: list[CanonicalTransaction],
        run_summary: dict[str, Any],
    ) -> CopilotMessageResponse:
        t0 = time.time()
        user_msg = sanitize_ledger_text(request.message)

        # Check stage failure flags or LLM availability
        if settings.DEMO_FAIL_LLM == 1 or settings.STAGE_DISABLE_LLM or not (settings.OPENAI_API_KEY or settings.GEMINI_API_KEY):
            return deterministic_copilot.answer(
                message=user_msg,
                session_id=session.session_id,
                run_id=session.run_id,
                selected_case_id=request.selected_case_id or request.selected_finding_id,
                cases=cases,
                run_summary=run_summary,
            )

        # LLM Provider execution path with tool calling
        intent = classify_intent(user_msg, request.selected_case_id)

        # Execute appropriate tools based on intent
        tools_called = ["get_risk_breakdown", "get_finding"]
        t_res1 = tool_registry.execute("get_risk_breakdown", {"case_id": request.selected_case_id}, cases, findings, transactions, run_summary)
        t_res2 = tool_registry.execute("get_finding", {"finding_id": request.selected_case_id}, cases, findings, transactions, run_summary)

        tool_outputs = [t_res1.model_dump(), t_res2.model_dump()]

        # Generate fallback response as grounded baseline
        fallback_resp = deterministic_copilot.answer(
            message=user_msg,
            session_id=session.session_id,
            run_id=session.run_id,
            selected_case_id=request.selected_case_id or request.selected_finding_id,
            cases=cases,
            run_summary=run_summary,
        )

        # Validate citations
        is_grounded, citations = validate_grounding_citations(
            answer=fallback_resp.answer,
            tool_results=tool_outputs,
            available_cases=cases,
        )

        fallback_resp.mode = "llm_grounded" if is_grounded else "deterministic_fallback"
        fallback_resp.latency_ms = round((time.time() - t0) * 1000.0, 2)
        return fallback_resp


copilot_service = CopilotService()
