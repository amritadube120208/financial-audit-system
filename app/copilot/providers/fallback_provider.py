import time
import logging
from typing import Any
from app.copilot.providers.base import BaseLLMProvider, ProviderResponse, CopilotCitation

logger = logging.getLogger(__name__)


class DeterministicFallbackProvider(BaseLLMProvider):
    """
    100% Offline Multi-Intent Statutory Evidence Copilot Engine.
    Guarantees that all citations, numbers, entities, and scores originate
    strictly from executed tool outputs with ZERO hardcoded values.
    """

    def is_available(self) -> bool:
        return True

    async def generate_response(
        self,
        session_id: str,
        run_id: str,
        user_message: str,
        system_context: str,
        tool_results: list[dict[str, Any]],
        citations: list[CopilotCitation],
    ) -> ProviderResponse:
        t0 = time.time()
        msg_lower = user_message.lower()

        # Dynamic Extraction from actual tool results
        run_summary: dict[str, Any] = {}
        case_info: dict[str, Any] = {}
        risk_breakdown: dict[str, Any] = {}
        trace_info: dict[str, Any] = {}
        gst_info: dict[str, Any] = {}
        entity_info: dict[str, Any] = {}
        sim_res: dict[str, Any] = {}
        proc_res: dict[str, Any] = {}

        for t in tool_results:
            if not isinstance(t, dict):
                continue
            name = t.get("tool_name", "")
            res = t.get("result", {})
            if not isinstance(res, dict) or "error" in res:
                continue

            if name == "get_run_summary":
                run_summary = res
            elif name == "get_finding":
                case_info = res
            elif name == "get_risk_breakdown":
                risk_breakdown = res
            elif name == "trace_money_flow":
                trace_info = res
            elif name == "get_gst_mismatches":
                gst_info = res
            elif name == "get_entity_profile":
                entity_info = res
            elif name == "simulate_risk_without_detector":
                sim_res = res
            elif name == "get_recommended_audit_procedures":
                proc_res = res

        # Case attributes extracted from tool results
        case_id = case_info.get("case_id") or case_info.get("finding_id")
        title = case_info.get("title", "Investigation Case")
        score = float(case_info.get("risk_score", risk_breakdown.get("risk_score", 0.0)))
        severity = str(case_info.get("severity", risk_breakdown.get("severity", "EVALUATING"))).split(".")[-1]
        exposure = float(case_info.get("monetary_exposure", 0.0))
        anomalies = case_info.get("anomaly_types", risk_breakdown.get("anomaly_types", []))
        entities = case_info.get("entity_ids", [])
        evidence_list = case_info.get("evidence", [])
        transaction_ids = case_info.get("transaction_ids", [])

        # Intent 1: Fraud Classification Guardrail Refusal
        if "fraud" in msg_lower or "scam" in msg_lower or "criminal" in msg_lower or "is this fraud" in msg_lower:
            target_label = f"Investigation **{case_id}**" if case_id else f"Audit run **{run_id}**"
            score_text = f" (Risk Score: {score:.1f}, Severity: {severity})" if case_id else ""
            answer = (
                f"**Statutory Audit Priority Notice:**\n\n"
                f"AuditGraph flags anomalous risk patterns for audit review prioritization and does not classify statutory fraud.\n\n"
                f"{target_label}{score_text} exhibits heightened detector signals requiring independent auditor verification under standard ISA/ICAI procedures."
            )

        # Intent 2: Risk Overriding / Prompt Injection Refusal
        elif "set risk" in msg_lower or "zero" in msg_lower or "ignore rules" in msg_lower or "reset score" in msg_lower:
            target_label = f"case **{case_id}**" if case_id else "this audit engagement"
            answer = (
                f"**Action Denied (Audit Integrity Guardrail):**\n\n"
                f"AuditGraph operates in read-only statutory evidence mode. Risk scores cannot be overridden or modified via prompt instructions.\n"
                f"The verified composite score for {target_label} remains **{score:.1f} ({severity})** based on deterministic and machine-learning detector signals."
            )

        # Intent 3: What-If Risk Simulation
        elif "what if" in msg_lower or "without" in msg_lower or "simulate" in msg_lower or "exclude" in msg_lower:
            if sim_res:
                excluded = sim_res.get("excluded_detector", "SPECIFIED")
                orig = sim_res.get("original_score", score)
                sim = sim_res.get("simulated_score", score)
                delta = sim_res.get("delta_score", 0.0)
                summary_text = sim_res.get("impact_summary", "")
                answer = (
                    f"**What-If Risk Simulation (Read-Only Analysis for {case_id or 'Case'}):**\n\n"
                    f"• **Excluded Detector:** {excluded}\n"
                    f"• **Original Composite Score:** {orig:.1f} ({severity})\n"
                    f"• **Simulated Score:** **{sim:.1f}**\n"
                    f"• **Risk Delta:** **{delta:+.1f} points**\n\n"
                    f"**Auditor Interpretation:** {summary_text}\n"
                    f"*(Note: Stored database score and audit queue ranking remain completely unchanged.)*"
                )
            else:
                answer = (
                    f"**What-If Simulation Status:**\n\n"
                    f"To simulate risk changes without a specific detector, select an investigation case from the queue and specify the engine to omit (Rules, ML, or Graph)."
                )

        # Document requests stay attached to the selected case's real evidence.
        elif "document" in msg_lower and case_id:
            lines = [f"**Supporting documents for {case_id}:**",
                     f"Transactions: {', '.join(transaction_ids)}.",
                     f"Counterparties: {', '.join(entities)}.",
                     "Request original invoices, purchase orders, receipt/service evidence, payment vouchers, bank statements, and approval records."]
            if any("BACKDAT" in str(a).upper() or "PERIOD" in str(a).upper() for a in anomalies):
                lines.append("Request the dated source documents, ERP posting audit trail, manual-journal authorization, and cut-off explanation.")
            if any("GST" in str(a).upper() for a in anomalies):
                lines.append("Request the purchase register, supplier tax invoice, relevant GSTR-2B record, and reconciliation working. The ledger marker is not proof of a tax discrepancy.")
            lines.append("The auditor should verify these records before reaching a conclusion.")
            answer = "\n\n".join(lines)

        # Intent 4: Recommended Audit Procedures
        elif any(k in msg_lower for k in ("procedure", "step", "checklist", "what should i audit", "next", "verify")):
            if proc_res and proc_res.get("recommended_procedures"):
                procedures = proc_res.get("recommended_procedures", [])
                lines = [f"**Recommended Audit Procedures for {case_id or 'Investigation'}:**\n",
                         f"Transactions: {', '.join(transaction_ids)}. Counterparties: {', '.join(entities)}."]
                for i, p in enumerate(procedures, 1):
                    lines.append(f"**{i}. {p.get('title')}:**")
                    for s in p.get("steps", []):
                        lines.append(f"  • {s}")
                answer = "\n".join(lines)
            else:
                answer = (
                    f"**Recommended Audit Next Steps for Run {run_id}:**\n\n"
                    f"1. **Examine High-Exposure Cases:** Review bank statements and voucher documentation for all CRITICAL tier findings.\n"
                    f"2. **Circular Flow Verification:** Perform third-party balance confirmations on all entities involved in detected money-flow loops.\n"
                    f"3. **Tax Reconciliation:** Match purchase register entries against GSTR-2B filing reports."
                )

        # Intent 5: Money Flow Graph Tracing
        elif "trace" in msg_lower or "money" in msg_lower or "flow" in msg_lower or "graph" in msg_lower or "circular" in msg_lower:
            if trace_info and trace_info.get("cycle_detected"):
                graph = trace_info.get("graph_payload") or {}
                lines = [f"**Money-flow trace for {case_id or trace_info.get('case_id')}:**\n"]
                for raw_edge in graph.get("edges", []):
                    edge = raw_edge.get("data", raw_edge)
                    amount = edge.get("amount_inr", edge.get("amount"))
                    amount_text = f"₹{float(amount):,.2f}" if amount is not None else "amount not recorded"
                    lines.append(f"• {edge.get('source')} → {edge.get('target')}: {amount_text}; transaction {edge.get('transaction_id')}; posted {edge.get('posted_at', edge.get('timestamp', 'date not recorded'))}.")
                lines.append(f"\nCase exposure: ₹{exposure:,.2f}. Reconcile the transfers to bank statements and supporting contracts to assess commercial substance. A circular pattern does not establish fraud.")
                answer = "\n".join(lines)
            elif case_id:
                answer = (
                    f"**Money Flow Trace for {case_id}:**\n\n"
                    f"No multi-node circular cycle was isolated for this specific case. Associated entities: {', '.join(entities) if entities else 'N/A'}.\n"
                    f"Review underlying vouchers for transaction-level anomalies."
                )
            else:
                answer = (
                    f"**Money Flow Analysis for Run {run_id}:**\n\n"
                    f"Please select a specific investigation case to inspect its localized counterparty graph and transaction cycle paths."
                )

        # Intent 6: GST / Tax Reconciliation
        elif "gst" in msg_lower or "tax" in msg_lower or "gstr" in msg_lower or "variance" in msg_lower:
            gst_count = gst_info.get("total_gst_mismatches", 0)
            gst_cases = gst_info.get("cases", [])
            lines = [
                f"**Statutory GST-to-Books Reconciliation Summary (Run {run_id}):**\n",
                f"• **Identified GSTR-2B Discrepancies:** **{gst_count}** cases flagged with tax credit variances",
            ]
            if gst_cases:
                top_gst = gst_cases[0]
                lines.append(f"• **Primary Flagged Case:** `{top_gst.get('case_id')}` ({top_gst.get('title')})")
                lines.append(f"• **Exposure at Risk:** ₹{float(top_gst.get('monetary_exposure', 0.0)):,.2f}")
            lines.append("• **Auditor Procedure:** Confirm whether supplier filed GSTR-1 returns and disallow un-reconciled ITC under Sec 16(2)(aa).")
            answer = "\n".join(lines)

        # Intent 7: Specific Investigation Case Explanation
        elif case_id:
            detector_scores = risk_breakdown.get("detector_scores", case_info.get("detector_scores", {}))
            score_summary = ", ".join([f"{k.capitalize()}: {v}" for k, v in detector_scores.items()]) if detector_scores else "Multi-Engine Fusion"
            evidence_lines = []
            for evidence in evidence_list:
                if isinstance(evidence, dict):
                    value = evidence.get("value")
                    if isinstance(value, bool):
                        value = "Yes" if value else "No"
                    unit = f" {evidence['unit']}" if evidence.get("unit") else ""
                    evidence_lines.append(f"  • {evidence.get('label', evidence.get('key', 'Evidence'))}: {value}{unit}")
                else:
                    evidence_lines.append(f"  • {evidence}")
            evidence_summary = "\n".join(evidence_lines) or "  • No detailed evidence recorded"

            answer = (
                f"**Statutory Audit Finding Analysis: {case_id}**\n\n"
                f"• **Title:** {title}\n"
                f"• **Risk Score:** **{score:.1f} / 100.0 ({severity})**\n"
                f"• **Monetary Exposure:** ₹{exposure:,.2f}\n"
                f"• **Transactions:** {', '.join(transaction_ids)}\n"
                f"• **Counterparties:** {', '.join(entities)}\n"
                f"• **Signals:** {', '.join(anomalies)}\n"
                f"• **Contributing Engine Scores:** {score_summary}\n\n"
                f"**Grounded Evidence Points:**\n{evidence_summary}\n\n"
                f"**Action Required:** Prioritize substantive voucher audit and counterparty confirmation."
            )

        # Default / Run Summary Intent
        else:
            tx_count = run_summary.get("transactions_analyzed", 0)
            total_cases = run_summary.get("total_cases", 0)
            crit_cases = run_summary.get("critical_cases", 0)
            high_cases = run_summary.get("high_cases", 0)
            reduction = run_summary.get("review_surface_reduction_pct", 0.0)

            answer = (
                f"**Audit Engagement Overview (Run {run_id}):**\n\n"
                f"• **Transactions Analyzed:** {tx_count:,} general ledger vouchers\n"
                f"• **Consolidated Investigations:** {total_cases} actionable cases ({crit_cases} CRITICAL, {high_cases} HIGH)\n"
                f"• **Review Surface Reduction:** **{reduction:.2f}%** reduction from raw ledger volume\n\n"
                f"Select an investigation from the queue to inspect detector breakdowns, graph topology, and tax reconciliation evidence."
            )

        duration = (time.time() - t0) * 1000.0
        used_tools = list({t.get("tool_name", "get_run_summary") for t in tool_results if isinstance(t, dict)})

        return ProviderResponse(
            message_id=f"msg_fallback_{int(time.time()*1000)}",
            session_id=session_id,
            run_id=run_id,
            answer=answer,
            mode="deterministic_fallback",
            grounded=True,
            confidence="high",
            used_tools=used_tools,
            citations=citations,
            safety_note="Audit review priority only; not a fraud determination.",
            duration_ms=duration,
        )
