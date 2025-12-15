import { useState, useRef, useEffect } from "react";
import { Plus, X, Terminal as TerminalIcon, SplitSquareHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminalStore, TerminalTab } from "@/stores/terminalStore";
import { useProjectStore } from "@/stores/projectStore";

interface TerminalTabsProps {
  onTabChange?: (tabId: string) => void;
}

export function TerminalTabs({ onTabChange }: TerminalTabsProps) {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab, renameTab, toggleLayout, layout } = useTerminalStore();
  const { currentProject } = useProjectStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const handleAddTab = () => {
    const newTabId = addTab(currentProject?.path);
    onTabChange?.(newTabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const handleDoubleClick = (tab: TerminalTab) => {
    setEditingTabId(tab.id);
    setEditValue(tab.title);
  };

  const handleRenameSubmit = () => {
    if (editingTabId && editValue.trim()) {
      renameTab(editingTabId, editValue.trim());
    }
    setEditingTabId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setEditingTabId(null);
    }
  };

  return (
    <div className="flex items-center h-10 bg-[#111113] border-b border-[#27272a] px-2 gap-1">
      {/* Tabs */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab)}
            className={cn(
              "group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all duration-150",
              "hover:bg-[#1f1f23]",
              tab.id === activeTabId
                ? "bg-[#1f1f23] text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                : "text-[#a1a1aa] hover:text-white"
            )}
          >
            <TerminalIcon className="w-3.5 h-3.5 shrink-0" />

            {editingTabId === tab.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                className="bg-transparent border-none outline-none text-sm w-24 text-white"
              />
            ) : (
              <span className="truncate max-w-[100px]">{tab.title}</span>
            )}

            {/* Close button - only show if more than one tab */}
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={cn(
                  "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-[#ef4444]/20 hover:text-[#ef4444]"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Active indicator */}
            {tab.id === activeTabId && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#3b82f6] rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Add Tab */}
        <button
          onClick={handleAddTab}
          className={cn(
            "p-1.5 rounded-lg transition-all duration-150",
            "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
          )}
          title="New tab (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Split Toggle */}
        <button
          onClick={toggleLayout}
          className={cn(
            "p-1.5 rounded-lg transition-all duration-150",
            layout !== 'single'
              ? "text-[#3b82f6] bg-[#3b82f6]/10"
              : "text-[#71717a] hover:text-white hover:bg-[#1f1f23]"
          )}
          title="Toggle split (Ctrl+\)"
        >
          <SplitSquareHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
