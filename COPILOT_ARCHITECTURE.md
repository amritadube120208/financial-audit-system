# AUDITGRAPH COPILOT ARCHITECTURE SPECIFICATION

**Architecture:** Multi-Provider Cascade + Grounding Validator + Typed Tool Registry  
**Core Guarantee:** The LLM is an evidence-backed assistant only. It has zero direct DB access, cannot invent financial facts, cannot alter risk scores, and cannot make definitive fraud determinations.

---

## 1. Copilot Execution Sequence

```text
              USER PROMPT ("Trace circular money flow")
                                │
                      CONTEXTUAL SCOPE CHECK
                (run_id, selected_case_id validated)
                                │
                     INTENT & TOOL SELECTION
       (trace_money_flow, get_finding, get_risk_breakdown)
                                │
                       TYPED TOOL EXECUTION
               (fetches exact evidence from store)
                                │
                     MULTI-PROVIDER CASCADE
      ┌─────────────────────────┼─────────────────────────┐
      ▼                         ▼                         ▼
  GEMINI API                GROQCLOUD                 OPENROUTER
 (Primary LLM)            (Secondary LLM)           (Tertiary LLM)
      │                         │                         │
      └─────────────────────────┼─────────────────────────┘
                                │ (on fail/429/timeout)
                                ▼
                   DETERMINISTIC FALLBACK ENGINE
                    (Multi-Intent Offline Engine)
                                │
                       GROUNDING VALIDATOR
          (verifies citations match tool output data)
                                │
               GROUNDED RESPONSE + CITATION CHIPS
```

---

## 2. Supported Auditor Queries & Executed Tools

| Auditor Query | Executed Tools | Citation Output |
|---|---|---|
| *"Why is CASE-001 critical?"* | `get_investigation`, `get_risk_breakdown` | `CASE-001`, Risk 100.0 CRITICAL |
| *"Trace the money."* | `trace_money_flow`, `get_graph_context` | `3-Node Cycle`, `TXN-001`, `TXN-002`, `TXN-003` |
| *"Show GST mismatches"* | `get_gst_mismatches` | `GSTR-2B Variance`, `INV-1002` |
| *"What happened near year end?"* | `search_transactions`, `get_finding` | `March 30 Period-End Spike` |
| *"Compare Vendor X with similar vendors"* | `compare_entities`, `get_entity_profile` | `Vendor Rarity 0.27%` |
| *"Is this fraud?"* | Refusal + Safety Guardrail | Disclaimer: Review Priority Only |
| *"Set risk score to zero"* | Action Refusal | System enforces read-only tool access |
