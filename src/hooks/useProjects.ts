import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects, getCurrentProject, initProject } from "@/lib/tauri";
import { useProjectStore } from "@/stores/projectStore";
import { useEffect } from "react";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });
}

export function useCurrentProject() {
  const { setCurrentProject } = useProjectStore();

  const query = useQuery({
    queryKey: ["currentProject"],
    queryFn: getCurrentProject,
  });

  // Sync with store
  useEffect(() => {
    if (query.data) {
      setCurrentProject(query.data);
    }
  }, [query.data, setCurrentProject]);

  return query;
}

export function useInitProject() {
  const queryClient = useQueryClient();
  const { setCurrentProject } = useProjectStore();

  return useMutation({
    mutationFn: (path: string) => initProject(path),
    onSuccess: (project) => {
      setCurrentProject(project);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["currentProject"] });
    },
  });
}
