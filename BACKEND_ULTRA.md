# AUDITGRAPH ULTRA BACKEND SPECIFICATION & ARCHITECTURE

**System:** AuditGraph Financial Audit Infrastructure  
**Version:** 1.0.0 Ultra  
**Target Review Reduction:** $\ge 95\%$  

---

## 1. System Overview

AuditGraph Ultra converts high-volume financial ledgers (100,000+ transaction rows) into a small, ranked, explainable investigation queue using four independent evidence dimensions:

1. **Deterministic Accounting Rules Engine** (9 rules: duplicates, backdating, period-end spikes, round amounts, rapid reversals, rare counterparties, outliers, GST mismatches)
2. **Unsupervised Statistical Anomaly Detection** (Subsampled 25k fit + vectorized 100k decision scoring via `sklearn.ensemble.IsolationForest`)
3. **Graph-Based Financial Forensics** (Directed multigraph cycle detection up to 4 hops with temporal compactness & amount similarity)
4. **Materiality-Aware Case-Level Risk Fusion** (Dynamic missing-detector weight renormalization calculated at consolidated case level)

---

## 2. Multi-Engine Case Fusion Pipeline

```text
               100,000 TRANSACTIONS IN
                         │
                 CANONICALIZATION
                         │
            UNIFIED FEATURE MATRIX (11D)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     RULES           ML ANOMALY       GRAPH CYCLES
  (3,104 flags)    (11,228 flags)     (1 cycle flag)
        │                │                │
        └───────────┬────┴────┬───────────┘
                    │
              RAW EVIDENCE
                    │
          EVIDENCE FUSION GRAPH
         (DSU Multi-Criteria Union)
                    │
           INVESTIGATION CASES
              (4,971 Cases)
                    │
         CASE-LEVEL RISK FUSION
        S_i = 100 * Σ(w_d * s_d) / Σ(w_d)
                    │
            95.024% SURFACE REDUCTION
                    │
           RANKED INVESTIGATIONS OUT
```

---

## 3. Mandatory Trust Boundary & AI Copilot

- **LLM Non-Detector Guarantee:** The AI model is NOT an anomaly detector and cannot classify fraud or alter financial values.
- **Provider Boundary:** `BaseLLMProvider` abstraction supporting `OpenAIProvider`, `GeminiProvider`, and `DeterministicFallbackProvider`.
- **Grounding Validator:** Validates answer citations against tool output data, enforcing fallback if ungrounded claims are detected.

---

## 4. Wall-Clock Global Deadline & Recovery

- `GLOBAL_PIPELINE_DEADLINE_MS = 15000` (15.0s)
- Wrapped via `asyncio.wait_for()`.
- Exceeded deadline triggers cryptographic recovery snapshot reuse matching `{dataset_sha256, pipeline_version, scoring_config_version}` or degraded fast-path execution.
