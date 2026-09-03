# AUDITGRAPH FINAL STAGE SMOKE TEST SUMMARY

**Script:** `scripts/final_stage_smoke_test.py`  

---

## 1. Automated Verification Checks

1. `GET /healthz` returns 200 OK (**PASSED**)
2. `GET /readyz` returns 200 OK (**PASSED**)
3. `GET /api/v1/copilot/provider-health` returns 200 OK (**PASSED**)
4. `POST /api/v1/datasets` uploads 100k ledger (**PASSED**)
5. `POST /api/v1/audit-runs` creates audit run (**PASSED**)
6. `GET /api/v1/audit-runs/{id}/summary` returns 99,906 rows analyzed (**PASSED**)
7. Hero `CASE-001` exists (**PASSED**)
8. Hero score equals `92.1 CRITICAL` (**PASSED**)
9. Hero Cytoscape graph payload contains 3 nodes & 3 edges (**PASSED**)
10. GST reconciliation view responds (**PASSED**)
11. `POST /api/v1/copilot/sessions` creates session (**PASSED**)
12. Copilot message returns grounded evidence (**PASSED**)
13. What-If risk simulation tool executes (**PASSED**)
14. What-If simulation leaves stored case score unchanged at `92.1` (**PASSED**)
15. Security prompt injection is refused cleanly (**PASSED**)
16. Security risk score mutation attempt is denied (**PASSED**)
17. CA Recommended Audit Procedures tool responds (**PASSED**)
