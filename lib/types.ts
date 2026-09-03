/**
 * TypeScript contracts mirroring FastAPI Pydantic schemas.
 * The backend is the single source of truth.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export type AuditStatus =
  | "CREATED"
  | "INGESTING"
  | "VALIDATING"
  | "FEATURIZING"
  | "DETECTING"
  | "SCORING"
  | "GROUPING"
  | "EXPLAINING"
  | "PERSISTING"
  | "READY"
  | "DEGRADED"
  | "RECOVERING"
  | "FAILED";

export interface EvidenceItem {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string | null;
  source: "ledger" | "derived" | "graph" | "gst" | "model";
}

export interface DatasetUploadResponse {
  dataset_id: string;
  filename: string;
  size_bytes: number;
  sha256: string;
  detected_format: "csv" | "xlsx";
  row_count: number;
  column_count: number;
  schema_status: "MAPPED" | "PENDING" | "INVALID";
  canonical_mapping: Record<string, string>;
  warnings: string[];
  created_at: string;
}

export interface CreateAuditRunRequest {
  dataset_id: string;
  gst_dataset_id?: string | null;
  configuration?: Record<string, unknown>;
}

export interface AuditRunResponse {
  run_id: string;
  dataset_id: string;
  status: AuditStatus;
  analysis_mode: string;
  progress?: number;
  current_stage?: string;
  pipeline_version?: string;
  scoring_config_version?: string;
  events_url?: string;
  created_at: string;
  completed_at?: string | null;
}

export interface AuditProgressEvent {
  event_id: string;
  run_id: string;
  sequence: number;
  state: AuditStatus;
  stage: string;
  progress: number;
  message: string;
  duration_ms: number;
  degraded: boolean;
  timestamp: string;
}

export interface RunMetrics {
  total_transactions: number;
  suspicious_transactions: number;
  raw_detector_flags: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  total_exposure?: string | number;
  execution_duration_ms?: number;
  [key: string]: unknown;
}

export interface DetectorInfo {
  family: string;
  findings_count: number;
  duration_ms: number;
  [key: string]: unknown;
}

export interface AuditSummaryResponse {
  run_id: string;
  status: AuditStatus;
  analysis_mode: string;
  dataset: {
    dataset_id: string;
    filename: string;
    row_count: number;
    sha256: string;
  };
  metrics: RunMetrics;
  detectors: Record<string, DetectorInfo>;
}

export interface FindingItem {
  finding_id: string;
  title: string;
  severity: Severity;
  risk_score: number;
  anomaly_type: string;
  primary_entity: string | null;
  monetary_exposure: string;
  transaction_count: number;
  transaction_ids: string[];
  entity_ids: string[];
  explanation: string;
  evidence: EvidenceItem[];
  detector_family: string;
  has_graph: boolean;
  created_at: string;
}

export interface FindingsListResponse {
  run_id: string;
  total_returned: number;
  limit: number;
  offset: number;
  findings: FindingItem[];
}

export interface GraphNode {
  id: string;
  label: string;
  type?: "entity" | "transaction" | string;
  total_exposure?: number;
  is_suspicious?: boolean;
  [key: string]: unknown;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type?: string;
  is_cycle?: boolean;
  [key: string]: unknown;
}

export interface FindingGraphResponse {
  finding_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: Record<string, unknown>;
  message?: string;
}

export interface CanonicalTransaction {
  transaction_id: string;
  posting_date: string;
  document_date?: string | null;
  fiscal_year?: number;
  amount: string;
  currency?: string;
  counterparty_id?: string;
  counterparty_name?: string;
  vendor_name?: string;
  invoice_number?: string;
  gstin?: string;
  narration?: string;
  is_manual_entry?: boolean;
  source_row_number?: number;
}

export interface TransactionsListResponse {
  run_id: string;
  total_returned: number;
  limit: number;
  offset: number;
  transactions: CanonicalTransaction[];
}

export interface SystemHealthResponse {
  status: "ready" | "degraded" | "unhealthy";
  components: {
    database: string;
    redis: string;
    llm: string;
    analysis_engine: string;
    recovery_store: string;
    [key: string]: string;
  };
  app_env: string;
  pipeline_version: string;
}

export interface SystemVersionResponse {
  app_version: string;
  pipeline_version: string;
  scoring_config_version: string;
  app_env: string;
  auth_mode: string;
}

export interface CopilotCitation {
  type: "finding" | "transaction" | "entity";
  id: string;
  label: string;
}

export interface CopilotAction {
  id: string;
  label: string;
  action_type: string;
  payload: Record<string, unknown>;
}

export interface CopilotMessage {
  message_id: string;
  session_id: string;
  run_id: string;
  role?: "user" | "assistant";
  content?: string;
  answer?: string;
  confidence?: "high" | "medium" | "low";
  grounded?: boolean;
  mode?: "llm_grounded" | "deterministic_fallback";
  citations?: CopilotCitation[];
  used_tools?: string[];
  safety_note?: string;
  follow_up_actions?: CopilotAction[];
  created_at?: string;
}

export interface CopilotSessionResponse {
  session_id: string;
  run_id: string;
  title: string;
  created_at: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}
