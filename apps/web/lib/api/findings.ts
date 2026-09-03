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
  return apiClient<FindingsResponse>(
    `/api/v1/audit-runs/${runId}/findings${qs ? `?${qs}` : ""}`
  );
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
