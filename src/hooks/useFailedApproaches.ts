import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "@/stores/projectStore";

export interface FailedApproach {
  id: string;
  description: string;
  reason?: string;
  createdAt: string;
}

export function useFailedApproaches() {
  const { currentProject } = useProjectStore();

  return useQuery({
    queryKey: ["failedApproaches", currentProject?.path],
    queryFn: async () => {
      if (!currentProject?.path) return [];
      return invoke<FailedApproach[]>("get_failed_approaches", {
        projectPath: currentProject.path,
      });
    },
    enabled: !!currentProject?.path,
  });
}

export function useAddFailedApproach() {
  const { currentProject } = useProjectStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      description,
      reason,
    }: {
      description: string;
      reason?: string;
    }) => {
      if (!currentProject?.path) throw new Error("No project selected");
      return invoke<FailedApproach>("add_failed_approach", {
        projectPath: currentProject.path,
        description,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["failedApproaches", currentProject?.path],
      });
    },
  });
}

export function useRemoveFailedApproach() {
  const { currentProject } = useProjectStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (approachId: string) => {
      if (!currentProject?.path) throw new Error("No project selected");
      return invoke("remove_failed_approach", {
        projectPath: currentProject.path,
        approachId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["failedApproaches", currentProject?.path],
      });
    },
  });
}

export function useClearFailedApproaches() {
  const { currentProject } = useProjectStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!currentProject?.path) throw new Error("No project selected");
      return invoke("clear_failed_approaches", {
        projectPath: currentProject.path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["failedApproaches", currentProject?.path],
      });
    },
  });
}
