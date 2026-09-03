import { create } from "zustand";

interface AuditContextState {
  lastActiveRunId: string | null;
  setLastActiveRunId: (runId: string) => void;
}

export const useAuditContextStore = create<AuditContextState>((set) => ({
  lastActiveRunId: null,
  setLastActiveRunId: (lastActiveRunId) => set({ lastActiveRunId }),
}));
