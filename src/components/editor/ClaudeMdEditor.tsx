import { useState, useEffect } from "react";
import { X, Save, Loader2, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

interface ClaudeMdEditorProps {
  open: boolean;
  onClose: () => void;
  projectPath: string | null;
}

export function ClaudeMdEditor({ open, onClose, projectPath }: ClaudeMdEditorProps) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = content !== originalContent;

  // Load CLAUDE.md content
  useEffect(() => {
    if (open && projectPath) {
      setIsLoading(true);
      setError(null);
      invoke<string | null>("read_claude_md", { projectPath })
        .then((result) => {
          const text = result ?? "";
          setContent(text);
          setOriginalContent(text);
        })
        .catch((err) => {
          setError(String(err));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, projectPath]);

  // Close on Escape (with unsaved changes warning)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        if (hasChanges) {
          if (confirm("You have unsaved changes. Close anyway?")) {
            onClose();
          }
        } else {
          onClose();
        }
      }
      // Ctrl+S to save
      if (e.ctrlKey && e.key === "s" && open) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasChanges, onClose]);

  const handleSave = async () => {
    if (!projectPath || !hasChanges) return;

    setIsSaving(true);
    try {
      await invoke("write_claude_md", { projectPath, content });
      setOriginalContent(content);
      toast.success("CLAUDE.md saved");
    } catch (err) {
      toast.error("Failed to save CLAUDE.md");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/60 backdrop-blur-sm animate-fade-in"
      )}
      onClick={() => {
        if (hasChanges) {
          if (confirm("You have unsaved changes. Close anyway?")) {
            onClose();
          }
        } else {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "bg-[#0a0a0b] border border-[#27272a] rounded-xl shadow-2xl",
          "w-[800px] max-w-[90vw] h-[80vh] flex flex-col animate-scale-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#3b82f6]" />
            <h2 className="font-semibold">CLAUDE.md</h2>
            {hasChanges && (
              <span className="text-xs text-[#eab308] px-1.5 py-0.5 bg-[#eab308]/10 rounded">
                Unsaved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                hasChanges
                  ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                  : "bg-[#27272a] text-[#71717a] cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#ef4444]">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Project Name\n\nDescribe your project here..."
              className={cn(
                "w-full h-full resize-none rounded-lg p-4",
                "bg-[#111113] border border-[#27272a]",
                "text-[#fafafa] font-mono text-sm",
                "focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30",
                "placeholder:text-[#52525b]"
              )}
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#27272a] text-xs text-[#71717a]">
          <span>
            {projectPath ? `${projectPath}/CLAUDE.md` : "No project selected"}
          </span>
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-[#27272a] text-[#a1a1aa]">Ctrl+S</kbd> to save
          </span>
        </div>
      </div>
    </div>
  );
}
