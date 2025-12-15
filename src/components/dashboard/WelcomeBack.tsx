import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Play,
  History,
  Brain,
  Loader2,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useClaudeCodeSessions } from "@/hooks/useClaudeCode";
import { useLatestSessionMemory, useHooksStatus, useInstallHooks } from "@/hooks/useSessionMemory";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface WelcomeBackProps {
  onStartSession: () => void;
  onViewHistory: () => void;
}

export function WelcomeBack({ onStartSession, onViewHistory }: WelcomeBackProps) {
  const { currentProject } = useProjectStore();
  const { data: claudeSessions = [] } = useClaudeCodeSessions(currentProject?.path || null);
  const { data: latestMemory } = useLatestSessionMemory();
  const { data: hooksStatus } = useHooksStatus();
  const installHooksMutation = useInstallHooks();
  const [showOpenThreads, setShowOpenThreads] = useState(false);

  // Get the most recent session from Claude Code
  const lastClaudeSession = useMemo(() => {
    if (claudeSessions.length === 0) return null;

    // Sort by modified date (most recent first)
    const sorted = [...claudeSessions].sort((a, b) =>
      new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    return sorted[0];
  }, [claudeSessions]);

  // Determine what to show: AI memory or Claude session data
  const hasAIMemory = !!latestMemory;
  const hasClaudeSession = !!lastClaudeSession;

  // Get time since last activity
  const timeSinceLastActivity = useMemo(() => {
    if (latestMemory) {
      return formatRelativeTime(new Date(latestMemory.createdAt));
    }
    if (lastClaudeSession) {
      return formatRelativeTime(new Date(lastClaudeSession.modified));
    }
    return null;
  }, [latestMemory, lastClaudeSession]);

  const handleInstallHooks = async () => {
    try {
      await installHooksMutation.mutateAsync();
      toast.success("Hooks installed", {
        description: "Session memory hooks are now active for this project",
      });
    } catch (error) {
      toast.error("Failed to install hooks", {
        description: String(error),
      });
    }
  };

  // No sessions at all - show getting started
  if (!hasAIMemory && !hasClaudeSession) {
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
              <div className="flex items-center gap-2">
                <Button onClick={onStartSession} className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Session
                </Button>
                {!hooksStatus?.installed && (
                  <Button
                    variant="outline"
                    onClick={handleInstallHooks}
                    disabled={installHooksMutation.isPending}
                    className="gap-2"
                  >
                    {installHooksMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                    Enable Session Memory
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show AI-generated memory if available
  if (hasAIMemory && latestMemory) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-primary/5 border-green-500/20 overflow-hidden">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">Welcome back!</h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeSinceLastActivity}
                </span>
                <span className="text-xs bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  AI Summary
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {latestMemory.summary}
              </p>

              {/* Open Threads */}
              {latestMemory.openThreads.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowOpenThreads(!showOpenThreads)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ListTodo className="w-3 h-3" />
                    {latestMemory.openThreads.length} open thread{latestMemory.openThreads.length > 1 ? 's' : ''}
                  </button>
                  {showOpenThreads && (
                    <ul className="mt-2 text-xs text-muted-foreground space-y-1 pl-4">
                      {latestMemory.openThreads.map((thread, i) => (
                        <li key={i} className="list-disc">{thread}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

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

  // Fall back to Claude Code session data
  const summaryPreview = lastClaudeSession!.summary.length > 150
    ? lastClaudeSession!.summary.slice(0, 150) + "..."
    : lastClaudeSession!.summary;

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
                {timeSinceLastActivity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              <span className="font-medium text-foreground">Last session:</span> {summaryPreview}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
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
              {!hooksStatus?.installed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleInstallHooks}
                  disabled={installHooksMutation.isPending}
                  className="gap-1.5 text-muted-foreground"
                >
                  {installHooksMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Brain className="w-3.5 h-3.5" />
                  )}
                  Enable AI Summaries
                </Button>
              )}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 hidden sm:block" />
        </div>
      </CardContent>
    </Card>
  );
}
