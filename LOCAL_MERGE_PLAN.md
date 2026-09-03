# AUDITGRAPH LOCAL MERGE PLAN & ARCHITECTURE SPECIFICATION

**Date:** 2026-09-03  
**Target:** Local Monorepo (`financial-audit-system`)  
**Backend:** Local Strong FastAPI Backend (`app/`, HEAD SHA: `d1261a9cbae9e1055d10b3c9ef7bb2813b79d1f8`)  
**Frontend Source:** Remote Branch `origin/frontend` (`apps/web/`, HEAD SHA: `da176a36d9f8e4c959d48d298a5d43ac6060b9e6`)  

---

## 1. Safety & Preservation Directives

1. **GitHub Write Safety:** `GITHUB MUTATIONS PERFORMED: NONE`. All work remains **100% LOCAL ONLY**.
2. **Backend Preservation:** The local strong FastAPI backend (`app/`) is preserved 100%. The weaker remote `backend/` directory in `origin/frontend` is completely ignored.
3. **Frontend Import:** Import ONLY `apps/web/` from `origin/frontend` using `git checkout origin/frontend -- apps/web`.

---

## 2. Step-by-Step Execution Sequence

1. **Step 1:** Create local filesystem backup `_backup_backend/` of core backend files (`app/`, `tests/`, `scripts/`, `alembic/`, `pyproject.toml`).
2. **Step 2:** Import `apps/web/` cleanly from `origin/frontend`.
3. **Step 3:** Compare frontend API calls in `apps/web/lib/api/...` against local FastAPI OpenAPI schemas (`app/main.py`). Create `API_INTEGRATION_MATRIX.md`.
4. **Step 4:** Reconcile API client contracts in `apps/web`:
   - Copilot Request payload: `{ message: content }`
   - Copilot Messages History array wrapping
   - Export route: `/api/v1/audit-runs/{id}/export?format=csv`
   - SSE endpoint: `/api/v1/audit-runs/{id}/events`
   - GST Reconciliation route: `/api/v1/audit-runs/{id}/gst-reconciliation`
5. **Step 5:** Create `apps/web/.env.local` pointing `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.
6. **Step 6:** Run `npm --prefix apps/web install` and verify `npm run build` or Next.js compilation.
7. **Step 7:** Create local launch scripts (`start-backend.ps1`, `start-frontend.ps1`, `start-auditgraph.ps1`).
8. **Step 8:** End-to-end runtime verification (Pytest + Playwright browser).
