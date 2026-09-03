# AUDITGRAPH 10-RUN PIPELINE BENCHMARK REPORT

**Dataset:** `data/demo/auditgraph_demo_100k.csv` (99,906 financial ledger rows)  
**Iterations:** 10 Sequential Full Analysis Runs  

---

## 1. 10-Run Empirical Latency Measurements

```json
{
  "iterations": 10,
  "p50_ms": 22863.1,
  "p95_ms": 23795.4,
  "min_ms": 21737.8,
  "max_ms": 23919.7,
  "runs": [
    { "iteration": 1, "duration_ms": 21737.8, "type": "cold" },
    { "iteration": 2, "duration_ms": 23283.0, "type": "cold" },
    { "iteration": 3, "duration_ms": 22837.8, "type": "cold" },
    { "iteration": 4, "duration_ms": 22150.1, "type": "cold" },
    { "iteration": 5, "duration_ms": 22607.0, "type": "cold" },
    { "iteration": 6, "duration_ms": 22888.5, "type": "warm" },
    { "iteration": 7, "duration_ms": 23795.4, "type": "warm" },
    { "iteration": 8, "duration_ms": 23919.7, "type": "warm" },
    { "iteration": 9, "duration_ms": 22346.0, "type": "warm" },
    { "iteration": 10, "duration_ms": 23723.3, "type": "warm" }
  ]
}
```

---

## 2. Benchmark Summary Statistics

- **P50 Latency:** **`22,863.1 ms (22.86 s)`**
- **P95 Latency:** **`23,795.4 ms (23.80 s)`**
- **Minimum Run Latency:** **`21,737.8 ms (21.74 s)`**
- **Maximum Run Latency:** **`23,919.7 ms (23.92 s)`**
- **Pipeline Run Completion Success:** **10 / 10 Runs (100% Success)**
