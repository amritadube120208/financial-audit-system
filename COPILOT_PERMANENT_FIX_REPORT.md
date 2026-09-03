# AuditGraph Copilot Permanent Reliability Hardening Report

**System**: AuditGraph Statutory Forensic Copilot  
**Author**: Principal AI Platform Engineer & SRE Team  
**Date**: September 4, 2026  
**Status**: VERIFIED PRODUCTION READY  
**Repository Branch**: `backend` (Local Only — Zero Remote Git Push)

---

## 1. Executive Summary

AuditGraph's Copilot previously suffered from recurring degradation caused by fragile architectural patterns: in-memory state loss across server restarts, silent fallback to arbitrary audit runs, hardcoded case IDs/citations (`case_inv_001`, `VENDOR_X17`, `risk_score=100.0`), unhandled Groq rate limits (HTTP 429), and frontend crash loops on missing backend sessions.

This engineering hardening project permanently re-architected the Copilot subsystem across the full stack:
- **Durable Persistence**: Moved sessions and message history into SQLite (`copilot_sessions`, `copilot_messages`) backed by SQLAlchemy async repository patterns.
- **Strict Run & Case Scoping**: Eradicated all arbitrary-run fallbacks (`next(iter(self._runs.values()))`) and synthetic demo auto-creation. Missing runs and missing sessions now return strict `404 RUN_NOT_FOUND` and `404 SESSION_NOT_FOUND`.
- **Zero-Hardcoding Grounding Engine**: Rewrote `copilot_service.py` and `fallback_provider.py` to derive all citations, entities, anomaly types, and risk scores dynamically from actual tool execution evidence.
- **Self-Healing Frontend Protocol**: Implemented an automated handshake in `apps/web/lib/api/copilot.ts` and `AuditCopilotSheet.tsx` that catches `SESSION_NOT_FOUND`, auto-provisions a fresh session for the active run, and retries the prompt seamlessly without user interruption.
- **Resilient AI Pipeline**: Added bounded jitter retries for Groq API limits (429/5xx), a real Reachability/Latency Health Probe, and a seamless cascade to a deterministic evidence engine.

All 35 automated pytest tests, 10 Playwright end-to-end browser scenarios, 20 consecutive message stress runs, and 10 clean full-stack restart cycles passed with a **100% success rate**.

---

## 2. Root Causes of Past Copilot Fragility

| Historical Defect | Root Cause | Failure Mode |
|---|---|---|
| **1. In-memory Session Wipes** | `self._copilot_sessions = {}` in `store.py` | Any uvicorn reload or restart wiped all active sessions, causing subsequent messages to fail or mutate. |
| **2. Silent Demo Fallback** | `get_copilot_session()` auto-created a demo session on unknown ID | Expired or stale sessions silently bound to `run_demo_100k`, leaking demo data into real audit investigations. |
| **3. Arbitrary Run Fallback** | `next(iter(self._runs.values()))` when run ID was omitted | If a run was not explicitly provided, the system arbitrarily picked any run from memory. |
| **4. Hardcoded Case Citations** | Hardcoded `"case_inv_001"` in fallback & service | Regardless of which case was selected, Copilot cited `case_inv_001` with risk 100.0. |
| **5. Hardcoded Entity Names** | Hardcoded `"VENDOR_X17"` and `"0.27%"` variance | Entities not in the audited ledger were hallucinated in deterministic evidence mode. |
| **6. Hardcoded GST Discrepancy** | Hardcoded `14` mismatches and citation `"gstr_2b_var"` | Failing grounding validation because citation source ID didn't match tool outputs. |
| **7. Hardcoded Action Chips** | Action chips labeled `"CASE-001"` | UI suggested actions for nonexistent cases in custom runs. |
| **8. Stale Frontend Sessions** | Frontend stored session IDs without validating backend existence | Backend restart left frontend holding dead session IDs; next message caused stuck loading spinner. |
| **9. Superficial Health Check** | Provider health checked `bool(GROQ_API_KEY)` only | UI reported "Healthy" even when Groq was rate-limited, timed out, or network-blocked. |
| **10. Unbounded Groq Failures** | Groq 429/timeout threw unhandled exception | Entire Copilot request crashed with 500 error instead of cascading to deterministic engine. |

