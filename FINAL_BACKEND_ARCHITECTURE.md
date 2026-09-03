# AUDITGRAPH FINAL BACKEND ARCHITECTURE SPECIFICATION

**System Architecture:** Modular Financial Audit Anomaly Engine  
**Runtime:** Python 3.12 / FastAPI Async ASGI Server  
**Persistence Layer:** SQLite Local Working Memory + Cryptographic Snapshot Recovery Store  

---

## 1. Pipeline Execution Flow

```text
RAW LEDGER (CSV / XLSX)
    ↓
CANONICALIZATION & SYNONYM MAPPING (98% posting_date, 96% amount, 100% vendor_name, 94% gstin)
    ↓
11D FEATURE MATRIX EXTRACTION (Numpy / Vectorized Pandas)
    ↓
MULTI-ENGINE DETECTORS (Parallel / Isolated Execution)
├── Deterministic Rules Suite (Duplicates, Backdated, Period-End Spikes, Round Amounts)
├── IsolationForest ML Engine (Unsupervised Behavioral Outliers, Contamination = 0.05)
└── Graph Forensics Engine (NetworkX 3-Node Cycle Detection, Window = 36h)
    ↓
DISJOINT SET UNION (DSU) EVIDENCE FUSION & CLUSTER BOUND PROTECTION
(Consolidates multi-detector findings; Max 100 transactions & Max 250 findings per case)
    ↓
CASE-LEVEL RISK FUSION (Dynamic Weight Renormalization)
$$Risk = \frac{0.35(Rules) + 0.25(ML) + 0.25(Graph) + 0.15(Materiality)}{\sum w_{active}} \times 100$$
    ↓
AUDITOR COMMAND CENTER QUEUE (Hero Case: CASE-001, Score: 92.1 CRITICAL)
    ↓
GROUNDED AI COPILOT SIDECAR (Multi-Provider Cascade + Ephemeral What-If Simulation + CA Audit Procedures)
```

---

## 2. Dynamic Weight Renormalization Formula

When detector families are unavailable or fail gracefully, weights automatically renormalize:

$$\text{Renormalized Score} = \frac{\sum_{f \in \mathcal{F}_{\text{active}}} w_f \cdot S_f}{\sum_{f \in \mathcal{F}_{\text{active}}} w_f} \times 100\%$$

This guarantees that engine degradation (e.g., ML offline or Graph disabled) never causes API failure or incorrect score scaling.
