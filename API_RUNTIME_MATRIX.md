# AuditGraph API Runtime Matrix

| Method | Endpoint | Primary Consumer | Request Payload / Params | Status Code | Response Type | Validation Status |
|:---|:---|:---|:---|:---:|:---|:---:|
| `GET` | `/healthz` | Navbar, System Health | None | `200 OK` | `{"status": "ok", "service": "auditgraph"}` | **PASS** |
| `GET` | `/readyz` | System Health | None | `200 OK` | `{"status": "ready", "database": "sqlite_async"}` | **PASS** |
| `POST` | `/api/v1/datasets/upload` | FileDropzone | `multipart/form-data` | `200 OK` | `DatasetRef` (SHA-256, row count, schema mapping) | **PASS** |
| `POST` | `/api/v1/datasets/{id}/mapping` | SchemaMapper | `{ mapping: { ... } }` | `200 OK` | `DatasetRef` | **PASS** |
| `POST` | `/api/v1/audit-runs` | AuditConfigPanel | `{ dataset_id, materiality, detectors }` | `200 OK` | `AuditRun` (status: `READY`) | **PASS** |
| `GET` | `/api/v1/audit-runs/{id}` | LivePipelineStages | None | `200 OK` | `AuditRun` | **PASS** |
| `GET` | `/api/v1/audit-runs/{id}/summary` | DashboardHeader, KpiCards, Home | None | `200 OK` | `AuditSummary` (KPIs, funnel, severity breakdown) | **PASS** |
| `GET` | `/api/v1/audit-runs/{id}/findings` | FindingsTable | `?limit=25&offset=0&severity=CRITICAL` | `200 OK` | `{ total_cases, cases: [...] }` | **PASS** |
| `GET` | `/api/v1/findings/{id}` | FindingDetailDrawer | Path `finding_id` | `200 OK` | `InvestigationCase` (evidence, scores, explanation) | **PASS** |
| `GET` | `/api/v1/findings/{id}/graph` | MoneyFlowGraph | Path `finding_id` | `200 OK` | `GraphPayload` (Cytoscape `{ nodes: [], edges: [] }`) | **PASS** |
| `GET` | `/api/v1/audit-runs/{id}/gst` | GstPanel | None | `200 OK` | `GstReconciliationSummary` (variances, unmatched items) | **PASS** |
| `GET` | `/api/v1/audit-runs/{id}/transactions` | TransactionsTable | `?limit=25&offset=0&search=INV-1002` | `200 OK` | `{ total_count, transactions: [...] }` | **PASS** |
| `POST` | `/api/v1/copilot/sessions` | AuditCopilotSheet | `{ run_id }` | `200 OK` | `{"session_id": "...", "messages": []}` | **PASS** |
| `GET` | `/api/v1/copilot/sessions/{id}/messages` | AuditCopilotSheet | Path `session_id` | `200 OK` | `[CopilotMessage, ...]` | **PASS** |
| `POST` | `/api/v1/copilot/messages` | AuditCopilotSheet | `{ message, selected_case_id }` | `200 OK` | `CopilotMessageResponse` (grounded answer, citations) | **PASS** |
| `GET` | `/api/v1/entities/{id}` | Entity Inspector | Path `entity_id` | `200 OK` | `EntityProfile` (transaction count, total volume) | **PASS** |
| `GET` | `/api/v1/exports/runs/{id}/findings` | Export Controller | `?format=json` | `200 OK` | Structured audit export file | **PASS** |