---

## 3. Architectural Changes Made

```
+-------------------------------------------------------------------------------+
|                             AuditCopilotSheet.tsx                             |
|  - Self-healing retry handshake on 404 SESSION_NOT_FOUND                      |
|  - Non-blocking provider badge (AI GROQ vs EVIDENCE MODE)                     |
|  - Dynamic run context (useParams with fallback)                              |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                       apps/web/lib/api/copilot.ts                             |
|  - Single clean schema: { message, selected_case_id }                         |
|  - Error classification: BACKEND_OFFLINE, SESSION_NOT_FOUND, RUN_NOT_FOUND   |
|  - sendCopilotMessageWithRecovery(sessionId, runId, msg, caseId)             |
+---------------------------------------+---------------------------------------+
                                        | HTTP /api/v1/copilot/...
                                        v
+-------------------------------------------------------------------------------+
|                           app/api/v1/copilot.py                               |
|  - Strict 404 contracts: RUN_NOT_FOUND, SESSION_NOT_FOUND                    |
|  - Real provider health probe (cached 30s reachability & latency)             |
+-------------------+---------------------------------------+-------------------+
                    |                                       |
                    v                                       v
+---------------------------------------+   +-----------------------------------+
|  copilot_repo (SQLAlchemy Async)      |   |        copilot_service.py         |
|  - Table: copilot_sessions            |   |  - Authoritative run validation   |
|  - Table: copilot_messages            |   |  - Dynamic intent tool execution  |
|  - SQLite: auditgraph.db              |   |  - Dynamic evidence extraction    |
|  (Survives reboots & restarts)        |   |  - Dynamic action chips           |
+---------------------------------------+   +-----------------+-----------------+
                                                              |
                                                              v
                                    +-------------------------------------------+
                                    |        ProviderCascadeRouter              |
                                    |  - GroqProvider (Bounded retry + 429)     |
                                    |  - OpenRouterProvider (Fallback 2)        |
                                    |  - DeterministicFallbackProvider (Safe)   |
                                    |  - GroundingValidator (Anti-hallucination)|
                                    +-------------------------------------------+
```

---

## 4. Files Modified & Created

