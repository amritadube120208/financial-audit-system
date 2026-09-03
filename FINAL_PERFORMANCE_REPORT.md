# AUDITGRAPH FINAL PERFORMANCE & BENCHMARK REPORT

**Dataset:** `data/demo/auditgraph_demo_100k.csv` (99,906 financial ledger rows)  
**Iterations:** 10 Full Pipeline Analysis Runs  

---

## 1. Latency Metrics Summary (100k Rows)

- **P50 Latency:** **`22,863.1 ms (22.86 s)`**
- **P95 Latency:** **`23,795.4 ms (23.80 s)`**
- **Min Latency:** **`21,737.8 ms (21.74 s)`**
- **Max Latency:** **`23,919.7 ms (23.92 s)`**
- **Pipeline Completion Rate:** **10 / 10 Runs (100% Success)**

---

## 2. Stage-by-Stage Processing Breakdown

| Pipeline Stage | P50 Latency | % of Total Time | Optimization Status |
|---|---|---|---|
| **Dataset Load & Parsing** | 6,235 ms | 27.2% | Pandas `read_csv` streaming |
| **Schema Synonym Mapping** | 120 ms | 0.5% | RapidFuzz fuzzy match |
| **11D Feature Matrix Extraction** | 1,009 ms | 4.4% | Numpy vectorized array ops |
| **Deterministic Rules Engine** | 2,407 ms | 10.5% | Indexed hash map lookup |
| **IsolationForest ML Engine** | 3,668 ms | 16.0% | Sub-sampled fit (25k max) |
| **NetworkX Graph Forensics** | 281 ms | 1.2% | DiGraph cycle detection |
| **DSU Case Fusion & Scoring** | 464 ms | 2.0% | Union-Find clustering |
| **Database Persistence** | 8,679 ms | 38.2% | Bulk SQLite transaction insert |
