import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "./Terminal";
import { TerminalTabs } from "./TerminalTabs";
import { useTerminalStore } from "@/stores/terminalStore";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

export function TerminalContainer() {
  const { tabs, activeTabId, addTab, layout } = useTerminalStore();
  const { currentProject } = useProjectStore();
  const initializedRef = useRef(false);

  // Initialize with one tab if none exist
  useEffect(() => {
    if (!initializedRef.current && tabs.length === 0 && currentProject?.path) {
      addTab(currentProject.path);
      initializedRef.current = true;
    }
  }, [tabs.length, currentProject?.path, addTab]);

  // Reset when project changes
  useEffect(() => {
    initializedRef.current = false;
  }, [currentProject?.id]);

  const handleTabChange = useCallback((_tabId: string) => {
    // Could trigger focus or other side effects here
  }, []);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0b]">
        <div className="text-center">
          <p className="text-[#71717a] text-lg">No project selected</p>
          <p className="text-[#52525b] text-sm mt-2">Select a project to start working</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0b] overflow-hidden">
      {/* Tab Bar */}
      <TerminalTabs onTabChange={handleTabChange} />

      {/* Terminal Area */}
      <div className="flex-1 relative overflow-hidden">
        {layout === 'single' && (
          <div className="absolute inset-0">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-150",
                  tab.id === activeTabId ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}
              >
                <Terminal id={tab.id} />
              </div>
            ))}
          </div>
        )}

        {layout === 'split-v' && tabs.length >= 2 && (
          <div className="absolute inset-0 flex">
            <div className="flex-1 border-r border-[#27272a]">
              <Terminal id={tabs[0]?.id || ''} />
            </div>
            <div className="flex-1">
              <Terminal id={tabs[1]?.id || ''} />
            </div>
          </div>
        )}

        {layout === 'split-h' && tabs.length >= 2 && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 border-b border-[#27272a]">
              <Terminal id={tabs[0]?.id || ''} />
            </div>
            <div className="flex-1">
              <Terminal id={tabs[1]?.id || ''} />
            </div>
          </div>
        )}

        {/* Fallback for split with only one tab */}
        {layout !== 'single' && tabs.length < 2 && tabs.length > 0 && (
          <div className="absolute inset-0">
            <Terminal id={tabs[0]?.id || ''} />
          </div>
        )}

        {/* Empty state */}
        {tabs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => addTab(currentProject?.path)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-[#3b82f6] text-white",
                "hover:bg-[#2563eb] transition-colors"
              )}
            >
              Open Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
