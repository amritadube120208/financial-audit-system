# AUDITGRAPH — COPILOT RELIABILITY BASELINE REPORT

**Diagnostic Date:** 2026-09-04  
**Author:** Principal AI Platform & Reliability Engineer  
**Status:** Baseline Established — Architectural Defects Reproduced  

---

## 1. Reproduction Matrix (Scenarios A – L)

| Scenario | Description | Observed Baseline Behavior | Root Cause | Status |
|---|---|---|---|---|
| **A. Normal Copilot** | Standard prompt submission | 200 OK via Groq LLM | Valid key present in `.env` | PASS |
| **B. Refresh Browser** | Full page refresh (F5 / Ctrl+R) | Frontend loses transient session if unpersisted; opens fresh session or re-fetches | Frontend session lifecycle state in memory | AT RISK |
| **C. Restart Frontend** | Next.js server reboot | Frontend mounts fresh UI; attempts to query previous session ID | Frontend memory unlinked to durable session | AT RISK |
| **D. Restart Backend** | FastAPI uvicorn reload | In-memory `_copilot_sessions` wiped clean; message history lost entirely | `self._copilot_sessions = {}` in `StageStore` | **FAIL** |
| **E. Restart Both** | Simultaneous reboot of backend & frontend | All sessions, chat history, and audit context disconnected | In-memory store + unpersisted UI state | **FAIL** |
| **F. Open Different Case** | Querying a secondary investigation (e.g. Case 2) | Copilot still defaults to `case_inv_001` if not explicitly specified; citations cite `case_inv_001` | Hardcoded fallback `target_case_id = request.selected_case_id or "case_inv_001"` | **FAIL** |
| **G. Open Different Run** | Querying a non-existent or newly uploaded run | `get_run_result(run_id)` silently falls back to `next(iter(self._runs.values()))` | Arbitrary run fallback in `app/persistence/store.py` | **FAIL** |
| **H. Use Stale Session ID** | Sending message to deleted or expired session ID | `get_copilot_session(session_id)` auto-creates a synthetic session assigned to `run_demo_100k` | Missing session mask in `store.py` | **FAIL** |
| **I. Delete / Expire Session** | Invalid session ID queried | Backend returns 200 with synthetic session rather than explicit `404 SESSION_NOT_FOUND` | Absence of explicit 404 contract | **FAIL** |
| **J. Temporarily Fail Groq** | Groq 429 / 5xx / timeout | Falls back to deterministic fallback, but health endpoint falsely reports "healthy" based solely on API key string presence | `get_copilot_provider_health` only checks `bool(api_key)` | **FAIL** |
| **K. Invalid Run ID** | Session creation with non-existent audit run | Returns 201 Created by substituting first active demo run | Arbitrary fallback in `get_run_result` | **FAIL** |
| **L. Stale LocalStorage** | Browser retaining obsolete run ID / session | Frontend attempts to query obsolete ID; backend either substitutes demo run or crashes | Lack of frontend validation & self-healing handshake | **FAIL** |

---

## 2. Specific Code-Level Defects Identified

1. **In-Memory Session Storage (`app/persistence/store.py`):**
   ```python
   self._copilot_sessions: dict[str, dict[str, Any]] = {}
   ```
   Sessions and messages reside entirely in process RAM. Any backend restart, reload, or crash destroys conversation history.

2. **Silent Substitution of Missing Audit Runs (`app/persistence/store.py`):**
   ```python
   def get_run_result(self, run_id: str):
       ...
       if self._runs:
           return next(iter(self._runs.values())) # DANGEROUS SILENT SUBSTITUTION
   ```

3. **Auto-Revival of Unknown Sessions with Demo Data (`app/persistence/store.py`):**
   ```python
   def get_copilot_session(self, session_id: str):
       if session_id not in self._copilot_sessions:
           self._copilot_sessions[session_id] = {
               "session_id": session_id,
               "run_id": "run_demo_100k",
               "messages": [],
           }
   ```
   Prevents the frontend from knowing the session expired and prevents clean self-healing.

4. **Hardcoded Case & Citations (`app/copilot/service.py`):**
   - Line 51: `target_case_id = request.selected_case_id or "case_inv_001"`
   - Line 76: `field="cycle_path", value="3-Node Cycle"`
   - Line 98: `source_id="gstr_2b_var", field="mismatch_count", value=14`
   - Line 102: `entity_id="VENDOR_X17"`, `value="0.27%"`
   - Line 112: `value=100.0`
   - Line 144: `label="Why is CASE-001 critical?"`

5. **Shallow Provider Health Check (`app/api/v1/copilot.py`):**
   ```python
   groq_avail = bool((settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip())
   ```
   Checks only whether the environment variable contains characters, ignoring DNS resolution, network availability, HTTP 429 quota exhaustion, and token validity.

6. **Frontend Lacks Self-Healing Protocol:**
   `apps/web/lib/api/copilot.ts` and `apps/web/components/copilot/AuditCopilotSheet.tsx` do not handle 404 responses with automatic session recreation and message replay.
