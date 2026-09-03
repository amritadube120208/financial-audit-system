# AUDITGRAPH FINAL TEST SUITE REPORT

**Execution Date:** 2026-09-03  
**Framework:** Pytest 9.1.1 + Playwright Chromium Headless  
**Total Test Count:** 20 Unit & Integration Tests + 17-Point Smoke Test  
**Pass Rate:** **100% PASSED**  

---

## 1. Pytest Test Breakdown

```text
======================= 20 passed, 30 warnings in 5.11s =======================
```

| Category | File | Test Case | Target | Result |
|---|---|---|---|---|
| **Integration** | `test_api_contracts.py` | `test_healthz_endpoint` | Healthz route | **PASSED** |
| **Integration** | `test_api_contracts.py` | `test_readyz_endpoint` | Readyz route | **PASSED** |
| **Integration** | `test_api_contracts.py` | `test_dataset_upload_and_run_flow` | Ingestion $\to$ Run $\to$ Findings | **PASSED** |
| **Integration** | `test_provider_cascade.py` | `test_provider_cascade_fallback_graceful` | Provider Failover Cascade | **PASSED** |
| **Resilience** | `test_stage_resilience.py` | `test_graph_failure_resilience` | `DEMO_FAIL_GRAPH=1` degraded mode | **PASSED** |
| **Security** | `test_security_boundaries.py` | `test_prompt_injection_detection` | Injection vector detection | **PASSED** |
| **Security** | `test_security_boundaries.py` | `test_copilot_refuses_risk_mutation` | Read-only risk score protection | **PASSED** |
| **Security** | `test_security_boundaries.py` | `test_copilot_refuses_fraud_claim` | Fraud claim guardrail disclaimer | **PASSED** |
| **Unit** | `test_hero_case_risk_math.py` | `test_hero_case_risk_math_exact` | Hero Case 92.1 score math | **PASSED** |
| **Unit** | `test_hero_case_risk_math.py` | `test_risk_fusion_dynamic_renormalization_missing_graph` | Weight renormalization | **PASSED** |
| **Unit** | `test_hero_case_risk_math.py` | `test_risk_fusion_zero_materiality` | Zero materiality handling | **PASSED** |
| **Unit** | `test_hero_case_risk_math.py` | `test_risk_fusion_boundary_min_max` | Min/Max boundary tests | **PASSED** |
| **Unit** | `test_graph_cycles.py` | `test_graph_cycle_detector_hero_roundtrip` | 3-node cycle detection | **PASSED** |
| **Unit** | `test_recommended_procedures.py` | `test_recommended_audit_procedures` | Anomaly-to-CA-audit-procedure mapping | **PASSED** |
| **Unit** | `test_rules.py` | `test_rules_detector_exact_duplicate` | Exact duplicate rule | **PASSED** |
| **Unit** | `test_rules.py` | `test_rules_detector_backdated` | Backdated posting rule | **PASSED** |
| **Unit** | `test_schema_mapper.py` | `test_map_columns_exact_and_fuzzy` | Schema synonym mapper | **PASSED** |
| **Unit** | `test_what_if_simulation.py` | `test_what_if_risk_simulation_ephemeral` | What-If read-only simulation | **PASSED** |
