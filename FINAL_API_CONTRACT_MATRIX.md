# AUDITGRAPH FINAL API CONTRACT MATRIX

| UI Feature | HTTP Method | Endpoint Path | Request Schema | Response Schema | PASS Status |
|---|---|---|---|---|---|
| **Health Check** | `GET` | `/healthz`, `/api/v1/health` | None | `{ status: "ok", version: "1.0.0" }` | **PASS** |
| **System Readiness** | `GET` | `/readyz` | None | `{ status: "ready", database: "sqlite" }` | **PASS** |
| **Dataset Upload** | `POST` | `/api/v1/datasets` | `Multipart/Form-Data` | `{ dataset_id: "ds_xxx", sha256: "..." }` | **PASS** |
| **Audit Run Creation** | `POST` | `/api/v1/audit-runs` | `{ dataset_id: "ds_xxx" }` | `{ run_id: "run_xxx", status: "READY" }` | **PASS** |
| **Audit Summary** | `GET` | `/api/v1/audit-runs/{id}/summary` | None | `{ summary: { transactions_analyzed: 99906 } }` | **PASS** |
| **SSE Events** | `GET` | `/api/v1/audit-runs/{id}/events` | None | `text/event-stream` (`READY`/`DEGRADED`) | **PASS** |
| **Investigations List** | `GET` | `/api/v1/audit-runs/{id}/findings` | None | `{ cases: [ { case_id: "case_inv_001", risk_score: 92.1 } ] }` | **PASS** |
| **Investigation Detail** | `GET` | `/api/v1/findings/{id}` | None | `{ case_id: "case_inv_001", severity: "CRITICAL" }` | **PASS** |
| **Money Flow Graph** | `GET` | `/api/v1/findings/{id}/graph` | None | `{ graph: { nodes: [...], edges: [...] } }` | **PASS** |
| **GST Reconciliation** | `GET` | `/api/v1/audit-runs/{id}/gst` | None | `{ items: [ { status: "MISSING IN GSTR-2B" } ] }` | **PASS** |
| **Copilot Session** | `POST` | `/api/v1/copilot/sessions` | `{ run_id: "run_xxx" }` | `{ session_id: "cop_xxx" }` | **PASS** |
| **Copilot Message** | `POST` | `/api/v1/copilot/sessions/{id}/messages` | `{ message: "...", selected_case_id: "..." }` | `{ answer: "...", grounded: true, citations: [...] }` | **PASS** |
| **Provider Health** | `GET` | `/api/v1/copilot/provider-health` | None | `{ active_provider: "gemini", providers: {...} }` | **PASS** |
| **Export Report** | `GET` | `/api/v1/audit-runs/{id}/export` | `format=csv` | `text/csv` attachment | **PASS** |
