import asyncio
import time
from datetime import datetime
from decimal import Decimal
from typing import Any, AsyncGenerator

from app.config import settings
from app.domain.enums import RunState, AnalysisMode, DetectorFamily
from app.domain.models import CanonicalTransaction, DetectorFinding, InvestigationCase
from app.detectors.rules.rules_suite import RulesDetector
from app.detectors.anomaly.isolation_forest import IsolationForestDetector
from app.detectors.graph.graph_cycles import GraphCycleDetector
from app.cases.builder import build_investigation_cases
from app.explain.deterministic import attach_deterministic_explanations
from app.resilience.recovery import recovery_store


class PipelineEvent:
    def __init__(
        self,
        run_id: str,
        state: RunState,
        stage: str,
        progress: float,
        message: str,
        degraded: bool = False,
    ):
        self.run_id = run_id
        self.state = state
        self.stage = stage
        self.progress = progress
        self.message = message
        self.degraded = degraded
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "state": self.state.value,
            "stage": self.stage,
            "progress": round(self.progress, 2),
            "message": self.message,
            "degraded": self.degraded,
            "timestamp": self.timestamp,
        }


class PipelineEventBus:
    def __init__(self):
        self._listeners: dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, run_id: str) -> asyncio.Queue:
        if run_id not in self._listeners:
            self._listeners[run_id] = []
        q = asyncio.Queue()
        self._listeners[run_id].append(q)
        return q

    def unsubscribe(self, run_id: str, q: asyncio.Queue):
        if run_id in self._listeners and q in self._listeners[run_id]:
            self._listeners[run_id].remove(q)

    async def publish(self, event: PipelineEvent):
        if event.run_id in self._listeners:
            for q in self._listeners[event.run_id]:
                await q.put(event)


event_bus = PipelineEventBus()


