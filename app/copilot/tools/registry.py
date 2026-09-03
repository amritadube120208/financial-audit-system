from decimal import Decimal
from typing import Any, Callable
from pydantic import BaseModel, Field
from app.domain.models import InvestigationCase, DetectorFinding, CanonicalTransaction
from app.domain.enums import Severity


class ToolResult(BaseModel):
    tool_name: str
    data: dict[str, Any]
    error: str | None = None


class CopilotToolRegistry:
    def __init__(self):
        self.tools: dict[str, Callable] = {}
        self._register_default_tools()

    def register(self, name: str, func: Callable):
        self.tools[name] = func

    def execute(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        cases: list[InvestigationCase],
        findings: list[DetectorFinding],
        transactions: list[CanonicalTransaction],
        run_summary_data: dict[str, Any],
    ) -> ToolResult:
        if tool_name not in self.tools:
            return ToolResult(tool_name=tool_name, data={}, error=f"Tool '{tool_name}' not found.")

        try:
            handler = self.tools[tool_name]
            result_data = handler(
                arguments=arguments,
                cases=cases,
                findings=findings,
                transactions=transactions,
                run_summary=run_summary_data,
            )
            return ToolResult(tool_name=tool_name, data=result_data)
        except Exception as exc:
            return ToolResult(tool_name=tool_name, data={}, error=str(exc))

    def _register_default_tools(self):

        # 1. get_run_summary
        def get_run_summary(arguments, cases, findings, transactions, run_summary, **_):
            return run_summary

        # 2. list_findings / list_cases
        def list_findings(arguments, cases, findings, transactions, run_summary, **_):
            min_risk = float(arguments.get("min_risk", 0.0))
            limit = int(arguments.get("limit", 10))
            severity_filter = arguments.get("severity")

            filtered_cases = [c for c in cases if c.risk_score >= min_risk]
            if severity_filter:
                if isinstance(severity_filter, str):
                    severity_filter = [severity_filter]
                filtered_cases = [c for c in filtered_cases if c.severity.value in severity_filter]

            results = []
            for c in filtered_cases[:limit]:
                results.append({
                    "case_id": c.case_id,
                    "title": c.title,
                    "severity": c.severity.value,
                    "risk_score": c.risk_score,
                    "monetary_exposure": float(c.monetary_exposure),
                    "anomaly_types": c.anomaly_types,
                    "transaction_count": len(c.transaction_ids),
                })
            return {"cases": results, "total_count": len(results)}

        # 3. get_finding / get_case
        def get_finding(arguments, cases, findings, transactions, run_summary, **_):
            finding_id = arguments.get("finding_id") or arguments.get("case_id")
            for c in cases:
                if c.case_id == finding_id or finding_id in [f.finding_id for f in findings]:
                    return c.model_dump()
            if cases:
                return cases[0].model_dump()
            return {"error": f"Case/Finding '{finding_id}' not found."}

        # 4. get_transaction
        def get_transaction(arguments, cases, findings, transactions, run_summary, **_):
            t_id = arguments.get("transaction_id")
            for t in transactions:
                if t.transaction_id == t_id:
                    return t.model_dump()
            return {"error": f"Transaction '{t_id}' not found."}

        # 5. search_transactions
        def search_transactions(arguments, cases, findings, transactions, run_summary, **_):
            entity_q = str(arguments.get("entity_query", "")).lower()
            amt_min = float(arguments.get("amount_min", 0.0))
            limit = int(arguments.get("limit", 20))

            results = []
            for t in transactions:
                amt_val = float(abs(t.amount))
                cp_name = (t.counterparty_name or t.entity_id or "").lower()

                if amt_val >= amt_min:
                    if not entity_q or entity_q in cp_name:
                        results.append({
                            "transaction_id": t.transaction_id,
                            "posting_date": t.posting_date.isoformat(),
                            "entity_id": t.entity_id,
                            "counterparty_name": t.counterparty_name,
                            "amount": float(t.amount),
                            "narration": t.narration,
                        })
                if len(results) >= limit:
                    break

            return {"transactions": results, "count": len(results)}

        # 6. get_entity_profile
        def get_entity_profile(arguments, cases, findings, transactions, run_summary, **_):
            entity_id = str(arguments.get("entity_id", "")).lower()
            matching_txns = [t for t in transactions if entity_id in (t.entity_id or "").lower() or entity_id in (t.counterparty_name or "").lower()]
            matching_cases = [c for c in cases if any(entity_id in e.lower() for e in c.entity_ids)]

            total_amount = sum(float(abs(t.amount)) for t in matching_txns)

            return {
                "entity_id": arguments.get("entity_id"),
                "transaction_count": len(matching_txns),
                "total_amount_inr": total_amount,
                "case_count": len(matching_cases),
                "highest_risk_score": max((c.risk_score for c in matching_cases), default=0.0),
            }

        # 7. compare_entities
        def compare_entities(arguments, cases, findings, transactions, run_summary, **_):
            entity_ids = arguments.get("entity_ids", [])
            profiles = []
            for e_id in entity_ids[:4]:
                p = get_entity_profile({"entity_id": e_id}, cases, findings, transactions, run_summary)
                profiles.append(p)
            return {"comparison": profiles}

        # 8. trace_money_flow
        def trace_money_flow(arguments, cases, findings, transactions, run_summary, **_):
            finding_id = arguments.get("finding_id") or arguments.get("case_id")
            for c in cases:
                if c.case_id == finding_id or (c.graph and finding_id in c.transaction_ids):
                    if c.graph:
                        return {
                            "path_type": "CYCLE",
                            "nodes": [n.model_dump() for n in c.graph.nodes],
                            "edges": [e.model_dump() for e in c.graph.edges],
                            "metrics": c.graph.metrics,
                        }
            # Fallback mock/derived trace
            if cases and cases[0].graph:
                return {
                    "path_type": "CYCLE",
                    "nodes": [n.model_dump() for n in cases[0].graph.nodes],
                    "edges": [e.model_dump() for e in cases[0].graph.edges],
                    "metrics": cases[0].graph.metrics,
                }
            return {"path_type": "NONE", "nodes": [], "edges": [], "metrics": {}}

        # 9. get_risk_breakdown
        def get_risk_breakdown(arguments, cases, findings, transactions, run_summary, **_):
            case_id = arguments.get("case_id") or arguments.get("finding_id")
            for c in cases:
                if c.case_id == case_id:
                    return {
                        "case_id": c.case_id,
                        "risk_score": c.risk_score,
                        "severity": c.severity.value,
                        "risk_breakdown": c.risk_breakdown,
                        "evidence": [ev.model_dump() for ev in c.evidence],
                    }
            if cases:
                return {
                    "case_id": cases[0].case_id,
                    "risk_score": cases[0].risk_score,
                    "severity": cases[0].severity.value,
                    "risk_breakdown": cases[0].risk_breakdown,
                    "evidence": [ev.model_dump() for ev in cases[0].evidence],
                }
            return {"error": "No cases available."}

        # 10. get_gst_mismatches
        def get_gst_mismatches(arguments, cases, findings, transactions, run_summary, **_):
            gst_cases = [c for c in cases if "GST_BOOK_MISMATCH" in c.anomaly_types]
            results = []
            for c in gst_cases:
                results.append({
                    "case_id": c.case_id,
                    "title": c.title,
                    "exposure": float(c.monetary_exposure),
                    "evidence": [ev.model_dump() for ev in c.evidence],
                })
            return {"gst_mismatches": results, "count": len(results)}

        # 11. get_audit_checklist
        def get_audit_checklist(arguments, cases, findings, transactions, run_summary, **_):
            finding_id = arguments.get("finding_id") or arguments.get("case_id")

            # Deterministic pre-authored audit checks
            checks = [
                {
                    "id": "verify_supporting_documents",
                    "label": "Verify purchase order, invoice, and bank payment confirmation for each transaction",
                    "priority": 1,
                },
                {
                    "id": "verify_counterparty_ownership",
                    "label": "Inspect MCA filings for shared directorship or beneficial ownership between entities",
                    "priority": 2,
                },
                {
                    "id": "verify_commercial_purpose",
                    "label": "Document commercial business rationale for rapid or period-end transfers",
                    "priority": 3,
                },
                {
                    "id": "reconcile_gst_portal",
                    "label": "Verify GSTR-3B and GSTR-2B monthly filing reconciliations",
                    "priority": 4,
                },
            ]
            return {"finding_id": finding_id, "checks": checks}

        # 12. get_pipeline_health
        def get_pipeline_health(arguments, cases, findings, transactions, run_summary, **_):
            return {
                "status": run_summary.get("status", "READY"),
                "analysis_mode": run_summary.get("analysis_mode", "live_full"),
                "detectors": run_summary.get("detectors", []),
                "resilience_switches": {
                    "DEMO_FAIL_LLM": 0,
                    "DEMO_FAIL_GRAPH": 0,
                    "DEMO_FAIL_REDIS": 0,
                },
            }

        # Register all tools
        self.register("get_run_summary", get_run_summary)
        self.register("list_findings", list_findings)
        self.register("list_cases", list_findings)
        self.register("get_finding", get_finding)
        self.register("get_case", get_finding)
        self.register("get_transaction", get_transaction)
        self.register("search_transactions", search_transactions)
        self.register("get_entity_profile", get_entity_profile)
        self.register("compare_entities", compare_entities)
        self.register("trace_money_flow", trace_money_flow)
        self.register("get_risk_breakdown", get_risk_breakdown)
        self.register("get_gst_mismatches", get_gst_mismatches)
        self.register("get_audit_checklist", get_audit_checklist)
        self.register("get_pipeline_health", get_pipeline_health)


tool_registry = CopilotToolRegistry()
