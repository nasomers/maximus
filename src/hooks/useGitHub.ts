import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectStore } from "@/stores/projectStore";
import {
  getGitStatus,
  gitCommit,
  gitPush,
  gitPull,
  checkGhCli,
  createPr,
  getGhAuthStatus,
  getGitRepoInfo,
  getGitConfig,
  setGitConfig,
  gitInit,
  createGithubRepo,
  GitStatus,
  GitCommitResult,
  GitPushResult,
  PrResult,
  GhAuthStatus,
  GitRepoInfo,
  GitConfig,
  CreateRepoResult,
} from "@/lib/tauri";

export function useGitStatus() {
  const { currentProject } = useProjectStore();

  return useQuery<GitStatus>({
    queryKey: ["gitStatus", currentProject?.path],
    queryFn: () => getGitStatus(currentProject!.path),
    enabled: !!currentProject?.path,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}

export function useGhCliAvailable() {
  return useQuery<boolean>({
    queryKey: ["ghCliAvailable"],
    queryFn: () => checkGhCli(),
    staleTime: 60000, // Check once per minute
  });
}

export function useGitCommit() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation<GitCommitResult, Error, string>({
    mutationFn: (message: string) => gitCommit(currentProject!.path, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitStatus"] });
    },
  });
}

export function useGitPush() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation<GitPushResult, Error>({
    mutationFn: () => gitPush(currentProject!.path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitStatus"] });
    },
  });
}

export function useGitPull() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation<GitPushResult, Error>({
    mutationFn: () => gitPull(currentProject!.path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitStatus"] });
    },
  });
}

export function useCreatePr() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation<PrResult, Error, { title: string; body: string }>({
    mutationFn: ({ title, body }) => createPr(currentProject!.path, title, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitStatus"] });
    },
  });
}

// Extended GitHub hooks

export function useGhAuthStatus() {
  return useQuery<GhAuthStatus>({
    queryKey: ["ghAuthStatus"],
    queryFn: () => getGhAuthStatus(),
    staleTime: 30000, // Check every 30 seconds
  });
}

export function useGitRepoInfo() {
  const { currentProject } = useProjectStore();

  return useQuery<GitRepoInfo>({
    queryKey: ["gitRepoInfo", currentProject?.path],
    queryFn: () => getGitRepoInfo(currentProject!.path),
    enabled: !!currentProject?.path,
    refetchInterval: 5000,
  });
}

export function useGitConfig() {
  return useQuery<GitConfig>({
    queryKey: ["gitConfig"],
    queryFn: () => getGitConfig(),
    staleTime: 60000,
  });
}

export function useSetGitConfig() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userName: string; userEmail: string }>({
    mutationFn: ({ userName, userEmail }) => setGitConfig(userName, userEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitConfig"] });
    },
  });
}

export function useGitInit() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation<void, Error, string | undefined>({
    mutationFn: (defaultBranch) => gitInit(currentProject!.path, defaultBranch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitRepoInfo"] });
      queryClient.invalidateQueries({ queryKey: ["gitStatus"] });
    },
  });
}

export function useCreateGithubRepo() {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  return useMutation<
    CreateRepoResult,
    Error,
    { name: string; description: string | null; isPrivate: boolean }
  >({
    mutationFn: ({ name, description, isPrivate }) =>
      createGithubRepo(currentProject!.path, name, description, isPrivate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitRepoInfo"] });
      queryClient.invalidateQueries({ queryKey: ["gitStatus"] });
    },
  });
}
