import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSession, endSession, listSessions } from "@/lib/tauri";
import { useProjectStore } from "@/stores/projectStore";

export function useSessions() {
  const { currentProject } = useProjectStore();
  const projectId = currentProject?.id;

  return useQuery({
    queryKey: ["sessions", projectId],
    queryFn: () => (projectId ? listSessions(projectId) : Promise.resolve([])),
    enabled: !!projectId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: (task: string) => {
      if (!currentProject?.id) {
        return Promise.reject(new Error("No project selected"));
      }
      return createSession(currentProject.id, task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
