from enum import Enum


class DetectorFamily(str, Enum):
    RULES = "RULES"
    RULE = "RULES"  # Alias
    STATISTICAL = "STATISTICAL"
    ANOMALY = "STATISTICAL"  # Alias
    ML = "STATISTICAL"  # Alias
    GRAPH = "GRAPH"
    GST = "GST"
    MATERIALITY = "MATERIALITY"


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
    FUSING_EVIDENCE = "FUSING_EVIDENCE"
    GROUPING = "GROUPING"
    BUILDING_CASES = "BUILDING_CASES"
    SCORING = "SCORING"
    EXPLAINING = "EXPLAINING"
    PERSISTING = "PERSISTING"
    READY = "READY"
    DEGRADED = "DEGRADED"
    RECOVERED = "RECOVERED"
    FAILED = "FAILED"


class AnalysisMode(str, Enum):
    FULL = "full"
    DEGRADED = "degraded"
    RECOVERED = "recovered"
    FAST_PATH = "fast_path"


class CopilotIntent(str, Enum):
    SUMMARY = "summary"
    CASE_EXPLANATION = "case_explanation"
    MONEY_FLOW = "money_flow"
    RISK_BREAKDOWN = "risk_breakdown"
    ENTITY_COMPARISON = "entity_comparison"
    PIPELINE_HEALTH = "pipeline_health"
    GENERAL_QUERY = "general_query"


class EvidenceSource(str, Enum):
    LEDGER = "LEDGER"
    RULES = "RULES"
    ML = "ML"
    GRAPH = "GRAPH"
    GST = "GST"
    DERIVED = "DERIVED"
