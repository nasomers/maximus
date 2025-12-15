import { useState, useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
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

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm animate-fade-in"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl",
          "w-[400px] max-h-[80vh] overflow-hidden animate-scale-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#3b82f6]" />
            <h2 className="font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg",
                "hover:bg-[#1f1f23] transition-colors"
              )}
            >
              <span className="text-sm text-[#a1a1aa]">{shortcut.description}</span>
              <kbd
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded",
                  "bg-[#27272a] text-[#fafafa] border border-[#3f3f46]"
                )}
              >
                {shortcut.keys}
              </kbd>
            </div>
          ))}

          {/* Additional shortcuts */}
          <div className="pt-3 mt-3 border-t border-[#27272a]">
            <div
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg",
                "hover:bg-[#1f1f23] transition-colors"
              )}
            >
              <span className="text-sm text-[#a1a1aa]">Command palette</span>
              <kbd
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded",
                  "bg-[#27272a] text-[#fafafa] border border-[#3f3f46]"
                )}
              >
                Ctrl+K
              </kbd>
            </div>
            <div
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg",
                "hover:bg-[#1f1f23] transition-colors"
              )}
            >
              <span className="text-sm text-[#a1a1aa]">Close this panel</span>
              <kbd
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded",
                  "bg-[#27272a] text-[#fafafa] border border-[#3f3f46]"
                )}
              >
                Esc
              </kbd>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#27272a] text-xs text-[#71717a] text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-[#27272a] text-[#a1a1aa]">?</kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
}

// Hook to manage keyboard shortcuts panel
export function useKeyboardShortcutsPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    open,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
    close: () => setOpen(false),
  };
}
