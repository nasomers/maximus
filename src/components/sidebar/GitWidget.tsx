import { useState } from "react";
import { GitBranch, ChevronDown, ChevronUp, Upload, Download, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/projectStore";
import { useGitStatus, useGitCommit, useGitPush, useGitPull } from "@/hooks/useGitHub";
import { toast } from "sonner";

export function GitWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [commitMessage, setCommitMessage] = useState("");
  const { currentProject } = useProjectStore();
  const { data: gitStatus, isLoading } = useGitStatus();
  const commitMutation = useGitCommit();
  const pushMutation = useGitPush();
  const pullMutation = useGitPull();

  const changedFilesCount = (gitStatus?.staged?.length || 0) +
    (gitStatus?.modified?.length || 0) +
    (gitStatus?.untracked?.length || 0);

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message");
      return;
    }
    try {
      await commitMutation.mutateAsync(commitMessage);
      setCommitMessage("");
      toast.success("Changes committed");
    } catch (error) {
      toast.error("Commit failed", { description: String(error) });
    }
  };

  const handlePush = async () => {
    try {
      await pushMutation.mutateAsync();
      toast.success("Pushed to remote");
    } catch (error) {
      toast.error("Push failed", { description: String(error) });
    }
  };

  const handlePull = async () => {
    try {
      await pullMutation.mutateAsync();
      toast.success("Pulled from remote");
    } catch (error) {
      toast.error("Pull failed", { description: String(error) });
    }
  };

  if (!currentProject) return null;

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
          <GitBranch className="w-4 h-4 text-[#a855f7]" />
          <span className="text-sm font-medium">Git</span>
          {changedFilesCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-[#3b82f6]/20 text-[#3b82f6]">
              {changedFilesCount}
            </span>
          )}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[#71717a]" />
            </div>
          ) : gitStatus ? (
            <>
              {/* Branch & Status */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#a1a1aa]">{gitStatus.branch || 'main'}</span>
                {gitStatus.ahead > 0 && (
                  <span className="text-xs text-[#22c55e]">↑{gitStatus.ahead}</span>
                )}
                {gitStatus.behind > 0 && (
                  <span className="text-xs text-[#eab308]">↓{gitStatus.behind}</span>
                )}
                {changedFilesCount === 0 && (
                  <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                )}
              </div>

              {/* Changed Files Summary */}
              {changedFilesCount > 0 && (
                <div className="text-xs text-[#71717a] space-y-1">
                  {(gitStatus.staged?.length || 0) > 0 && (
                    <div className="text-[#22c55e]">
                      {gitStatus.staged?.length} staged
                    </div>
                  )}
                  {(gitStatus.modified?.length || 0) > 0 && (
                    <div className="text-[#eab308]">
                      {gitStatus.modified?.length} modified
                    </div>
                  )}
                  {(gitStatus.untracked?.length || 0) > 0 && (
                    <div className="text-[#71717a]">
                      {gitStatus.untracked?.length} untracked
                    </div>
                  )}
                </div>
              )}

              {/* Commit Input */}
              {changedFilesCount > 0 && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message..."
                    className={cn(
                      "w-full px-2 py-1.5 text-sm rounded bg-[#0a0a0b] border border-[#27272a]",
                      "focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/50",
                      "placeholder:text-[#52525b]"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commitMessage.trim()) {
                        handleCommit();
                      }
                    }}
                  />
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || commitMutation.isPending}
                    className={cn(
                      "w-full py-1.5 text-sm rounded font-medium transition-all",
                      "bg-[#3b82f6] text-white hover:bg-[#2563eb]",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {commitMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Commit"
                    )}
                  </button>
                </div>
              )}

              {/* Push/Pull Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePush}
                  disabled={pushMutation.isPending || !gitStatus.hasRemote}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded",
                    "bg-[#1f1f23] hover:bg-[#27272a] transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title={!gitStatus.hasRemote ? "No remote configured" : "Push to remote"}
                >
                  {pushMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Push</span>
                </button>
                <button
                  onClick={handlePull}
                  disabled={pullMutation.isPending || !gitStatus.hasRemote}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded",
                    "bg-[#1f1f23] hover:bg-[#27272a] transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title={!gitStatus.hasRemote ? "No remote configured" : "Pull from remote"}
                >
                  {pullMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Pull</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#71717a]">
              <AlertCircle className="w-4 h-4" />
              <span>Not a git repository</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
