import { useState } from "react";
import { ChevronDown, Settings, Zap, FolderPlus, Check, Folder, Loader2, Trash2 } from "lucide-react";
import { MaximusLogo } from "@/components/ui/MaximusLogo";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Header() {
  const { currentProject, setCurrentProject } = useProjectStore();
  const { data: projects = [] } = useProjects();
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const projectName = currentProject?.name ?? "No project";
  const usage = 42; // TODO: Connect to real usage data

  // Usage color based on percentage
  const getUsageColor = () => {
    if (usage >= 80) return "bg-red-500";
    if (usage >= 60) return "bg-yellow-500";
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
            <MaximusLogo size="md" state="normal" />
            <span className="font-semibold text-lg hidden sm:block">Maximus</span>
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
          <div className="flex items-center gap-3 bg-secondary/30 px-3 py-1.5 rounded-lg">
            <Zap className={cn("w-4 h-4", usage >= 80 ? "text-red-500" : usage >= 60 ? "text-yellow-500" : "text-primary")} />
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-500 rounded-full", getUsageColor())}
                  style={{ width: `${usage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground w-8">{usage}%</span>
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure Maximus preferences and options.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Settings panel coming soon.</p>
            <p className="text-xs mt-1">Configure themes, shortcuts, and more.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
