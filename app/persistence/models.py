from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, DateTime, JSON, Boolean, Numeric
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class DatasetDB(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False)
    column_count: Mapped[int] = mapped_column(Integer, nullable=False)
    canonical_mapping_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditRunDB(Base):
    __tablename__ = "audit_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    dataset_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    analysis_mode: Mapped[str] = mapped_column(String(32), nullable=False)
    pipeline_version: Mapped[str] = mapped_column(String(64), nullable=False)
    scoring_config_version: Mapped[str] = mapped_column(String(64), nullable=False)
    summary_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    detectors_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InvestigationCaseDB(Base):
    __tablename__ = "investigation_cases"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    monetary_exposure: Mapped[float] = mapped_column(Float, nullable=False)
    primary_transaction_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    transaction_ids_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    entity_ids_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    anomaly_types_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    evidence_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    risk_breakdown_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    graph_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CopilotSessionDB(Base):
    __tablename__ = "copilot_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CopilotMessageDB(Base):
    __tablename__ = "copilot_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[str] = mapped_column(String(32), nullable=False)
    grounded: Mapped[bool] = mapped_column(Boolean, default=True)
    confidence: Mapped[str] = mapped_column(String(32), default="high")
    citations_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    used_tools_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
