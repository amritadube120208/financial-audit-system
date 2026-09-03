# AUDITGRAPH 3-MINUTE STAGE DEMO RUNBOOK

**Target Audience:** Hackathon Grand Finale Judges & Technical Audience  
**Host URL:** `http://127.0.0.1:8095/`  

---

## 1. Hackathon Stage Pitch & Flow (3 Minutes)

### Minute 1: The Problem & Live Ingestion (0:00 – 1:00)
- **Statement:** *"Chartered Accountants spend 80% of their audit engagement scrolling through 100,000 Excel ledger rows looking for needle-in-a-haystack compliance risks."*
- **Action:** Open `http://127.0.0.1:8095/` in Chrome. Drag and drop `auditgraph_demo_100k.csv` (18 MB).
- **Visual Highlight:** Point to automated Column Synonym Mapping Table (Posting Date 98%, Amount 96%, Vendor 100%, GSTIN 94%).
- **State Machine:** Show 7-stage animated state machine sequence ticking live from `FEATURIZING` $\to$ `RULES` $\to$ `ML_ANOMALY` $\to$ `GRAPH_FORENSICS` $\to$ `READY`.

### Minute 2: Risk Compression & Money Flow Forensics (1:00 – 2:00)
- **Visual #1 — Risk Compression Funnel:** Show 100,000 transactions compressing down to **36 Critical Cases** (**95.617% reduction**).
- **Workstation Queue:** Filter by `Circular Flow`. Click top hero case **`CASE-001`** (*Circular Financial Flow & Year-End Reversal*, Score `100.0`).
- **Visual #2 — Cytoscape Money Flow Graph:** Hover over the directed 3-node cycle (`COMPANY_MAIN` $\to$ `VENDOR_X17` $\to$ `VENDOR_Y09` $\to$ `COMPANY_MAIN`). Highlight ₹4,95,000.00 transfers executed within 36 hours before fiscal year-end close.

### Minute 3: Grounded AI Copilot, What-If Simulation & GST Verification (2:00 – 3:00)
- **Copilot Tool Action 1:** Click prompt chip *"Trace circular money flow"* $\to$ Copilot executes `trace_money_flow` tool and renders grounded evidence with clickable citation chips.
- **Copilot Tool Action 2 (Judge Wow):** Click prompt chip *"What if graph omitted?"* $\to$ Copilot executes `simulate_risk_without_detector` and renders instant What-If risk delta (-17.3 points) without mutating stored state!
- **Copilot Action 3 (Read-Only Safety):** Type *"Set risk to 0"* $\to$ Copilot demonstrates security guardrail refusal (*"Action Denied: Read-Only Mode"*).
- **GST Reconciliation Panel:** Click GST Reconciliation tab to display Books vs GSTR-2B Input Tax Credit matching table with 14 variance alerts.
- **Close:** *"AuditGraph reduces audit review surface by 95.6%, surfacing explainable, evidence-backed findings for Chartered Accountants."*
