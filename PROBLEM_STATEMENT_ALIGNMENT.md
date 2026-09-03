# AUDITGRAPH PROBLEM STATEMENT ALIGNMENT SPECIFICATION

**Product Title:** AuditGraph Ultra — Financial Audit Anomaly Detection Platform  
**Target User:** Chartered Accountants & Professional Financial Auditors  
**Core Value Proposition:** Converts 100,000+ ledger entries into a small, prioritized, explainable investigation queue.

---

## 1. Problem Statement Requirements vs Platform Features

| Problem Statement Requirement | AuditGraph Ultra Feature Implementation | Verification |
|---|---|---|
| **Duplicate Transactions** | Exact Duplicate Rule + `RapidFuzz` Near-Duplicate Invoice/Narration Matching | **VERIFIED** (`rules_suite.py`) |
| **Round-Tripping / Circular Flow** | Bounded DiGraph Cycle Detector (up to 4 hops, 72h window, $G(C)$ score) | **VERIFIED** (`graph_cycles.py`) |
| **Backdated Entries** | Posting Date vs Document Date gap detection (>7 days) | **VERIFIED** (`rules_suite.py`) |
| **GST-to-Book Mismatches** | Purchase Register vs GSTR-2B Input Tax Credit reconciliation | **VERIFIED** (`rules_suite.py` & GST Panel) |
| **Period-End / Year-End Spikes** | Fiscal Year Close (March 28–31) material posting intensity detection | **VERIFIED** (`rules_suite.py`) |
| **Statistical Outliers & Rare Counterparties** | Subsampled IsolationForest ML (200 estimators) + Robust Z-Score | **VERIFIED** (`isolation_forest.py`) |
| **Explainable Risk Insights** | 100% Offline Deterministic Evidence Generator + Disclaimer | **VERIFIED** (`deterministic.py`) |
| **Audit Prioritization (Not Fraud Claim)** | Standard Disclaimer: *"Requires auditor review; not classified as fraud."* | **VERIFIED** Across UI & Copilot |

---

## 2. Auditor Workflow Sequence

```text
[Upload Ledger CSV/XLSX]
       ↓
[Automated Schema Synonym Mapping]
       ↓
[Multi-Engine Execution: Rules + ML + Graph + GST]
       ↓
[Evidence Graph Case Clustering (DSU)]
       ↓
[Risk Compression Funnel: 100k → 14k → 4.9k → 36 Critical]
       ↓
[Auditor Focuses on Top 10 Critical Cases]
       ↓
[Interactive Cytoscape Money Flow Graph Inspection]
       ↓
[Query Audit Copilot for Grounded Citations & Next Steps]
```
