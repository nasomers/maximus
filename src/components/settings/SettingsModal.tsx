import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Palette,
  Cloud,
  Terminal,
  Camera,
  Sun,
  Moon,
  Monitor,
  Check,
  ExternalLink,
  RefreshCw,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore, Theme } from "@/stores/settingsStore";
import { useGhAuthStatus } from "@/hooks/useGitHub";

export type SettingsTab = "appearance" | "terminal" | "snapshots" | "sync";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: SettingsTab;
}

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "snapshots", label: "Snapshots", icon: Camera },
  { id: "sync", label: "Cloud Sync", icon: Cloud },
];

export function SettingsModal({ open, onOpenChange, initialTab = "appearance" }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Update active tab when initialTab changes (e.g., opening from sync icon)
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[500px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(100%-60px)]">
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-2 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeTab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "terminal" && <TerminalSettings />}
            {activeTab === "snapshots" && <SnapshotSettings />}
            {activeTab === "sync" && <SyncSettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useSettingsStore();

  const themes: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                theme === id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm">{label}</span>
              {theme === id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Interface</h3>
        <div className="space-y-3">
          <ToggleSetting
            label="Show 'Welcome Back' on dashboard"
            description="Display last session summary when opening a project"
            checked={useSettingsStore.getState().showWelcomeBack}
            onChange={(checked) => useSettingsStore.getState().setShowWelcomeBack(checked)}
          />
        </div>
      </div>
    </div>
  );
}

function TerminalSettings() {
  const { terminalFontSize, setTerminalFontSize } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Font Size</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="10"
            max="20"
            value={terminalFontSize}
            onChange={(e) => setTerminalFontSize(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm w-12 text-center">{terminalFontSize}px</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Adjust the font size in the integrated terminal
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1">Shell</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Maximus uses your system's default shell
        </p>
        <div className="bg-secondary/30 px-3 py-2 rounded-lg text-sm font-mono">
          {navigator.platform.includes("Win") ? "PowerShell / cmd.exe" : "$SHELL (bash/zsh)"}
        </div>
      </div>
    </div>
  );
}

function SnapshotSettings() {
  const { autoSnapshotOnRiskyCommand, setAutoSnapshotOnRiskyCommand } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Auto-Snapshot</h3>
        <div className="space-y-3">
          <ToggleSetting
            label="Snapshot before risky commands"
            description="Automatically create a snapshot before rm, git reset, etc."
            checked={autoSnapshotOnRiskyCommand}
            onChange={setAutoSnapshotOnRiskyCommand}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1">Storage</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Snapshots are stored in each project's .maximus/snapshots directory
        </p>
        <div className="bg-secondary/30 px-3 py-2 rounded-lg text-sm font-mono">
          project/.maximus/snapshots/.git
        </div>
      </div>
    </div>
  );
}

function SyncSettings() {
  const { sync } = useSettingsStore();
  const { data: ghAuth } = useGhAuthStatus();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">GitHub Authentication</h3>
        {ghAuth?.authenticated ? (
          <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-2 rounded-lg">
            <Check className="w-4 h-4" />
            <span className="text-sm">Authenticated as {ghAuth.username}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-yellow-500 bg-yellow-500/10 px-3 py-2 rounded-lg text-sm">
              GitHub CLI not authenticated
            </div>
            <p className="text-xs text-muted-foreground">
              Run <code className="bg-secondary px-1 rounded">gh auth login</code> in your terminal
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Sync Repository</h3>
        {sync.repoUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-2 rounded-lg">
              <Github className="w-4 h-4" />
              <span className="text-sm font-mono flex-1 truncate">{sync.repoUrl}</span>
              <a
                href={`https://${sync.repoUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              {sync.lastSynced
                ? `Last synced: ${new Date(sync.lastSynced).toLocaleString()}`
                : "Never synced"}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary/20 rounded-lg">
            <Cloud className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              Sync not configured
            </p>
            <p className="text-xs text-muted-foreground">
              Set up cloud sync to access your prompts and memories across machines
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1">What gets synced?</h3>
        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
          <li>- Prompt library</li>
          <li>- Session memories (summaries only)</li>
          <li>- App settings</li>
          <li className="text-green-500">- Sensitive data is scrubbed before sync</li>
        </ul>
      </div>
    </div>
  );
}

// Helper components

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="pt-0.5">
        <div
          className={cn(
            "w-9 h-5 rounded-full transition-colors relative",
            checked ? "bg-primary" : "bg-secondary"
          )}
          onClick={() => onChange(!checked)}
        >
          <div
            className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
              checked ? "left-4" : "left-0.5"
            )}
          />
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium group-hover:text-foreground transition-colors">
          {label}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </label>
  );
}

