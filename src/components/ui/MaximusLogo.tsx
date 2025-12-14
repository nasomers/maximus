import { cn } from "@/lib/utils";

export type LogoState = "normal" | "syncing" | "warning" | "error" | "success";

interface MaximusLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  state?: LogoState;
  showStatusDot?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const accentColorMap: Record<LogoState, string> = {
  normal: "#6366f1",   // Indigo
  syncing: "#8b5cf6",  // Purple
  warning: "#f59e0b",  // Amber
  error: "#ef4444",    // Red
  success: "#22c55e",  // Green
};

const dotColorMap: Record<LogoState, string> = {
  normal: "bg-indigo-500",
  syncing: "bg-purple-500 animate-pulse",
  warning: "bg-amber-500",
  error: "bg-red-500",
  success: "bg-green-500",
};

export function MaximusLogo({
  size = "md",
  state = "normal",
  showStatusDot = true,
  className,
}: MaximusLogoProps) {
  const accentColor = accentColorMap[state];
  const lighterAccent = state === "normal" ? "#818cf8" : accentColor;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 64 64"
        className={cn(sizeMap[size], "drop-shadow-lg")}
        style={{ filter: `drop-shadow(0 4px 6px ${accentColor}30)` }}
      >
        <defs>
          {/* Background gradient */}
          <linearGradient id={`bg-gradient-${state}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e2028" />
            <stop offset="100%" stopColor="#14161a" />
          </linearGradient>

          {/* M letter gradient */}
          <linearGradient id={`m-gradient-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lighterAccent} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
        </defs>

        {/* Rounded rectangle background */}
        <rect
          x="5"
          y="5"
          width="54"
          height="54"
          rx="14"
          ry="14"
          fill={`url(#bg-gradient-${state})`}
        />

        {/* M letter - clean geometric design */}
        <path
          d="M 16 44 L 16 20 L 24 20 L 32 32 L 40 20 L 48 20 L 48 44 L 41 44 L 41 30 L 34 40 L 30 40 L 23 30 L 23 44 Z"
          fill={`url(#m-gradient-${state})`}
        />
      </svg>

      {/* Status indicator dot */}
      {showStatusDot && (
        <div
          className={cn(
            "absolute rounded-full border-2 border-background",
            dotColorMap[state],
            size === "sm" && "-top-0.5 -right-0.5 w-2 h-2",
            size === "md" && "-top-0.5 -right-0.5 w-2.5 h-2.5",
            size === "lg" && "top-0 right-0 w-3 h-3",
            size === "xl" && "top-0.5 right-0.5 w-4 h-4"
          )}
        />
      )}
    </div>
  );
}
