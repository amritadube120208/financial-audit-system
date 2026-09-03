from typing import Any
from app.config import settings
from app.copilot.schemas import CopilotMessageRequest, CopilotMessageResponse
from app.copilot.safety import sanitize_user_input
from app.copilot.tools.registry import copilot_tools
from app.copilot.grounding import validate_grounding
from app.copilot.providers.factory import get_llm_provider


class CopilotService:
    async def process_message(
        self,
        session_id: str,
        run_id: str,
        request: CopilotMessageRequest,
    ) -> CopilotMessageResponse:
        """
        Process audit copilot query using intent/tool planning, tool execution, provider synthesis, and grounding validation.
        """
        clean_text = sanitize_user_input(request.message)

        # 1. Intent / Tool Planning & Scope Check
        selected_case_id = request.selected_case_id
        selected_entity_id = request.selected_entity_id

        tool_results: list[dict[str, Any]] = []

        # Execute relevant tools based on query intent & parameters
        if selected_case_id:
            res_finding = copilot_tools.get_finding(run_id=run_id, finding_id=selected_case_id)
            tool_results.append({"tool_name": "get_finding", "result": res_finding})

            res_risk = copilot_tools.get_risk_breakdown(run_id=run_id, case_id=selected_case_id)
            tool_results.append({"tool_name": "get_risk_breakdown", "result": res_risk})

        if selected_entity_id:
            res_entity = copilot_tools.get_entity_profile(run_id=run_id, entity_id=selected_entity_id)
            tool_results.append({"tool_name": "get_entity_profile", "result": res_entity})

        query_lower = clean_text.lower()
        if "summary" in query_lower or "overview" in query_lower or not tool_results:
            res_summary = copilot_tools.get_run_summary(run_id=run_id)
            tool_results.append({"tool_name": "get_run_summary", "result": res_summary})

        if "gst" in query_lower:
            res_gst = copilot_tools.get_gst_mismatches(run_id=run_id)
            tool_results.append({"tool_name": "get_gst_mismatches", "result": res_gst})

        if "pipeline" in query_lower or "health" in query_lower:
            res_pipe = copilot_tools.get_pipeline_health(run_id=run_id)
            tool_results.append({"tool_name": "get_pipeline_health", "result": res_pipe})

        # 2. System Context
        system_prompt = (
            "You are the AuditGraph AI Copilot, an expert financial audit assistant.\n"
            "Your role is to explain evidence-backed anomalies to auditors.\n"
            "STRICT MANDATE:\n"
            "- Never declare fraud. Use 'Requires auditor review' or 'Potential anomaly'.\n"
            "- Only make claims directly backed by tool outputs.\n"
            "- Do not alter risk scores, transaction amounts, or severity levels.\n"
        )

        context_data = {
            "session_id": session_id,
            "run_id": run_id,
            "selected_case_id": selected_case_id,
            "selected_entity_id": selected_entity_id,
        }

        # 3. Provider Generation
        provider = get_llm_provider()
        provider_resp = await provider.generate(
            user_message=clean_text,
            system_prompt=system_prompt,
            tool_results=tool_results,
            context_data=context_data,
        )

        # 4. Grounding Validation
        is_grounded, grounding_notes = validate_grounding(
            answer=provider_resp.answer,
            tool_results=tool_results,
            citations=provider_resp.citations,
        )

        final_response = CopilotMessageResponse(
            message_id=f"msg_{session_id[:6]}_{request.selected_case_id or 'gen'}",
            session_id=session_id,
            run_id=run_id,
            answer=provider_resp.answer,
            mode=provider_resp.mode,
            grounded=is_grounded,
            confidence=provider_resp.confidence,
            used_tools=provider_resp.used_tools,
            citations=provider_resp.citations,
            suggested_actions=provider_resp.suggested_actions,
            safety_note=provider_resp.safety_note,
        )

        return final_response


copilot_service = CopilotService()
