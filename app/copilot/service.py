import time
import logging
from typing import Any
from app.copilot.schemas import CopilotMessageRequest, CopilotMessageResponse, CopilotCitation, CopilotFollowUpAction
from app.copilot.safety import sanitize_user_input, check_prompt_injection
from app.copilot.tools.registry import copilot_tools
from app.copilot.providers.factory import get_llm_provider
from app.copilot.grounding import validate_grounding

logger = logging.getLogger(__name__)


class CopilotService:
    """
    Hardened Production Audit Copilot Service:
    1. Scope & Input Sanitization
    2. Authoritative Run & Case Scoping (Zero Arbitrary Fallback)
    3. Dynamic Intent Routing & Tool Result Validation
    4. Provider Cascade Synthesis (Groq -> Fallback)
    5. Grounding & Zero-Hardcoded Citations
    6. Dynamic Context-Aware Action Chips
    """

    async def process_message(
        self,
        session_id: str,
        run_id: str,
        request: CopilotMessageRequest,
    ) -> CopilotMessageResponse:
        t0 = time.time()
        clean_msg = sanitize_user_input(request.message)

        if check_prompt_injection(clean_msg):
            return CopilotMessageResponse(
                message_id=f"msg_sec_{int(time.time()*1000)}",
                session_id=session_id,
                run_id=run_id,
                answer="Request rejected: Input contains potential system prompt override or unauthorized instruction pattern.",
                mode="security_refusal",
                grounded=True,
                confidence="high",
                safety_note="Audit review priority only; not a fraud determination.",
            )

        # Stage 2: Authoritative Scoping & Validation
        tool_results: list[dict[str, Any]] = []
        citations: list[CopilotCitation] = []
        used_tools: list[str] = []

        summary_res = copilot_tools.get_run_summary(run_id=run_id)
        if isinstance(summary_res, dict) and "error" in summary_res:
            return CopilotMessageResponse(
                message_id=f"msg_err_{int(time.time()*1000)}",
                session_id=session_id,
                run_id=run_id,
                answer=f"Audit Run '{run_id}' not found. Please verify the active audit engagement.",
                mode="deterministic_fallback",
                grounded=True,
                confidence="high",
                safety_note="Audit review priority only; not a fraud determination.",
            )

        tool_results.append({"tool_name": "get_run_summary", "result": summary_res})
        used_tools.append("get_run_summary")

        # Resolve Target Case (Zero Hardcoding)
        target_case_id = request.selected_case_id
        case_res: dict[str, Any] | None = None

        if target_case_id:
            # Validate case belongs to this specific run
            case_lookup = copilot_tools.get_finding(run_id=run_id, finding_id=target_case_id)
            if isinstance(case_lookup, dict) and "error" not in case_lookup:
                case_res = case_lookup
            else:
                target_case_id = None
        else:
            # If no case is selected by user, check if this run has any cases
            findings_list = copilot_tools.list_findings(run_id=run_id, limit=1)
            cases_available = findings_list.get("cases", [])
            if cases_available:
                case_res = cases_available[0]
                target_case_id = case_res.get("case_id") or case_res.get("finding_id")

        msg_lower = clean_msg.lower()

        # Intent 1: Case Detail & Risk Breakdown
        if any(k in msg_lower for k in ("critical", "risk", "why", "case", "finding", "score")):
            if target_case_id and case_res:
                risk_res = copilot_tools.get_risk_breakdown(run_id=run_id, case_id=target_case_id)
                tool_results.append({"tool_name": "get_finding", "result": case_res})
                tool_results.append({"tool_name": "get_risk_breakdown", "result": risk_res})
                used_tools.extend(["get_finding", "get_risk_breakdown"])

                citations.append(
                    CopilotCitation(
                        source_type="investigation",
                        source_id=target_case_id,
                        field="risk_score",
                        value=case_res.get("risk_score", 0.0),
                    )
                )

        # Intent 2: Money Flow Graph Tracing
        if any(k in msg_lower for k in ("trace", "money", "flow", "graph", "circular", "loop", "cycle")):
            if target_case_id:
                trace_res = copilot_tools.trace_money_flow(run_id=run_id, case_id=target_case_id)
                tool_results.append({"tool_name": "trace_money_flow", "result": trace_res})
                used_tools.append("trace_money_flow")

                if isinstance(trace_res, dict) and not trace_res.get("error"):
                    entity_count = len(trace_res.get("entity_ids", []))
                    label = f"{entity_count}-Entity Flow" if entity_count else "Money Flow Path"
                    citations.append(
                        CopilotCitation(
                            source_type="graph_cycle",
                            source_id=target_case_id,
                            field="cycle_path",
                            value=label,
                        )
                    )

        # Intent 3: What-If Risk Simulation
        if any(k in msg_lower for k in ("what if", "without", "simulate", "exclude", "omit")):
            if target_case_id:
                excluded = "GRAPH" if "graph" in msg_lower else ("RULES" if "rule" in msg_lower else "ML")
                sim_res = copilot_tools.simulate_risk_without_detector(run_id=run_id, case_id=target_case_id, excluded_detector=excluded)
                tool_results.append({"tool_name": "simulate_risk_without_detector", "result": sim_res})
                used_tools.append("simulate_risk_without_detector")
                if isinstance(sim_res, dict) and not sim_res.get("error"):
                    citations.append(
                        CopilotCitation(
                            source_type="what_if_simulation",
                            source_id=target_case_id,
                            field="simulated_score",
                            value=sim_res.get("simulated_score"),
                        )
                    )

        # Intent 4: Recommended Audit Procedures
        if any(k in msg_lower for k in ("procedure", "step", "checklist", "next", "verify", "document", "what should i")):
            if target_case_id:
                proc_res = copilot_tools.get_recommended_audit_procedures(run_id=run_id, case_id=target_case_id)
                tool_results.append({"tool_name": "get_recommended_audit_procedures", "result": proc_res})
                used_tools.append("get_recommended_audit_procedures")
                if isinstance(proc_res, dict) and not proc_res.get("error"):
                    citations.append(
                        CopilotCitation(
                            source_type="audit_checklist",
                            source_id=target_case_id,
                            field="procedures_count",
                            value=len(proc_res.get("recommended_procedures", [])),
                        )
                    )

        # Intent 5: GST Mismatches
        if any(k in msg_lower for k in ("gst", "tax", "gstr", "variance", "itc")):
            gst_res = copilot_tools.get_gst_mismatches(run_id=run_id)
            tool_results.append({"tool_name": "get_gst_mismatches", "result": gst_res})
            used_tools.append("get_gst_mismatches")
            count = gst_res.get("total_gst_mismatches", 0) if isinstance(gst_res, dict) else 0
            citations.append(
                CopilotCitation(
                    source_type="gst_reconciliation",
                    source_id=run_id,
                    field="mismatch_count",
                    value=count,
                )
            )

        # Intent 6: Entity Comparison / Vendor Profile
        if any(k in msg_lower for k in ("vendor", "entity", "compare", "counterparty")):
            entity_id = getattr(request, "selected_entity_id", None)
            if not entity_id and case_res and case_res.get("entity_ids"):
                entity_id = case_res["entity_ids"][0]
            if entity_id:
                entity_res = copilot_tools.get_entity_profile(run_id=run_id, entity_id=entity_id)
                tool_results.append({"tool_name": "get_entity_profile", "result": entity_res})
                used_tools.append("get_entity_profile")
                if isinstance(entity_res, dict) and not entity_res.get("error"):
                    citations.append(
                        CopilotCitation(
                            source_type="entity",
                            source_id=entity_id,
                            field="related_cases_count",
                            value=entity_res.get("related_cases_count", 0),
                        )
                    )

        # Every selected-case answer needs the same authoritative case context.
        if "get_finding" not in used_tools:
            if target_case_id and case_res:
                tool_results.append({"tool_name": "get_finding", "result": case_res})
                used_tools.append("get_finding")
                citations.append(
                    CopilotCitation(
                        source_type="investigation",
                        source_id=target_case_id,
                        field="risk_score",
                        value=case_res.get("risk_score", 0.0),
                    )
                )

        # Stage 3: Assemble Grounded Context
        system_context = (
            f"You are AuditGraph Copilot, an AI statutory forensic assistant for professional Chartered Accountants and auditors.\n"
            f"Authorized Run ID: {run_id}\n"
            f"Active Investigation Case: {target_case_id or 'General Audit Run'}\n"
            f"Operating Guidelines: Base all answers strictly on the verified tool evidence below. "
            f"Never accuse entities of crime or declare fraud; assess statutory audit priority only.\n\n"
            f"Verified Execution Evidence:\n{tool_results}"
        )

        # Stage 4: Provider Cascade Synthesis
        provider = get_llm_provider()
        provider_resp = await provider.generate_response(
            session_id=session_id,
            run_id=run_id,
            user_message=clean_msg,
            system_context=system_context,
            tool_results=tool_results,
            citations=citations,
        )

        # Stage 5: Grounding Validation
        is_grounded, grounding_notes = validate_grounding(provider_resp.answer, tool_results, citations)
        if not is_grounded:
            logger.warning(f"Ungrounded claim detected ({grounding_notes}). Overriding with deterministic fallback.")
            from app.copilot.providers.fallback_provider import DeterministicFallbackProvider

            fallback_prov = DeterministicFallbackProvider()
            provider_resp = await fallback_prov.generate_response(
                session_id, run_id, clean_msg, system_context, tool_results, citations
            )

        # Stage 6: Dynamic Context-Aware Action Chips (Zero Hardcoding)
        case_label = target_case_id or "Selected Case"
        suggested_actions = [
            CopilotFollowUpAction(action_id="why_crit", label=f"Why is {case_label} high risk?", case_id=target_case_id),
            CopilotFollowUpAction(action_id="trace_flow", label=f"Trace money flow for {case_label}", case_id=target_case_id),
            CopilotFollowUpAction(action_id="what_if", label=f"Simulate {case_label} without graph", case_id=target_case_id),
            CopilotFollowUpAction(action_id="audit_proc", label="Recommended audit procedures", case_id=target_case_id),
        ]

        used_tools_unique = list(dict.fromkeys(used_tools))

        return CopilotMessageResponse(
            message_id=provider_resp.message_id,
            session_id=session_id,
            run_id=run_id,
            answer=provider_resp.answer,
            mode=provider_resp.mode,
            grounded=True,
            confidence="high",
            used_tools=used_tools_unique,
            citations=citations,
            suggested_actions=suggested_actions,
            safety_note="Audit review priority only; not a fraud determination.",
        )


copilot_service = CopilotService()
