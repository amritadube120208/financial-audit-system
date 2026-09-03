import { create } from "zustand";

export interface StoredRun {
  runId: string;
  filename?: string;
  rowCount?: number;
  createdAt: string;
}

interface AuditContextState {
  lastActiveRunId: string | null;
  recentRuns: StoredRun[];
  setLastActiveRunId: (runId: string) => void;
  addRecentRun: (run: StoredRun) => void;
}

export const useAuditContextStore = create<AuditContextState>((set) => {
  // Load from localStorage if available
  let initialRunId: string | null = null;
  let initialRecent: StoredRun[] = [];
  if (typeof window !== "undefined") {
    try {
      initialRunId = localStorage.getItem("auditgraph_last_run");
      const stored = localStorage.getItem("auditgraph_recent_runs");
      if (stored) initialRecent = JSON.parse(stored);
    } catch {
      // Ignore storage errors
    }
  }

  return {
    lastActiveRunId: initialRunId,
    recentRuns: initialRecent,
    setLastActiveRunId: (runId: string) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("auditgraph_last_run", runId);
        } catch {}
      }
      set({ lastActiveRunId: runId });
    },
    addRecentRun: (run: StoredRun) => {
      set((state) => {
        const filtered = state.recentRuns.filter((r) => r.runId !== run.runId);
        const updated = [run, ...filtered].slice(0, 5);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("auditgraph_recent_runs", JSON.stringify(updated));
            localStorage.setItem("auditgraph_last_run", run.runId);
          } catch {}
        }
        return { recentRuns: updated, lastActiveRunId: run.runId };
      });
    },
  };
});
