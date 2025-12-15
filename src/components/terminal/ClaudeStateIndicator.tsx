import { cn } from "@/lib/utils";
import { useClaudeState, ClaudeStateDisplay } from "@/hooks/useClaudeState";
import { Brain, Pencil, Wrench, HelpCircle, AlertCircle, CheckCircle, Circle } from "lucide-react";

interface ClaudeStateIndicatorProps {
  terminalId: string;
  className?: string;
  variant?: "compact" | "full";
}

const StateIcon = ({ state, className }: { state: ClaudeStateDisplay["state"]; className?: string }) => {
  const iconClass = cn("w-3.5 h-3.5", className);

  switch (state) {
    case "thinking":
      return <Brain className={cn(iconClass, "animate-pulse")} />;
    case "writing":
      return <Pencil className={iconClass} />;
    case "tool_use":
      return <Wrench className={cn(iconClass, "animate-spin-slow")} />;
    case "asking":
      return <HelpCircle className={cn(iconClass, "animate-bounce-subtle")} />;
    case "error":
      return <AlertCircle className={iconClass} />;
    case "complete":
      return <CheckCircle className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
};

export function ClaudeStateIndicator({
  terminalId,
  className,
  variant = "compact",
}: ClaudeStateIndicatorProps) {
  const stateDisplay = useClaudeState(terminalId);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300",
          stateDisplay.bgColor,
          stateDisplay.color,
          // Glow effect for active states
          stateDisplay.state === "thinking" && "shadow-[0_0_10px_rgba(168,85,247,0.3)]",
          stateDisplay.state === "tool_use" && "shadow-[0_0_10px_rgba(234,179,8,0.3)]",
          stateDisplay.state === "asking" && "shadow-[0_0_10px_rgba(249,115,22,0.4)]",
          stateDisplay.state === "error" && "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
          stateDisplay.state === "complete" && "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
          className
        )}
        title={stateDisplay.question || stateDisplay.label}
      >
        <StateIcon state={stateDisplay.state} />
        <span className="truncate max-w-[80px]">{stateDisplay.label}</span>
      </div>
    );
  }

  // Full variant - shows more detail
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-300",
        stateDisplay.bgColor,
        stateDisplay.color,
        // Animated border for active states
        stateDisplay.state !== "idle" && "ring-1 ring-current ring-opacity-30",
        className
      )}
    >
      <StateIcon state={stateDisplay.state} className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="font-medium">{stateDisplay.label}</span>
        {stateDisplay.question && (
          <span className="text-xs opacity-80 truncate max-w-[200px]">
            {stateDisplay.question}
          </span>
        )}
      </div>
      {stateDisplay.awaitingInput && stateDisplay.state !== "idle" && (
        <div className="ml-auto flex items-center gap-1 text-xs opacity-70">
          <span className="animate-pulse">awaiting input</span>
        </div>
      )}
    </div>
  );
}

/**
 * Floating Claude state pill - can be positioned anywhere
 */
export function ClaudeStatePill({
  terminalId,
  className,
}: {
  terminalId: string;
  className?: string;
}) {
  const stateDisplay = useClaudeState(terminalId);

  // Don't show when idle
  if (stateDisplay.state === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
        "backdrop-blur-md bg-black/60 border border-white/10",
        "shadow-lg shadow-black/20",
        "animate-fade-in",
        stateDisplay.color,
        className
      )}
    >
      <StateIcon state={stateDisplay.state} />
      <span>{stateDisplay.label}</span>
      {stateDisplay.state === "asking" && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
    </div>
  );
}
