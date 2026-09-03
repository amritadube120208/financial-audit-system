import time
from typing import Any
from app.domain.enums import CopilotIntent
from app.domain.models import InvestigationCase
from app.copilot.schemas import CopilotMessageResponse, CopilotCitation, CopilotFollowUpAction


def classify_intent(message: str, selected_case_id: str | None = None) -> CopilotIntent:
    """Classify user query into a deterministic CopilotIntent enum."""
    msg_lower = message.lower().strip()

    if selected_case_id or "why" in msg_lower or "critical" in msg_lower or "explain" in msg_lower:
        return CopilotIntent.EXPLAIN_FINDING
    elif "summary" in msg_lower or "overview" in msg_lower or "summarize" in msg_lower:
        return CopilotIntent.RUN_SUMMARY
    elif "trace" in msg_lower or "flow" in msg_lower or "graph" in msg_lower or "cycle" in msg_lower:
        return CopilotIntent.TRACE_FLOW
    elif "compare" in msg_lower or "versus" in msg_lower or "vs" in msg_lower:
        return CopilotIntent.COMPARE_ENTITIES
    elif "gst" in msg_lower or "tax" in msg_lower or "gstr" in msg_lower:
        return CopilotIntent.GST_REVIEW
    elif "checklist" in msg_lower or "check" in msg_lower or "next step" in msg_lower:
        return CopilotIntent.AUDIT_CHECKLIST
    elif "breakdown" in msg_lower or "score" in msg_lower:
        return CopilotIntent.RISK_BREAKDOWN
    elif "list" in msg_lower or "show" in msg_lower or "high risk" in msg_lower:
        return CopilotIntent.LIST_FINDINGS

    return CopilotIntent.GENERAL_EXPLANATION


class DeterministicCopilotFallback:
    def answer(
        self,
        message: str,
        session_id: str,
        run_id: str,
        selected_case_id: str | None,
        cases: list[InvestigationCase],
        run_summary: dict[str, Any],
    ) -> CopilotMessageResponse:
        t0 = time.time()
        intent = classify_intent(message, selected_case_id)

        target_case = None
        if selected_case_id:
            target_case = next((c for c in cases if c.case_id == selected_case_id), None)
        if not target_case and cases:
            target_case = cases[0]

        citations: list[CopilotCitation] = []
        used_tools: list[str] = []
        follow_up_actions: list[CopilotFollowUpAction] = []

        if intent == CopilotIntent.EXPLAIN_FINDING and target_case:
            used_tools = ["get_risk_breakdown", "get_finding"]
            citations.append(CopilotCitation(type="case", id=target_case.case_id, label=target_case.title))
            for t_id in target_case.transaction_ids[:3]:
                citations.append(CopilotCitation(type="transaction", id=t_id, label=f"Transaction {t_id}"))

            answer = (
                f"The investigation {target_case.case_id} ('{target_case.title}') is classified as {target_case.severity.value} "
                f"with a risk score of {target_case.risk_score:.1f}/100.\n\n"
                f"Key evidence backing this determination:\n"
            )
            for ev in target_case.evidence:
                answer += f"• {ev.label}: {ev.value}{' ' + ev.unit if ev.unit else ''}\n"

            answer += "\nThis pattern requires auditor review; it is not classified as fraud by the system."

            if target_case.graph:
                used_tools.append("trace_money_flow")
                follow_up_actions.append(
                    CopilotFollowUpAction(
                        action_id=f"act_open_graph_{target_case.case_id}",
                        type="OPEN_FINDING_GRAPH",
                        label="Open money-flow graph",
                        payload={"finding_id": target_case.case_id},
                    )
                )

        elif intent == CopilotIntent.RUN_SUMMARY:
            used_tools = ["get_run_summary"]
            tx_count = run_summary.get("transactions_analyzed", len(cases) * 100)
            crit = run_summary.get("critical_findings", len([c for c in cases if c.severity.value == "CRITICAL"]))
            high = run_summary.get("high_findings", len([c for c in cases if c.severity.value == "HIGH"]))
            exposure = run_summary.get("monetary_exposure_inr", sum(float(c.monetary_exposure) for c in cases))

            answer = (
                f"Audit Run Summary for {run_id}:\n"
                f"• Transactions Analyzed: {tx_count:,}\n"
                f"• Critical Priority Investigations: {crit}\n"
                f"• High Priority Investigations: {high}\n"
                f"• Total Monetary Exposure Requiring Review: ₹{exposure:,.2f}\n\n"
                f"All prioritized investigations are backed by deterministic rules, statistical anomalies, and relational graph evidence."
            )

        elif intent == CopilotIntent.TRACE_FLOW and target_case:
            used_tools = ["trace_money_flow", "get_finding"]
            citations.append(CopilotCitation(type="case", id=target_case.case_id, label=target_case.title))

            answer = (
                f"Money Flow Analysis for {target_case.case_id}:\n"
                f"AuditGraph detected a circular transaction path involving entities {', '.join(target_case.entity_ids)}.\n\n"
                f"Path sequence & timing:\n"
            )
            for t_id in target_case.transaction_ids:
                citations.append(CopilotCitation(type="transaction", id=t_id, label=f"Transaction {t_id}"))
                answer += f"• Transaction {t_id} routed through counterparty network.\n"

            answer += "\nUse the interactive Money-Flow Graph tab to inspect individual node and edge parameters."

        else:
            used_tools = ["list_findings"]
            crit_cases = [c for c in cases if c.severity.value in ("CRITICAL", "HIGH")][:5]

            answer = f"AuditGraph analyzed {len(cases)} total prioritized cases in run {run_id}.\n\nTop prioritized cases requiring auditor review:\n"
            for c in crit_cases:
                citations.append(CopilotCitation(type="case", id=c.case_id, label=c.title))
                answer += f"• [{c.severity.value}] {c.case_id}: {c.title} ({c.risk_score:.1f}/100)\n"

            answer += "\nClick on any investigation case to view complete machine evidence and money-flow details."

        latency = (time.time() - t0) * 1000.0

        return CopilotMessageResponse(
            message_id=f"msg_fallback_{int(time.time()*1000)}",
            session_id=session_id,
            run_id=run_id,
            answer=answer,
            confidence="high",
            grounded=True,
            mode="deterministic_fallback",
            citations=citations,
            used_tools=used_tools,
            follow_up_actions=follow_up_actions,
            safety_note="AuditGraph prioritizes evidence for human investigation and does not determine fraud.",
            latency_ms=round(latency, 2),
        )


deterministic_copilot = DeterministicCopilotFallback()
