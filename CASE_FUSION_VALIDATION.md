# AUDITGRAPH CASE FUSION & CLUSTERING VALIDATION REPORT

**Module:** `app/cases/clustering.py` & `app/cases/builder.py`  
**Algorithm:** Disjoint Set Union (DSU) Multi-Criteria Evidence Graph  

---

## 1. DSU Graph Union Criteria

Findings are connected into a single `EvidenceCluster` if they share any of the following key identifiers:

1. **Transaction ID Match:** Multiple findings referencing the same `transaction_id`.
2. **Invoice Number Match:** Shared `invoice_number` across vendor entries.
3. **Reference Number Match:** Shared banking `reference_number`.
4. **Graph Cycle Path:** Entities and transactions participating in the same directed multigraph cycle path.
5. **Entity ID Match:** Identical `entity_id` or `counterparty_name`.

---

## 2. Case Fusion Proof on Hero Case `CASE-001`

- **Raw Findings Merged:** 5 raw detector findings across 3 transactions (`TXN-001`, `TXN-002`, `TXN-003`).
- **Engine Agreement:**
  - **Rules Engine:** Period-End Spike (March 30), Rare Counterparty (`Vendor Y09`).
  - **IsolationForest ML:** Anomaly Score `0.85`.
  - **Graph Forensics:** 3-Node Cycle Score `0.98`.
  - **Materiality Engine:** Exposure `₹495,000.00` (Materiality Score `0.99`).
- **Result:** **ONE consolidated investigation case (`CASE-001`)** instead of 5 separate un-clustered alerts.
