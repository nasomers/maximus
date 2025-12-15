import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Play,
  History,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useClaudeCodeSessions } from "@/hooks/useClaudeCode";
import { formatRelativeTime } from "@/lib/utils";

interface WelcomeBackProps {
  onStartSession: () => void;
  onViewHistory: () => void;
}

export function WelcomeBack({ onStartSession, onViewHistory }: WelcomeBackProps) {
  const { currentProject } = useProjectStore();
  const { data: claudeSessions = [] } = useClaudeCodeSessions(currentProject?.path || null);

  // Get the most recent session from Claude Code
  const lastSession = useMemo(() => {
    if (claudeSessions.length === 0) return null;

    // Sort by modified date (most recent first)
    const sorted = [...claudeSessions].sort((a, b) =>
      new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    return sorted[0];
  }, [claudeSessions]);

  // Get time since last session
  const timeSinceLastSession = useMemo(() => {
    if (!lastSession) return null;
    return formatRelativeTime(new Date(lastSession.modified));
  }, [lastSession]);

  // If no sessions, show getting started prompt
  if (!lastSession) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">Ready to start?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No recent Claude Code sessions found for this project. Start a new session to get going.
              </p>
              <Button onClick={onStartSession} className="gap-2">
                <Play className="w-4 h-4" />
                Start Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Truncate summary if too long
  const summaryPreview = lastSession.summary.length > 150
    ? lastSession.summary.slice(0, 150) + "..."
    : lastSession.summary;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 overflow-hidden">
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">Welcome back!</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeSinceLastSession}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              <span className="font-medium text-foreground">Last session:</span> {summaryPreview}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={onStartSession} size="sm" className="gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Continue Working
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewHistory}
                className="gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Session History
              </Button>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 hidden sm:block" />
        </div>
      </CardContent>
    </Card>
  );
}
