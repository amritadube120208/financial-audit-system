import { apiClient, getApiBaseUrl } from "./client";
import { AuditRun, AuditRunCreateRequest, AuditSummary, SSEPipelineEvent } from "../types/api";

export async function createAuditRun(payload: AuditRunCreateRequest): Promise<AuditRun> {
  return apiClient<AuditRun>("/api/v1/audit-runs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAuditRun(runId: string): Promise<AuditRun> {
  return apiClient<AuditRun>(`/api/v1/audit-runs/${runId}`);
}

export async function getAuditSummary(runId: string): Promise<AuditSummary> {
  return apiClient<AuditSummary>(`/api/v1/audit-runs/${runId}/summary`);
}

export function getAuditExportUrl(runId: string, format = "csv"): string {
  return `${getApiBaseUrl()}/api/v1/audit-runs/${runId}/export?format=${format}`;
}

export async function downloadAuditExport(runId: string, format = "csv", filename?: string) {
  const url = getAuditExportUrl(runId, format);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download export report");

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename || `AuditGraph_Report_${runId}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export function subscribeToAuditEvents(
  runId: string,
  onEvent: (event: SSEPipelineEvent) => void,
  onError?: (err: Event) => void
): () => void {
  const url = `${getApiBaseUrl()}/api/v1/audit-runs/${runId}/events`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    try {
      const data: SSEPipelineEvent = JSON.parse(e.data);
      onEvent(data);
      if (data.stage === "READY" || data.stage === "DEGRADED" || data.stage === "FAILED") {
        eventSource.close();
      }
    } catch (err) {
      console.error("Failed to parse SSE event:", err);
    }
  };

  if (onError) {
    eventSource.onerror = (err) => {
      onError(err);
      eventSource.close();
    };
  }

  return () => {
    eventSource.close();
  };
}
