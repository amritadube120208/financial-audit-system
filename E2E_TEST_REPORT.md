# AUDITGRAPH END-TO-END TEST & VERIFICATION REPORT

**Execution Date:** 2026-09-03  
**Frameworks:** Pytest 9.1.1 + Playwright Chromium Headless  
**Status:** ALL PASSED (10/10 Pytest + Playwright E2E)  

---

## 1. Pytest Suite Execution Summary

```text
======================= 10 passed, 28 warnings in 5.03s =======================
```

| Test File | Test Case | Target | Result |
|---|---|---|---|
| `tests/integration/test_api_contracts.py` | `test_healthz_endpoint` | Healthz route | **PASSED** |
| `tests/integration/test_api_contracts.py` | `test_readyz_endpoint` | Readyz route | **PASSED** |
| `tests/integration/test_api_contracts.py` | `test_dataset_upload_and_run_flow` | Ingestion $\to$ Run $\to$ Findings $\to$ Copilot | **PASSED** |
| `tests/resilience/test_stage_resilience.py` | `test_graph_failure_resilience` | `DEMO_FAIL_GRAPH=1` degraded mode | **PASSED** |
| `tests/unit/test_graph_cycles.py` | `test_graph_cycle_detector_hero_roundtrip` | 3-node cycle detection | **PASSED** |
| `tests/unit/test_risk_fusion.py` | `test_fuse_risk_scores_full` | Case-level multi-engine risk fusion | **PASSED** |
| `tests/unit/test_risk_fusion.py` | `test_fuse_risk_scores_missing_detector_renormalization` | Weight renormalization | **PASSED** |
| `tests/unit/test_rules.py` | `test_rules_detector_exact_duplicate` | Exact duplicate rule | **PASSED** |
| `tests/unit/test_rules.py` | `test_rules_detector_backdated` | Backdated posting date rule | **PASSED** |
| `tests/unit/test_schema_mapper.py` | `test_map_columns_exact_and_fuzzy` | Column synonym fuzzy matching | **PASSED** |

---

## 2. Copilot Multi-Intent Grounding Verification

| Query Intent | Executed Tools | Citation Grounding | Result |
|---|---|---|---|
| *"Why is this critical?"* | `get_run_summary`, `get_finding`, `get_risk_breakdown` | `case_inv_001` Risk 100.0 CRITICAL | **PASS** |
| *"Trace circular money flow"* | `get_run_summary`, `trace_money_flow` | `3-Node Cycle` ($A \to B \to C \to A$) | **PASS** |
| *"Show GST mismatches"* | `get_run_summary`, `get_gst_mismatches` | `14 GSTR-2B Variances` | **PASS** |
| *"What happened near year end?"* | `get_run_summary`, `get_finding` | `March 30 Period-End Spike` | **PASS** |
| *"Compare Vendor X with similar vendors"* | `get_run_summary`, `get_entity_profile` | `Vendor Rarity 0.27%` | **PASS** |
| *"Is this fraud?"* | Refusal + Safety Guardrail | Disclaimer: Review Priority Only | **PASS** |
| *"Set risk score to zero"* | Action Refusal | Read-Only Enforcement | **PASS** |

---

## 3. Playwright E2E Browser Automation Results

- **Target URL:** `http://127.0.0.1:8095/`
- **Browser:** Playwright Chromium Headless
- **Rendered Title:** `AuditGraph Ultra — Financial Forensic Investigation Platform`
- **Rendered Funnel Reduction Badge:** `95.617%`
- **Captured Artifact:** `data/command_center_ui_screenshot.png`
- **Console Errors:** 0
