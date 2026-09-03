export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AuditRunStatus =
  | "CREATED"
  | "INGESTING"
  | "VALIDATING"
  | "DETECTING"
  | "SCORING"
  | "EXPLAINING"
  | "READY"
  | "DEGRADED"
  | "RECOVERY"
  | "FAILED";

export type AnalysisMode = "LIVE" | "DEGRADED" | "RECOVERY";

export interface Dataset {
  dataset_id: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  detected_format: string;
  sha256: string;
  schema_mapping: Record<string, string>;
  warnings: string[];
  uploaded_at: string;
}

export interface DetectorToggles {
  rules: boolean;
  ml: boolean;
  graph: boolean;
  gst: boolean;
}

export interface AuditRunCreateRequest {
  dataset_id: string;
  audit_name: string;
  fiscal_year_start?: string;
  fiscal_year_end?: string;
  materiality_threshold_inr?: number;
  top_k?: number;
  detectors?: DetectorToggles;
  hard_deadline_ms?: number;
}

export interface AuditRun {
  run_id: string;
  dataset_id: string;
  audit_name: string;
  status: AuditRunStatus;
  analysis_mode: AnalysisMode;
  created_at: string;
  completed_at?: string;
  config: AuditRunCreateRequest;
}

export interface AuditSummary {
  run_id: string;
  audit_name: string;
  status: AuditRunStatus;
  analysis_mode: AnalysisMode;
  pipeline_version: string;
  dataset_sha256: string;
  analysis_duration_ms: number;
  transaction_count: number;
  total_value_inr: number;
  initial_flags: number;
  unique_flagged_transactions: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  triage_reduction_pct: number;
  detector_availability: Record<string, boolean>;
}

export interface FindingEvidence {
  type: string;
  description: string;
  value: string;
}

export interface DetectorContributions {
  rules: number;
  ml: number;
  graph: number;
  materiality: number;
}

export interface Finding {
  finding_id: string;
  transaction_id: string;
  title: string;
  risk_score: number;
  severity: Severity;
  primary_detector: string;
  rule_code: string;
  amount: number;
  posting_date: string;
  account_debit: string;
  account_credit: string;
  vendor_name: string;
  invoice_number: string;
  narration: string;
  explanation: string;
  evidence: FindingEvidence[];
  related_transaction_ids: string[];
  related_entity_ids: string[];
  detector_contributions: DetectorContributions;
  status: string;
}

export interface FindingsResponse {
  items: Finding[];
  total: number;
  next_cursor?: string | null;
  has_more: boolean;
}

export interface GraphNodeData {
  id: string;
  label: string;
  type: "company" | "vendor" | "customer" | "account" | string;
  risk_score: number;
  gstin?: string;
}

export interface GraphNode {
  data: GraphNodeData;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  amount: number;
  timestamp: string;
  transaction_id: string;
  is_cycle: boolean;
}

export interface GraphEdge {
  data: GraphEdgeData;
}

export interface CycleInfo {
  has_cycle: boolean;
  hops: number;
  time_window_hours: number;
  amount_similarity_pct: number;
  cycle_path: string[];
  risk_contribution: string;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cycle_info?: CycleInfo;
}

export interface Transaction {
  transaction_id: string;
  posting_date: string;
  amount: number;
  vendor_name: string;
  invoice_number: string;
  account_debit: string;
  account_credit: string;
  narration: string;
  is_suspicious: boolean;
  flags: string[];
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  next_cursor?: string | null;
  has_more: boolean;
}

export interface Entity {
  entity_id: string;
  name: string;
  type: string;
  gstin?: string;
  total_volume_inr: number;
  flagged_count: number;
  risk_level: string;
}

export interface GstReconciliationItem {
  invoice_number: string;
  gstin: string;
  vendor_name: string;
  books_amount: number;
  gst_snapshot_amount: number;
  difference: number;
  difference_pct: number;
  status: "MATCHED" | "MISMATCHED" | "MISSING_IN_GST" | string;
  tax_amount: number;
}

export interface GstReconciliationSummary {
  enabled: boolean;
  total_matched: number;
  total_mismatched: number;
  total_discrepancy_inr: number;
  items: GstReconciliationItem[];
}

export interface CopilotSession {
  session_id: string;
  run_id: string;
  created_at: string;
}

export interface CopilotCitation {
  type?: string;
  id?: string;
  label?: string;
  source_type?: string;
  source_id?: string;
  field?: string;
  value?: any;
}

export interface CopilotMessage {
  message_id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  grounding_mode: "llm_grounded" | "deterministic_fallback";
  citations: CopilotCitation[];
  created_at: string;
}

export interface APIErrorDetail {
  code: string;
  message: string;
  recoverable: boolean;
  required_fields: string[];
  request_id: string;
}

export interface APIErrorResponse {
  error: APIErrorDetail;
}

export interface SSEPipelineEvent {
  stage: AuditRunStatus;
  progress_pct: number;
  message: string;
  timestamp: string;
}
