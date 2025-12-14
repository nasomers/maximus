import { invoke } from "@tauri-apps/api/core";

// Types
export interface Snapshot {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  filesChanged: number;
  snapshotType: "auto" | "manual";
}

export interface Project {
  id: string;
  name: string;
  path: string;
  lastOpenedAt?: string;
  createdAt?: string;
}

export interface Session {
  id: string;
  projectId: string;
  taskDescription: string;
  startedAt: string;
  endedAt?: string;
  filesModified: string[];
  tokensEstimate?: number;
  retryCount: number;
  efficiencyScore?: number;
  logPath: string;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// Snapshot commands
export async function createSnapshot(
  projectId: string,
  name: string,
  description?: string
): Promise<Snapshot> {
  return invoke("create_snapshot", { projectId, name, description });
}

export async function listSnapshots(projectId: string): Promise<Snapshot[]> {
  return invoke("list_snapshots", { projectId });
}

export async function restoreSnapshot(
  projectId: string,
  snapshotId: string
): Promise<void> {
  return invoke("restore_snapshot", { projectId, snapshotId });
}

// Snapshot diff types
export interface FileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
}

export interface SnapshotDiff {
  files: FileChange[];
  totalAdditions: number;
  totalDeletions: number;
}

export async function getSnapshotDiff(
  projectId: string,
  snapshotId: string
): Promise<SnapshotDiff> {
  return invoke("get_snapshot_diff", { projectId, snapshotId });
}

export async function getFileAtSnapshot(
  projectId: string,
  snapshotId: string,
  filePath: string
): Promise<string | null> {
  return invoke("get_file_at_snapshot", { projectId, snapshotId, filePath });
}

export async function compareSnapshots(
  projectId: string,
  fromId: string,
  toId: string
): Promise<SnapshotDiff> {
  return invoke("compare_snapshots", { projectId, fromId, toId });
}

// Memory commands
export async function getMemory(projectPath: string): Promise<MemoryItem[]> {
  return invoke("get_memory", { projectPath });
}

export async function setMemory(
  projectPath: string,
  key: string,
  value: string,
  category?: string
): Promise<MemoryItem> {
  return invoke("set_memory", { projectPath, key, value, category });
}

export async function deleteMemory(
  projectPath: string,
  key: string
): Promise<void> {
  return invoke("delete_memory", { projectPath, key });
}

// Project commands
export async function listProjects(): Promise<Project[]> {
  return invoke("list_projects");
}

export async function getCurrentProject(): Promise<Project | null> {
  return invoke("get_current_project");
}

export async function initProject(path: string): Promise<Project> {
  return invoke("init_project", { path });
}

export async function deleteProject(projectId: string): Promise<void> {
  return invoke("delete_project", { projectId });
}

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  isHidden: boolean;
}

export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke("list_directory", { path });
}

export interface ScaffoldProjectParams {
  name: string;
  location: string;
  template: string;
  techStack: string[];
  description: string;
  designPrompt: string;
}

export async function scaffoldProject(params: ScaffoldProjectParams): Promise<Project> {
  return invoke("scaffold_project", {
    name: params.name,
    location: params.location,
    template: params.template,
    tech_stack: params.techStack,
    description: params.description,
    design_prompt: params.designPrompt,
  });
}

// Session commands
export async function createSession(
  projectId: string,
  task: string
): Promise<Session> {
  return invoke("create_session", { projectId, task });
}

export async function endSession(sessionId: string): Promise<Session> {
  return invoke("end_session", { sessionId });
}

export async function listSessions(projectId: string): Promise<Session[]> {
  return invoke("list_sessions", { projectId });
}

export interface TodayStats {
  sessionCount: number;
  totalMinutes: number;
  estimatedTokens: number;
  estimatedCost: number;
}

export async function getTodayStats(): Promise<TodayStats> {
  return invoke("get_today_stats");
}

// Tray state types
export type TrayState = "normal" | "syncing" | "warning" | "error" | "success";

// Tray commands
export async function setTrayState(state: TrayState): Promise<void> {
  return invoke("set_tray_state", { state });
}

export async function flashTrayState(
  state: "success" | "error" | "warning",
  durationMs?: number
): Promise<void> {
  return invoke("flash_tray_state", { state, durationMs });
}

export async function updateTrayUsage(): Promise<void> {
  return invoke("update_tray_usage");
}

// PTY commands
export async function ptySpawn(
  id: string,
  cols: number,
  rows: number,
  cwd?: string
): Promise<void> {
  return invoke("pty_spawn", { id, cols, rows, cwd });
}

export async function ptyWrite(id: string, data: string): Promise<void> {
  return invoke("pty_write", { id, data });
}

export async function ptyResize(
  id: string,
  cols: number,
  rows: number
): Promise<void> {
  return invoke("pty_resize", { id, cols, rows });
}

export async function ptyKill(id: string): Promise<void> {
  return invoke("pty_kill", { id });
}

