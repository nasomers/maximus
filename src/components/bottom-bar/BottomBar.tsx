import { useState, useMemo } from "react";
import { MessageSquare, XCircle, FileText, Zap, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClaudeCodeStats, formatTokens } from "@/hooks/useClaudeCode";

export function BottomBar() {
  const [conciseMode, setConciseMode] = useState(true);
  const { data: claudeStats } = useClaudeCodeStats();

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
    <div className="flex items-center justify-between h-8 px-3 bg-[#111113] border-t border-[#27272a] text-xs">
      {/* Left: Toggles & Actions */}
      <div className="flex items-center gap-3">
        {/* Concise Mode Toggle */}
        <button
          onClick={() => setConciseMode(!conciseMode)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded transition-colors",
            conciseMode
              ? "bg-[#22c55e]/10 text-[#22c55e]"
              : "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
          )}
          title="When enabled, prompts Claude to be concise"
        >
          <MessageSquare className="w-3 h-3" />
          <span>Concise</span>
          {conciseMode && <span className="text-[10px]">✓</span>}
        </button>

        {/* Failed Approaches (placeholder for now) */}
        <button
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded transition-colors",
            "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
          )}
          title="Track approaches that didn't work"
        >
          <XCircle className="w-3 h-3" />
          <span>Failed: 0</span>
        </button>

        {/* CLAUDE.md Quick Edit */}
        <button
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded transition-colors",
            "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
          )}
          title="Edit CLAUDE.md for project context"
        >
          <FileText className="w-3 h-3" />
          <span>CLAUDE.md</span>
        </button>
      </div>

      {/* Right: Cost & Token Display */}
      <div className="flex items-center gap-4">
        {/* Token Count */}
        <div className="flex items-center gap-1.5 text-[#a1a1aa]">
          <Zap className="w-3 h-3 text-[#eab308]" />
          <span>{formatTokens(todayUsage.tokens)} tokens</span>
        </div>

        {/* Cost Estimate */}
        <div className="flex items-center gap-1.5 text-[#a1a1aa]">
          <DollarSign className="w-3 h-3 text-[#22c55e]" />
          <span>${todayUsage.cost.toFixed(2)} today</span>
        </div>
      </div>
    </div>
  );
}
