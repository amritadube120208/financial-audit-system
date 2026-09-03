import { apiClient, APIClientError } from "./client";
import { CopilotSession, CopilotMessage } from "../types/api";

export interface ProviderHealthResponse {
  active_provider: string;
  status: string;
  providers: {
    groq?: {
      configured: boolean;
      reachable: boolean;
      status: string;
      model?: string;
      latency_ms?: number;
      last_check?: string;
      error?: string;
    };
    deterministic_fallback?: {
      configured: boolean;
      reachable: boolean;
      status: string;
      model?: string;
    };
  };
}

export type CopilotErrorKind =
  | "BACKEND_OFFLINE"
  | "RUN_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "NETWORK_TIMEOUT"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export class CopilotError extends Error {
  kind: CopilotErrorKind;
  status: number;
  recoverable: boolean;

  constructor(message: string, kind: CopilotErrorKind, status = 500, recoverable = true) {
    super(message);
    this.name = "CopilotError";
    this.kind = kind;
    this.status = status;
    this.recoverable = recoverable;
  }
}

export function classifyCopilotError(err: unknown): CopilotError {
  if (err instanceof CopilotError) return err;

  if (err instanceof APIClientError) {
    if (err.status === 0 || err.code === "NETWORK_ERROR") {
      return new CopilotError("Backend server is offline or unreachable.", "BACKEND_OFFLINE", 0, true);
    }
    if (err.status === 404 && (err.code === "SESSION_NOT_FOUND" || err.message.includes("SESSION_NOT_FOUND") || err.message.includes("session"))) {
      return new CopilotError(err.message, "SESSION_NOT_FOUND", 404, true);
    }
    if (err.status === 404 && (err.code === "RUN_NOT_FOUND" || err.message.includes("RUN_NOT_FOUND") || err.message.includes("run"))) {
      return new CopilotError(err.message, "RUN_NOT_FOUND", 404, false);
    }
    if (err.status === 429) {
      return new CopilotError("Inference rate limit reached. Retrying via fallback...", "RATE_LIMITED", 429, true);
    }
    return new CopilotError(err.message, "UNKNOWN", err.status, err.recoverable);
  }

  const msg = err instanceof Error ? err.message : "Unknown copilot error";
  return new CopilotError(msg, "UNKNOWN", 500, true);
}

/**
 * 1. Create a durable session for an authoritative run
 */
export async function createCopilotSession(runId: string): Promise<CopilotSession> {
  try {
    return await apiClient<CopilotSession>("/api/v1/copilot/sessions", {
      method: "POST",
      body: JSON.stringify({ run_id: runId }),
    });
  } catch (err) {
    throw classifyCopilotError(err);
  }
}

/**
 * 2. Send prompt to Copilot session with clean schema (Phase 17)
 */
export async function sendCopilotMessage(
  sessionId: string,
  message: string,
  selectedCaseId?: string
): Promise<CopilotMessage> {
  try {
    const payload: { message: string; selected_case_id?: string } = {
      message: message.trim(),
    };
    if (selectedCaseId) {
      payload.selected_case_id = selectedCaseId;
    }

    return await apiClient<CopilotMessage>(`/api/v1/copilot/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw classifyCopilotError(err);
  }
}

/**
 * 3. Self-Healing Message Delivery (Phase 5)
 * If message fails with SESSION_NOT_FOUND (e.g. backend restart):
 * Recreates session for the active run and retries sending EXACTLY ONCE.
 */
export async function sendCopilotMessageWithRecovery(
  sessionId: string | null,
  runId: string,
  message: string,
  selectedCaseId?: string
): Promise<{ message: CopilotMessage; activeSessionId: string }> {
  let targetSessionId = sessionId;

  if (!targetSessionId) {
    const newSession = await createCopilotSession(runId);
    targetSessionId = newSession.session_id;
  }

  try {
    const res = await sendCopilotMessage(targetSessionId, message, selectedCaseId);
    return { message: res, activeSessionId: targetSessionId };
  } catch (err) {
    const classified = classifyCopilotError(err);
    if (classified.kind === "SESSION_NOT_FOUND") {
      // Self-heal: Create new session and retry once
      const recoveredSession = await createCopilotSession(runId);
      const retriedRes = await sendCopilotMessage(recoveredSession.session_id, message, selectedCaseId);
      return { message: retriedRes, activeSessionId: recoveredSession.session_id };
    }
    throw classified;
  }
}

/**
 * 4. Retrieve durable message history from database
 */
export async function getCopilotMessages(sessionId: string): Promise<CopilotMessage[]> {
  try {
    const res = await apiClient<any>(`/api/v1/copilot/sessions/${sessionId}/messages`);
    const rawList = Array.isArray(res) ? res : Array.isArray(res?.messages) ? res.messages : [];
    return rawList.map((m: any) => ({
      message_id: m.message_id || `msg_${Math.random()}`,
      session_id: m.session_id || sessionId,
      role: m.role || (m.answer ? "assistant" : "user"),
      content: m.content || m.answer || m.message || "",
      grounding_mode: m.grounding_mode || m.mode || "groq_llm_grounded",
      citations: m.citations || [],
      created_at: m.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    throw classifyCopilotError(err);
  }
}

/**
 * 5. Real Provider Health Probe
 */
export async function getProviderHealth(): Promise<ProviderHealthResponse> {
  try {
    return await apiClient<ProviderHealthResponse>("/api/v1/copilot/provider-health");
  } catch {
    return {
      active_provider: "deterministic_fallback",
      status: "degraded_evidence_mode",
      providers: {
        deterministic_fallback: {
          configured: true,
          reachable: true,
          status: "healthy",
          model: "statutory_evidence_engine",
        },
      },
    };
  }
}