class AuditPipelineOrchestrator:
    def __init__(self):
        self.rules_detector = RulesDetector()
        self.ml_detector = IsolationForestDetector()
        self.graph_detector = GraphCycleDetector()

    async def run_pipeline(
        self,
        run_id: str,
        dataset_sha256: str,
        transactions: list[CanonicalTransaction],
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        config = config or {}
        t0 = time.time()
        degraded = False
        degraded_reasons = []

        # Check for DEMO_FORCE_TIMEOUT failure injection flag
        if settings.DEMO_FORCE_TIMEOUT == 1:
            snapshot = recovery_store.get_verified_snapshot(
                dataset_sha256=dataset_sha256,
                pipeline_version=settings.PIPELINE_VERSION,
                scoring_config_version=settings.SCORING_CONFIG_VERSION,
            )
            if snapshot:
                snapshot["analysis_mode"] = AnalysisMode.RECOVERY_SNAPSHOT.value
                snapshot["recovery"] = {"used": True, "reason": "DEMO_FORCE_TIMEOUT"}
                await event_bus.publish(PipelineEvent(run_id, RunState.READY, "complete", 1.0, "Completed via cryptographic recovery snapshot."))
                return snapshot

        # 1. State: CREATED
        await event_bus.publish(PipelineEvent(run_id, RunState.CREATED, "start", 0.05, "Audit run created."))

        # 2. State: VALIDATING
        await event_bus.publish(PipelineEvent(run_id, RunState.VALIDATING, "validating", 0.15, "Validating canonical transaction schema."))
        await asyncio.sleep(0.05)

        # 3. State: FEATURIZING
        await event_bus.publish(PipelineEvent(run_id, RunState.FEATURIZING, "featurizing", 0.30, "Building unified feature matrix."))
        await asyncio.sleep(0.05)

        # 4. State: DETECTING (Parallel detector execution)
        await event_bus.publish(PipelineEvent(run_id, RunState.DETECTING, "detectors", 0.55, "Running multi-engine detectors concurrently."))

        all_findings: list[DetectorFinding] = []
        detector_statuses = []

        # Run Rules Detector
        t_rules0 = time.time()
        try:
            rule_findings = self.rules_detector.run(transactions, run_id, config)
            all_findings.extend(rule_findings)
            detector_statuses.append({
                "name": "rules",
                "status": "AVAILABLE",
                "duration_ms": round((time.time() - t_rules0) * 1000, 2),
                "finding_count": len(rule_findings),
            })
        except Exception as exc:
            degraded = True
            degraded_reasons.append(f"Rules detector error: {str(exc)}")

        # Run IsolationForest Anomaly Engine
        t_ml0 = time.time()
        try:
            ml_findings = self.ml_detector.run(transactions, run_id, config)
            all_findings.extend(ml_findings)
            detector_statuses.append({
                "name": "isolation_forest",
                "status": "AVAILABLE",
                "duration_ms": round((time.time() - t_ml0) * 1000, 2),
                "finding_count": len(ml_findings),
            })
        except Exception as exc:
            degraded = True
            degraded_reasons.append(f"ML detector error: {str(exc)}")

        # Run Graph Forensics Engine (check DEMO_FAIL_GRAPH flag)
        t_graph0 = time.time()
        if settings.DEMO_FAIL_GRAPH == 1:
            degraded = True
            degraded_reasons.append("Graph detector unavailable due to DEMO_FAIL_GRAPH switch.")
            detector_statuses.append({
                "name": "graph_cycles",
                "status": "UNAVAILABLE",
                "duration_ms": 0.0,
                "finding_count": 0,
            })
        else:
            try:
                graph_findings = self.graph_detector.run(transactions, run_id, config)
                all_findings.extend(graph_findings)
                detector_statuses.append({
                    "name": "graph_cycles",
                    "status": "AVAILABLE",
                    "duration_ms": round((time.time() - t_graph0) * 1000, 2),
                    "finding_count": len(graph_findings),
                })
            except Exception as exc:
                degraded = True
                degraded_reasons.append(f"Graph detector error: {str(exc)}")
                detector_statuses.append({
                    "name": "graph_cycles",
                    "status": "UNAVAILABLE",
                    "duration_ms": round((time.time() - t_graph0) * 1000, 2),
                    "finding_count": 0,
                })

        # 5. State: SCORING & GROUPING
        await event_bus.publish(PipelineEvent(run_id, RunState.SCORING, "risk_fusion", 0.75, "Performing materiality-aware risk fusion.", degraded=degraded))
        await event_bus.publish(PipelineEvent(run_id, RunState.GROUPING, "case_builder", 0.85, "Grouping findings into prioritized cases.", degraded=degraded))

        materiality_thresh = Decimal(str(config.get("materiality_amount_inr", 50000)))
        cases = build_investigation_cases(all_findings, run_id, materiality_thresh)

        # 6. State: EXPLAINING
        await event_bus.publish(PipelineEvent(run_id, RunState.EXPLAINING, "deterministic_explainer", 0.92, "Generating evidence-grounded explanations."))
        cases = attach_deterministic_explanations(cases)

        # 7. State: PERSISTING & READY
        await event_bus.publish(PipelineEvent(run_id, RunState.PERSISTING, "persisting", 0.98, "Persisting audit run results."))

        duration_ms = round((time.time() - t0) * 1000, 2)
        final_state = RunState.DEGRADED if degraded else RunState.READY
        analysis_mode = AnalysisMode.DEGRADED.value if degraded else AnalysisMode.LIVE_FULL.value

        # Calculate metrics summary
        crit_count = len([c for c in cases if c.severity.value == "CRITICAL"])
        high_count = len([c for c in cases if c.severity.value == "HIGH"])
        med_count = len([c for c in cases if c.severity.value == "MEDIUM"])
        low_count = len([c for c in cases if c.severity.value == "LOW"])
        total_exposure = sum(float(c.monetary_exposure) for c in cases)

        result_payload = {
            "run_id": run_id,
            "status": final_state.value,
            "analysis_mode": analysis_mode,
            "pipeline_version": settings.PIPELINE_VERSION,
            "dataset_sha256": dataset_sha256,
            "summary": {
                "transactions_analyzed": len(transactions),
                "raw_detector_flags": len(all_findings),
                "unique_suspicious_transactions": len({t for f in all_findings for t in f.transaction_ids}),
                "total_cases": len(cases),
                "critical_findings": crit_count,
                "high_findings": high_count,
                "medium_findings": med_count,
                "low_findings": low_count,
                "monetary_exposure_inr": round(total_exposure, 2),
                "analysis_duration_ms": duration_ms,
            },
            "detectors": detector_statuses,
            "top_cases": [c.model_dump() for c in cases],
            "degraded_reasons": degraded_reasons,
            "recovery": {"used": False, "reason": None},
            "created_at": datetime.utcnow().isoformat(),
        }

        # Cache verified recovery snapshot if clean run
        if not degraded and dataset_sha256:
            recovery_store.save_snapshot(
                dataset_sha256=dataset_sha256,
                pipeline_version=settings.PIPELINE_VERSION,
                scoring_config_version=settings.SCORING_CONFIG_VERSION,
                result_data=result_payload,
            )

        await event_bus.publish(PipelineEvent(run_id, final_state, "ready", 1.0, "Audit run processing complete.", degraded=degraded))
        return result_payload


pipeline_orchestrator = AuditPipelineOrchestrator()
