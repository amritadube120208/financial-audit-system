from typing import Any
from app.copilot.schemas import CopilotCitation, CopilotFollowUpAction, CopilotMessageResponse
from app.persistence.store import stage_store


def generate_deterministic_fallback(
    query: str,
    run_id: str,
    selected_case_id: str | None = None,
) -> CopilotMessageResponse:
    """
    Generates a 100% offline deterministic evidence response when LLM provider is unavailable or DEMO_FAIL_LLM=1.
    """
    run_result = stage_store.get_run_result(run_id)
    query_lower = query.lower()

    citations = []
    used_tools = ["get_run_summary"]

    if selected_case_id and run_result:
        cases = run_result.get("cases", [])
        target_case = next((c for c in cases if c.get("case_id") == selected_case_id), None)
        if target_case:
            used_tools.append("get_finding")
            answer = (
                f"Investigation **{selected_case_id}** ({target_case.get('title')}) has a Risk Score of **{target_case.get('risk_score', 0.0):.1f}** "
                f"with severity **{target_case.get('severity')}**.\n\n"
                f"**Key Findings & Anomaly Types:** {', '.join(target_case.get('anomaly_types', []))}\n"
                f"**Monetary Exposure:** ₹{target_case.get('monetary_exposure', 0.0):,.2f}\n"
                f"**Description:** {target_case.get('description')}\n\n"
                f"*Note: AuditGraph prioritizes review items; this is not a final determination of fraud.*"
            )
            citations.append(
                CopilotCitation(
                    source_type="investigation",
                    source_id=selected_case_id,
                    field="risk_score",
                    value=target_case.get("risk_score", 0.0),
                )
            )
        else:
            answer = f"Case ID `{selected_case_id}` was not found in audit run `{run_id}`."
    elif "gst" in query_lower and run_result:
        used_tools.append("get_gst_mismatches")
        gst_cases = [c for c in run_result.get("cases", []) if "GST_MISMATCH" in c.get("anomaly_types", [])]
        answer = (
            f"Found **{len(gst_cases)}** investigation cases involving GSTR-2B Input Tax Credit mismatches in run `{run_id}`."
        )
    else:
        total_cases = run_result.get("total_cases", 0) if run_result else 0
        crit_cases = run_result.get("critical_cases", 0) if run_result else 0
        answer = (
            f"Audit Run `{run_id}` overview: Analyzed ledger yielding **{total_cases}** consolidated investigation cases, "
            f"with **{crit_cases}** classified as CRITICAL severity.\n\n"
            f"Select any case in the investigation queue to inspect graph flows and detector evidence."
        )

    actions = [
        CopilotFollowUpAction(action_id="act_inspect_top", label="Inspect Top Critical Case", case_id=selected_case_id),
        CopilotFollowUpAction(action_id="act_trace_graph", label="Trace Money Flow Graph", case_id=selected_case_id),
    ]

    return CopilotMessageResponse(
        message_id=f"msg_fallback_{run_id[:6]}",
        session_id=f"cop_fallback_{run_id[:6]}",
        run_id=run_id,
        answer=answer,
        mode="deterministic_fallback",
        grounded=True,
        confidence="high",
        used_tools=used_tools,
        citations=citations,
        suggested_actions=actions,
        safety_note="Audit review priority only; not a fraud determination.",
    )
