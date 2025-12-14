import { useQuery } from "@tanstack/react-query";
import {
  getClaudeCodeStats,
  getClaudeCodeSessions,
  getClaudeCodeProjects,
  ClaudeCodeStats,
  ClaudeCodeSession,
} from "@/lib/tauri";

export function useClaudeCodeStats() {
  return useQuery<ClaudeCodeStats, Error>({
    queryKey: ["claudeCodeStats"],
    queryFn: getClaudeCodeStats,
    staleTime: 30000, // Refresh every 30 seconds
    retry: false, // Don't retry if Claude Code isn't installed
  });
}

export function useClaudeCodeSessions(projectPath: string | null) {
  return useQuery<ClaudeCodeSession[], Error>({
    queryKey: ["claudeCodeSessions", projectPath],
    queryFn: () => getClaudeCodeSessions(projectPath!),
    enabled: !!projectPath,
    staleTime: 30000,
  });
}

export function useClaudeCodeProjects() {
  return useQuery<string[], Error>({
    queryKey: ["claudeCodeProjects"],
    queryFn: getClaudeCodeProjects,
    staleTime: 60000, // Refresh every minute
  });
}

// Helper to format token counts
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

// Helper to format model names
export function formatModelName(model: string): string {
  if (model.includes("opus")) return "Opus 4.5";
  if (model.includes("sonnet")) return "Sonnet 4";
  if (model.includes("haiku")) return "Haiku";
  return model;
}

// Calculate estimated cost from model usage
export function calculateCost(modelUsage: Record<string, { inputTokens: number; outputTokens: number; cacheReadInputTokens: number; cacheCreationInputTokens: number }>): number {
  let totalCost = 0;

  for (const [model, usage] of Object.entries(modelUsage)) {
    // Pricing per 1M tokens (approximate)
    let inputPrice = 3; // Default
    let outputPrice = 15;
    let cacheReadPrice = 0.30; // Cache read is much cheaper
    let cacheWritePrice = 3.75; // Cache write has a premium

    if (model.includes("opus")) {
      inputPrice = 15;
      outputPrice = 75;
      cacheReadPrice = 1.50;
      cacheWritePrice = 18.75;
    } else if (model.includes("sonnet")) {
      inputPrice = 3;
      outputPrice = 15;
      cacheReadPrice = 0.30;
      cacheWritePrice = 3.75;
    } else if (model.includes("haiku")) {
      inputPrice = 0.25;
      outputPrice = 1.25;
      cacheReadPrice = 0.025;
      cacheWritePrice = 0.30;
    }

    totalCost += (usage.inputTokens / 1000000) * inputPrice;
    totalCost += (usage.outputTokens / 1000000) * outputPrice;
    totalCost += (usage.cacheReadInputTokens / 1000000) * cacheReadPrice;
    totalCost += (usage.cacheCreationInputTokens / 1000000) * cacheWritePrice;
  }

  return totalCost;
}
