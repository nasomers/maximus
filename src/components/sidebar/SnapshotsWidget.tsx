import { useState } from "react";
import { Camera, ChevronDown, ChevronUp, RotateCcw, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSnapshots, useCreateSnapshot, useRestoreSnapshot } from "@/hooks/useSnapshots";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

export function SnapshotsWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [snapshotName, setSnapshotName] = useState("");
  const { data: snapshots = [], isLoading } = useSnapshots();
  const createMutation = useCreateSnapshot();
  const restoreMutation = useRestoreSnapshot();

  // Show only the 5 most recent
  const recentSnapshots = snapshots.slice(0, 5);

  const handleCreate = async () => {
    const name = snapshotName.trim() || `snapshot-${Date.now()}`;
    try {
      await createMutation.mutateAsync({ name });
      setSnapshotName("");
      toast.success("Snapshot created", { description: name });
    } catch (error) {
      toast.error("Failed to create snapshot", { description: String(error) });
    }
  };

  const handleRestore = async (snapshotId: string, name: string) => {
    try {
      await restoreMutation.mutateAsync(snapshotId);
      toast.success("Snapshot restored", { description: name });
    } catch (error) {
      toast.error("Failed to restore snapshot", { description: String(error) });
    }
  };

  const handleQuickUndo = async () => {
    if (snapshots.length > 0) {
      await handleRestore(snapshots[0].id, snapshots[0].name);
    }
  };

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
          <Camera className="w-4 h-4 text-[#22c55e]" />
          <span className="text-sm font-medium">Snapshots</span>
          {snapshots.length > 0 && (
            <span className="text-xs text-[#71717a]">
              {snapshots.length}
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
          {/* Quick Save */}
          <div className="flex gap-2">
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot name..."
              className={cn(
                "flex-1 px-2 py-1.5 text-sm rounded bg-[#0a0a0b] border border-[#27272a]",
                "focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50",
                "placeholder:text-[#52525b]"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className={cn(
                "px-3 py-1.5 text-sm rounded font-medium transition-all",
                "bg-[#22c55e] text-black hover:bg-[#16a34a]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Create snapshot (Ctrl+S)"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </div>

          {/* Quick Undo */}
          {snapshots.length > 0 && (
            <button
              onClick={handleQuickUndo}
              disabled={restoreMutation.isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-1.5 text-sm rounded",
                "bg-[#eab308]/10 text-[#eab308] hover:bg-[#eab308]/20",
                "transition-colors disabled:opacity-50"
              )}
              title="Restore last snapshot (Ctrl+Z)"
            >
              {restoreMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>Undo to last snapshot</span>
            </button>
          )}

          {/* Recent Snapshots */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[#71717a]" />
            </div>
          ) : recentSnapshots.length > 0 ? (
            <div className="space-y-1">
              <div className="text-xs text-[#71717a] mb-2">Recent</div>
              {recentSnapshots.map((snapshot, index) => (
                <button
                  key={snapshot.id}
                  onClick={() => handleRestore(snapshot.id, snapshot.name)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left",
                    "hover:bg-[#1f1f23] transition-colors group"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    index === 0 ? "bg-[#22c55e]" : "bg-[#3f3f46]"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{snapshot.name}</div>
                    <div className="flex items-center gap-1 text-xs text-[#71717a]">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(new Date(snapshot.timestamp))}
                    </div>
                  </div>
                  <RotateCcw className="w-3.5 h-3.5 text-[#71717a] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-[#71717a]">
              No snapshots yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
