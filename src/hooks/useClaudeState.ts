import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";

/**
 * Claude Code's operational states
 */
export type ClaudeState =
  | "idle"
  | "thinking"
  | "writing"
  | "tool_use"
  | "asking"
  | "error"
  | "complete";

/**
 * State information emitted from the Rust parser
 */
export interface ClaudeStateInfo {
  state: ClaudeState;
  tool_name?: string;
  question?: string;
  progress?: number;
  awaiting_input: boolean;
}

/**
 * State with display metadata
 */
export interface ClaudeStateDisplay {
  state: ClaudeState;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  toolName?: string;
  question?: string;
  awaitingInput: boolean;
}

const STATE_CONFIG: Record<ClaudeState, { label: string; color: string; bgColor: string; icon: string }> = {
  idle: {
    label: "Ready",
    color: "text-[#71717a]",
    bgColor: "bg-[#27272a]",
    icon: "○",
  },
  thinking: {
    label: "Thinking",
    color: "text-[#a855f7]",
    bgColor: "bg-[#a855f7]/15",
    icon: "◐",
  },
  writing: {
    label: "Writing",
    color: "text-[#3b82f6]",
    bgColor: "bg-[#3b82f6]/15",
    icon: "✎",
  },
  tool_use: {
    label: "Working",
    color: "text-[#eab308]",
    bgColor: "bg-[#eab308]/15",
    icon: "⚙",
  },
  asking: {
    label: "Question",
    color: "text-[#f97316]",
    bgColor: "bg-[#f97316]/15",
    icon: "?",
  },
  error: {
    label: "Error",
    color: "text-[#ef4444]",
    bgColor: "bg-[#ef4444]/15",
    icon: "✕",
  },
  complete: {
    label: "Done",
    color: "text-[#22c55e]",
    bgColor: "bg-[#22c55e]/15",
    icon: "✓",
  },
};

/**
 * Hook to track Claude's state for a specific terminal
 */
export function useClaudeState(terminalId: string): ClaudeStateDisplay {
  const [stateInfo, setStateInfo] = useState<ClaudeStateInfo>({
    state: "idle",
    awaiting_input: true,
  });

  useEffect(() => {
    // Listen for state changes from the PTY parser
    const unlisten = listen<ClaudeStateInfo>(`claude-state-${terminalId}`, (event) => {
      setStateInfo(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [terminalId]);

  // Map raw state to display state
  const normalizedState = normalizeState(stateInfo.state);
  const config = STATE_CONFIG[normalizedState];

  return {
    state: normalizedState,
    label: stateInfo.tool_name
      ? `${config.label}: ${stateInfo.tool_name}`
      : config.label,
    color: config.color,
    bgColor: config.bgColor,
    icon: config.icon,
    toolName: stateInfo.tool_name,
    question: stateInfo.question,
    awaitingInput: stateInfo.awaiting_input,
  };
}

/**
 * Normalize state from Rust (handles snake_case tool_use variant)
 */
function normalizeState(state: ClaudeState | string): ClaudeState {
  // Handle snake_case from Rust serde
  if (typeof state === "object" && "tool_use" in state) {
    return "tool_use";
  }
  if (state === "tool_use" || (typeof state === "string" && state.startsWith("ToolUse"))) {
    return "tool_use";
  }
  return state as ClaudeState;
}

/**
 * Hook to track questions Claude has asked (for pinning)
 */
export function useClaudeQuestions(terminalId: string) {
  const [questions, setQuestions] = useState<Array<{ text: string; timestamp: Date }>>([]);

  useEffect(() => {
    const unlisten = listen<ClaudeStateInfo>(`claude-state-${terminalId}`, (event) => {
      if (event.payload.state === "asking" && event.payload.question) {
        setQuestions((prev) => [
          ...prev.slice(-9), // Keep last 10
          { text: event.payload.question!, timestamp: new Date() },
        ]);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [terminalId]);

  const clearQuestions = useCallback(() => setQuestions([]), []);

  return { questions, clearQuestions };
}
