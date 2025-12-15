import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  Save,
  Undo2,
  GitBranch,
  FileText,
  Keyboard,
  PanelLeft,
  SplitSquareHorizontal,
  Plus,
  X,
  Maximize,
  HelpCircle,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTerminalStore } from "@/stores/terminalStore";
import { useProjectStore } from "@/stores/projectStore";
import { useCreateSnapshot, useRestoreSnapshot, useSnapshots } from "@/hooks/useSnapshots";
import { toast } from "sonner";

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  group: "terminal" | "snapshots" | "navigation" | "settings";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { currentProject } = useProjectStore();
  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    toggleSidebar,
    toggleLayout,
    sidebarVisible,
  } = useTerminalStore();

  const createSnapshotMutation = useCreateSnapshot();
  const restoreSnapshotMutation = useRestoreSnapshot();
  const { data: snapshots = [] } = useSnapshots();

  // Open command palette with Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runCommand = useCallback((action: () => void) => {
    setOpen(false);
    // Small delay to let the dialog close smoothly
    setTimeout(action, 100);
  }, []);

  const handleQuickSnapshot = useCallback(async () => {
    if (!currentProject) {
      toast.error("No project selected");
      return;
    }
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "-");
    try {
      await createSnapshotMutation.mutateAsync({ name: `snapshot-${timestamp}` });
      toast.success("Snapshot created");
    } catch {
      toast.error("Failed to create snapshot");
    }
  }, [currentProject, createSnapshotMutation]);

  const handleQuickUndo = useCallback(async () => {
    if (snapshots.length === 0) {
      toast.error("No snapshots to restore");
      return;
    }
    try {
      await restoreSnapshotMutation.mutateAsync(snapshots[0].id);
      toast.success("Snapshot restored");
    } catch {
      toast.error("Failed to restore snapshot");
    }
  }, [snapshots, restoreSnapshotMutation]);

  const commands: Command[] = [
    // Terminal commands
    {
      id: "new-tab",
      label: "New Terminal Tab",
      icon: <Plus className="w-4 h-4" />,
      shortcut: "Ctrl+T",
      action: () => addTab(currentProject?.path),
      group: "terminal",
    },
    {
      id: "close-tab",
      label: "Close Current Tab",
      icon: <X className="w-4 h-4" />,
      shortcut: "Ctrl+W",
      action: () => activeTabId && tabs.length > 1 && closeTab(activeTabId),
      group: "terminal",
    },
    {
      id: "toggle-split",
      label: "Toggle Split View",
      icon: <SplitSquareHorizontal className="w-4 h-4" />,
      shortcut: "Ctrl+\\",
      action: toggleLayout,
      group: "terminal",
    },
    {
      id: "toggle-sidebar",
      label: sidebarVisible ? "Hide Sidebar" : "Show Sidebar",
      icon: <PanelLeft className="w-4 h-4" />,
      shortcut: "Ctrl+B",
      action: toggleSidebar,
      group: "terminal",
    },
    {
      id: "fullscreen",
      label: "Toggle Fullscreen",
      icon: <Maximize className="w-4 h-4" />,
      shortcut: "F11",
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      },
      group: "terminal",
    },

    // Snapshot commands
    {
      id: "create-snapshot",
      label: "Create Snapshot",
      icon: <Save className="w-4 h-4" />,
      shortcut: "Ctrl+S",
      action: handleQuickSnapshot,
      group: "snapshots",
    },
    {
      id: "restore-snapshot",
      label: "Restore Last Snapshot",
      icon: <Undo2 className="w-4 h-4" />,
      shortcut: "Ctrl+Z",
      action: handleQuickUndo,
      group: "snapshots",
    },

    // Navigation commands
    {
      id: "git-status",
      label: "Run git status",
      icon: <GitBranch className="w-4 h-4" />,
      action: () => {
        // This would need to be wired to actually run the command
        toast.info("Use the Quick Commands widget for git status");
      },
      group: "navigation",
    },
    {
      id: "edit-claude-md",
      label: "Edit CLAUDE.md",
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        toast.info("CLAUDE.md editor coming soon");
      },
      group: "navigation",
    },

    // Settings commands
    {
      id: "keyboard-shortcuts",
      label: "Keyboard Shortcuts",
      icon: <Keyboard className="w-4 h-4" />,
      shortcut: "?",
      action: () => {
        toast.info("Keyboard shortcuts help coming soon");
      },
      group: "settings",
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        // Would need to trigger settings modal
        toast.info("Press the settings icon in the header");
      },
      group: "settings",
    },
    {
      id: "help",
      label: "Help",
      icon: <HelpCircle className="w-4 h-4" />,
      action: () => {
        toast.info("Press the help icon in the header");
      },
      group: "settings",
    },
  ];

  const terminalCommands = commands.filter((c) => c.group === "terminal");
  const snapshotCommands = commands.filter((c) => c.group === "snapshots");
  const navigationCommands = commands.filter((c) => c.group === "navigation");
  const settingsCommands = commands.filter((c) => c.group === "settings");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Terminal">
          {terminalCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => runCommand(cmd.action)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {cmd.icon}
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">
                  {cmd.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Snapshots">
          {snapshotCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => runCommand(cmd.action)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {cmd.icon}
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">
                  {cmd.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => runCommand(cmd.action)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {cmd.icon}
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">
                  {cmd.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {settingsCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => runCommand(cmd.action)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {cmd.icon}
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">
                  {cmd.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
