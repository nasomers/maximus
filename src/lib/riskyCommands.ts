// Patterns that indicate risky operations
export interface RiskyPattern {
  pattern: RegExp;
  severity: "warning" | "danger";
  reason: string;
  suggestion: string;
}

export const RISKY_PATTERNS: RiskyPattern[] = [
  // Destructive file operations
  {
    pattern: /rm\s+(-[rf]+\s+)*[^\s]+/i,
    severity: "danger",
    reason: "Deleting files",
    suggestion: "Create a snapshot before deleting files",
  },
  {
    pattern: /rmdir/i,
    severity: "warning",
    reason: "Removing directories",
    suggestion: "Consider saving your work first",
  },

  // Git destructive operations
  {
    pattern: /git\s+reset\s+--hard/i,
    severity: "danger",
    reason: "Hard reset will discard changes",
    suggestion: "Save a snapshot to preserve current state",
  },
  {
    pattern: /git\s+checkout\s+--?\s*\./i,
    severity: "danger",
    reason: "Discarding all local changes",
    suggestion: "Create a snapshot first",
  },
  {
    pattern: /git\s+clean\s+-[fd]+/i,
    severity: "danger",
    reason: "Removing untracked files",
    suggestion: "Snapshot before cleaning",
  },
  {
    pattern: /git\s+stash\s+drop/i,
    severity: "warning",
    reason: "Dropping stashed changes",
    suggestion: "Make sure you don't need those changes",
  },
  {
    pattern: /git\s+push\s+.*--force/i,
    severity: "danger",
    reason: "Force pushing can overwrite remote history",
    suggestion: "Double-check before force pushing",
  },
  {
    pattern: /git\s+rebase/i,
    severity: "warning",
    reason: "Rebasing rewrites history",
    suggestion: "Save state before rebasing",
  },

  // Database operations
  {
    pattern: /drop\s+(table|database)/i,
    severity: "danger",
    reason: "Dropping database objects",
    suggestion: "Backup before dropping",
  },
  {
    pattern: /truncate\s+table/i,
    severity: "danger",
    reason: "Truncating table data",
    suggestion: "Consider backing up first",
  },

  // npm/package destructive
  {
    pattern: /npm\s+uninstall/i,
    severity: "warning",
    reason: "Removing packages",
    suggestion: "Snapshot before removing dependencies",
  },
  {
    pattern: /npm\s+prune/i,
    severity: "warning",
    reason: "Pruning dependencies",
    suggestion: "Save state before pruning",
  },

  // Cargo destructive
  {
    pattern: /cargo\s+clean/i,
    severity: "warning",
    reason: "Cleaning build artifacts",
    suggestion: "This is usually safe, but snapshot if unsure",
  },

  // Docker destructive
  {
    pattern: /docker\s+(rm|rmi|system\s+prune)/i,
    severity: "warning",
    reason: "Removing Docker resources",
    suggestion: "Make sure you don't need these",
  },

  // Claude-specific risky prompts
  {
    pattern: /refactor\s+(the\s+)?(entire|whole|all)/i,
    severity: "warning",
    reason: "Large refactoring operation",
    suggestion: "Snapshot before major refactors",
  },
  {
    pattern: /rewrite\s+(the\s+)?(entire|whole|all)/i,
    severity: "warning",
    reason: "Rewriting code",
    suggestion: "Save current state first",
  },
  {
    pattern: /delete\s+(all|everything|the\s+entire)/i,
    severity: "danger",
    reason: "Bulk deletion requested",
    suggestion: "Create a snapshot immediately",
  },
  {
    pattern: /start\s+(over|fresh|from\s+scratch)/i,
    severity: "danger",
    reason: "Starting over",
    suggestion: "Definitely save your current work",
  },
];

export interface RiskyDetection {
  pattern: RiskyPattern;
  match: string;
}

export function detectRiskyCommand(input: string): RiskyDetection | null {
  for (const pattern of RISKY_PATTERNS) {
    const match = input.match(pattern.pattern);
    if (match) {
      return {
        pattern,
        match: match[0],
      };
    }
  }
  return null;
}

export function detectAllRiskyCommands(input: string): RiskyDetection[] {
  const detections: RiskyDetection[] = [];
  for (const pattern of RISKY_PATTERNS) {
    const match = input.match(pattern.pattern);
    if (match) {
      detections.push({
        pattern,
        match: match[0],
      });
    }
  }
  return detections;
}
