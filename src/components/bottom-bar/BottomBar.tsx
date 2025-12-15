import { useState, useMemo, useEffect, useRef } from "react";
import { MessageSquare, XCircle, FileText, Zap, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClaudeCodeStats, formatTokens } from "@/hooks/useClaudeCode";
import { useProjectStore } from "@/stores/projectStore";
import { useFailedApproaches } from "@/hooks/useFailedApproaches";
import { ClaudeMdEditor } from "@/components/editor/ClaudeMdEditor";
import { FailedApproachesPopup } from "@/components/failed-approaches/FailedApproachesPopup";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

const CONCISE_PREFIX = "Be concise and direct. Avoid unnecessary explanations unless asked.";

export function BottomBar() {
  const [conciseMode, setConciseMode] = useState(false);
  const [showClaudeMdEditor, setShowClaudeMdEditor] = useState(false);
  const [showFailedApproaches, setShowFailedApproaches] = useState(false);
  const failedButtonRef = useRef<HTMLButtonElement>(null);
  const { currentProject } = useProjectStore();
  const { data: claudeStats } = useClaudeCodeStats();
  const { data: failedApproaches = [] } = useFailedApproaches();

  // Load initial concise mode state
  useEffect(() => {
    invoke<string | null>("get_prompt_prefix").then((prefix) => {
      setConciseMode(prefix === CONCISE_PREFIX);
    }).catch(() => {});
  }, []);

  const handleToggleConcise = async () => {
    const newValue = !conciseMode;
    try {
      await invoke("set_prompt_prefix", {
        prefix: newValue ? CONCISE_PREFIX : null,
      });
      setConciseMode(newValue);
      toast.success(newValue ? "Concise mode enabled" : "Concise mode disabled");
    } catch (error) {
      toast.error("Failed to update concise mode");
    }
  };

  // Get today's usage
  const todayUsage = useMemo(() => {
    if (!claudeStats?.dailyActivity) return { messages: 0, tokens: 0, cost: 0 };

    const today = new Date().toISOString().split("T")[0];
    const todayActivity = claudeStats.dailyActivity.find(
      (d) => d.date === today
    );

    const todayTokensEntry = claudeStats.dailyModelTokens?.find(
      (d) => d.date === today
    );
    const todayTokens = todayTokensEntry
      ? Object.values(todayTokensEntry.tokensByModel).reduce((sum, t) => sum + t, 0)
      : 0;

    // Rough cost estimate: $0.01 per 1K tokens average
    const estimatedCost = (todayTokens / 1000) * 0.01;

    return {
      messages: todayActivity?.messageCount || 0,
      tokens: todayTokens,
      cost: estimatedCost,
    };
  }, [claudeStats]);

  return (
    <div className="flex items-center justify-between h-8 px-3 bg-[#111113] border-t border-[#27272a] text-xs select-none">
      {/* Left: Toggles & Actions */}
      <div className="flex items-center gap-2">
        {/* Concise Mode Toggle */}
        <button
          onClick={handleToggleConcise}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200",
            conciseMode
              ? "bg-[#22c55e]/15 text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.15)]"
              : "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
          )}
          title="When enabled, prompts Claude to be concise"
        >
          <MessageSquare className="w-3 h-3" />
          <span>Concise</span>
          {conciseMode && <span className="text-[10px] ml-0.5">✓</span>}
        </button>

        <div className="h-3 w-px bg-[#27272a]" />

        {/* Failed Approaches */}
        <button
          ref={failedButtonRef}
          onClick={() => setShowFailedApproaches(true)}
          disabled={!currentProject}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200",
            failedApproaches.length > 0
              ? "text-[#ef4444] bg-[#ef4444]/10"
              : currentProject
                ? "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
                : "text-[#52525b] cursor-not-allowed"
          )}
          title="Track approaches that didn't work"
        >
          <XCircle className="w-3 h-3" />
          <span>Failed: {failedApproaches.length}</span>
        </button>

        <div className="h-3 w-px bg-[#27272a]" />

        {/* CLAUDE.md Quick Edit */}
        <button
          onClick={() => setShowClaudeMdEditor(true)}
          disabled={!currentProject}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200",
            currentProject
              ? "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
              : "text-[#52525b] cursor-not-allowed"
          )}
          title={currentProject ? "Edit CLAUDE.md for project context" : "Select a project first"}
        >
          <FileText className="w-3 h-3" />
          <span>CLAUDE.md</span>
        </button>
      </div>

      {/* Right: Cost & Token Display */}
      <div className="flex items-center gap-4 font-mono">
        {/* Token Count */}
        <div className="flex items-center gap-1.5 text-[#a1a1aa] transition-colors hover:text-[#eab308]">
          <Zap className="w-3 h-3 text-[#eab308]" />
          <span>{formatTokens(todayUsage.tokens)}</span>
          <span className="text-[#52525b]">tokens</span>
        </div>

        <div className="h-3 w-px bg-[#27272a]" />

        {/* Cost Estimate */}
        <div className="flex items-center gap-1.5 text-[#a1a1aa] transition-colors hover:text-[#22c55e]">
          <DollarSign className="w-3 h-3 text-[#22c55e]" />
          <span className="tabular-nums">${todayUsage.cost.toFixed(2)}</span>
          <span className="text-[#52525b]">today</span>
        </div>
      </div>

      {/* CLAUDE.md Editor Modal */}
      <ClaudeMdEditor
        open={showClaudeMdEditor}
        onClose={() => setShowClaudeMdEditor(false)}
        projectPath={currentProject?.path ?? null}
      />

      {/* Failed Approaches Popup */}
      <FailedApproachesPopup
        open={showFailedApproaches}
        onClose={() => setShowFailedApproaches(false)}
        anchorRef={failedButtonRef}
      />
    </div>
  );
}
