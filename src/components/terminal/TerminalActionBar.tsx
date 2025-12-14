import { useState, useEffect, useRef } from "react";
import { Save, Undo2, Square, Clock, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSnapshots, useCreateSnapshot, useRestoreSnapshot } from "@/hooks/useSnapshots";

interface TerminalActionBarProps {
  sessionActive: boolean;
  onEndSession?: () => void;
}

export function TerminalActionBar({ sessionActive, onEndSession }: TerminalActionBarProps) {
  const { currentProject } = useProjectStore();
  const { riskyCommandDetected, setRiskyCommandDetected, sessionStartTime } = useSessionStore();
  const { data: snapshots = [] } = useSnapshots();
  const createSnapshotMutation = useCreateSnapshot();
  const restoreMutation = useRestoreSnapshot();

  // Track if we've already auto-saved for this risky command
  const autoSavedRef = useRef(false);

  // Session timer
  const [elapsed, setElapsed] = useState(0);

  // Token estimate (rough approximation based on time)
  const [tokenEstimate, setTokenEstimate] = useState(0);

  // Show warning banner
  const [showWarning, setShowWarning] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!sessionActive || !sessionStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - sessionStartTime;
      setElapsed(elapsedMs);

      // Rough token estimate: ~15 tokens per second of active coding
      setTokenEstimate(Math.floor(elapsedMs / 1000 * 15));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, sessionStartTime]);

  // Auto-snapshot on risky command detection
  useEffect(() => {
    if (riskyCommandDetected && !autoSavedRef.current && currentProject) {
      autoSavedRef.current = true;
      setShowWarning(true);

      // Auto-save a checkpoint
      const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "-");
      createSnapshotMutation.mutate({
        name: `auto-checkpoint-${timestamp}`,
      });

      // Hide warning after 5 seconds
      const timer = setTimeout(() => {
        setShowWarning(false);
        setRiskyCommandDetected(false);
        autoSavedRef.current = false;
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [riskyCommandDetected, currentProject, createSnapshotMutation, setRiskyCommandDetected]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return String(tokens);
  };

  // Estimate cost: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
  // Rough average: $0.01 per 1K tokens
  const estimatedCost = (tokenEstimate / 1000 * 0.01).toFixed(2);

  const handleQuickSave = async () => {
    if (!currentProject) return;
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "-");
    await createSnapshotMutation.mutateAsync({
      name: `checkpoint-${timestamp}`,
    });
  };

  const handleUndo = async () => {
    if (snapshots.length > 0) {
      await restoreMutation.mutateAsync(snapshots[0].id);
    }
  };

  if (!currentProject) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
      {/* Warning Banner */}
      {showWarning && (
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 rounded-full px-3 py-1.5 text-xs font-medium animate-pulse">
          <Shield className="w-3.5 h-3.5" />
          <span>Risky operation detected - Auto-checkpoint created</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-full px-2 py-1.5 shadow-lg">
        {/* Session Stats */}
        {sessionActive && (
          <>
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono font-medium">{formatTime(elapsed)}</span>
            </div>

            {/* Token Estimate */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-xs font-mono">
                ~{formatTokens(tokenEstimate)} <span className="text-muted-foreground">(${estimatedCost})</span>
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />
          </>
        )}

        {/* Quick Save */}
        <button
          onClick={handleQuickSave}
          disabled={createSnapshotMutation.isPending}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            "hover:bg-primary hover:text-primary-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            createSnapshotMutation.isPending && "animate-pulse"
          )}
          title="Quick Save (Checkpoint)"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={snapshots.length === 0 || restoreMutation.isPending}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            "hover:bg-orange-500 hover:text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          title="Undo (Restore Last Snapshot)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        {/* End Session */}
        {sessionActive && onEndSession && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={onEndSession}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                "hover:bg-red-500 hover:text-white"
              )}
              title="End Session"
            >
              <Square className="w-3.5 h-3.5" />
              <span>End</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
