import { apiClient } from "./client";
import {
  FindingsResponse,
  Finding,
  GraphPayload,
  TransactionsResponse,
  GstReconciliationSummary,
  Entity,
} from "../types/api";

export interface FindingsFilterParams {
  severity?: string;
  detector?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}

export async function getFindings(
  runId: string,
  params: FindingsFilterParams = {}
): Promise<FindingsResponse> {
  const query = new URLSearchParams();
  if (params.severity) query.append("severity", params.severity);
  if (params.detector) query.append("detector", params.detector);
  if (params.search) query.append("search", params.search);
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.cursor) query.append("cursor", params.cursor);

  const qs = query.toString();
  const raw = await apiClient<any>(
    `/api/v1/audit-runs/${runId}/findings${qs ? `?${qs}` : ""}`
  );

  const rawItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.cases)
    ? raw.cases
    : Array.isArray(raw?.findings)
    ? raw.findings
    : Array.isArray(raw)
    ? raw
    : [];

  const total =
    typeof raw?.total === "number"
      ? raw.total
      : typeof raw?.total_cases === "number"
      ? raw.total_cases
      : rawItems.length;

  const items: Finding[] = rawItems.map((item: any) => ({
    finding_id: item.finding_id || item.case_id || "finding_001",
    case_id: item.case_id || item.finding_id,
    title: item.title || "Suspicious Investigation Finding",
    risk_score: item.risk_score ?? item.score ?? 50.0,
    severity: item.severity || "HIGH",
    amount: item.monetary_exposure ?? item.amount ?? 0.0,
    monetary_exposure: item.monetary_exposure ?? item.amount ?? 0.0,
    primary_detector: item.primary_detector || (item.detector_scores ? "MULTI_ENGINE" : "RULES"),
    posting_date: item.posting_date || "2026-03-31",
    transaction_id: item.transaction_id || (item.case_id ? `TX-${item.case_id}` : "TX-1001"),
    vendor_name: item.vendor_name || item.primary_entity || "COUNTERPARTY",
    primary_entity: item.primary_entity || item.vendor_name || "COUNTERPARTY",
    evidence: item.evidence || [],
  }));

  return {
    items,
    total,
    has_more: Boolean(raw?.has_more),
    next_cursor: raw?.next_cursor,
  };
}

export async function getFinding(findingId: string): Promise<Finding> {
  return apiClient<Finding>(`/api/v1/findings/${findingId}`);
}

export async function getFindingGraph(findingId: string): Promise<GraphPayload> {
  return apiClient<GraphPayload>(`/api/v1/findings/${findingId}/graph`);
}

export interface TransactionsFilterParams {
  search?: string;
  vendor?: string;
  suspicious_only?: boolean;
  limit?: number;
  cursor?: string;
}

export async function getTransactions(
  runId: string,
  params: TransactionsFilterParams = {}
): Promise<TransactionsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.vendor) query.append("vendor", params.vendor);
  if (params.suspicious_only) query.append("suspicious_only", "true");
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.cursor) query.append("cursor", params.cursor);

  const qs = query.toString();
  return apiClient<TransactionsResponse>(
    `/api/v1/audit-runs/${runId}/transactions${qs ? `?${qs}` : ""}`
  );
}

export async function getGstReconciliation(runId: string): Promise<GstReconciliationSummary> {
  return apiClient<GstReconciliationSummary>(`/api/v1/audit-runs/${runId}/gst`);
}

export async function getEntity(entityId: string): Promise<Entity> {
  return apiClient<Entity>(`/api/v1/entities/${entityId}`);
}
