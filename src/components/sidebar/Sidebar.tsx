import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminalStore } from "@/stores/terminalStore";
import { GitWidget } from "./GitWidget";
import { SnapshotsWidget } from "./SnapshotsWidget";
import { QuickCommandsWidget } from "./QuickCommandsWidget";

export function Sidebar() {
  const { sidebarVisible, toggleSidebar, sidebarWidth } = useTerminalStore();

  return (
    <>
      {/* Collapsed Toggle */}
      {!sidebarVisible && (
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-20",
            "p-1.5 rounded-lg bg-[#1f1f23] border border-[#27272a]",
            "text-[#71717a] hover:text-white hover:bg-[#27272a]",
            "transition-all duration-200 hover-glow",
            "animate-fade-in"
          )}
          title="Show sidebar (Ctrl+B)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "h-full bg-[#111113] border-l border-[#27272a] flex flex-col overflow-hidden",
          "transition-all duration-300 ease-out",
          sidebarVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 pointer-events-none translate-x-4 w-0"
        )}
        style={{ width: sidebarVisible ? sidebarWidth : 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#27272a]">
          <span className="text-xs font-medium text-[#71717a] uppercase tracking-wider">
            Widgets
          </span>
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1 rounded text-[#71717a] hover:text-white hover:bg-[#1f1f23]",
              "transition-colors"
            )}
            title="Hide sidebar (Ctrl+B)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Widgets */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
          <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <GitWidget />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <SnapshotsWidget />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <QuickCommandsWidget />
          </div>
        </div>
      </div>
    </>
  );
}
