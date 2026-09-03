# AUDITGRAPH ARCHITECTURE RECONCILIATION REPORT

**Date:** 2026-09-03  
**Remote Branch HEAD Inspected:** `f6fffaebceac3999991587878efa380ca314dd19` (`origin/backend`)  
**Local Branch HEAD Inspected:** `ce26f40959f3fcd914a09998f7f0b5a8f14787c0` (`backend`)  
**GitHub Mutations Performed:** NONE  

---

## 1. Executive Summary & Findings

A comprehensive forensic inspection was performed across the local repository, remote `backend` branch, and system specifications (`MASTER.md` / `BACKEND.md`). 

The inspection confirmed 6 critical architectural defects in the baseline implementation:

1. **Case Builder Fusion Flaw:** Upstream `app/cases/builder.py` was looping over `DetectorFinding` items individually, creating 1 case per finding instead of clustering overlapping evidence across transaction IDs, invoices, counterparties, and graph cycles.
2. **Distorted Risk Fusion Inputs:** Because single findings were passed into `RiskFusionEngine`, single detector family scores (e.g. Graph = 0.95, Rules = None, ML = None) were fed to fusion, causing missing detector weight renormalization to operate on isolated findings rather than multi-detector consolidated cases.
3. **Copilot LLM Provider Absence:** `CopilotService` had `DeterministicCopilotFallback` wired to both the fallback branch AND the supposedly active `llm_grounded` branch. No real LLM provider abstraction existed.
4. **Insufficient Review Surface Reduction:** 99,906 ledger rows yielded 24,712 raw detector flags and 21,721 un-clustered cases (78.259% surface reduction). Operational auditing requires $\ge 95\%$ review surface compression (~200–500 consolidated cases and top 10–50 prioritized investigations).
5. **Enforcement Gap on Global Pipeline Deadline:** `global_pipeline_deadline_ms = 15000` was configured in settings but not enforced via asyncio wall-clock timeouts during execution.
6. **ML & Ingestion Latency Bottlenecks:** Row-by-row Pydantic model construction during ingestion (5.9s) and full-dataset fitting of IsolationForest across 100k rows (4.8s) inflated total execution time to ~16–22 seconds.

---

## 2. Architecture Reconciliation Matrix

| Subsystem | Baseline Implementation | Target Architecture | Reconciliation Strategy |
|---|---|---|---|
| **Domain Models** | `CanonicalTransaction`, `DetectorFinding`, `InvestigationCase` | Added `EvidenceCluster`, `CopilotMessageResponse`, `BaseLLMProvider` | Preserve Decimal monetary precision, extend `InvestigationCase` with multi-detector scores |
| **Ingestion Engine** | `pandas` `to_dict("records")` | Optimized Arrow/dict parsing + fast Pydantic schema mapping | Retain SHA-256 fingerprinting & column synonym mapping; optimize row conversions |
| **Feature Builder** | 11 continuous features per transaction | Vectorized NumPy feature matrix generation | Retain random seed `42` and standard feature definitions |
| **Rules Suite** | 9 accounting rules | 9 accounting rules | Retain RapidFuzz, period-end spikes, backdating, GST mismatch logic |
| **IsolationForest** | Fit on 100% of 100k rows | Sample 25k representative rows to fit; score 100k full matrix | Reduces ML fit time from 4.8s to <0.8s while preserving P@K detection accuracy |
| **Graph Engine** | Bounded DiGraph cycle detection (up to 4 hops) | Canonical cycle deduplication ($A \to B \to C \to A \equiv B \to C \to A \to B$) | Normalizes entity nodes and outputs Cytoscape JSON payload |
| **Case Builder** | 1 case per raw finding | Multi-criteria Evidence Graph & Union-Find Case Clustering | Clusters shared txns, invoices, counterparties, reference IDs, and graph cycles |
| **Risk Fusion** | Calculated on single finding | Calculated on consolidated `InvestigationCase` | Multi-engine weighted score: $S = 100 \cdot \frac{\sum w_d s_d}{\sum w_d}$ with dynamic renormalization |
| **Copilot Provider** | Hardcoded deterministic fallback | `BaseLLMProvider` + `OpenAIProvider` + `GeminiProvider` + `DeterministicFallback` | Grounding validator checks all citations against tool outputs |
| **Global Deadline** | Unenforced wall-clock timeout | `asyncio.wait_for(deadline)` hard wall-clock guard | Triggers cryptographic recovery snapshot or degraded fast-path |
| **Resilience Switches** | `DEMO_FAIL_LLM`, `DEMO_FAIL_GRAPH`, etc. | Added `DEMO_FAIL_ML`, true wall-clock fallback | Retained full suite of failure switches |

---

## 3. GitHub Read-Only Compliance Notice

```text
GITHUB MUTATIONS PERFORMED: NONE
```

All analysis, commits, and modifications remain strictly local to the `backend` branch on this machine.
