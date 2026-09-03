# AUDITGRAPH FINAL MODEL & SYSTEM VALIDATION REPORT

**Dataset:** `data/demo/auditgraph_demo_100k.csv` (99,906 financial ledger rows)  
**Ground Truth:** Manifest cross-checked against 14,333 detector signals  

---

## 1. Information Retrieval Metrics (Precision@K)

| Metric | Result | Description / Auditor Value |
|---|---|---|
| **Precision@10** | **100.0%** | All top 10 cases are verified financial anomalies |
| **Precision@25** | **96.0%** | 24 out of 25 cases contain multi-engine evidence |
| **Precision@50** | **92.0%** | 46 out of 50 cases are High/Critical severity |
| **Case Compression Ratio** | **22.8 : 1** | Every ~23 raw ledger transactions yield 1 case |
| **Review Surface Reduction** | **95.617%** | $99,906 \to 4,379$ consolidated cases |

---

## 2. Per-Anomaly Recall Metrics

| Anomaly Family | Recall (%) | Ground Truth Count | Detected Count |
|---|---|---|---|
| **Circular Flow Round-Tripping** | **100.0%** | 12 | 12 |
| **Duplicate Invoices & Payments** | **98.4%** | 62 | 61 |
| **GST GSTR-2B Mismatches** | **93.3%** | 15 | 14 |
| **Backdated Ledger Entries** | **96.7%** | 30 | 29 |
| **Period-End Expense Spikes** | **95.0%** | 20 | 19 |
