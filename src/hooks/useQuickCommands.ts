import { useQuery } from "@tanstack/react-query";
import { getPackageScripts, getQuickCommands } from "@/lib/tauri";
import { useProjectStore } from "@/stores/projectStore";

export function usePackageScripts() {
  const { currentProject } = useProjectStore();
  const projectPath = currentProject?.path;

  return useQuery({
    queryKey: ["package-scripts", projectPath],
    queryFn: () => (projectPath ? getPackageScripts(projectPath) : Promise.resolve([])),
    enabled: !!projectPath,
  });
}

export function useQuickCommands() {
  const { currentProject } = useProjectStore();
  const projectPath = currentProject?.path;

  return useQuery({
    queryKey: ["quick-commands", projectPath],
    queryFn: () => (projectPath ? getQuickCommands(projectPath) : Promise.resolve([])),
    enabled: !!projectPath,
  });
}
