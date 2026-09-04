import type { AuditProgressEvent } from "./types";
import { API_BASE } from "./api";

export interface SseSubscriberCallbacks {
  onEvent: (event: AuditProgressEvent) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

export function subscribeToAuditEvents(
  runId: string,
  callbacks: SseSubscriberCallbacks
): () => void {
  const url = `${API_BASE}/api/v1/audit-runs/${runId}/events`;
  let eventSource: EventSource | null = null;
  let isClosed = false;

  try {
    eventSource = new EventSource(url);

    eventSource.onmessage = (e) => {
      if (isClosed) return;
      try {
        const data: AuditProgressEvent = JSON.parse(e.data);
        callbacks.onEvent(data);

        if (["READY", "DEGRADED", "FAILED"].includes(data.state)) {
          isClosed = true;
          eventSource?.close();
          callbacks.onComplete();
        }
      } catch (err) {
        // Ignore unparseable lines like keep-alive comments
      }
    };

    eventSource.onerror = (e) => {
      if (isClosed) return;
      isClosed = true;
      eventSource?.close();
      callbacks.onError(new Error("SSE connection failed or closed. Fallback active."));
    };
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error("Failed to initialize SSE"));
  }

  return () => {
    isClosed = true;
    eventSource?.close();
  };
}
