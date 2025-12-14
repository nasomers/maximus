import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  getSnapshotDiff,
  getFileAtSnapshot,
  compareSnapshots,
} from "@/lib/tauri";
import { useProjectStore } from "@/stores/projectStore";

export function useSnapshots() {
  const { currentProject } = useProjectStore();
  const projectId = currentProject?.id;

  return useQuery({
    queryKey: ["snapshots", projectId],
    queryFn: () => (projectId ? listSnapshots(projectId) : Promise.resolve([])),
    enabled: !!projectId,
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) => {
      if (!currentProject?.id) {
        return Promise.reject(new Error("No project selected"));
      }
      return createSnapshot(currentProject.id, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
    },
  });
}

export function useRestoreSnapshot() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: (snapshotId: string) => {
      if (!currentProject?.id) {
        return Promise.reject(new Error("No project selected"));
      }
      return restoreSnapshot(currentProject.id, snapshotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
    },
  });
}

export function useSnapshotDiff(snapshotId: string | null) {
  const { currentProject } = useProjectStore();
  const projectId = currentProject?.id;

  return useQuery({
    queryKey: ["snapshot-diff", projectId, snapshotId],
    queryFn: () =>
      projectId && snapshotId
        ? getSnapshotDiff(projectId, snapshotId)
        : Promise.resolve(null),
    enabled: !!projectId && !!snapshotId,
  });
}

export function useFileAtSnapshot(snapshotId: string | null, filePath: string | null) {
  const { currentProject } = useProjectStore();
  const projectId = currentProject?.id;

  return useQuery({
    queryKey: ["file-at-snapshot", projectId, snapshotId, filePath],
    queryFn: () =>
      projectId && snapshotId && filePath
        ? getFileAtSnapshot(projectId, snapshotId, filePath)
        : Promise.resolve(null),
    enabled: !!projectId && !!snapshotId && !!filePath,
  });
}

export function useCompareSnapshots(fromId: string | null, toId: string | null) {
  const { currentProject } = useProjectStore();
  const projectId = currentProject?.id;

  return useQuery({
    queryKey: ["compare-snapshots", projectId, fromId, toId],
    queryFn: () =>
      projectId && fromId && toId
        ? compareSnapshots(projectId, fromId, toId)
        : Promise.resolve(null),
    enabled: !!projectId && !!fromId && !!toId,
  });
}