// Prompt types
export interface Prompt {
  id: string;
  name: string;
  content: string;
  tags: string[];
  variables: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

// Prompt commands
export async function listPrompts(): Promise<Prompt[]> {
  return invoke("list_prompts");
}

export async function createPrompt(
  name: string,
  content: string,
  tags: string[],
  variables: string[]
): Promise<Prompt> {
  return invoke("create_prompt", { name, content, tags, variables });
}

export async function updatePrompt(
  id: string,
  name: string,
  content: string,
  tags: string[],
  variables: string[]
): Promise<Prompt> {
  return invoke("update_prompt", { id, name, content, tags, variables });
}

export async function getPrompt(id: string): Promise<Prompt> {
  return invoke("get_prompt", { id });
}

export async function deletePrompt(id: string): Promise<void> {
  return invoke("delete_prompt", { id });
}

export async function usePrompt(id: string): Promise<Prompt> {
  return invoke("use_prompt", { id });
}

// Analytics types
export interface DailyStats {
  date: string;
  sessionCount: number;
  totalMinutes: number;
  tokensEstimate: number;
  filesModified: number;
}

export interface WeeklyStats {
  weekStart: string;
  sessionCount: number;
  totalMinutes: number;
  tokensEstimate: number;
  avgSessionLength: number;
}

export interface OverallStats {
  totalSessions: number;
  totalMinutes: number;
  totalTokens: number;
  avgSessionLength: number;
  mostProductiveDay: string | null;
  longestSessionMinutes: number;
  totalFilesModified: number;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  sessionCount: number;
  totalMinutes: number;
  tokensEstimate: number;
}

// Analytics commands
export async function getDailyStats(days: number): Promise<DailyStats[]> {
  return invoke("get_daily_stats", { days });
}

export async function getWeeklyStats(weeks: number): Promise<WeeklyStats[]> {
  return invoke("get_weekly_stats", { weeks });
}

export async function getOverallStats(): Promise<OverallStats> {
  return invoke("get_overall_stats");
}

export async function getProjectStats(): Promise<ProjectStats[]> {
  return invoke("get_project_stats");
}

// Claude Code integration types
export interface ClaudeCodeDailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

export interface ClaudeCodeDailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>;
}

export interface ClaudeCodeModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUsd: number;
}

export interface ClaudeCodeLongestSession {
  sessionId: string;
  duration: number;
  messageCount: number;
  timestamp: string;
}

export interface ClaudeCodeStats {
  version: number;
  lastComputedDate: string;
  dailyActivity: ClaudeCodeDailyActivity[];
  dailyModelTokens: ClaudeCodeDailyModelTokens[];
  modelUsage: Record<string, ClaudeCodeModelUsage>;
  totalSessions: number;
  totalMessages: number;
  longestSession: ClaudeCodeLongestSession | null;
  firstSessionDate: string | null;
  hourCounts: Record<string, number>;
}

export interface ClaudeCodeSession {
  id: string;
  summary: string;
  projectPath: string;
  filePath: string;
  fileSize: number;
  modified: string;
}

// Claude Code commands
export async function getClaudeCodeStats(): Promise<ClaudeCodeStats> {
  return invoke("get_claude_code_stats");
}

export async function getClaudeCodeSessions(projectPath: string): Promise<ClaudeCodeSession[]> {
  return invoke("get_claude_code_sessions", { projectPath });
}

export async function getClaudeCodeProjects(): Promise<string[]> {
  return invoke("get_claude_code_projects");
}

// Quick Commands types
export interface PackageScript {
  name: string;
  command: string;
}

export interface QuickCommand {
  id: string;
  name: string;
  command: string;
  category: string;
  description?: string;
}

// Quick Commands
export async function getPackageScripts(projectPath: string): Promise<PackageScript[]> {
  return invoke("get_package_scripts", { projectPath });
}

export async function getQuickCommands(projectPath: string): Promise<QuickCommand[]> {
  return invoke("get_quick_commands", { projectPath });
}

// GitHub types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  hasRemote: boolean;
}

export interface GitCommitResult {
  success: boolean;
  message: string;
  sha?: string;
}

export interface GitPushResult {
  success: boolean;
  message: string;
}

export interface PrResult {
  success: boolean;
  message: string;
  url?: string;
}

// GitHub commands
export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  return invoke("get_git_status", { projectPath });
}

export async function gitStageAll(projectPath: string): Promise<void> {
  return invoke("git_stage_all", { projectPath });
}

export async function gitCommit(projectPath: string, message: string): Promise<GitCommitResult> {
  return invoke("git_commit", { projectPath, message });
}

export async function gitPush(projectPath: string): Promise<GitPushResult> {
  return invoke("git_push", { projectPath });
}

export async function gitPull(projectPath: string): Promise<GitPushResult> {
  return invoke("git_pull", { projectPath });
}

export async function checkGhCli(): Promise<boolean> {
  return invoke("check_gh_cli");
}

export async function createPr(projectPath: string, title: string, body: string): Promise<PrResult> {
  return invoke("create_pr", { projectPath, title, body });
}

// Extended GitHub types
export interface GhAuthStatus {
  installed: boolean;
  authenticated: boolean;
  username?: string;
  scopes: string[];
}

export interface GitRepoInfo {
  isRepo: boolean;
  hasRemote: boolean;
  remoteUrl?: string;
  branch: string;
}

export interface GitConfig {
  userName?: string;
  userEmail?: string;
}

export interface CreateRepoResult {
  success: boolean;
  url?: string;
  message: string;
}

// Extended GitHub commands
export async function getGhAuthStatus(): Promise<GhAuthStatus> {
  return invoke("get_gh_auth_status");
}

export async function getGitRepoInfo(projectPath: string): Promise<GitRepoInfo> {
  return invoke("get_git_repo_info", { projectPath });
}

export async function getGitConfig(): Promise<GitConfig> {
  return invoke("get_git_config");
}

export async function setGitConfig(userName: string, userEmail: string): Promise<void> {
  return invoke("set_git_config", { userName, userEmail });
}

export async function gitInit(projectPath: string, defaultBranch?: string): Promise<void> {
  return invoke("git_init", { projectPath, defaultBranch });
}

export async function createGithubRepo(
  projectPath: string,
  name: string,
  description: string | null,
  isPrivate: boolean
): Promise<CreateRepoResult> {
  return invoke("create_github_repo", { projectPath, name, description, isPrivate });
}

export async function gitAddRemote(projectPath: string, url: string): Promise<void> {
  return invoke("git_add_remote", { projectPath, url });
}
