import { create } from "zustand";

interface AuditUiState {
  // Findings table filter state
  severityFilter: string | null;
  minRiskFilter: number | null;
  searchQuery: string;
  setSeverityFilter: (s: string | null) => void;
  setMinRiskFilter: (r: number | null) => void;
  setSearchQuery: (q: string) => void;

  // Finding Detail Drawer
  selectedFindingId: string | null;
  isFindingDrawerOpen: boolean;
  openFindingDrawer: (id: string) => void;
  closeFindingDrawer: () => void;

  // Copilot Panel toggle
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
  setCopilotOpen: (open: boolean) => void;

  // Active tab inside Audit page ('findings', 'graph', 'detectors', 'metrics')
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAuditUiStore = create<AuditUiState>((set) => ({
  severityFilter: null,
  minRiskFilter: null,
  searchQuery: "",
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  setMinRiskFilter: (minRiskFilter) => set({ minRiskFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectedFindingId: null,
  isFindingDrawerOpen: false,
  openFindingDrawer: (id) => set({ selectedFindingId: id, isFindingDrawerOpen: true }),
  closeFindingDrawer: () => set({ isFindingDrawerOpen: false }),

  isCopilotOpen: false,
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
  setCopilotOpen: (isCopilotOpen) => set({ isCopilotOpen }),

  activeTab: "findings",
  setActiveTab: (activeTab) => set({ activeTab }),
}));
