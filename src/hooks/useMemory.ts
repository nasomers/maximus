import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMemory, setMemory, deleteMemory, MemoryItem } from "@/lib/tauri";
import { useProjectStore } from "@/stores/projectStore";

export function useMemory() {
  const { currentProject } = useProjectStore();
  const projectPath = currentProject?.path;

  return useQuery({
    queryKey: ["memory", projectPath],
    queryFn: () => (projectPath ? getMemory(projectPath) : Promise.resolve([])),
    enabled: !!projectPath,
  });
}

export function useSetMemory() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: ({
      key,
      value,
      category,
    }: {
      key: string;
      value: string;
      category?: string;
    }): Promise<MemoryItem> => {
      if (!currentProject?.path) {
        return Promise.reject(new Error("No project selected"));
      }
      return setMemory(currentProject.path, key, value, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: (key: string) => {
      if (!currentProject?.path) {
        return Promise.reject(new Error("No project selected"));
      }
      return deleteMemory(currentProject.path, key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });
}
