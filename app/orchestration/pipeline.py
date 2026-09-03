import asyncio
import time
from datetime import datetime, date
from decimal import Decimal
from typing import Any, Callable

from app.config import settings
from app.ml.registry import model_registry
from app.domain.enums import RunState, DetectorFamily, AnalysisMode
from app.domain.models import CanonicalTransaction, DetectorFinding, InvestigationCase
from app.ingest.loader import load_dataset
from app.features.builder import build_feature_matrix
from app.detectors.rules.rules_suite import RulesDetector
from app.detectors.anomaly.isolation_forest import IsolationForestDetector
from app.detectors.graph.graph_cycles import GraphCycleDetector
from app.cases.builder import build_investigation_cases
from app.explain.deterministic import attach_deterministic_explanations
from app.resilience.recovery import recovery_store
from app.persistence.store import stage_store


class PipelineEvent:
    def __init__(self, event_type: str, run_id: str, data: dict[str, Any]):
        self.event_type = event_type
        self.run_id = run_id
        self.data = data
        self.timestamp = datetime.utcnow().isoformat()


class EventBus:
    def __init__(self):
        self._subscribers: list[Callable[[PipelineEvent], Any]] = []

    def subscribe(self, callback: Callable[[PipelineEvent], Any]):
        self._subscribers.append(callback)

    def publish(self, event: PipelineEvent):
        for sub in self._subscribers:
            try:
                sub(event)
            except Exception:
                pass


event_bus = EventBus()


