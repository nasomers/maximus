import { useQuery } from "@tanstack/react-query";
import {
  getDailyStats,
  getWeeklyStats,
  getOverallStats,
  getProjectStats,
} from "@/lib/tauri";

export function useDailyStats(days: number = 14) {
  return useQuery({
    queryKey: ["analytics", "daily", days],
    queryFn: () => getDailyStats(days),
    staleTime: 60000, // 1 minute
  });
}

export function useWeeklyStats(weeks: number = 8) {
  return useQuery({
    queryKey: ["analytics", "weekly", weeks],
    queryFn: () => getWeeklyStats(weeks),
    staleTime: 60000,
  });
}

export function useOverallStats() {
  return useQuery({
    queryKey: ["analytics", "overall"],
    queryFn: getOverallStats,
    staleTime: 60000,
  });
}

export function useProjectStats() {
  return useQuery({
    queryKey: ["analytics", "projects"],
    queryFn: getProjectStats,
    staleTime: 60000,
  });
}
