import { Home, TerminalSquare, History, Brain, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
  { id: "snapshots", label: "Snapshots", icon: History },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "prompts", label: "Prompts", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

export type TabId = (typeof tabs)[number]["id"];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="relative flex items-center justify-around border-t border-border/50 bg-card/80 backdrop-blur-sm py-1.5 px-2">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200",
              "min-w-[64px]",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {/* Active indicator background */}
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-primary/10 animate-in fade-in-0 zoom-in-95 duration-200" />
            )}

            {/* Icon with glow effect when active */}
            <div className="relative">
              <Icon
                className={cn(
                  "w-5 h-5 relative z-10 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              {isActive && (
                <div className="absolute inset-0 blur-md bg-primary/40 scale-150" />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-[10px] font-medium relative z-10 transition-all duration-200",
                isActive && "font-semibold"
              )}
            >
              {label}
            </span>

            {/* Top indicator line */}
            {isActive && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
