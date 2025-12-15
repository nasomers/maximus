import { useState } from "react";
import { Terminal, ChevronDown, ChevronUp, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/projectStore";
import { useQuickCommands } from "@/hooks/useQuickCommands";
import { useTerminalStore } from "@/stores/terminalStore";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export function QuickCommandsWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const { currentProject } = useProjectStore();
  const { activeTabId } = useTerminalStore();
  const { data: commands = [] } = useQuickCommands();

  const handleRunCommand = async (command: string, name: string) => {
    if (!activeTabId) {
      toast.error("No active terminal");
      return;
    }

    try {
      setRunningCommand(name);
      await invoke("pty_write", { id: activeTabId, data: command + "\n" });
      toast.success(`Running: ${name}`);
    } catch (error) {
      toast.error("Failed to run command", { description: String(error) });
    } finally {
      // Small delay before clearing the running state
      setTimeout(() => setRunningCommand(null), 500);
    }
  };

  if (!currentProject) return null;

  // Group commands by category
  const npmScripts = commands.filter((c) => c.category === "npm");
  const customCommands = commands.filter((c) => c.category !== "npm");

  return (
    <div className="bg-[#18181b] rounded-lg border border-[#27272a] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2",
          "hover:bg-[#1f1f23] transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-medium">Quick Commands</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#71717a]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#71717a]" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* NPM Scripts */}
          {npmScripts.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-[#71717a] mb-2">npm scripts</div>
              {npmScripts.map((cmd) => (
                <button
                  key={cmd.name}
                  onClick={() => handleRunCommand(cmd.command, cmd.name)}
                  disabled={runningCommand === cmd.name}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left",
                    "hover:bg-[#1f1f23] transition-colors group",
                    "disabled:opacity-50"
                  )}
                >
                  {runningCommand === cmd.name ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#06b6d4]" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[#06b6d4] transition-colors" />
                  )}
                  <span className="text-sm flex-1 truncate">{cmd.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Custom Commands */}
          {customCommands.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-[#71717a] mb-2">Custom</div>
              {customCommands.map((cmd) => (
                <button
                  key={cmd.name}
                  onClick={() => handleRunCommand(cmd.command, cmd.name)}
                  disabled={runningCommand === cmd.name}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left",
                    "hover:bg-[#1f1f23] transition-colors group",
                    "disabled:opacity-50"
                  )}
                >
                  {runningCommand === cmd.name ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#06b6d4]" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[#06b6d4] transition-colors" />
                  )}
                  <span className="text-sm flex-1 truncate">{cmd.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {commands.length === 0 && (
            <div className="text-center py-4 text-sm text-[#71717a]">
              No package.json found
            </div>
          )}

          {/* Common Commands */}
          <div className="space-y-1 pt-2 border-t border-[#27272a]">
            <div className="text-xs text-[#71717a] mb-2">Common</div>
            {[
              { name: "claude", command: "claude" },
              { name: "git status", command: "git status" },
              { name: "clear", command: "clear" },
            ].map((cmd) => (
              <button
                key={cmd.name}
                onClick={() => handleRunCommand(cmd.command, cmd.name)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left",
                  "hover:bg-[#1f1f23] transition-colors group"
                )}
              >
                <Play className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[#06b6d4] transition-colors" />
                <span className="text-sm flex-1 truncate font-mono text-[#a1a1aa]">
                  {cmd.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
