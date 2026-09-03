# COPILOT ROOT CAUSE DIAGNOSIS & REPAIR REPORT

**Module:** `app/copilot/service.py`, `app/copilot/providers/factory.py`  

---

## 1. Identified Root Causes for Potential Copilot Failures

1. **Frontend-Backend Schema Discrepancy:** The legacy frontend sent `{ content: "..." }`, while the FastAPI backend expected `{ message: "..." }`.  
   *Fix:* Updated `sendCopilotMessage` in `apps/web/lib/api/copilot.ts` to send both `{ message, content }`.
2. **Missing Provider API Key Fallback Handling:** When cloud provider API keys (Gemini / Groq / OpenRouter) were unconfigured, unhandled exceptions in legacy code returned 500 errors.  
   *Fix:* Built `ProviderCascadeRouter` with `is_available()` checks and seamless fallback to `DeterministicFallbackProvider`.
3. **Array Schema Wrapping in Message History:** `GET /api/v1/copilot/sessions/{id}/messages` returns `{ session_id, messages: [...] }`.  
   *Fix:* Updated frontend wrapper to unwrap `res.messages` array cleanly.
4. **Tool Execution Scope:** All tools in `CopilotTools` now enforce strict scoping to the authorized `run_id`.
