import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "@/stores/projectStore";

export interface SessionMemory {
  id: string;
  projectId: string;
  claudeSessionId?: string;
  sessionDate: string;
  summary: string;
  keyDecisions: string[];
  openThreads: string[];
  filesTouched: string[];
  durationMinutes?: number;
  createdAt: string;
}

export interface CreateSessionMemoryInput {
  projectId: string;
  claudeSessionId?: string;
  summary: string;
  keyDecisions?: string[];
  openThreads?: string[];
  filesTouched?: string[];
  durationMinutes?: number;
}

export interface HooksStatus {
  installed: boolean;
  hooksPath: string;
  hasStopHook: boolean;
  hasSessionStartHook: boolean;
}

export interface PendingSession {
  session_id: string;
  transcript_path: string;
  cwd: string;
  timestamp: string;
}

// Session Memory Hooks

export function useSessionMemories() {
  const { currentProject } = useProjectStore();

  return useQuery({
    queryKey: ["sessionMemories", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      return invoke<SessionMemory[]>("get_session_memories", {
        projectId: currentProject.id,
      });
    },
    enabled: !!currentProject?.id,
  });
}

export function useLatestSessionMemory() {
  const { currentProject } = useProjectStore();

  return useQuery({
    queryKey: ["latestSessionMemory", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return null;
      return invoke<SessionMemory | null>("get_latest_session_memory", {
        projectId: currentProject.id,
      });
    },
    enabled: !!currentProject?.id,
  });
}

export function useSaveSessionMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSessionMemoryInput) => {
      return invoke<SessionMemory>("save_session_memory", { input });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sessionMemories", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["latestSessionMemory", variables.projectId],
      });
    },
  });
}

export function useDeleteSessionMemory() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: async (memoryId: string) => {
      return invoke("delete_session_memory", { memoryId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessionMemories", currentProject?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["latestSessionMemory", currentProject?.id],
      });
    },
  });
}

// Hooks Management

export function useHooksStatus() {
  const { currentProject } = useProjectStore();

  return useQuery({
    queryKey: ["hooksStatus", currentProject?.path],
    queryFn: async () => {
      if (!currentProject?.path) return null;
      return invoke<HooksStatus>("get_hooks_status", {
        projectPath: currentProject.path,
      });
    },
    enabled: !!currentProject?.path,
  });
}

export function useInstallHooks() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: async () => {
      if (!currentProject?.path) throw new Error("No project selected");
      return invoke<HooksStatus>("install_hooks", {
        projectPath: currentProject.path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hooksStatus", currentProject?.path],
      });
    },
  });
}

export function useUninstallHooks() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: async () => {
      if (!currentProject?.path) throw new Error("No project selected");
      return invoke("uninstall_hooks", {
        projectPath: currentProject.path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hooksStatus", currentProject?.path],
      });
    },
  });
}

// Pending Sessions (from hooks)

export function usePendingSessions() {
  return useQuery({
    queryKey: ["pendingSessions"],
    queryFn: async () => {
      return invoke<PendingSession[]>("get_pending_sessions");
    },
    refetchInterval: 5000, // Check every 5 seconds for new pending sessions
  });
}

export function useClearPendingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return invoke("clear_pending_session", { sessionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingSessions"] });
    },
  });
}

export function useImportSessionSummary() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!currentProject?.id) throw new Error("No project selected");
      return invoke("import_session_summary", {
        sessionId,
        projectId: currentProject.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingSessions"] });
      queryClient.invalidateQueries({
        queryKey: ["sessionMemories", currentProject?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["latestSessionMemory", currentProject?.id],
      });
    },
  });
}
