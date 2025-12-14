import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileCode, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useSessions } from "@/hooks/useSessions";
import { useAppStore } from "@/stores/appStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { Session } from "@/lib/tauri";

function getEfficiencyConfig(efficiency: number | null | undefined) {
  if (efficiency == null) {
    return {
      color: "text-muted-foreground",
      bg: "bg-secondary/50",
      border: "border-border/50",
      label: "In progress",
    };
  }
  if (efficiency >= 80) {
    return {
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      label: "Excellent",
    };
  }
  if (efficiency >= 60) {
    return {
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      label: "Good",
    };
  }
  return {
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Needs work",
  };
}

function calculateDuration(startedAt: string, endedAt?: string): string | null {
  if (!endedAt) return null;

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const diff = end - start;

  if (diff < 0) return null;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

interface SessionItemProps {
  session: Session;
  isFirst?: boolean;
  onClick?: () => void;
}

function SessionItem({ session, isFirst, onClick }: SessionItemProps) {
  const effConfig = getEfficiencyConfig(session.efficiencyScore);
  const duration = calculateDuration(session.startedAt, session.endedAt);
  const isActive = !session.endedAt;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "bg-secondary/20 hover:bg-secondary/40",
        "border border-transparent hover:border-border/50",
        "cursor-pointer",
        isActive && "ring-1 ring-primary/30"
      )}
    >
      {/* Left: Efficiency indicator */}
      <div
        className={cn(
          "flex flex-col items-center justify-center w-14 h-14 rounded-lg border",
          effConfig.bg,
          effConfig.border
        )}
      >
        {session.efficiencyScore != null ? (
          <>
            <span className={cn("text-lg font-bold", effConfig.color)}>
              {session.efficiencyScore}
            </span>
            <span className="text-[10px] text-muted-foreground">score</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground mt-1">active</span>
          </>
        )}
      </div>

      {/* Center: Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{session.taskDescription}</h4>
          {isFirst && !isActive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              <Sparkles className="w-3 h-3" />
              Latest
            </span>
          )}
          {isActive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeTime(new Date(session.startedAt))}
          </span>
          {duration && (
            <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">
              {duration}
            </span>
          )}
        </div>
      </div>

      {/* Right: Files + Arrow */}
      <div className="flex items-center gap-3">
        {session.filesModified.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileCode className="w-4 h-4" />
            <span>{session.filesModified.length}</span>
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export function RecentSessions() {
  const { data: sessions = [], isLoading } = useSessions();
  const { setActiveTab, setPendingTerminalCommand } = useAppStore();
  const { setActiveSession, setSessionStartTime } = useSessionStore();

  const handleSessionClick = (session: Session) => {
    // If it's an active session, resume it in terminal
    if (!session.endedAt) {
      setActiveSession(session);
      setSessionStartTime(new Date(session.startedAt).getTime());
      setPendingTerminalCommand("claude");
      setActiveTab("terminal");
    } else {
      // For completed sessions, show details or restart similar task
      // For now, switch to analytics to see session history
      setActiveTab("analytics");
    }
  };

  const handleViewAll = () => {
    setActiveTab("analytics");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No sessions yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start your first session to track your progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
          <button
            onClick={handleViewAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.slice(0, 5).map((session, index) => (
          <SessionItem
            key={session.id}
            session={session}
            isFirst={index === 0}
            onClick={() => handleSessionClick(session)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
