# AUDITGRAPH FRONTEND REDESIGN SPECIFICATION

**Design Philosophy:** *"Financial Forensic Investigation Command Center"*  
**Visual Style:** Bloomberg data density + Palantir investigation workflow + Stripe clarity. Clean off-white/charcoal typography with high-contrast risk colors.

---

## 1. Information Architecture & Key Components

1. **Top Navigation Header & Auditor Workspace:**
   - Active Client/Dataset indicator (`Alpha Traders Pvt Ltd — FY26 Ledgers`)
   - Platform status indicator (`Backend Ready :8088`)
   - Client Action CTAs: `NEW AUDIT ANALYSIS`, `OPEN INVESTIGATION`

2. **Data Ingestion & Schema Synonym Detection:**
   - Drag-and-drop file upload container.
   - Column Mapping Confidence Table showing fuzzy matching confidence for Posting Date, Amount, Vendor Name, GSTIN.

3. **7-Stage Analysis Progress Tracker:**
   - Animated state machine sequence (`INGESTING` $\to$ `VALIDATING` $\to$ `FEATURIZING` $\to$ `DETERMINISTIC_RULES` $\to$ `ML_ANOMALY` $\to$ `GRAPH_FORENSICS` $\to$ `CASE_FUSION` $\to$ `SCORING`).

4. **Killer Visual #1: Animated Risk Compression Funnel:**
   - Visualizes compression from 100,000 transactions $\to$ 14,333 detector flags $\to$ 4,379 cases $\to$ 36 Critical Investigations (**95.6% surface reduction**).

5. **Investigation Queue (The Auditor's Primary Workstation):**
   - Filters by severity (`ALL`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and anomaly type (`Circular Flow`, `Duplicate`, `GST Mismatch`, `Period End`, `Backdated`, `Statistical Anomaly`).
   - Search bar across case IDs, vendor names, amounts, and invoice numbers.

6. **Investigation Detail & Killer Visual #2: Cytoscape Money Flow Graph:**
   - Interactive directed graph ($A \to B \to C \to A$) with edge hover inspection displaying transaction date, amount, reference number, and account details.
   - Multi-Engine Risk Fusion Breakdown gauges (`Rules`, `ML Anomaly`, `Graph Forensics`, `Materiality`).
   - Factual Machine Evidence Timeline.

7. **GST Reconciliation View:**
   - Books vs GSTR-2B Input Tax Credit reconciliation table with status tags (`MATCHED`, `PARTIAL MATCH`, `MISSING IN GSTR-2B`, `AMOUNT MISMATCH`).

8. **AI Audit Copilot Sidecar:**
   - Contextual tool-calling AI sidecar with prefilled prompt chips (*"Why is CASE-001 critical?"*, *"Trace the money"*, *"Show GST mismatches"*, *"What happened near year end?"*).
   - Shows active tools used (`get_finding`, `trace_money_flow`, `get_risk_breakdown`) and grounded citation chips with mandatory auditor review disclaimer.
