import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light" | "system";

export interface SyncSettings {
  enabled: boolean;
  repoUrl: string | null;
  lastSynced: string | null;
  status: "synced" | "syncing" | "offline" | "error" | "not_setup";
}

export interface SettingsState {
  // Setup
  setupComplete: boolean;
  setSetupComplete: (complete: boolean) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Terminal
  terminalFontSize: number;
  setTerminalFontSize: (size: number) => void;

  // Sync
  sync: SyncSettings;
  setSyncSettings: (settings: Partial<SyncSettings>) => void;

  // UI preferences
  showWelcomeBack: boolean;
  setShowWelcomeBack: (show: boolean) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Snapshots
  autoSnapshotOnRiskyCommand: boolean;
  setAutoSnapshotOnRiskyCommand: (enabled: boolean) => void;

  // Reset
  resetSettings: () => void;
}

const defaultSettings = {
  setupComplete: false,
  theme: "dark" as Theme,
  terminalFontSize: 14,
  sync: {
    enabled: false,
    repoUrl: null,
    lastSynced: null,
    status: "not_setup" as const,
  },
  showWelcomeBack: true,
  sidebarCollapsed: false,
  autoSnapshotOnRiskyCommand: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setSetupComplete: (complete) => set({ setupComplete: complete }),

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setTerminalFontSize: (size) => set({ terminalFontSize: size }),

      setSyncSettings: (settings) =>
        set((state) => ({
          sync: { ...state.sync, ...settings },
        })),

      setShowWelcomeBack: (show) => set({ showWelcomeBack: show }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setAutoSnapshotOnRiskyCommand: (enabled) =>
        set({ autoSnapshotOnRiskyCommand: enabled }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "lumen-settings",
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Apply theme to document
function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
    root.classList.toggle("light", !prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }
}

// Listen for system theme changes
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const settings = useSettingsStore.getState();
    if (settings.theme === "system") {
      applyTheme("system");
    }
  });
}
