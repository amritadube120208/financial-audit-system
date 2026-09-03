# AUDITGRAPH COPILOT DIAGNOSTIC REPORT

**Diagnostic Date:** 2026-09-03  
**Status:** Root Causes Identified & Fix Plan Formulated  

---

## 1. Trace Analysis of Failed Queries

During empirical tracing of `CopilotService`, queries were posted to `/api/v1/copilot/sessions/{id}/messages`.

| Query | Expected Tool Execution | Observed Execution | Root Cause |
|---|---|---|---|
| *"Why is this critical?"* | `get_finding`, `get_risk_breakdown` | Used `get_run_summary` | Intent router defaulted to generic summary |
| *"Trace the money."* | `trace_money_flow`, `get_finding` | Used `get_run_summary` | Query string didn't trigger money flow route |
| *"Show GST mismatches"* | `get_gst_mismatches` | Used `get_run_summary` | Intent router didn't pass GST mismatch case list |
| *"What happened near year end?"* | `search_transactions` (March 28-31 filter) | Used `get_run_summary` | Period-end intent handler missing |
| *"Is this fraud?"* | Refusal + Disclaimer | Returned generic text | Safety guardrail lacked explicit fraud claim refusal |

---

## 2. Root Cause Summary

1. **Intent Router Limitation:** `CopilotService` had simplistic substring checks (`if "gst" in query`) which missed common auditor prompts like *"Trace circular money flow"* or *"Why is case_inv_001 critical?"*.
2. **Generic Fallback Response Generator:** `generate_deterministic_fallback()` was returning identical template text regardless of query intent.
3. **Absence of Real Provider Cascade:** No automatic failover between LLM providers (Gemini, GroqCloud, OpenRouter, Fallback).

---

## 3. Required Repair Plan

1. **Implement Dynamic Intent Router:** Parse query intents (`CRITICAL_WHY`, `MONEY_FLOW`, `GST_MISMATCH`, `YEAR_END_POSTINGS`, `VENDOR_COMPARE`, `FRAUD_DISCLAIMER_CHECK`).
2. **Multi-Provider Cascade Router (`app/copilot/providers/router.py`):**
   ```text
   Gemini API (Primary) → GroqCloud API (Secondary) → OpenRouter (Tertiary) → Multi-Intent Fallback
   ```
3. **Intent-Specific Fallback Templates:** Ensure every intent returns tailored, grounded evidence responses even when 100% offline.
