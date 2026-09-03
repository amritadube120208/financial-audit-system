from enum import Enum


class DetectorFamily(str, Enum):
    RULE = "RULE"
    ML = "ML"
    GRAPH = "GRAPH"
    GST = "GST"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RunState(str, Enum):
    CREATED = "CREATED"
    INGESTING = "INGESTING"
    VALIDATING = "VALIDATING"
    FEATURIZING = "FEATURIZING"
    DETECTING = "DETECTING"
    SCORING = "SCORING"
    GROUPING = "GROUPING"
    EXPLAINING = "EXPLAINING"
    PERSISTING = "PERSISTING"
    READY = "READY"
    DEGRADED = "DEGRADED"
    RECOVERING = "RECOVERING"
    FAILED = "FAILED"


class AnalysisMode(str, Enum):
    LIVE_FULL = "live_full"
    DEGRADED = "degraded"
    RECOVERY_SNAPSHOT = "recovery_snapshot"
    EMERGENCY_RULES_ONLY = "emergency_rules_only"


class CopilotIntent(str, Enum):
    RUN_SUMMARY = "run_summary"
    EXPLAIN_FINDING = "explain_finding"
    LIST_FINDINGS = "list_findings"
    SEARCH_TRANSACTIONS = "search_transactions"
    COMPARE_ENTITIES = "compare_entities"
    TRACE_FLOW = "trace_flow"
    RISK_BREAKDOWN = "risk_breakdown"
    GST_REVIEW = "gst_review"
    AUDIT_CHECKLIST = "audit_checklist"
    GENERAL_EXPLANATION = "general_explanation"
    UNSUPPORTED = "unsupported"


class EvidenceSource(str, Enum):
    LEDGER = "ledger"
    DERIVED = "derived"
    GRAPH = "graph"
    GST = "gst"
    MODEL = "model"
