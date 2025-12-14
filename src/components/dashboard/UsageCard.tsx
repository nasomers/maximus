import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, Target, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTodayStats } from "@/lib/tauri";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
}

function StatItem({ icon, label, value, sublabel }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-secondary/50">
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
        {sublabel && (
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        )}
      </div>
    </div>
  );
}

interface RingChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function RingChart({ percentage, size = 100, strokeWidth = 8 }: RingChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on usage
  const getColor = () => {
    if (percentage >= 80) return "stroke-red-500";
    if (percentage >= 60) return "stroke-yellow-500";
    return "stroke-primary";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-all duration-700 ease-out", getColor())}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{percentage}%</span>
        <span className="text-xs text-muted-foreground">today</span>
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return String(tokens);
}

export function UsageCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["todayStats"],
    queryFn: getTodayStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate usage percentage (arbitrary daily goal of 480 minutes = 8 hours)
  const dailyGoalMinutes = 480;
  const usagePercentage = stats
    ? Math.min(100, Math.round((stats.totalMinutes / dailyGoalMinutes) * 100))
    : 0;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Left: Ring Chart */}
          <div className="flex items-center justify-center p-6 bg-gradient-to-br from-secondary/30 to-transparent">
            <RingChart percentage={usagePercentage} size={110} strokeWidth={10} />
          </div>

          {/* Right: Stats */}
          <div className="flex-1 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Today's Usage</h3>
              {stats && stats.sessionCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatItem
                icon={<Clock className="w-4 h-4 text-muted-foreground" />}
                label="Sessions"
                value={stats?.sessionCount ?? 0}
                sublabel={stats ? formatDuration(stats.totalMinutes) : undefined}
              />
              <StatItem
                icon={<Zap className="w-4 h-4 text-muted-foreground" />}
                label="Est. Tokens"
                value={stats ? `~${formatTokens(stats.estimatedTokens)}` : "0"}
              />
              <StatItem
                icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
                label="Est. Cost"
                value={stats ? `$${stats.estimatedCost.toFixed(2)}` : "$0.00"}
              />
              <StatItem
                icon={<Target className="w-4 h-4 text-muted-foreground" />}
                label="Time Left"
                value={formatDuration(Math.max(0, dailyGoalMinutes - (stats?.totalMinutes ?? 0)))}
                sublabel="of 8h goal"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
