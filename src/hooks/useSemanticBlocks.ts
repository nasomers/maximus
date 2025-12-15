import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";

/**
 * Types of semantic blocks
 */
export type BlockType =
  | { type: "thinking" }
  | { type: "code"; language?: string }
  | { type: "tool"; name: string }
  | { type: "tool_output"; name: string; success: boolean }
  | { type: "question" }
  | { type: "error" }
  | { type: "text" }
  | { type: "file_content"; path: string }
  | { type: "diff"; path?: string }
  | { type: "command"; cmd: string }
  | { type: "command_output"; exit_code?: number };

/**
 * A semantic block from Claude's output
 */
export interface SemanticBlock {
  id: number;
  block_type: BlockType;
  content: string;
  timestamp: number;
  complete: boolean;
  collapsed_default: boolean;
}

/**
 * Block with UI state
 */
export interface SemanticBlockWithState extends SemanticBlock {
  collapsed: boolean;
  pinned: boolean;
}

/**
 * Hook to track semantic blocks for a terminal
 */
export function useSemanticBlocks(terminalId: string, maxBlocks = 100) {
  const [blocks, setBlocks] = useState<SemanticBlockWithState[]>([]);

  useEffect(() => {
    const unlisten = listen<SemanticBlock>(`semantic-block-${terminalId}`, (event) => {
      const newBlock: SemanticBlockWithState = {
        ...event.payload,
        collapsed: event.payload.collapsed_default,
        pinned: false,
      };

      setBlocks((prev) => {
        // Check if we're updating an existing block
        const existingIndex = prev.findIndex((b) => b.id === newBlock.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...newBlock };
          return updated;
        }

        // Add new block, trim old ones
        const updated = [...prev, newBlock];
        if (updated.length > maxBlocks) {
          // Keep pinned blocks and trim oldest unpinned
          const pinned = updated.filter((b) => b.pinned);
          const unpinned = updated.filter((b) => !b.pinned);
          return [...pinned, ...unpinned.slice(-maxBlocks + pinned.length)];
        }
        return updated;
      });
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [terminalId, maxBlocks]);

  const toggleCollapsed = useCallback((blockId: number) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, collapsed: !b.collapsed } : b))
    );
  }, []);

  const togglePinned = useCallback((blockId: number) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, pinned: !b.pinned } : b))
    );
  }, []);

  const clearBlocks = useCallback(() => {
    setBlocks((prev) => prev.filter((b) => b.pinned));
  }, []);

  const collapseAll = useCallback(() => {
    setBlocks((prev) => prev.map((b) => ({ ...b, collapsed: true })));
  }, []);

  const expandAll = useCallback(() => {
    setBlocks((prev) => prev.map((b) => ({ ...b, collapsed: false })));
  }, []);

  return {
    blocks,
    toggleCollapsed,
    togglePinned,
    clearBlocks,
    collapseAll,
    expandAll,
    pinnedBlocks: blocks.filter((b) => b.pinned),
    questionBlocks: blocks.filter((b) => getBlockTypeName(b.block_type) === "question"),
  };
}

/**
 * Get the string name of a block type
 */
export function getBlockTypeName(blockType: BlockType): string {
  if ("type" in blockType) {
    return blockType.type;
  }
  // Handle snake_case from Rust
  const keys = Object.keys(blockType);
  return keys[0] || "unknown";
}

/**
 * Get display info for a block type
 */
export function getBlockTypeDisplay(blockType: BlockType): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const typeName = getBlockTypeName(blockType);

  switch (typeName) {
    case "thinking":
      return {
        label: "Thinking",
        color: "text-[#a855f7]",
        bgColor: "bg-[#a855f7]/10",
        icon: "🧠",
      };
    case "code":
      return {
        label: `Code${(blockType as { type: "code"; language?: string }).language ? ` (${(blockType as { type: "code"; language?: string }).language})` : ""}`,
        color: "text-[#3b82f6]",
        bgColor: "bg-[#3b82f6]/10",
        icon: "💻",
      };
    case "tool":
      return {
        label: (blockType as { type: "tool"; name: string }).name,
        color: "text-[#eab308]",
        bgColor: "bg-[#eab308]/10",
        icon: "🔧",
      };
    case "tool_output":
      const output = blockType as { type: "tool_output"; name: string; success: boolean };
      return {
        label: `${output.name} Output`,
        color: output.success ? "text-[#22c55e]" : "text-[#ef4444]",
        bgColor: output.success ? "bg-[#22c55e]/10" : "bg-[#ef4444]/10",
        icon: output.success ? "✓" : "✕",
      };
    case "question":
      return {
        label: "Question",
        color: "text-[#f97316]",
        bgColor: "bg-[#f97316]/10",
        icon: "❓",
      };
    case "error":
      return {
        label: "Error",
        color: "text-[#ef4444]",
        bgColor: "bg-[#ef4444]/10",
        icon: "⚠",
      };
    case "diff":
      return {
        label: "Changes",
        color: "text-[#06b6d4]",
        bgColor: "bg-[#06b6d4]/10",
        icon: "±",
      };
    case "command":
      return {
        label: "Command",
        color: "text-[#10b981]",
        bgColor: "bg-[#10b981]/10",
        icon: "$",
      };
    case "command_output":
      return {
        label: "Output",
        color: "text-[#71717a]",
        bgColor: "bg-[#27272a]",
        icon: "→",
      };
    case "file_content":
      return {
        label: "File",
        color: "text-[#8b5cf6]",
        bgColor: "bg-[#8b5cf6]/10",
        icon: "📄",
      };
    default:
      return {
        label: "Text",
        color: "text-[#a1a1aa]",
        bgColor: "bg-[#1f1f23]",
        icon: "💬",
      };
  }
}
