# AUDITGRAPH FRONTEND V3 COMMAND CENTER AUDIT

**Date:** 2026-09-03  
**Target:** Command Center UI at `http://127.0.0.1:8095/`  

---

## 1. Information Architecture & Workstation Layout

```text
AUDIT WORKSPACE (Client Selector: Alpha Traders Pvt Ltd)
    ↓
DATA INGESTION & SYNONYM MAPPING (Column Synonym Confidence Table)
    ↓
7-STAGE ANALYSIS PROGRESS TRACKER (Live State Machine Sequence)
    ↓
RISK OVERVIEW (Killer Visual #1: Animated Risk Compression Funnel)
    ↓
INVESTIGATION QUEUE WORKSTATION (Priority, Anomaly Tags, Search)
    ↓
CASE DETAIL & MONEY FLOW GRAPH (Killer Visual #2: Cytoscape Graph + Evidence Timeline)
    ↓
GST RECONCILIATION PANEL (Books vs GSTR-2B ITC Matching Table)
    ↓
AI AUDIT COPILOT SIDECAR (Multi-Provider Cascade + What-If Simulation + Audit Procedures)
```

---

## 2. Viewport & Responsiveness Audit

- **Desktop (1440px):** 12-column grid layout (Queue 5 cols, Case Workspace & Copilot 7 cols). Rendered without horizontal scroll.
- **Laptop (1280px):** Rendered with 0 layout overflow.
- **Tablet (1024px):** Single-column stacked workstation layout.
- **Console Errors:** 0
- **Network Status:** 200 OK across all static and API endpoints.
