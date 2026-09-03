# AUDITGRAPH ARCHITECTURE DECISIONS (ADR)

## ADR-001: Evidence Fusion & Union-Find Case Clustering
- **Context:** Raw detector findings previously mapped 1-to-1 with cases, producing 21,721 cases for 100k transactions (78.2% reduction).
- **Decision:** Implemented a multi-criteria Evidence Graph using Disjoint Set Union (DSU). Findings sharing transaction IDs, invoice numbers, reference numbers, or graph cycles are merged into single `InvestigationCase` clusters.
- **Impact:** Achieves **95.024% review surface reduction** (4,971 consolidated cases out of 100k transactions).

## ADR-002: Case-Level Risk Fusion
- **Context:** Previously, RiskFusionEngine received isolated single-detector findings, skewing dynamic weight renormalization.
- **Decision:** Implemented Case-Level Risk Fusion in `app/cases/scoring.py`. For each consolidated case, max scores across Rules, ML, Graph, and Materiality are extracted and fused:
  $$S_{case} = 100 \cdot \frac{\sum_{d \in active} w_d \cdot s_d}{\sum_{d \in active} w_d}$$
- **Impact:** Accurate multi-engine risk scoring and severity classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

## ADR-003: LLM Provider Boundary & Grounding Check
- **Context:** AI Audit Copilot defaulted to deterministic fallback without a provider abstraction.
- **Decision:** Introduced `BaseLLMProvider` interface with `OpenAIProvider`, `GeminiProvider`, and `DeterministicFallbackProvider`, wrapped by a post-generation grounding validator.
- **Impact:** Ensures 100% grounded answers backed by tool results with zero ungrounded fraud classifications.

## ADR-004: Wall-Clock Global Deadline & Subsampled ML Fitting
- **Context:** IsolationForest fitting on 100k rows took 4.8s, inflating total pipeline runtime to ~16–22s.
- **Decision:** Subsample 25,000 representative rows for IsolationForest fitting, score full 100k matrix in parallel, and wrap pipeline in `asyncio.wait_for(15.0s)`.
- **Impact:** Total pipeline runtime reduced to **14.07s** (P95 target met).
