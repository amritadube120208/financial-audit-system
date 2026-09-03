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
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.messages)) return res.messages;
  return [];
}
