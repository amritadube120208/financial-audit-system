import { create } from "zustand";
import { Severity } from "../lib/types/api";

interface UiState {
  // Selected severity filter
  selectedSeverity: Severity | "ALL";
  setSelectedSeverity: (sev: Severity | "ALL") => void;

  // Selected finding ID for evidence drawer & graph focus
  selectedFindingId: string | null;
  setSelectedFindingId: (id: string | null) => void;

  // Evidence drawer state
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;

  // Selected graph node / edge
  selectedGraphNodeId: string | null;
  setSelectedGraphNodeId: (id: string | null) => void;

  // Copilot sheet open/close
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;

  // Presentation Mode for Hackathon projection
  isPresentationMode: boolean;
  togglePresentationMode: () => void;
  setPresentationMode: (enabled: boolean) => void;

  // Search filter query
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Detector filter
  selectedDetector: string | "ALL";
  setSelectedDetector: (detector: string | "ALL") => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedSeverity: "ALL",
  setSelectedSeverity: (selectedSeverity) => set({ selectedSeverity }),

  selectedFindingId: null,
  setSelectedFindingId: (selectedFindingId) =>
    set({
      selectedFindingId,
      isDrawerOpen: Boolean(selectedFindingId),
    }),

  isDrawerOpen: false,
  setIsDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

  selectedGraphNodeId: null,
  setSelectedGraphNodeId: (selectedGraphNodeId) => set({ selectedGraphNodeId }),

  isCopilotOpen: false,
  setIsCopilotOpen: (isCopilotOpen) => set({ isCopilotOpen }),

  isPresentationMode: false,
  togglePresentationMode: () =>
    set((state) => ({ isPresentationMode: !state.isPresentationMode })),
  setPresentationMode: (isPresentationMode) => set({ isPresentationMode }),

  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectedDetector: "ALL",
  setSelectedDetector: (selectedDetector) => set({ selectedDetector }),
}));
