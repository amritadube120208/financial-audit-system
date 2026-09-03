from datetime import date, datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field, ConfigDict
from app.domain.enums import DetectorFamily, Severity, RunState, AnalysisMode
from app.domain.evidence import EvidenceItem


class CanonicalTransaction(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    transaction_id: str
    dataset_id: str = "default_ds"
    posting_date: date
    document_date: date | None = None
    fiscal_year: str = "FY26"
    month: int = 1
    day_of_month: int = 1
    invoice_number: str | None = None
    reference_number: str | None = None
    entity_id: str = "COMPANY-SELF"
    counterparty_id: str | None = None
    counterparty_name: str | None = None
    debit_account: str | None = None
    credit_account: str | None = None
    account_code: str | None = None
    account_name: str | None = None
    amount: Decimal
    currency: str = "INR"
    gst_amount: Decimal | None = None
    gstin: str | None = None
    narration: str | None = None
    is_manual_entry: bool = False
    source_system: str | None = None
    source_row_number: int = 0


class DetectorFinding(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    finding_id: str
    run_id: str
    detector_family: DetectorFamily
    detector_name: str
    anomaly_type: str
    transaction_ids: list[str] = Field(default_factory=list)
    entity_ids: list[str] = Field(default_factory=list)
    raw_score: float
    normalized_score: float
    severity: Severity
    monetary_exposure: Decimal = Decimal("0.00")
    evidence: list[EvidenceItem] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    detector_version: str = "1.0.0"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GraphNode(BaseModel):
    id: str
    label: str
    kind: str = "entity"


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    transaction_id: str
    amount_inr: Decimal
    posted_at: str


class GraphPayload(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)


class InvestigationCase(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    case_id: str
    run_id: str
    title: str
    severity: Severity
    risk_score: float
    primary_transaction_id: str | None = None
    transaction_ids: list[str] = Field(default_factory=list)
    entity_ids: list[str] = Field(default_factory=list)
    anomaly_types: list[str] = Field(default_factory=list)
    monetary_exposure: Decimal = Decimal("0.00")
    evidence: list[EvidenceItem] = Field(default_factory=list)
    risk_breakdown: dict[str, Any] = Field(default_factory=dict)
    explanation: str
    graph: GraphPayload | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DatasetRef(BaseModel):
    dataset_id: str
    filename: str
    sha256: str
    size_bytes: int
    row_count: int
    column_count: int
    canonical_mapping: dict[str, str] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    created_at: str
