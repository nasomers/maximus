import { useState, useMemo } from "react";
import { ChevronDown, Settings, Zap, FolderPlus, Check, Folder, Loader2, Trash2, Github, Cloud, CloudOff, HelpCircle } from "lucide-react";
import { LumenLogo } from "@/components/ui/LumenLogo";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { initProject, deleteProject } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SettingsModal, SettingsTab } from "@/components/settings/SettingsModal";
import { HelpModal } from "@/components/help/HelpModal";
import { useSettingsStore } from "@/stores/settingsStore";
import { useGhAuthStatus } from "@/hooks/useGitHub";
import { useClaudeCodeStats, formatTokens } from "@/hooks/useClaudeCode";

export function Header() {
  const { currentProject, setCurrentProject } = useProjectStore();
  const { data: projects = [] } = useProjects();
  const { data: ghAuth } = useGhAuthStatus();
  const { data: claudeStats } = useClaudeCodeStats();
  const { sync } = useSettingsStore();
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("appearance");

  const openSettings = (tab: SettingsTab = "appearance") => {
    setSettingsTab(tab);
    setShowSettings(true);
  };

  const projectName = currentProject?.name ?? "No project";

  // Get today's usage from Claude Code stats
  const todayUsage = useMemo(() => {
    if (!claudeStats?.dailyActivity) return { messages: 0, tokens: 0 };

    const today = new Date().toISOString().split("T")[0];
    const todayActivity = claudeStats.dailyActivity.find(
      (d) => d.date === today
    );

    // Get today's tokens from dailyModelTokens
    const todayTokensEntry = claudeStats.dailyModelTokens?.find(
      (d) => d.date === today
    );
    const todayTokens = todayTokensEntry
      ? Object.values(todayTokensEntry.tokensByModel).reduce((sum, t) => sum + t, 0)
      : 0;

    return {
      messages: todayActivity?.messageCount || 0,
      tokens: todayTokens,
    };
  }, [claudeStats]);

  // Usage indicator (messages as rough activity level)
  const activityLevel = Math.min(100, (todayUsage.messages / 50) * 100);

  const getUsageColor = () => {
    if (activityLevel >= 80) return "bg-red-500";
    if (activityLevel >= 50) return "bg-yellow-500";
    return "bg-primary";
  };

  const handleInitProject = async () => {
    try {
      setIsInitializing(true);

      // Open folder dialog
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Project Folder",
      });

      if (selected) {
        // Initialize the project
        const project = await initProject(selected as string);
        setCurrentProject(project);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["currentProject"] });
      }
    } catch (error) {
      console.error("Failed to initialize project:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSelectProject = (project: typeof currentProject) => {
    if (project) {
      setCurrentProject(project);
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  };

  const handleRemoveProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent selecting the project
    try {
      await deleteProject(projectId);
      // If we removed the current project, clear it
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ["projects"] });
    } catch (error) {
      console.error("Failed to remove project:", error);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-b from-card to-background">
        {/* Left: Branding + Project Selector */}
        <div className="flex items-center gap-4">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <LumenLogo size="md" state="normal" />
            <span className="font-semibold text-lg hidden sm:block">Lumen</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Project Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 hover:bg-secondary/50 px-3 py-1.5 rounded-lg transition-all hover:shadow-sm group"
                disabled={isInitializing}
              >
                {isInitializing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
                <span className="font-medium text-sm">
                  {isInitializing ? "Initializing..." : projectName}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Projects</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {projects.length > 0 ? (
                <>
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      className="flex items-center gap-2 group"
                    >
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {project.path}
                        </div>
                      </div>
                      {currentProject?.id === project.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                      <button
                        onClick={(e) => handleRemoveProject(e, project.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                        title="Remove project"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              ) : (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No projects yet
                </div>
              )}

              <DropdownMenuItem onClick={handleInitProject} className="text-primary">
                <FolderPlus className="w-4 h-4 mr-2" />
                Initialize New Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Usage + Settings */}
        <div className="flex items-center gap-4">
          {/* Usage indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
              <div className="flex items-center gap-3 bg-secondary/30 px-3 py-1.5 rounded-lg cursor-default">
                <Zap className={cn("w-4 h-4", activityLevel >= 80 ? "text-red-500" : activityLevel >= 50 ? "text-yellow-500" : "text-primary")} />
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-500 rounded-full", getUsageColor())}
                      style={{ width: `${activityLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {todayUsage.messages > 0 ? formatTokens(todayUsage.tokens) : "0"}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
              <TooltipContent>
                Today: {todayUsage.messages} messages, {formatTokens(todayUsage.tokens)} tokens
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* GitHub & Sync Status */}
          <TooltipProvider>
            <div className="flex items-center gap-1">
              {/* GitHub Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => openSettings("sync")}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                      ghAuth?.authenticated
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-yellow-500 hover:bg-yellow-500/10"
                    )}
                  >
                    <Github className="w-4 h-4" />
                    {ghAuth?.authenticated && (
                      <span className="text-xs font-medium hidden sm:inline">
                        {ghAuth.username}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {ghAuth?.authenticated
                    ? `GitHub: ${ghAuth.username}`
                    : "GitHub: Not authenticated - click to configure"}
                </TooltipContent>
              </Tooltip>

              {/* Sync Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => openSettings("sync")}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors",
                      sync.enabled && sync.repoUrl
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    {sync.enabled && sync.repoUrl ? (
                      <Cloud className="w-4 h-4" />
                    ) : (
                      <CloudOff className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium hidden sm:inline">
                      {sync.enabled && sync.repoUrl ? "Synced" : "Sync"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {sync.enabled && sync.repoUrl
                    ? `Memory synced to ${sync.repoUrl}`
                    : "Memory sync not configured - click to set up"}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Help */}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover-glow"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => openSettings("appearance")}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:rotate-45"
            title="Settings"
          >
            <Settings className="w-5 h-5 transition-transform duration-300" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        initialTab={settingsTab}
      />

      {/* Help Modal */}
      <HelpModal open={showHelp} onOpenChange={setShowHelp} />
    </>
  );
}
