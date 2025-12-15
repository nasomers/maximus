import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  RotateCcw,
  FileCode,
  Clock,
  Layers,
  Loader2,
  AlertCircle,
  ChevronRight,
  FilePlus,
  FileX,
  FilePen,
  X,
  History,
  MessageSquare,
  Lightbulb,
  Bug,
  RefreshCw,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  useSnapshots,
  useCreateSnapshot,
  useRestoreSnapshot,
  useSnapshotDiff,
} from "@/hooks/useSnapshots";
import { useProjectStore } from "@/stores/projectStore";
import type { Snapshot, FileChange } from "@/lib/tauri";

// Restore reasons
const RESTORE_REASONS = [
  { id: "bug", label: "Claude introduced a bug", icon: Bug, color: "text-red-500" },
  { id: "wrong_approach", label: "Wrong approach/direction", icon: RefreshCw, color: "text-yellow-500" },
  { id: "exploring", label: "Just exploring options", icon: Compass, color: "text-blue-500" },
  { id: "mistake", label: "I made a mistake", icon: AlertTriangle, color: "text-orange-500" },
  { id: "other", label: "Other reason", icon: MessageSquare, color: "text-muted-foreground" },
];

interface RestoreFeedback {
  reason: string;
  details?: string;
  snapshotId: string;
  snapshotName: string;
  timestamp: string;
}

// Store feedback in localStorage for now (could be sent to backend later)
function saveFeedback(feedback: RestoreFeedback) {
  const existing = JSON.parse(localStorage.getItem("lumen_restore_feedback") || "[]");
  existing.push({ ...feedback, savedAt: new Date().toISOString() });
  localStorage.setItem("lumen_restore_feedback", JSON.stringify(existing));
}

// Feedback dialog for learning from corrections
function RestoreFeedbackDialog({
  open,
  onOpenChange,
  snapshotName,
  onConfirm,
  isRestoring,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshotName: string;
  onConfirm: (reason: string, details?: string) => void;
  isRestoring: boolean;
}) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason, details.trim() || undefined);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedReason(null);
      setDetails("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Learn from this
          </DialogTitle>
          <DialogDescription>
            Why are you restoring to "{snapshotName}"? This helps improve future sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {RESTORE_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                selectedReason === reason.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground hover:bg-secondary/50"
              )}
            >
              <reason.icon className={cn("w-5 h-5", reason.color)} />
              <span className="text-sm font-medium">{reason.label}</span>
            </button>
          ))}

          {selectedReason && (
            <div className="pt-2">
              <label className="text-sm font-medium text-muted-foreground">
                Additional details (optional)
              </label>
              <Textarea
                placeholder="What went wrong? What would you do differently?"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="mt-2 h-20 resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => onConfirm("skipped")}
            disabled={isRestoring}
          >
            Skip & Restore
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// File change icon based on status
function FileChangeIcon({ status }: { status: string }) {
  switch (status) {
    case "added":
      return <FilePlus className="w-4 h-4 text-green-500" />;
    case "deleted":
      return <FileX className="w-4 h-4 text-red-500" />;
    case "modified":
      return <FilePen className="w-4 h-4 text-yellow-500" />;
    default:
      return <FileCode className="w-4 h-4 text-muted-foreground" />;
  }
}

// Diff stats badge
function DiffStats({ additions, deletions }: { additions: number; deletions: number }) {
  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      {additions > 0 && <span className="text-green-500">+{additions}</span>}
      {deletions > 0 && <span className="text-red-500">-{deletions}</span>}
    </div>
  );
}

// File list in diff panel
function FileList({ files }: { files: FileChange[] }) {
  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No files changed in this snapshot
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {files.map((file, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <FileChangeIcon status={file.status} />
          <span className="flex-1 text-sm font-mono truncate">{file.path}</span>
          <DiffStats additions={file.additions} deletions={file.deletions} />
        </div>
      ))}
    </div>
  );
}

