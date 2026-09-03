# AUDITGRAPH TEST REPORT

**Execution Date:** 2026-09-03  
**Framework:** Pytest 9.1.1  
**Status:** ALL PASSED (10/10)  

---

## Summary Results

```text
======================= 10 passed, 29 warnings in 5.05s =======================
```

| Test Suite | File | Tests | Status |
|---|---|---|---|
| **Integration API Contracts** | `tests/integration/test_api_contracts.py` | 3 | PASSED |
| **Resilience Failures** | `tests/resilience/test_stage_resilience.py` | 1 | PASSED |
| **Graph Forensics Unit** | `tests/unit/test_graph_cycles.py` | 1 | PASSED |
| **Risk Fusion Unit** | `tests/unit/test_risk_fusion.py` | 2 | PASSED |
| **Rules Suite Unit** | `tests/unit/test_rules.py` | 2 | PASSED |
| **Schema Mapper Unit** | `tests/unit/test_schema_mapper.py` | 1 | PASSED |
| **Playwright Browser E2E** | `tests/e2e_browser/test_browser_e2e.py` | 1 | PASSED |

---

## Playwright Browser Automation Results

- **Browser:** Playwright Chromium Headless
- **Target URL:** `http://127.0.0.1:8090/docs`
- **Rendered Endpoints in Swagger UI:** 20 endpoints
- **Direct `/readyz` Browser Check:** `[OK] PASS`
- **Console Errors:** 0
- **Captured Artifact:** `data/e2e_browser_docs.png`
