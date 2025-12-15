import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFailedApproaches,
  useAddFailedApproach,
  useRemoveFailedApproach,
  useClearFailedApproaches,
} from "@/hooks/useFailedApproaches";
import { toast } from "sonner";

interface FailedApproachesPopupProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function FailedApproachesPopup({
  open,
  onClose,
  anchorRef,
}: FailedApproachesPopupProps) {
  const [newApproach, setNewApproach] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: approaches = [], isLoading } = useFailedApproaches();
  const addMutation = useAddFailedApproach();
  const removeMutation = useRemoveFailedApproach();
  const clearMutation = useClearFailedApproaches();

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleAdd = async () => {
    const description = newApproach.trim();
    if (!description) return;

    try {
      await addMutation.mutateAsync({ description });
      setNewApproach("");
      toast.success("Approach noted");
    } catch {
      toast.error("Failed to add approach");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
    } catch {
      toast.error("Failed to remove approach");
    }
  };

  const handleClear = async () => {
    if (approaches.length === 0) return;
    if (!confirm("Clear all failed approaches?")) return;

    try {
      await clearMutation.mutateAsync();
      toast.success("Cleared all approaches");
    } catch {
      toast.error("Failed to clear approaches");
    }
  };

  if (!open) return null;

  // Position popup above the button
  const getPopupStyle = (): React.CSSProperties => {
    if (!anchorRef.current) return {};
    const rect = anchorRef.current.getBoundingClientRect();
    return {
      position: "fixed",
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        style={getPopupStyle()}
        className={cn(
          "z-50 w-80 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl",
          "animate-scale-in origin-bottom-left"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-[#ef4444]" />
            <span className="text-sm font-medium">Failed Approaches</span>
            {approaches.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-[#ef4444]/20 text-[#ef4444]">
                {approaches.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#27272a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
          {/* Add new approach */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newApproach}
              onChange={(e) => setNewApproach(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newApproach.trim()) {
                  handleAdd();
                }
              }}
              placeholder="What didn't work..."
              className={cn(
                "flex-1 px-2 py-1.5 text-sm rounded-lg",
                "bg-[#0a0a0b] border border-[#27272a]",
                "focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/30",
                "placeholder:text-[#52525b]"
              )}
            />
            <button
              onClick={handleAdd}
              disabled={!newApproach.trim() || addMutation.isPending}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                newApproach.trim()
                  ? "bg-[#ef4444] text-white hover:bg-[#dc2626]"
                  : "bg-[#27272a] text-[#52525b] cursor-not-allowed"
              )}
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* List of approaches */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#71717a]" />
            </div>
          ) : approaches.length === 0 ? (
            <div className="text-center py-4 text-sm text-[#71717a]">
              No failed approaches yet.
              <br />
              <span className="text-xs text-[#52525b]">
                Track what didn't work to avoid repeating mistakes
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {approaches.map((approach) => (
                <div
                  key={approach.id}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg",
                    "bg-[#0a0a0b] border border-[#27272a]",
                    "group"
                  )}
                >
                  <XCircle className="w-3.5 h-3.5 mt-0.5 text-[#ef4444] shrink-0" />
                  <span className="flex-1 text-sm text-[#a1a1aa]">
                    {approach.description}
                  </span>
                  <button
                    onClick={() => handleRemove(approach.id)}
                    className={cn(
                      "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                      "hover:bg-[#27272a] text-[#71717a] hover:text-white"
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {approaches.length > 0 && (
          <div className="flex justify-end px-3 py-2 border-t border-[#27272a]">
            <button
              onClick={handleClear}
              disabled={clearMutation.isPending}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs rounded",
                "text-[#71717a] hover:text-[#ef4444] hover:bg-[#ef4444]/10",
                "transition-colors"
              )}
            >
              {clearMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}
