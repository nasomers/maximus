import {
  useClaudeCodeStats,
  formatTokens,
  formatModelName,
  calculateCost,
} from "@/hooks/useClaudeCode";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Calendar,
  Cpu,
  MessageSquare,
  Wrench,
  DollarSign,
  Clock,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function Analytics() {
  const { data: claudeCodeStats, isLoading, error } = useClaudeCodeStats();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-500/20">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Usage Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Real usage data from Claude Code
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error || !claudeCodeStats ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Cpu className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-1">Claude Code Stats Not Available</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure Claude Code is installed and has been used at least once.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </div>
                  <p className="text-2xl font-bold">{claudeCodeStats.totalMessages}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {claudeCodeStats.totalSessions} sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Wrench className="w-4 h-4" />
                    Tool Calls
                  </div>
                  <p className="text-2xl font-bold">
                    {claudeCodeStats.dailyActivity.reduce((sum, d) => sum + d.toolCallCount, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Edits, reads, commands
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    Est. Cost
                  </div>
                  <p className="text-2xl font-bold">
                    ${calculateCost(claudeCodeStats.modelUsage).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on token usage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    Longest Session
                  </div>
                  <p className="text-2xl font-bold">
                    {claudeCodeStats.longestSession
                      ? formatDuration(claudeCodeStats.longestSession.duration)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {claudeCodeStats.longestSession
                      ? `${claudeCodeStats.longestSession.messageCount} messages`
                      : "No sessions yet"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Token Usage by Model */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  Token Usage
                </CardTitle>
                <CardDescription>Breakdown by model and token type</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(claudeCodeStats.modelUsage).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No token usage recorded yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(claudeCodeStats.modelUsage).map(([model, usage]) => {
                      const totalTokens = usage.inputTokens + usage.outputTokens +
                        usage.cacheReadInputTokens + usage.cacheCreationInputTokens;
                      const inputPercent = totalTokens > 0 ? (usage.inputTokens / totalTokens) * 100 : 0;
                      const outputPercent = totalTokens > 0 ? (usage.outputTokens / totalTokens) * 100 : 0;
                      const cacheReadPercent = totalTokens > 0 ? (usage.cacheReadInputTokens / totalTokens) * 100 : 0;
                      const cacheWritePercent = totalTokens > 0 ? (usage.cacheCreationInputTokens / totalTokens) * 100 : 0;

                      return (
                        <div key={model} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{formatModelName(model)}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatTokens(totalTokens)} total
                            </span>
                          </div>

                          {/* Token bar */}
                          <div className="h-3 rounded-full overflow-hidden flex bg-secondary/30">
                            <div
                              className="bg-blue-500 transition-all"
                              style={{ width: `${inputPercent}%` }}
                              title={`Input: ${formatTokens(usage.inputTokens)}`}
                            />
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${outputPercent}%` }}
                              title={`Output: ${formatTokens(usage.outputTokens)}`}
                            />
                            <div
                              className="bg-purple-500 transition-all"
                              style={{ width: `${cacheReadPercent}%` }}
                              title={`Cache Read: ${formatTokens(usage.cacheReadInputTokens)}`}
                            />
                            <div
                              className="bg-amber-500 transition-all"
                              style={{ width: `${cacheWritePercent}%` }}
                              title={`Cache Write: ${formatTokens(usage.cacheCreationInputTokens)}`}
                            />
                          </div>

                          {/* Legend */}
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-muted-foreground">Input:</span>
                              <span>{formatTokens(usage.inputTokens)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-muted-foreground">Output:</span>
                              <span>{formatTokens(usage.outputTokens)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-muted-foreground">Cache Read:</span>
                              <span>{formatTokens(usage.cacheReadInputTokens)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-muted-foreground">Cache Write:</span>
                              <span>{formatTokens(usage.cacheCreationInputTokens)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Activity */}
            {claudeCodeStats.dailyActivity.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Daily Activity
                  </CardTitle>
                  <CardDescription>Messages per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[...claudeCodeStats.dailyActivity].reverse()}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#71717a" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#71717a" }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #27272a",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            messageCount: "Messages",
                            sessionCount: "Sessions",
                            toolCallCount: "Tool Calls",
                          };
                          return [value, labels[name] || name];
                        }}
                        labelFormatter={(label) => {
                          const d = new Date(label);
                          return d.toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric"
                          });
                        }}
                      />
                      <Bar
                        dataKey="messageCount"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        name="messageCount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Active Hours Heatmap */}
            {Object.keys(claudeCodeStats.hourCounts).length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Active Hours</CardTitle>
                  <CardDescription>When you're most productive</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const count = claudeCodeStats.hourCounts[hour.toString()] || 0;
                      const maxCount = Math.max(...Object.values(claudeCodeStats.hourCounts), 1);
                      const intensity = count / maxCount;
                      return (
                        <div
                          key={hour}
                          className="flex-1 h-8 rounded transition-colors cursor-help"
                          style={{
                            backgroundColor: intensity > 0
                              ? `rgba(99, 102, 241, ${0.15 + intensity * 0.85})`
                              : "rgba(39, 39, 42, 0.3)",
                          }}
                          title={`${hour}:00 - ${count} sessions`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>12am</span>
                    <span>6am</span>
                    <span>12pm</span>
                    <span>6pm</span>
                    <span>11pm</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* First Session Info */}
            {claudeCodeStats.firstSessionDate && (
              <p className="text-xs text-center text-muted-foreground mb-4">
                Using Claude Code since {new Date(claudeCodeStats.firstSessionDate).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}
