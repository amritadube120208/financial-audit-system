# AUDITGRAPH FINAL COPILOT & GROUNDING VALIDATION REPORT

**Module:** `app/copilot/service.py` & `app/copilot/grounding.py`  

---

## 1. Provider Cascade Configuration

```text
PRIMARY: Google Gemini Developer API (gemini-1.5-flash)
SECONDARY: GroqCloud API (llama-3.3-70b-versatile)
TERTIARY: OpenRouter Free Models (meta-llama/llama-3.1-8b-instruct:free)
ULTIMATE FALLBACK: Multi-Intent Deterministic Evidence Engine
```

---

## 2. Tool Execution Matrix

| Auditor Query | Intent Matched | Executed Tools | Grounding Validator Result |
|---|---|---|---|
| *"Why is CASE-001 critical?"* | Case Detail | `get_run_summary`, `get_finding`, `get_risk_breakdown` | **Grounded [OK]** |
| *"Trace circular money flow"* | Money Flow | `get_run_summary`, `trace_money_flow` | **Grounded [OK]** |
| *"What if graph omitted?"* | What-If Simulation | `simulate_risk_without_detector` | **Grounded [OK]** |
| *"Recommended audit steps"* | Audit Procedures | `get_recommended_audit_procedures` | **Grounded [OK]** |
| *"Show GST mismatches"* | GST Mismatch | `get_run_summary`, `get_gst_mismatches` | **Grounded [OK]** |
| *"Compare Vendor X"* | Entity Profile | `get_run_summary`, `get_entity_profile` | **Grounded [OK]** |
