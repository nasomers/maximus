import { useState } from "react";
import { Save, Undo2, Play, Loader2 } from "lucide-react";
import { setTrayState, flashTrayState } from "@/lib/tauri";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onSave?: () => Promise<void>;
  onUndo?: () => Promise<void>;
  onStart?: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  loading?: boolean;
  variant?: "default" | "primary";
  disabled?: boolean;
}

function ActionButton({
  icon,
  label,
  sublabel,
  onClick,
  loading,
  variant = "default",
  disabled,
}: ActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200",
        "border border-border/50 hover:border-border",
        "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
        isPrimary
          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30"
          : "bg-card hover:bg-secondary/50"
      )}
    >
      {/* Subtle gradient overlay */}
      {!isPrimary && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "p-2 rounded-lg",
          isPrimary ? "bg-white/20" : "bg-secondary"
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          icon
        )}
      </div>

      {/* Labels */}
      <div className="text-center">
        <div className="font-medium text-sm">{loading ? "Working..." : label}</div>
        {sublabel && (
          <div className={cn("text-xs mt-0.5", isPrimary ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

export function QuickActions({ onSave, onUndo, onStart }: QuickActionsProps) {
  const [saving, setSaving] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const handleSave = async () => {
    if (!onSave || saving) return;

    setSaving(true);
    try {
      await setTrayState("syncing");
      await onSave();
      await flashTrayState("success", 2000);
    } catch {
      await flashTrayState("error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!onUndo || undoing) return;

    setUndoing(true);
    try {
      await setTrayState("syncing");
      await onUndo();
      await flashTrayState("success", 2000);
    } catch {
      await flashTrayState("error", 3000);
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <ActionButton
        icon={<Save className="w-5 h-5" />}
        label="Save"
        sublabel="Create snapshot"
        onClick={handleSave}
        loading={saving}
      />
      <ActionButton
        icon={<Undo2 className="w-5 h-5" />}
        label="Undo"
        sublabel="Restore last"
        onClick={handleUndo}
        loading={undoing}
      />
      <ActionButton
        icon={<Play className="w-5 h-5" />}
        label="Start"
        sublabel="New session"
        onClick={onStart}
        variant="primary"
      />
    </div>
  );
}
