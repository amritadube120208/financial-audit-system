# AUDITGRAPH COPILOT PROVIDER INTEGRATION TEST REPORT

**Execution Date:** 2026-09-03  
**Router:** `ProviderCascadeRouter`  

---

## 1. Provider Status Matrix

| Provider Layer | Configured Variable | Availability Status | Failover Trigger | Mode Label |
|---|---|---|---|---|
| **Google Gemini** | `GEMINI_API_KEY` | Available if set | 429 / Timeout / Missing key | `AI COPILOT — GEMINI` |
| **GroqCloud** | `GROQ_API_KEY` | Available if set | 429 / Timeout / Missing key | `AI COPILOT — GROQ` |
| **OpenRouter** | `OPENROUTER_API_KEY` | Available if set | 429 / Timeout / Missing key | `AI COPILOT — OPENROUTER` |
| **Deterministic Engine** | None Required | **Always Available** | N/A (Offline Safety Net) | `EVIDENCE MODE — OFFLINE` |

---

## 2. Intent Routing & Tool Execution Verification

- *"Why is CASE-001 critical?"* $\implies$ `get_run_summary`, `get_finding`, `get_risk_breakdown` (**PASSED**)
- *"Trace circular money flow"* $\implies$ `trace_money_flow` (**PASSED**)
- *"What if graph omitted?"* $\implies$ `simulate_risk_without_detector` (**PASSED**)
- *"Recommended audit steps"* $\implies$ `get_recommended_audit_procedures` (**PASSED**)
- *"Set risk to zero"* $\implies$ Denied (*Action Denied: Read-only audit mode*) (**PASSED**)
