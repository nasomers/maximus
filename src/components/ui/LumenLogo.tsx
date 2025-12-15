import { cn } from "@/lib/utils";

export type LogoState = "normal" | "syncing" | "warning" | "error" | "success";

interface LumenLogoProps {
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

export function LumenLogo({
  size = "md",
  state = "normal",
  showStatusDot = true,
  className,
}: LumenLogoProps) {
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

          {/* L letter gradient */}
          <linearGradient id={`l-gradient-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lighterAccent} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>

          {/* Glow effect for the lightbulb */}
          <radialGradient id={`glow-${state}`} cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
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

        {/* Subtle glow behind the L */}
        <ellipse
          cx="32"
          cy="28"
          rx="16"
          ry="12"
          fill={`url(#glow-${state})`}
        />

        {/* L letter - clean geometric design representing illumination */}
        <path
          d="M 22 18 L 22 46 L 42 46 L 42 39 L 29 39 L 29 18 Z"
          fill={`url(#l-gradient-${state})`}
        />

        {/* Light rays emanating from top of L */}
        <g fill={accentColor} opacity="0.6">
          <rect x="24" y="12" width="2" height="4" rx="1" />
          <rect x="30" y="10" width="2" height="5" rx="1" />
          <rect x="36" y="12" width="2" height="4" rx="1" />
        </g>
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
