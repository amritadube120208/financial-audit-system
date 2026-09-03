# AUDITGRAPH FINAL STAGE OPERATIONAL RUNBOOK

**Target Audience:** Hackathon Presenter, System Administrator, SRE  
**Port:** `8102` (Localhost)  

---

## 1. Quick Command Reference

```powershell
# 1. Start AuditGraph Backend Server
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8102

# 2. Run 20-Point Pytest Test Suite
.\.venv\Scripts\pytest.exe -v

# 3. Run 17-Point Final Stage Smoke Test
.\.venv\Scripts\python.exe scripts/final_stage_smoke_test.py

# 4. Run 10-Iteration Performance Benchmark
.\.venv\Scripts\python.exe scripts/benchmark_10_runs.py

# 5. Run Playwright Chromium E2E Browser Verification
.\.venv\Scripts\python.exe scripts/verify_frontend_browser.py
```

---

## 2. Emergency Recovery & Reset Procedures

- **Reset Local State:** Restart Uvicorn server on clean port.
- **Simulate Graph Failure:** Set environment variable `$env:DEMO_FAIL_GRAPH="1"` and restart backend.
- **Simulate LLM Offline Mode:** Unset API keys or set `$env:DEMO_FAIL_LLM="1"`. Copilot automatically uses the Offline Evidence Engine.
