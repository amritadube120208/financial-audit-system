import { apiClient } from "./client";

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export interface ReadyResponse {
  ready: boolean;
  database: string;
  cache: string;
  engines: Record<string, boolean>;
}

export interface VersionResponse {
  api_version: string;
  pipeline_version: string;
  scoring_config_version: string;
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