class PipelineOrchestrator:
    @staticmethod
    def _scope_recovered_cases(snapshot: dict[str, Any], run_id: str):
        for index, case in enumerate(snapshot.get("cases", []), 1):
            case["case_id"] = f"case_{run_id}_{index:03d}"
            case["run_id"] = run_id
        for finding in snapshot.get("findings", []):
            finding["run_id"] = run_id

    async def run_pipeline(
        self,
        run_id: str,
        dataset_sha256: str,
        transactions: list[CanonicalTransaction],
    ) -> dict[str, Any]:
        """
        Orchestrates full audit pipeline execution with hard wall-clock global deadline enforcement.
        Enforces timeout isolation and fallback snapshot reuse.
        """
        t_start = time.time()
        deadline_sec = float(settings.GLOBAL_PIPELINE_DEADLINE_MS) / 1000.0

        # Check for DEMO_FORCE_TIMEOUT flag
        if settings.DEMO_FORCE_TIMEOUT == 1:
            snapshot = recovery_store.get_verified_snapshot(
                dataset_sha256=dataset_sha256,
                pipeline_version=settings.PIPELINE_VERSION,
                scoring_config_version=settings.SCORING_CONFIG_VERSION,
            )
            if snapshot:
                self._scope_recovered_cases(snapshot, run_id)
                snapshot["run_id"] = run_id
                snapshot["analysis_mode"] = "recovered"
                snapshot["status"] = RunState.READY.value
                stage_store.save_run_result(run_id, snapshot)
                return snapshot

        # Wrap core pipeline execution in asyncio.wait_for to strictly enforce wall-clock deadline
        try:
            result = await asyncio.wait_for(
                self._execute_core_pipeline(
                    run_id=run_id,
                    dataset_sha256=dataset_sha256,
                    transactions=transactions,
                    t_start=t_start,
                ),
                timeout=deadline_sec,
            )
            return result

        except asyncio.TimeoutError:
            # Global deadline exceeded: attempt verified cryptographic recovery snapshot reuse
            snapshot = recovery_store.get_verified_snapshot(
                dataset_sha256=dataset_sha256,
                pipeline_version=settings.PIPELINE_VERSION,
                scoring_config_version=settings.SCORING_CONFIG_VERSION,
            )
            if snapshot:
                self._scope_recovered_cases(snapshot, run_id)
                snapshot["run_id"] = run_id
                snapshot["analysis_mode"] = "recovered"
                snapshot["status"] = RunState.READY.value
                stage_store.save_run_result(run_id, snapshot)
                return snapshot

            # Fallback to degraded fast-path analysis (Rules + Materiality only)
            return await self._execute_fast_path(run_id, transactions, ["GLOBAL_DEADLINE_EXCEEDED"])

    async def _execute_core_pipeline(
        self,
        run_id: str,
        dataset_sha256: str,
        transactions: list[CanonicalTransaction],
        t_start: float,
    ) -> dict[str, Any]:

        active_families = [DetectorFamily.RULES, DetectorFamily.ANOMALY, DetectorFamily.GRAPH]
        degraded_reasons = []
        analysis_mode = AnalysisMode.FULL.value

        event_bus.publish(PipelineEvent("STATE_CHANGE", run_id, {"state": RunState.FEATURIZING.value}))

        # 1. Rules Detector Execution
        rules_detector = RulesDetector()
        try:
            rule_findings = await asyncio.to_thread(rules_detector.run, transactions, run_id)
        except Exception as exc:
            rule_findings = []
            degraded_reasons.append(f"RULES_ENGINE_FAILURE: {str(exc)}")

        # 2. IsolationForest ML Engine Execution
        if settings.DEMO_FAIL_ML == 1 or not model_registry.is_ready():
            ml_findings = []
            degraded_reasons.append("DEMO_FAIL_ML switch active" if settings.DEMO_FAIL_ML else "ML MODEL UNAVAILABLE")
            active_families.remove(DetectorFamily.ANOMALY)
        else:
            ml_detector = IsolationForestDetector()
            try:
                ml_findings = await asyncio.to_thread(ml_detector.run, transactions, run_id)
            except Exception as exc:
                ml_findings = []
                degraded_reasons.append(f"ML_ENGINE_FAILURE: {str(exc)}")
                if DetectorFamily.ANOMALY in active_families:
                    active_families.remove(DetectorFamily.ANOMALY)

        # 3. Graph Forensics Engine Execution
        if settings.DEMO_FAIL_GRAPH == 1:
            graph_findings = []
            degraded_reasons.append("DEMO_FAIL_GRAPH switch active")
            active_families.remove(DetectorFamily.GRAPH)
        else:
            graph_detector = GraphCycleDetector()
            try:
                graph_findings = await asyncio.to_thread(graph_detector.run, transactions, run_id)
            except Exception as exc:
                graph_findings = []
                degraded_reasons.append(f"GRAPH_ENGINE_FAILURE: {str(exc)}")
                if DetectorFamily.GRAPH in active_families:
                    active_families.remove(DetectorFamily.GRAPH)

        # Determine overall analysis mode
        if degraded_reasons:
            analysis_mode = AnalysisMode.DEGRADED.value

        # 4. Evidence Fusion & Case Building
        all_findings = rule_findings + ml_findings + graph_findings
        event_bus.publish(PipelineEvent("STATE_CHANGE", run_id, {"state": RunState.GROUPING.value}))

        cases = build_investigation_cases(
            findings=all_findings,
            run_id=run_id,
            materiality_threshold=settings.MATERIALITY_THRESHOLD,
            active_families=active_families,
        )

        # 5. Deterministic Explanations
        event_bus.publish(PipelineEvent("STATE_CHANGE", run_id, {"state": RunState.EXPLAINING.value}))
        cases = attach_deterministic_explanations(cases)

        # 6. Persistence & Response Assembly
        event_bus.publish(PipelineEvent("STATE_CHANGE", run_id, {"state": RunState.PERSISTING.value}))

        total_cases = len(cases)
        crit_cases = sum(1 for c in cases if c.severity.value == "CRITICAL")
        high_cases = sum(1 for c in cases if c.severity.value == "HIGH")

        # Calculated review surface reduction
        reduction_pct = (1.0 - (total_cases / max(1, len(transactions)))) * 100.0

        cases_dicts = [c.model_dump() for c in cases]
        findings_dicts = [f.model_dump() for f in all_findings]

        result_payload = {
            "run_id": run_id,
            "status": RunState.DEGRADED.value if degraded_reasons else RunState.READY.value,
            "analysis_mode": analysis_mode,
            "degraded_reasons": degraded_reasons,
            "transactions_analyzed": len(transactions),
            "total_raw_flags": len(all_findings),
            "ml_model": model_registry.get_status(),
            "total_cases": total_cases,
            "critical_cases": crit_cases,
            "high_cases": high_cases,
            "review_surface_reduction_pct": round(reduction_pct, 3),
            "duration_ms": round((time.time() - t_start) * 1000.0, 1),
            "cases": cases_dicts,
            "findings": findings_dicts,
            "created_at": datetime.utcnow().isoformat(),
        }

        stage_store.save_run_result(run_id, result_payload)

        # Save cryptographic recovery snapshot if execution was clean
        if not degraded_reasons:
            recovery_store.save_snapshot(
                dataset_sha256=dataset_sha256,
                pipeline_version=settings.PIPELINE_VERSION,
                scoring_config_version=settings.SCORING_CONFIG_VERSION,
                result_data=result_payload,
            )

        event_bus.publish(PipelineEvent("STATE_CHANGE", run_id, {"state": RunState.READY.value}))
        return result_payload

    async def _execute_fast_path(
        self,
        run_id: str,
        transactions: list[CanonicalTransaction],
        reasons: list[str],
    ) -> dict[str, Any]:
        """
        Fast-path analysis using Rules + Materiality only when deadline is exceeded or critical engines fail.
        """
        t0 = time.time()
        rules_detector = RulesDetector()
        rule_findings = rules_detector.run(transactions, run_id)

        cases = build_investigation_cases(
            findings=rule_findings,
            run_id=run_id,
            materiality_threshold=settings.MATERIALITY_THRESHOLD,
            active_families=[DetectorFamily.RULES],
        )
        cases = attach_deterministic_explanations(cases)

        result_payload = {
            "run_id": run_id,
            "status": RunState.DEGRADED.value,
            "analysis_mode": "degraded_fast_path",
            "degraded_reasons": reasons,
            "transactions_analyzed": len(transactions),
            "total_raw_flags": len(rule_findings),
            "total_cases": len(cases),
            "critical_cases": sum(1 for c in cases if c.severity.value == "CRITICAL"),
            "high_cases": sum(1 for c in cases if c.severity.value == "HIGH"),
            "review_surface_reduction_pct": round((1.0 - (len(cases) / max(1, len(transactions)))) * 100.0, 3),
            "duration_ms": round((time.time() - t0) * 1000.0, 1),
            "cases": [c.model_dump() for c in cases],
            "findings": [f.model_dump() for f in rule_findings],
            "created_at": datetime.utcnow().isoformat(),
        }
        stage_store.save_run_result(run_id, result_payload)
        return result_payload


pipeline_orchestrator = PipelineOrchestrator()