// Snapshot diff panel
function SnapshotDiffPanel({
  snapshotId,
  snapshotName,
  onClose,
}: {
  snapshotId: string;
  snapshotName: string;
  onClose: () => void;
}) {
  const { data: diff, isLoading, error } = useSnapshotDiff(snapshotId);

  return (
    <div className="border-l border-border bg-card/50 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{snapshotName}</h3>
          <p className="text-xs text-muted-foreground">Changes in this snapshot</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Failed to load diff</p>
            </div>
          ) : diff ? (
            <>
              {/* Summary */}
              <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-secondary/50">
                <div className="text-center">
                  <div className="text-lg font-bold">{diff.files.length}</div>
                  <div className="text-xs text-muted-foreground">Files</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500">+{diff.totalAdditions}</div>
                  <div className="text-xs text-muted-foreground">Additions</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500">-{diff.totalDeletions}</div>
                  <div className="text-xs text-muted-foreground">Deletions</div>
                </div>
              </div>

              {/* File list */}
              <FileList files={diff.files} />
            </>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

interface TimelineNodeProps {
  snapshot: Snapshot;
  isLast?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onRestore: (id: string) => void;
  isRestoring?: boolean;
}

function TimelineNode({
  snapshot,
  isLast,
  isSelected,
  onSelect,
  onRestore,
  isRestoring,
}: TimelineNodeProps) {
  const isManual = snapshot.snapshotType === "manual";
  const timestamp = new Date(snapshot.timestamp);
  const timeStr = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="relative flex">
      {/* Timeline track */}
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        {/* Time label */}
        <div className="text-xs text-muted-foreground mb-1 font-mono">{timeStr}</div>

        {/* Node */}
        <button
          onClick={onSelect}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 transition-all",
            isSelected
              ? "border-primary bg-primary scale-125"
              : isManual
              ? "border-primary/60 bg-primary/20 hover:bg-primary/40"
              : "border-muted-foreground/40 bg-background hover:border-muted-foreground"
          )}
        >
          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
        </button>

        {/* Connector line */}
        {!isLast && <div className="w-0.5 flex-1 bg-border min-h-[60px]" />}
      </div>

      {/* Content card */}
      <div
        className={cn(
          "flex-1 p-3 rounded-xl mb-3 transition-all cursor-pointer border",
          isSelected
            ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
            : "bg-card border-border/50 hover:border-border hover:bg-card/80"
        )}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{snapshot.name}</h3>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  isManual
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {isManual ? "Manual" : "Auto"}
              </span>
            </div>

            {snapshot.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {snapshot.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileCode className="w-3 h-3" />
                {snapshot.filesChanged} files
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(timestamp)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform",
                isSelected && "rotate-90"
              )}
            />
          </div>
        </div>

        {/* Expanded actions */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(snapshot.id);
              }}
              disabled={isRestoring}
              className="h-7 text-xs"
            >
              {isRestoring ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3 mr-1" />
              )}
              Restore to this point
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Snapshots() {
  const { currentProject } = useProjectStore();
  const { data: snapshots = [], isLoading, error } = useSnapshots();
  const createMutation = useCreateSnapshot();
  const restoreMutation = useRestoreSnapshot();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [newSnapshotDescription, setNewSnapshotDescription] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [pendingRestoreSnapshot, setPendingRestoreSnapshot] = useState<Snapshot | null>(null);

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);

  // Open feedback dialog instead of restoring directly
  const handleRestoreClick = (id: string) => {
    const snapshot = snapshots.find((s) => s.id === id);
    if (snapshot) {
      setPendingRestoreSnapshot(snapshot);
      setShowFeedbackDialog(true);
    }
  };

  // Actually perform the restore after feedback
  const handleRestoreWithFeedback = async (reason: string, details?: string) => {
    if (!pendingRestoreSnapshot) return;

    setRestoringId(pendingRestoreSnapshot.id);
    try {
      // Save feedback
      if (reason !== "skipped") {
        saveFeedback({
          reason,
          details,
          snapshotId: pendingRestoreSnapshot.id,
          snapshotName: pendingRestoreSnapshot.name,
          timestamp: pendingRestoreSnapshot.timestamp,
        });
      }

      // Perform restore
      await restoreMutation.mutateAsync(pendingRestoreSnapshot.id);

      // Close dialog and show success
      setShowFeedbackDialog(false);
      setPendingRestoreSnapshot(null);
      toast.success("Restored successfully", {
        description: `Reverted to "${pendingRestoreSnapshot.name}"`,
      });
    } catch (e) {
      toast.error("Failed to restore", {
        description: e instanceof Error ? e.message : "An error occurred",
      });
    } finally {
      setRestoringId(null);
    }
  };

  const handleCreate = async () => {
    if (!newSnapshotName.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: newSnapshotName.trim(),
        description: newSnapshotDescription.trim() || undefined,
      });
      setShowCreateDialog(false);
      setNewSnapshotName("");
      setNewSnapshotDescription("");
      toast.success("Snapshot created", {
        description: `Saved "${newSnapshotName.trim()}"`,
      });
    } catch (e) {
      console.error("Failed to create snapshot:", e);
      toast.error("Failed to create snapshot", {
        description: e instanceof Error ? e.message : "An error occurred",
      });
    }
  };

  // Group snapshots by date
  const groupedSnapshots = snapshots.reduce((acc, snapshot) => {
    const date = new Date(snapshot.timestamp).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(snapshot);
    return acc;
  }, {} as Record<string, Snapshot[]>);

  // No project selected
  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">No Project Selected</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Select or initialize a project from the Dashboard to manage snapshots.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading snapshots...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Error Loading Snapshots</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Time Travel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {snapshots.length} snapshots · Click to view changes
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Save Now
        </Button>
      </div>

      {/* Description */}
      <Card className="bg-secondary/30 border-border/50 mb-4 flex-shrink-0">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Time Travel</strong> lets you browse your project's history.
            Click any snapshot to see exactly what changed. Hit <strong>Restore</strong> to travel back to that point.
          </p>
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Timeline */}
        <ScrollArea className="flex-1">
          <div className="pr-4">
            {snapshots.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                      <Layers className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">No snapshots yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Create your first snapshot to start your project's timeline.
                    </p>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Snapshot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSnapshots).map(([date, dateSnapshots]) => (
                  <div key={date}>
                    {/* Date header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {date}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Snapshots for this date */}
                    <div>
                      {dateSnapshots.map((snapshot, index) => (
                        <TimelineNode
                          key={snapshot.id}
                          snapshot={snapshot}
                          isLast={index === dateSnapshots.length - 1}
                          isSelected={selectedSnapshotId === snapshot.id}
                          onSelect={() =>
                            setSelectedSnapshotId(
                              selectedSnapshotId === snapshot.id ? null : snapshot.id
                            )
                          }
                          onRestore={handleRestoreClick}
                          isRestoring={restoringId === snapshot.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Diff panel */}
        {selectedSnapshot && (
          <div className="w-80 flex-shrink-0 rounded-xl overflow-hidden border border-border">
            <SnapshotDiffPanel
              snapshotId={selectedSnapshot.id}
              snapshotName={selectedSnapshot.name}
              onClose={() => setSelectedSnapshotId(null)}
            />
          </div>
        )}
      </div>

      {/* Create Snapshot Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Snapshot</DialogTitle>
            <DialogDescription>
              Save the current state of your project. You can restore this
              snapshot at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., before-refactor"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && newSnapshotName.trim()) {
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                placeholder="What are you saving?"
                value={newSnapshotDescription}
                onChange={(e) => setNewSnapshotDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newSnapshotName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Snapshot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Feedback Dialog */}
      <RestoreFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={(open) => {
          setShowFeedbackDialog(open);
          if (!open) setPendingRestoreSnapshot(null);
        }}
        snapshotName={pendingRestoreSnapshot?.name || ""}
        onConfirm={handleRestoreWithFeedback}
        isRestoring={!!restoringId}
      />
    </div>
  );
}
