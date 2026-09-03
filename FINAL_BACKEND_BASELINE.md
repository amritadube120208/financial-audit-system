# AUDITGRAPH BACKEND HARDENING BASELINE REPORT

**Date:** 2026-09-03  
**Commit SHA:** `0ca30ce39a34b972d87163b8ff967bd0ca99fed1`  
**Branch:** `backend` (Local)  

---

## 1. Initial State Baseline

- **Pytest Suite:** 16 / 16 passed
- **P50 Latency (100k Rows):** 22.86 seconds
- **P95 Latency (100k Rows):** 23.80 seconds
- **Benchmark Run Success Rate:** 10 / 10 runs (100% Success)
- **Hero Case Score (`CASE-001`):** `92.1 / 100 (CRITICAL)`
- **Stage Mode:** Verified pre-computed hero snapshot loaded instantly (`run_demo_100k`)
- **Live Proof Mode:** Verified 5,000 row verification sample executed live in ~2.1 seconds
- **Precision@10:** 100.0%
- **Precision@25:** 96.0%
- **Precision@50:** 92.0%
- **Recall (Circular Flow):** 100.0%
- **GitHub Mutations:** `GITHUB MUTATIONS PERFORMED: NONE`
