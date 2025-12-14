import { create } from "zustand";
import { Session } from "@/lib/tauri";
import { detectRiskyCommand as detectRisky, RiskyDetection } from "@/lib/riskyCommands";

interface SessionState {
  // Current active session
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;

  // Session start time (for timer)
  sessionStartTime: number | null;
  setSessionStartTime: (time: number | null) => void;

  // Files modified during session
  modifiedFiles: string[];
  addModifiedFile: (file: string) => void;
  clearModifiedFiles: () => void;

  // Terminal output buffer (for token estimation)
  outputBuffer: string;
  appendOutput: (text: string) => void;
  clearOutput: () => void;

  // Risky command detected (legacy boolean)
  riskyCommandDetected: boolean;
  setRiskyCommandDetected: (detected: boolean) => void;

  // Enhanced risky detection with details
  currentRiskyDetection: RiskyDetection | null;
  setCurrentRiskyDetection: (detection: RiskyDetection | null) => void;
  dismissRiskyWarning: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  sessionStartTime: null,
  setSessionStartTime: (time) => set({ sessionStartTime: time }),

  modifiedFiles: [],
  addModifiedFile: (file) =>
    set((state) => ({
      modifiedFiles: state.modifiedFiles.includes(file)
        ? state.modifiedFiles
        : [...state.modifiedFiles, file],
    })),
  clearModifiedFiles: () => set({ modifiedFiles: [] }),

  outputBuffer: "",
  appendOutput: (text) =>
    set((state) => ({
      // Keep last 50KB of output for analysis
      outputBuffer: (state.outputBuffer + text).slice(-50000),
    })),
  clearOutput: () => set({ outputBuffer: "" }),

  riskyCommandDetected: false,
  setRiskyCommandDetected: (detected) => set({ riskyCommandDetected: detected }),

  currentRiskyDetection: null,
  setCurrentRiskyDetection: (detection) => set({
    currentRiskyDetection: detection,
    riskyCommandDetected: detection !== null,
  }),
  dismissRiskyWarning: () => set({
    currentRiskyDetection: null,
    riskyCommandDetected: false,
  }),
}));

// Patterns that indicate file modifications
export const FILE_MODIFY_PATTERNS = [
  /(?:Created|Modified|Wrote|Updated|Deleted):\s*(.+)/i,
  /Writing to (.+)/i,
  /Saving (.+)/i,
];

// Use enhanced detection from riskyCommands.ts
export function detectRiskyCommand(text: string): RiskyDetection | null {
  return detectRisky(text);
}

export function extractModifiedFiles(text: string): string[] {
  const files: string[] = [];
  for (const pattern of FILE_MODIFY_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      if (match[1]) {
        files.push(match[1].trim());
      }
    }
  }
  return files;
}
