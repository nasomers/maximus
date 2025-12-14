import { create } from "zustand";
import { TabId } from "@/components/layout/TabBar";

interface AppState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Terminal command queue
  pendingTerminalCommand: string | null;
  setPendingTerminalCommand: (cmd: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),

  pendingTerminalCommand: null,
  setPendingTerminalCommand: (cmd) => set({ pendingTerminalCommand: cmd }),
}));
