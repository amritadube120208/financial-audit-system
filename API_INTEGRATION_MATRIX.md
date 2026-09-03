# AUDITGRAPH API INTEGRATION MATRIX

| Frontend Function | Frontend Call Endpoint | Backend FastAPI Route | Contract Match | Reconciliation Action |
|---|---|---|---|---|
| `healthCheck()` | `/api/v1/health` | `GET /healthz`, `GET /api/v1/version` | Matched | Added backend `/api/v1/health` alias |
| `uploadDataset()` | `/api/v1/datasets` | `POST /api/v1/datasets` | **Exact Match** | None required |
| `createAuditRun()` | `/api/v1/audit-runs` | `POST /api/v1/audit-runs` | **Exact Match** | None required |
| `getAuditSummary()` | `/api/v1/audit-runs/{id}/summary` | `GET /api/v1/audit-runs/{id}/summary` | **Exact Match** | None required |
| `subscribeToAuditEvents()` | `/api/v1/audit-runs/{id}/events` | `GET /api/v1/audit-runs/{id}/events` | **Exact Match** | Handles SSE READY/DEGRADED/RECOVERED |
| `getFindings()` | `/api/v1/audit-runs/{id}/findings` | `GET /api/v1/audit-runs/{id}/findings` | **Exact Match** | Returns cases array & summary |
| `getFinding()` | `/api/v1/findings/{id}` | `GET /api/v1/investigations/{id}` | Alias Needed | Added `/api/v1/findings/{id}` backend alias |
| `getFindingGraph()` | `/api/v1/findings/{id}/graph` | `GET /api/v1/investigations/{id}/graph` | Alias Needed | Added `/api/v1/findings/{id}/graph` backend alias |
| `getGstReconciliation()` | `/api/v1/audit-runs/{id}/gst` | `GET /api/v1/audit-runs/{id}/gst-reconciliation` | Alias Needed | Added `/api/v1/audit-runs/{id}/gst` backend alias |
| `createCopilotSession()` | `/api/v1/copilot/sessions` | `POST /api/v1/copilot/sessions` | **Exact Match** | None required |
| `sendCopilotMessage()` | `/api/v1/copilot/sessions/{id}/messages` | `POST /api/v1/copilot/sessions/{id}/messages` | Schema Fix | Updated frontend request `{ message, selected_case_id }` |
| `getCopilotMessages()` | `/api/v1/copilot/sessions/{id}/messages` | `GET /api/v1/copilot/sessions/{id}/messages` | Schema Fix | Updated frontend to parse `{ session_id, messages }` |
| `getAuditExportUrl()` | `/api/v1/audit-runs/{id}/export` | `GET /api/v1/audit-runs/{id}/export` | **Exact Match** | None required |
| `getProviderHealth()` | `/api/v1/copilot/provider-health` | `GET /api/v1/copilot/provider-health` | **Exact Match** | Wired into header badge |
