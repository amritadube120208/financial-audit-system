import { APIErrorResponse } from "../types/api";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class APIClientError extends Error {
  code: string;
  recoverable: boolean;
  requiredFields: string[];
  requestId?: string;
  status: number;

  constructor(
    message: string,
    code = "UNKNOWN_ERROR",
    status = 500,
    recoverable = true,
    requiredFields: string[] = [],
    requestId?: string
  ) {
    super(message);
    this.name = "APIClientError";
    this.code = code;
    this.status = status;
    this.recoverable = recoverable;
    this.requiredFields = requiredFields;
    this.requestId = requestId;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type if not FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorData: APIErrorResponse | null = null;
      try {
        errorData = await res.json();
      } catch {
        // Fallback for non-JSON error
      }

      const errObj = (errorData as any)?.error || (typeof (errorData as any)?.detail === "object" ? (errorData as any).detail : null);
      if (errObj) {
        throw new APIClientError(
          errObj.message || `API request failed with status ${res.status}`,
          errObj.code || "HTTP_ERROR",
          res.status,
          errObj.recoverable ?? true,
          errObj.required_fields || [],
          errObj.request_id
        );
      }
      if (typeof (errorData as any)?.detail === "string") {
        throw new APIClientError(
          (errorData as any).detail,
          "HTTP_ERROR",
          res.status
        );
      }

      throw new APIClientError(
        `Request to ${cleanEndpoint} failed (${res.status} ${res.statusText})`,
        "HTTP_ERROR",
        res.status
      );
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof APIClientError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Network error or API offline";
    throw new APIClientError(message, "NETWORK_ERROR", 0, true);
  }
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
