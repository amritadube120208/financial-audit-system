import { apiClient } from "./client";

export interface SystemTelemetry {
  uptime_seconds: number;
  memory_resident_mb: number;
  python_version: string;
  platform: string;
  active_runs_in_memory: number;
  loaded_datasets_count: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  telemetry?: SystemTelemetry;
}

export interface ReadyResponse {
  ready: boolean;
  status: string;
  service: string;
  pipeline_version: string;
  database: string;
  cache: string;
  engines: Record<string, boolean>;
  timestamp: string;
}

export interface VersionResponse {
  api_version: string;
  pipeline_version: string;
  scoring_config_version: string;
  detector_config_version?: string;
  git_commit: string;
  engines: Record<string, string>;
}

export async function getHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>("/healthz");
}

export async function getReady(): Promise<ReadyResponse> {
  return apiClient<ReadyResponse>("/readyz");
}

export async function getVersion(): Promise<VersionResponse> {
  return apiClient<VersionResponse>("/api/v1/version");
}
