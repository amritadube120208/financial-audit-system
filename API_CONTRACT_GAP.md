# AUDITGRAPH API CONTRACT GAP ANALYSIS

**Date:** 2026-09-03  
**Auditor:** Principal Backend & API Architect  

---

## 1. OpenAPI Endpoint & UI Mapping Matrix

| UI Feature / Component | Backend Endpoint | Method | Parameters / Body | Status | Compatibility Notes |
|---|---|---|---|---|---|
| **Health Check** | `/healthz` & `/readyz` | GET | None | **COMPATIBLE** | Returns `{"status": "ready"}` |
| **Dataset Ingestion** | `/api/v1/datasets` | POST | `file: UploadFile` | **COMPATIBLE** | Returns `DatasetRef` with SHA256 & canonical mapping |
| **Dataset Metadata** | `/api/v1/datasets/{id}` | GET | `dataset_id: str` | **COMPATIBLE** | Returns row count & column mapping |
| **Create Audit Run** | `/api/v1/audit-runs` | POST | `{"dataset_id": "ds_..."}` | **COMPATIBLE** | Runs multi-engine pipeline |
| **Audit Run Summary** | `/api/v1/audit-runs/{id}/summary` | GET | `run_id: str` | **COMPATIBLE** | Returns metrics & surface reduction % |
| **Investigation Queue** | `/api/v1/audit-runs/{id}/findings` | GET | `run_id: str` | **COMPATIBLE** | Returns `cases: list[InvestigationCase]` |
| **Case Detail** | `/api/v1/findings/{case_id}` | GET | `finding_id: str` | **COMPATIBLE** | Returns single case with evidence & breakdown |
| **Money Flow Graph** | `/api/v1/findings/{case_id}/graph` | GET | `finding_id: str` | **COMPATIBLE** | Returns Cytoscape JSON payload |
| **Create Copilot Session**| `/api/v1/copilot/sessions` | POST | `{"run_id": "run_..."}` | **COMPATIBLE** | Returns `session_id` |
| **Post Copilot Message** | `/api/v1/copilot/sessions/{id}/messages` | POST | `{"message": "...", "selected_case_id": "..."}` | **COMPATIBLE** | Returns grounded answer + citations + tools |
| **Provider Health** | `/api/v1/copilot/provider-health` | GET | None | **ADDED** | Returns active provider status & fallbacks |
| **GST Reconciliation** | `/api/v1/audit-runs/{id}/gst-reconciliation` | GET | `run_id: str` | **ADDED** | Returns Books vs GSTR-2B variances |
