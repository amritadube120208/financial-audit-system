import axios, { AxiosError } from "axios";
import type {
  AuditRunResponse,
  AuditSummaryResponse,
  CopilotMessage,
  CopilotSessionResponse,
  CreateAuditRunRequest,
  DatasetUploadResponse,
  FindingGraphResponse,
  FindingItem,
  FindingsListResponse,
  SystemHealthResponse,
  SystemVersionResponse,
  TransactionsListResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  return error.response?.data?.detail?.code || error.response?.data?.error?.code;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (data?.detail) {
      return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
    return error.message || "Failed to communicate with AuditGraph backend.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

// 1. Health & Version
export async function getHealthz(): Promise<{ status: string; process: string }> {
  const res = await apiClient.get("/healthz");
  return res.data;
}

export async function getReadyz(): Promise<SystemHealthResponse> {
  const res = await apiClient.get("/readyz");
  return res.data;
}

export async function getVersion(): Promise<SystemVersionResponse> {
  const res = await apiClient.get("/api/v1/version");
  return res.data;
}

// 2. Datasets
export async function uploadDataset(
  file: File,
  onProgress?: (pct: number) => void
): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post<DatasetUploadResponse>("/api/v1/datasets", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) {
        const pct = Math.round((evt.loaded * 100) / evt.total);
        onProgress(pct);
      }
    },
  });
  return res.data;
}

export async function getDataset(datasetId: string): Promise<DatasetUploadResponse> {
  const res = await apiClient.get<DatasetUploadResponse>(`/api/v1/datasets/${datasetId}`);
  return res.data;
}

// 3. Audit Runs
export async function createAuditRun(
  payload: CreateAuditRunRequest,
  idempotencyKey?: string
): Promise<AuditRunResponse> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }
  const res = await apiClient.post<AuditRunResponse>("/api/v1/audit-runs", payload, {
    headers,
  });
  return res.data;
}

export async function getAuditRun(runId: string): Promise<AuditRunResponse> {
  const res = await apiClient.get<AuditRunResponse>(`/api/v1/audit-runs/${runId}`);
  return res.data;
}

export async function getAuditRunSummary(runId: string): Promise<AuditSummaryResponse> {
  const res = await apiClient.get<AuditSummaryResponse>(`/api/v1/audit-runs/${runId}/summary`);
  return res.data;
}

// 4. Findings
export async function getAuditRunFindings(
  runId: string,
  params?: {
    severity?: string;
    min_risk?: number;
    entity_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<FindingsListResponse> {
  const res = await apiClient.get<FindingsListResponse>(`/api/v1/audit-runs/${runId}/findings`, {
    params,
  });
  return res.data;
}

export async function getFindingDetail(findingId: string): Promise<FindingItem> {
  const res = await apiClient.get<FindingItem>(`/api/v1/findings/${findingId}`);
  return res.data;
}

export async function getFindingGraph(findingId: string): Promise<FindingGraphResponse> {
  type Node = { id: string; label: string; type?: string };
  type Edge = { id: string; source: string; target: string; weight?: number; amount?: number };
  const res = await apiClient.get<{ nodes: (Node | { data: Node })[]; edges: (Edge | { data: Edge })[] }>(`/api/v1/findings/${findingId}/graph`);
  return {
    ...res.data,
    finding_id: findingId,
    metrics: {},
    nodes: res.data.nodes.map(n => "data" in n ? n.data : n),
    edges: res.data.edges.map(e => { const d = "data" in e ? e.data : e; return { ...d, weight: Number(d.weight ?? d.amount ?? 0) }; }),
  };
}

// 5. Transactions
export async function getAuditRunTransactions(
  runId: string,
  params?: {
    counterparty_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<TransactionsListResponse> {
  const res = await apiClient.get<TransactionsListResponse>(
    `/api/v1/audit-runs/${runId}/transactions`,
    { params }
  );
  return res.data;
}

// 6. Copilot
export async function createCopilotSession(runId: string, title = "Audit Investigation"): Promise<CopilotSessionResponse> {
  const res = await apiClient.post<CopilotSessionResponse>("/api/v1/copilot/sessions", {
    run_id: runId,
    title,
  });
  return res.data;
}

export async function sendCopilotMessage(
  sessionId: string,
  message: string,
  findingId?: string | null
): Promise<CopilotMessage> {
  const res = await apiClient.post<CopilotMessage>(
    `/api/v1/copilot/sessions/${sessionId}/messages`,
    {
      message,
      selected_case_id: findingId || null,
    }
  );
  return res.data;
}

export async function getCopilotMessages(
  sessionId: string
): Promise<{ session_id: string; run_id: string; messages: CopilotMessage[] }> {
  const res = await apiClient.get(`/api/v1/copilot/sessions/${sessionId}/messages`);
  return res.data;
}

// 7. Export URL generator
export function getExportUrl(runId: string, format: "csv" | "json" = "csv"): string {
  return `${API_BASE}/api/v1/audit-runs/${runId}/export?format=${format}`;
}