| File | Type | Rationale |
|---|---|---|
| [`app/persistence/copilot_repository.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/app/persistence/copilot_repository.py) | **NEW** | Provides async SQLAlchemy CRUD operations for `CopilotSessionDB` and `CopilotMessageDB` in `auditgraph.db`. |
| [`app/persistence/store.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/app/persistence/store.py) | **MODIFIED** | Removed `next(iter(self._runs.values()))` arbitrary fallback. Removed synthetic demo session creation on unknown session IDs. |
| [`app/api/v1/copilot.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/app/api/v1/copilot.py) | **MODIFIED** | Wired session creation and message logging directly to SQLite DB repository. Added real `/provider-health` probe endpoint. Enforced strict 404 responses. |
| [`app/copilot/service.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/app/copilot/service.py) | **MODIFIED** | Rewrote intent routing to dynamically extract citations from actual tool outputs (`summary_res`, `case_res`, `trace_res`, `gst_res`, `sim_res`). Dynamically generates context-aware follow-up action chips. |
| [`app/copilot/providers/groq.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/app/copilot/providers/groq.py) | **MODIFIED** | Added bounded exponential backoff retries for 429/5xx, dynamic config reading from `settings`, and 30-second cached health probe. |
| [`app/copilot/providers/fallback_provider.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/app/copilot/providers/fallback_provider.py) | **MODIFIED** | Eradicated all hardcoded strings (`case_inv_001`, `VENDOR_X17`, `14`, `100.0`). Dynamically parses actual tool execution results into structured statutory markdown. |
| [`apps/web/lib/api/copilot.ts`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/apps/web/lib/api/copilot.ts) | **MODIFIED** | Centralized Copilot API layer with clean schema `{ message, selected_case_id }`, error classifier, and self-healing session recovery (`sendCopilotMessageWithRecovery`). |
| [`apps/web/lib/api/client.ts`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/apps/web/lib/api/client.ts) | **MODIFIED** | Enhanced API client error parsing to recognize FastAPI `detail` error codes and messages. |
| [`apps/web/lib/types/api.ts`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/apps/web/lib/types/api.ts) | **MODIFIED** | Expanded `CopilotCitation` interface to support dynamic fields: `source_id`, `source_type`, `field`, and `value`. |
| [`apps/web/components/copilot/AuditCopilotSheet.tsx`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/apps/web/components/copilot/AuditCopilotSheet.tsx) | **MODIFIED** | Connected to self-healing message recovery, added non-crashing error boundary banner with retry, and dynamic provider badge (`AI · GROQ` vs `EVIDENCE MODE`). |
| [`tests/integration/test_copilot_reliability_hardened.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/tests/integration/test_copilot_reliability_hardened.py) | **NEW** | Comprehensive 15-test backend test suite verifying persistence, isolation, fallback, 429 handling, and safety refusal. |
| [`tests/e2e_browser/test_copilot_playwright_hardened.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/tests/e2e_browser/test_copilot_playwright_hardened.py) | **NEW** | 10-point browser test verifying sheet opening, messaging, page reload resilience, and cross-route usability. |
| [`scripts/test_20_consecutive_messages.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/scripts/test_20_consecutive_messages.py) | **NEW** | 20-message sequential stress test verifying zero message loss and complete SQLite persistence. |
| [`scripts/test_10_clean_restarts.py`](file:///c:/Users/Ganesh%20Nair/OneDrive/Desktop/FINANCIAL%20AUDIT/scripts/test_10_clean_restarts.py) | **NEW** | 10-iteration process lifecycle test verifying backend reboots and session recovery. |

---

## 5. Session Persistence & Lifecycle Implementation

Sessions are now persisted into the SQLite relational database at `auditgraph.db`. The table schema:
```sql
CREATE TABLE copilot_sessions (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE copilot_messages (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES copilot_sessions(id),
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    mode VARCHAR(64) NOT NULL,
    grounded BOOLEAN DEFAULT TRUE,
    confidence VARCHAR(32) DEFAULT 'high',
    citations_json JSON,
    used_tools_json JSON,
    latency_ms FLOAT,
    created_at DATETIME NOT NULL
);
```

When the backend restarts:
1. The database persists intact on disk.
2. `GET /api/v1/copilot/sessions/{id}/messages` reads directly from `copilot_repo.get_messages(session_id)`.
3. If an old session ID is queried that truly does not exist in SQLite, the backend returns:
   ```json
   {
     "detail": {
       "code": "SESSION_NOT_FOUND",
       "message": "Copilot session 'cop_...' not found."
     }
   }
   ```
4. Frontend `sendCopilotMessageWithRecovery` catches `SESSION_NOT_FOUND`, calls `POST /api/v1/copilot/sessions` for the active `runId`, updates its runtime state, and replays the user prompt. To the user, interaction is uninterrupted.

---

## 6. Run & Case Isolation Implementation

- **Run Scoping**: When a message arrives, `copilot_service.py` executes `get_run_summary(run_id=run_id)`. If the run is not registered, it returns an immediate statutory run error without touching any other run.
- **Case Scoping**:
  - If the user selects a case or sends `selected_case_id`, the system validates that the case exists within `run_id`.
  - If the case is not part of this run, the system rejects the cross-run case ID and falls back to general run review.
  - Citations strictly bind to the verified case: `CopilotCitation(source_type="investigation", source_id=case["case_id"], ...)`.
- **Verification**: Verified across two separate audit runs (`run_alpha_corp` and `run_gamma_ltd`). Citations and entities for Alpha never leaked into Gamma, and vice versa.

---

## 7. Groq Resilience Strategy & Fallback Cascade

1. **Bounded Exponential Backoff**:
   - `groq.py` wraps inference in an asynchronous retry loop with a maximum of 2 attempts.
   - Triggers on HTTP 429 (Rate Limit), 500, 502, 503, 504, and `httpx.TransportError`.
   - Uses jittered backoff (`delay = 0.5 * (2 ** attempt) + random.uniform(0.1, 0.3)`).
2. **Provider Cascade**:
   - If Groq fails after retries, `ProviderCascadeRouter` catches the exception and logs an audit trail.
   - Seamlessly delegates to `DeterministicFallbackProvider`.
   - Generates a fully formatted, grounded statutory evidence response from verified tool outputs with `mode = "deterministic_fallback"`.
   - The user never encounters an application crash or raw stack trace.
3. **Real Reachability Health Probe**:
   - `GET /api/v1/copilot/provider-health` runs a lightweight test request (`max_tokens=2`) against Groq.
   - Caches results for 30 seconds to protect rate limits.
   - Measures latency in milliseconds.
   - Never exposes API keys in response payloads.

---

## 8. Automated Test Suite Results

### A. Pytest Full Test Suite
- **Command**: `pytest -v`
- **Total Tests**: 35
- **Passed**: 35
- **Failed**: 0
- **Duration**: 81.69s
- **Pass Rate**: **100%**

### B. Playwright End-to-End Browser Tests
- **Command**: `python tests/e2e_browser/test_copilot_playwright_hardened.py`
- **Scenarios Evaluated**:
  1. Open Copilot Panel: **PASS**
  2. Send Initial Inquiry: **PASS**
  3. Grounded Response Rendered: **PASS**
  4. Hard Browser Refresh (F5): **PASS**
  5. Send Message Post-Refresh: **PASS**
  6. Multi-Intent Routing (Graph Money Flow): **PASS**
  7. Fresh Incognito Context / Cold Start: **PASS**
  8. Global Copilot Button Usability Across Routes (`/about`): **PASS**
  9. Provider Mode Badge Display (`AI · GROQ`): **PASS**
  10. Verification Screenshot Artifact Saved: **PASS** (`data/copilot_hardened_playwright.png`)

### C. 20 Consecutive Message Stress Test
- **Command**: `python scripts/test_20_consecutive_messages.py`
- **Messages Submitted**: 20
- **Messages Answered**: 20
- **Failures / Dropouts**: 0
- **Database Messages Persisted**: 40 (20 User + 20 Assistant)
- **Total Time**: 121.7s
- **Result**: **PASS (20/20)**

### D. 10 Clean Restarts Test
- **Command**: `python scripts/test_10_clean_restarts.py`
- **Iterations**: 10
- **Full Backend Restarts**: 10
- **Sessions Re-established & Answered**: 10
- **Result**: **PASS (10/10)**

---

## 9. Operational Runbook: How to Diagnose Copilot

1. **Verify Backend Service**:
   ```powershell
   curl http://127.0.0.1:8000/readyz
   ```
   Should return `{"status": "ready"}`.

2. **Verify Provider Health**:
   ```powershell
   curl http://127.0.0.1:8000/api/v1/copilot/provider-health
   ```
   Examine `active_provider` and `latency_ms`.

3. **Inspect SQLite Database**:
   ```powershell
   python -c "import sqlite3; con=sqlite3.connect('auditgraph.db'); print(con.cursor().execute('SELECT COUNT(*) FROM copilot_sessions').fetchone()[0])"
   ```

4. **Force Deterministic Evidence Mode (Testing / Offline)**:
   Set `DEMO_FAIL_LLM=1` in environment or `.env` to verify deterministic statutory engine behavior without an external LLM.

5. **Start Frontend & Backend with Provided Scripts**:
   - Backend: `.\start-backend.ps1`
   - Frontend: `.\start-frontend.ps1`
   - Full Suite: `.\start-auditgraph.ps1`
