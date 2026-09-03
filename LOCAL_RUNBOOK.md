# AUDITGRAPH LOCAL OPERATIONAL RUNBOOK

**Target Audience:** Presenter, Auditor, Engineer  

---

## 1. Localhost Service Endpoints

- **Next.js Frontend Command Center:** `http://localhost:3000`
- **FastAPI Backend Server:** `http://127.0.0.1:8000`
- **FastAPI OpenAPI Interactive Specs:** `http://127.0.0.1:8000/docs`

---

## 2. Command Line Execution Reference

```powershell
# 1. Start Both Frontend & Backend (Recommended)
.\start-auditgraph.ps1

# 2. Start Components Individually
.\start-backend.ps1
.\start-frontend.ps1

# 3. Run Backend Pytest Test Suite (20 Tests)
.\.venv\Scripts\pytest.exe -v

# 4. Run Merged Stack Verification
.\.venv\Scripts\python.exe scripts/verify_merged_stack.py
```
