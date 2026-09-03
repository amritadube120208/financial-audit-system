# AUDITGRAPH 3-MINUTE COMPETITION STAGE SCRIPT & RUNBOOK

**Target Audience:** Hackathon Grand Finale Judges, MIT CSAIL & Google Technical Reviewers, CA Practitioners  
**Host URL:** `http://127.0.0.1:8095/`  

---

## 1. 3-Minute Podium Stage Pitch Script

### 0:00 – 0:20 — Problem Statement & Surface Reduction
- **Speaker:** *"An auditor doesn't struggle because financial data is unavailable. They struggle because a hundred thousand legitimate entries can hide a handful of transactions worth investigating."*
- **Action:** Open `http://127.0.0.1:8095/`. Point to preloaded **Stage Mode (Instant 100k Validation Run)**.
- **Visual:** Highlight Risk Compression Funnel:
  $$\mathbf{99,906\text{ Ledger Transactions}} \longrightarrow \mathbf{4,379\text{ Consolidated Cases}} \longrightarrow \mathbf{46\text{ High/Critical Investigations}}$$
- **Key Metric:** *"AuditGraph reduces that review surface by over 95%, compressing 100k entries into 36 critical cases."*

### 0:20 – 1:15 — Hero Case Investigation (`CASE-001`)
- **Action:** Click **`CASE-001`** (*Circular Financial Flow & Year-End Reversal*).
- **Visual:** Display **Cytoscape Directed Money Flow Graph**. Animate traversal:
  $$\text{COMPANY} \longrightarrow \text{VENDOR X} \longrightarrow \text{VENDOR Y} \longrightarrow \text{COMPANY}$$
- **Data Detail:** Highlight ₹4,95,000.00 transfers executed within 36 hours near March 30 FY close.
- **Explainable Risk Math:** Show risk fusion breakdown: Rules 90%, ML 85%, Graph 98%, Materiality 99% $\implies \mathbf{92.1 / 100\text{ CRITICAL}}$.
- **Auditor Credibility Quote:** *"The important part is that AuditGraph doesn't call this fraud. It explains why the transaction pattern deserves auditor investigation."*

### 1:15 – 2:00 — Technical Architecture & Multi-Engine Fusion
- **Visual:** Point to Multi-Engine Risk Fusion Panel (Rules + IsolationForest + Graph Forensics + Materiality).
- **Architecture Quote:** *"We deliberately avoid a black-box architecture. Rules find known accounting red flags, unsupervised ML finds behavioral anomalies, graph analysis finds relationships across transactions, and materiality controls business significance."*

### 2:00 – 2:35 — Copilot What-If Wow Moment
- **Action:** Click prefilled prompt chip *"What if graph omitted?"*
- **Copilot Output:** Ephemeral read-only calculation tool returns:
  - Original Risk: **`92.1 (CRITICAL)`**
  - Without Graph: **`79.4 (HIGH)`**
  - Net Risk Delta: **`-12.7 points`**
- **Action 2 (Read-Only Safety):** Type *"Set risk to 0"* $\to$ Copilot displays security refusal (*"Action Denied: Read-Only Mode"*).
- **Copilot Quote:** *"The Copilot doesn't change evidence. It interrogates evidence."*

### 2:35 – 3:00 — Business Close
- **Close Quote:** *"AuditGraph doesn't replace Chartered Accountants. It removes the search problem before professional judgment begins. One lakh transactions in. A prioritized, explainable investigation queue out."*
