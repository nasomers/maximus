import { useEffect, useCallback } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { useProjectStore } from "@/stores/projectStore";
import { useCreateSnapshot, useRestoreSnapshot, useSnapshots } from "@/hooks/useSnapshots";
import { toast } from "sonner";

export function useKeyboardShortcuts() {
  const { currentProject } = useProjectStore();
  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    setActiveTab,
    toggleSidebar,
    toggleLayout,
  } = useTerminalStore();

  const createSnapshotMutation = useCreateSnapshot();
  const restoreSnapshotMutation = useRestoreSnapshot();
  const { data: snapshots = [] } = useSnapshots();

  // Quick snapshot
  const handleQuickSnapshot = useCallback(async () => {
    if (!currentProject) {
      toast.error("No project selected");
      return;
    }
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "-");
    try {
      await createSnapshotMutation.mutateAsync({ name: `snapshot-${timestamp}` });
      toast.success("Snapshot created");
    } catch (error) {
      toast.error("Failed to create snapshot");
    }
  }, [currentProject, createSnapshotMutation]);

  // Quick undo (restore last snapshot)
  const handleQuickUndo = useCallback(async () => {
    if (snapshots.length === 0) {
      toast.error("No snapshots to restore");
      return;
    }
    try {
      await restoreSnapshotMutation.mutateAsync(snapshots[0].id);
      toast.success("Snapshot restored");
    } catch (error) {
      toast.error("Failed to restore snapshot");
    }
  }, [snapshots, restoreSnapshotMutation]);

  // New tab
  const handleNewTab = useCallback(() => {
    addTab(currentProject?.path);
    toast.success("New terminal tab");
  }, [addTab, currentProject?.path]);

  // Close tab
  const handleCloseTab = useCallback(() => {
    if (activeTabId && tabs.length > 1) {
      closeTab(activeTabId);
    }
  }, [activeTabId, tabs.length, closeTab]);

  // Switch to tab by number
  const handleSwitchTab = useCallback((index: number) => {
    if (tabs[index]) {
      setActiveTab(tabs[index].id);
    }
  }, [tabs, setActiveTab]);

  // Next tab
  const handleNextTab = useCallback(() => {
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    if (tabs[nextIndex]) {
      setActiveTab(tabs[nextIndex].id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  // Previous tab
  const handlePrevTab = useCallback(() => {
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (tabs[prevIndex]) {
      setActiveTab(tabs[prevIndex].id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+B: Toggle sidebar (works everywhere)
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+T: New tab (works everywhere)
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        handleNewTab();
        return;
      }

      // Ctrl+W: Close tab (works everywhere)
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        handleCloseTab();
        return;
      }

      // Ctrl+\: Toggle split
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        toggleLayout();
        return;
      }

      // Ctrl+S: Quick snapshot
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleQuickSnapshot();
        return;
      }

      // Ctrl+Z: Quick undo (only if not in input)
      if (e.ctrlKey && e.key === 'z' && !isInput) {
        e.preventDefault();
        handleQuickUndo();
        return;
      }

      // Ctrl+Tab: Next tab
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        handleNextTab();
        return;
      }

      // Ctrl+Shift+Tab: Previous tab
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        handlePrevTab();
        return;
      }

      // Ctrl+1-9: Switch to tab
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        handleSwitchTab(index);
        return;
      }

      // F11: Toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleSidebar,
    toggleLayout,
    handleNewTab,
    handleCloseTab,
    handleQuickSnapshot,
    handleQuickUndo,
    handleNextTab,
    handlePrevTab,
    handleSwitchTab,
  ]);
}

// Export shortcut list for help display
export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+T', description: 'New terminal tab' },
  { keys: 'Ctrl+W', description: 'Close current tab' },
  { keys: 'Ctrl+Tab', description: 'Next tab' },
  { keys: 'Ctrl+Shift+Tab', description: 'Previous tab' },
  { keys: 'Ctrl+1-9', description: 'Switch to tab N' },
  { keys: 'Ctrl+\\', description: 'Toggle split pane' },
  { keys: 'Ctrl+B', description: 'Toggle sidebar' },
  { keys: 'Ctrl+S', description: 'Create snapshot' },
  { keys: 'Ctrl+Z', description: 'Restore last snapshot' },
  { keys: 'F11', description: 'Toggle fullscreen' },
];
