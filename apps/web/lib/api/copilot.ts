import { apiClient } from "./client";
import { CopilotSession, CopilotMessage } from "../types/api";

export async function createCopilotSession(runId: string): Promise<CopilotSession> {
  return apiClient<CopilotSession>("/api/v1/copilot/sessions", {
    method: "POST",
    body: JSON.stringify({ run_id: runId }),
  });
}

export async function sendCopilotMessage(
  sessionId: string,
  content: string,
  selectedCaseId?: string
): Promise<CopilotMessage> {
  return apiClient<CopilotMessage>(`/api/v1/copilot/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      message: content,
      content: content,
      selected_case_id: selectedCaseId,
    }),
  });
}

export async function getCopilotMessages(sessionId: string): Promise<CopilotMessage[]> {
  const res = await apiClient<any>(`/api/v1/copilot/sessions/${sessionId}/messages`);
  const rawList = Array.isArray(res) ? res : Array.isArray(res?.messages) ? res.messages : [];
  return rawList.map((m: any) => ({
    message_id: m.message_id || `msg_${Math.random()}`,
    session_id: m.session_id || sessionId,
    role: m.role || (m.answer ? "assistant" : "user"),
    content: m.content || m.answer || m.message || "",
    grounding_mode: m.grounding_mode || m.mode || "llm_grounded",
    citations: m.citations || [],
    created_at: m.created_at || new Date().toISOString(),
  }));
}
