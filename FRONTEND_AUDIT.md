# AUDITGRAPH FRONTEND FORENSIC AUDIT REPORT

**Date:** 2026-09-03  
**Target:** Live Frontend at `http://localhost:8088/`  
**Auditor:** Principal UX & Product Architect  

---

## 1. Executive Summary & Defect Findings

A forensic audit of the live frontend (`http://localhost:8088/`) was conducted. Two critical product flaws were identified:

1. **Problem Statement Misalignment:** The existing UI resembled a generic SaaS dashboard with static metrics cards, failing to communicate the core auditor problem statement: *"Chartered Accountants spent days manually auditing 100k transactions; AuditGraph compresses 100,000 ledger rows into 46 high-risk, explainable investigations."*
2. **Disconnected Copilot Integration:** Copilot queries ("Trace the money", "Show GST mismatches") defaulted to generic single-finding fallback templates without invoking specialized tools (`trace_money_flow`, `get_gst_mismatches`, `compare_entities`).

---

## 2. Screen Audit & Action Matrix

| Screen / Component | Current Purpose | Problem Statement Requirement | Identified Gap | Action Plan |
|---|---|---|---|---|
| **Header Banner** | Generic title & static stats | Clear Chartered Accountant Audit Workspace | Lacks client/dataset selection & active audit state | **REWORK:** Add Auditor Workspace Header, active client profile, SHA-256 fingerprint badge |
| **Ingestion Upload** | Simple button / upload | Drag-and-drop CSV/XLSX with column synonym mapping | No visual proof of column synonym detection confidence | **REWORK:** Add drag-and-drop zone with live column mapping confidence table |
| **Analysis Progress** | Simple text alert | Live backend state machine progress | Lacks step-by-step state machine visualization | **REWORK:** Add 7-stage animated state machine progress tracker (SSE/Polling) |
| **Risk Overview** | Generic cards | Visual proof of 100k $\to$ 4k signal compression | Missing Risk Compression Funnel | **REWORK:** Add animated **Risk Compression Funnel** ($100k \to 14k \to 4.9k \to 36$) |
| **Investigation Queue** | Cards list | Ranked CA audit queue with risk & exposure | Lacks anomaly filters (Duplicate, Round-trip, GST, Period-end) | **REWORK:** Add multi-criteria filter tabs & search by vendor/invoice/risk |
| **Investigation Detail** | Basic SVG & score boxes | Comprehensive case investigation room | Graph lacked interactive node hover data & evidence timeline | **REWORK:** Upgrade to Cytoscape/SVG interactive graph with edge hover & machine evidence timeline |
| **GST Reconciliation** | None | Books vs GSTR-2B ITC variance detection | Missing GST reconciliation view | **NEW:** Add GST Reconciliation Panel (Books vs GSTR-2B matching) |
| **AI Audit Copilot** | Generic chat box | Tool-calling evidence sidecar for CAs | Returned static template for all queries | **REWORK:** Connect Multi-Provider Cascade (Gemini/Groq/OpenRouter/Fallback) + Intent Router |
| **Audit Pack Export** | Basic alert | Downloadable CA Audit Summary Report | Lacks formatted export | **REWORK:** Add PDF/HTML Audit Report Pack exporter |

---

## 3. Recommended Information Architecture

```text
1. AUDIT WORKSPACE (Client & Dataset Selector)
2. DATA INGESTION (Drag & Drop + Synonym Mapping Table)
3. ANALYSIS SEQUENCE (7-Stage Live State Machine Tracker)
4. RISK OVERVIEW (Killer Visual #1: Animated Risk Compression Funnel)
5. INVESTIGATION QUEUE (Ranked Cases with Anomaly Filters)
6. INVESTIGATION DETAIL (Killer Visual #2: Money Flow Graph + Evidence Timeline)
7. GST RECONCILIATION PANEL (Books vs GSTR-2B Variance)
8. AI AUDIT COPILOT SIDECAR (Multi-Provider Cascade + Grounded Tool Chips)
9. AUDIT PACK EXPORT (Auditor-Ready Report Download)
```
