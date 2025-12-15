import { useState, memo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pin,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SemanticBlockWithState,
  getBlockTypeDisplay,
  getBlockTypeName,
} from "@/hooks/useSemanticBlocks";

interface SemanticBlockCardProps {
  block: SemanticBlockWithState;
  onToggleCollapsed: (id: number) => void;
  onTogglePinned: (id: number) => void;
  className?: string;
}

export const SemanticBlockCard = memo(function SemanticBlockCard({
  block,
  onToggleCollapsed,
  onTogglePinned,
  className,
}: SemanticBlockCardProps) {
  const [copied, setCopied] = useState(false);
  const display = getBlockTypeDisplay(block.block_type);
  const typeName = getBlockTypeName(block.block_type);
  const lineCount = block.content.split("\n").length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCode = typeName === "code";
  const isDiff = typeName === "diff";
  const isQuestion = typeName === "question";
  const isError = typeName === "error";

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200",
        "hover:border-[#3f3f46]",
        display.bgColor,
        block.pinned && "ring-1 ring-[#3b82f6] ring-opacity-50",
        isQuestion && "border-[#f97316]/30",
        isError && "border-[#ef4444]/30",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer select-none",
          "border-b border-transparent",
          !block.collapsed && "border-[#27272a]"
        )}
        onClick={() => onToggleCollapsed(block.id)}
      >
        {/* Collapse indicator */}
        <button className="p-0.5 rounded hover:bg-[#27272a] transition-colors">
          {block.collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-[#71717a]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
          )}
        </button>

        {/* Icon and label */}
        <span className="text-sm">{display.icon}</span>
        <span className={cn("text-xs font-medium", display.color)}>
          {display.label}
        </span>

        {/* Line count */}
        {lineCount > 1 && (
          <span className="text-xs text-[#52525b]">{lineCount} lines</span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pin */}
          <button
            onClick={() => onTogglePinned(block.id)}
            className={cn(
              "p-1 rounded transition-colors",
              block.pinned
                ? "text-[#3b82f6] bg-[#3b82f6]/10"
                : "text-[#71717a] hover:text-white hover:bg-[#27272a]"
            )}
            title={block.pinned ? "Unpin" : "Pin"}
          >
            <Pin className="w-3 h-3" />
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
            title="Copy content"
          >
            {copied ? (
              <Check className="w-3 h-3 text-[#22c55e]" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Incomplete indicator */}
        {!block.complete && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
        )}
      </div>

      {/* Content */}
      {!block.collapsed && (
        <div
          className={cn(
            "px-3 py-2 text-sm font-mono overflow-x-auto",
            "max-h-64 overflow-y-auto scrollbar-thin"
          )}
        >
          {isCode || isDiff ? (
            <CodeContent content={block.content} isDiff={isDiff} />
          ) : (
            <pre className="whitespace-pre-wrap text-[#a1a1aa]">
              {block.content}
            </pre>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Code/Diff content with syntax highlighting colors
 */
function CodeContent({ content, isDiff }: { content: string; isDiff: boolean }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        let lineClass = "text-[#a1a1aa]";

        if (isDiff) {
          if (line.startsWith("+") && !line.startsWith("+++")) {
            lineClass = "text-[#22c55e] bg-[#22c55e]/5";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            lineClass = "text-[#ef4444] bg-[#ef4444]/5";
          } else if (line.startsWith("@@")) {
            lineClass = "text-[#3b82f6]";
          }
        }

        return (
          <div key={i} className={cn("px-1 -mx-1", lineClass)}>
            <span className="text-[#52525b] select-none mr-3">
              {String(i + 1).padStart(3)}
            </span>
            {line}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Container for semantic blocks with controls
 */
interface SemanticBlockListProps {
  blocks: SemanticBlockWithState[];
  onToggleCollapsed: (id: number) => void;
  onTogglePinned: (id: number) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onClear: () => void;
  className?: string;
}

export function SemanticBlockList({
  blocks,
  onToggleCollapsed,
  onTogglePinned,
  onCollapseAll,
  onExpandAll,
  onClear,
  className,
}: SemanticBlockListProps) {
  if (blocks.length === 0) {
    return (
      <div className={cn("text-center py-8 text-[#52525b] text-sm", className)}>
        Semantic blocks will appear here as Claude works...
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-[#71717a]">
          {blocks.length} blocks
          {blocks.filter((b) => b.pinned).length > 0 &&
            ` (${blocks.filter((b) => b.pinned).length} pinned)`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCollapseAll}
            className="text-xs text-[#71717a] hover:text-white transition-colors"
          >
            Collapse all
          </button>
          <span className="text-[#27272a]">|</span>
          <button
            onClick={onExpandAll}
            className="text-xs text-[#71717a] hover:text-white transition-colors"
          >
            Expand all
          </button>
          <span className="text-[#27272a]">|</span>
          <button
            onClick={onClear}
            className="text-xs text-[#71717a] hover:text-[#ef4444] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Pinned blocks first */}
      {blocks.filter((b) => b.pinned).length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-[#71717a] px-2">Pinned</span>
          {blocks
            .filter((b) => b.pinned)
            .map((block) => (
              <SemanticBlockCard
                key={block.id}
                block={block}
                onToggleCollapsed={onToggleCollapsed}
                onTogglePinned={onTogglePinned}
              />
            ))}
        </div>
      )}

      {/* Regular blocks */}
      <div className="space-y-2">
        {blocks
          .filter((b) => !b.pinned)
          .map((block) => (
            <SemanticBlockCard
              key={block.id}
              block={block}
              onToggleCollapsed={onToggleCollapsed}
              onTogglePinned={onTogglePinned}
            />
          ))}
      </div>
    </div>
  );
}

/**
 * Pinned questions panel - shows questions Claude has asked
 */
interface PinnedQuestionsProps {
  questions: SemanticBlockWithState[];
  className?: string;
}

export function PinnedQuestions({
  questions,
  className,
}: PinnedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#f97316]/30 bg-[#f97316]/5 p-3",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">❓</span>
        <span className="text-xs font-medium text-[#f97316]">
          Claude is asking
        </span>
      </div>
      <div className="space-y-2">
        {questions.slice(-3).map((q) => (
          <div
            key={q.id}
            className="text-sm text-[#a1a1aa] bg-[#0a0a0b] rounded px-2 py-1.5"
          >
            {q.content}
          </div>
        ))}
      </div>
    </div>
  );
}
