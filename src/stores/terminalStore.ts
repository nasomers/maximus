import { create } from "zustand";

export type CommandStatus = 'idle' | 'running' | 'success' | 'error';

export interface CommandInfo {
  command: string;
  startTime: number;
  endTime?: number;
  exitCode?: number;
  duration?: number;
}

export interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
  isActive: boolean;
  status: CommandStatus;
  lastCommand?: CommandInfo;
}

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string | null;
  layout: 'single' | 'split-v' | 'split-h';
  sidebarVisible: boolean;
  sidebarWidth: number;

  // Actions
  addTab: (cwd?: string) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  renameTab: (id: string, title: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  toggleLayout: () => void;
  setLayout: (layout: 'single' | 'split-v' | 'split-h') => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;

  // Command status actions
  setCommandRunning: (tabId: string, command: string) => void;
  setCommandComplete: (tabId: string, exitCode?: number) => void;
  getTabStatus: (tabId: string) => CommandStatus;
}

let tabCounter = 0;

function generateTabId(): string {
  return `tab-${Date.now()}-${++tabCounter}`;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  layout: 'single',
  sidebarVisible: true,
  sidebarWidth: 280,

  addTab: (cwd?: string) => {
    const id = generateTabId();
    const tabNumber = get().tabs.length + 1;
    const newTab: TerminalTab = {
      id,
      title: `Terminal ${tabNumber}`,
      cwd: cwd || '',
      isActive: true,
      status: 'idle',
    };

    set((state) => ({
      tabs: [
        ...state.tabs.map((t) => ({ ...t, isActive: false })),
        newTab,
      ],
      activeTabId: id,
    }));

    return id;
  },

  closeTab: (id: string) => {
    const state = get();
    const tabIndex = state.tabs.findIndex((t) => t.id === id);

    if (tabIndex === -1) return;

    const newTabs = state.tabs.filter((t) => t.id !== id);

    // If we're closing the active tab, activate another
    let newActiveId = state.activeTabId;
    if (state.activeTabId === id && newTabs.length > 0) {
      // Try to activate the tab to the left, or the first tab
      const newIndex = Math.max(0, tabIndex - 1);
      newActiveId = newTabs[newIndex]?.id || null;
      newTabs.forEach((t, i) => {
        t.isActive = i === newIndex;
      });
    }

    set({
      tabs: newTabs,
      activeTabId: newTabs.length > 0 ? newActiveId : null,
    });
  },

  setActiveTab: (id: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) => ({
        ...t,
        isActive: t.id === id,
      })),
      activeTabId: id,
    }));
  },

  renameTab: (id: string, title: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, title } : t
      ),
    }));
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newTabs = [...state.tabs];
      const [removed] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, removed);
      return { tabs: newTabs };
    });
  },

  toggleLayout: () => {
    set((state) => {
      const layouts: Array<'single' | 'split-v' | 'split-h'> = ['single', 'split-v', 'split-h'];
      const currentIndex = layouts.indexOf(state.layout);
      const nextIndex = (currentIndex + 1) % layouts.length;
      return { layout: layouts[nextIndex] };
    });
  },

  setLayout: (layout) => {
    set({ layout });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },

  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(200, Math.min(400, width)) });
  },

  setCommandRunning: (tabId: string, command: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              status: 'running' as CommandStatus,
              lastCommand: {
                command,
                startTime: Date.now(),
              },
            }
          : t
      ),
    }));
  },

  setCommandComplete: (tabId: string, exitCode?: number) => {
    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.id !== tabId) return t;

        const endTime = Date.now();
        const duration = t.lastCommand ? endTime - t.lastCommand.startTime : 0;

        return {
          ...t,
          status: (exitCode === 0 || exitCode === undefined ? 'success' : 'error') as CommandStatus,
          lastCommand: t.lastCommand
            ? {
                ...t.lastCommand,
                endTime,
                exitCode,
                duration,
              }
            : undefined,
        };
      }),
    }));

    // Reset to idle after a delay
    setTimeout(() => {
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === tabId ? { ...t, status: 'idle' as CommandStatus } : t
        ),
      }));
    }, 3000);
  },

  getTabStatus: (tabId: string) => {
    const tab = get().tabs.find((t) => t.id === tabId);
    return tab?.status || 'idle';
  },
}));
