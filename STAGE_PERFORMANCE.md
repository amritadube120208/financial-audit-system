# AUDITGRAPH STAGE PERFORMANCE MEASUREMENTS

**Dataset:** `data/demo/auditgraph_demo_100k.csv` (99,906 financial ledger rows)  
**Measurement Date:** 2026-09-03  

---

## 1. Latency & Throughput Metrics

| Measurement Benchmark | Latency (P50) | Latency (P95) | SLA Target | SLA Status |
|---|---|---|---|---|
| **Frontend Initial Page Load** | 120 ms | 180 ms | < 500 ms | **PASS** |
| **Ingestion & Schema Mapping** | 6,235 ms | 6,800 ms | < 10,000 ms | **PASS** |
| **Feature Engineering (11D)** | 1,009 ms | 1,200 ms | < 2,000 ms | **PASS** |
| **Deterministic Rules Engine** | 2,407 ms | 2,600 ms | < 5,000 ms | **PASS** |
| **IsolationForest ML Engine** | 3,668 ms | 4,100 ms | < 6,000 ms | **PASS** |
| **Graph Forensics Engine** | 281 ms | 350 ms | < 1,000 ms | **PASS** |
| **Risk Fusion & Case Builder** | 464 ms | 600 ms | < 1,500 ms | **PASS** |
| **Total End-to-End Pipeline** | **14.07 s** | **14.80 s** | **< 15.00 s** | **PASS** |
| **Copilot Query Roundtrip** | 4.2 ms | 6.5 ms | < 500 ms | **PASS** |

---

## 2. Review Surface Compression Metrics

- **Total Ledger Transactions Analyzed:** `99,906`
- **Total Raw Detector Flags:** `14,333`
- **Consolidated Case Queue:** `4,379`
- **Critical Investigations Requiring Review:** `36`
- **First-Pass Surface Reduction Percentage:** **`95.617%`** ($\ge 95\%$ target met)
