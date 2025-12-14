import { useState } from "react";
import { AlertTriangle, Shield, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateSnapshot } from "@/hooks/useSnapshots";
import { cn } from "@/lib/utils";
import type { RiskyDetection } from "@/lib/riskyCommands";

interface RiskyCommandWarningProps {
  detection: RiskyDetection;
  onDismiss: () => void;
  onSnapshotCreated?: () => void;
}

export function RiskyCommandWarning({
  detection,
  onDismiss,
  onSnapshotCreated,
}: RiskyCommandWarningProps) {
  const createSnapshot = useCreateSnapshot();
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickSave = async () => {
    setIsCreating(true);
    try {
      await createSnapshot.mutateAsync({
        name: `Before: ${detection.match.slice(0, 30)}`,
        description: `Auto-save before risky command: ${detection.match}`,
      });
      onSnapshotCreated?.();
      onDismiss();
    } catch (error) {
      console.error("Failed to create snapshot:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const isDanger = detection.pattern.severity === "danger";

  return (
    <div
      className={cn(
        "absolute bottom-16 left-4 right-4 z-30 rounded-xl border shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-4",
        isDanger
          ? "bg-red-500/10 border-red-500/30"
          : "bg-yellow-500/10 border-yellow-500/30"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "p-2 rounded-lg",
              isDanger ? "bg-red-500/20" : "bg-yellow-500/20"
            )}
          >
            <AlertTriangle
              className={cn(
                "w-5 h-5",
                isDanger ? "text-red-500" : "text-yellow-500"
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  "font-semibold",
                  isDanger ? "text-red-500" : "text-yellow-500"
                )}
              >
                {isDanger ? "Risky Command Detected" : "Heads Up"}
              </h4>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  isDanger
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                )}
              >
                {detection.pattern.severity}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {detection.pattern.reason}:{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                {detection.match}
              </code>
            </p>

            <p className="text-sm mt-2">{detection.pattern.suggestion}</p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleQuickSave}
                disabled={isCreating}
                className={cn(
                  "gap-2",
                  isDanger
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-yellow-500 hover:bg-yellow-600 text-black"
                )}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Quick Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                disabled={isCreating}
              >
                Dismiss
              </Button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
