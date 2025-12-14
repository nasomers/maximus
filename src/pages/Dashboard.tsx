import { useState } from "react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentSessions } from "@/components/dashboard/RecentSessions";
import { FileExplorer } from "@/components/dashboard/FileExplorer";
import { NewProjectWizard, ProjectConfig } from "@/components/project/NewProjectWizard";
import { useCurrentProject } from "@/hooks/useProjects";
import { useProjectStore } from "@/stores/projectStore";
import { useAppStore } from "@/stores/appStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSnapshots, useCreateSnapshot, useRestoreSnapshot } from "@/hooks/useSnapshots";
import { useCreateSession } from "@/hooks/useSessions";
import { scaffoldProject } from "@/lib/tauri";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Play, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Dashboard() {
  const { isLoading } = useCurrentProject();
  const { currentProject, setCurrentProject } = useProjectStore();
  const { setActiveTab, setPendingTerminalCommand } = useAppStore();
  const { setActiveSession, setSessionStartTime, clearModifiedFiles } = useSessionStore();
  const { data: snapshots = [] } = useSnapshots();
  const createSnapshotMutation = useCreateSnapshot();
  const restoreMutation = useRestoreSnapshot();
  const createSessionMutation = useCreateSession();

  const queryClient = useQueryClient();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [showNewProjectWizard, setShowNewProjectWizard] = useState(false);

  // Show loading state while fetching current project
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading project...</span>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!snapshotName.trim()) return;

    await createSnapshotMutation.mutateAsync({
      name: snapshotName.trim(),
    });

    setShowSaveDialog(false);
    setSnapshotName("");
  };

  const handleUndo = async () => {
    // Restore the most recent snapshot
    if (snapshots.length > 0) {
      await restoreMutation.mutateAsync(snapshots[0].id);
    }
  };

  const handleStart = () => {
    setShowSessionDialog(true);
  };

  const handleStartSession = async () => {
    if (!taskDescription.trim()) return;

    try {
      const session = await createSessionMutation.mutateAsync(taskDescription.trim());
      setShowSessionDialog(false);
      setTaskDescription("");

      // Set up session tracking
      setActiveSession(session);
      setSessionStartTime(Date.now());
      clearModifiedFiles();

      // Switch to terminal and launch claude
      setPendingTerminalCommand("claude");
      setActiveTab("terminal");
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleNewProjectComplete = async (config: ProjectConfig) => {
    try {
      // Create the project
      const project = await scaffoldProject({
        name: config.name,
        location: config.location,
        template: config.template,
        techStack: config.techStack,
        description: config.description,
        designPrompt: config.designPrompt,
      });

      // Set as current project
      setCurrentProject(project);

      // Refresh queries
      await queryClient.refetchQueries({ queryKey: ["projects"] });

      // If there's a design prompt, switch to terminal and start claude with context
      if (config.designPrompt) {
        const designCommand = `claude "Let's design this project together. Here's my initial brief:\\n\\n${config.designPrompt.replace(/"/g, '\\"').replace(/\n/g, "\\n")}\\n\\nPlease help me refine the requirements, suggest architecture, and update the CLAUDE.md with our decisions."`;
        setPendingTerminalCommand(designCommand);
        setActiveTab("terminal");
      } else {
        // Just switch to terminal with claude ready
        setPendingTerminalCommand("claude");
        setActiveTab("terminal");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return (
    <div className="h-full">
      {/* Two-column layout */}
      <div className="flex gap-4 h-full">
        {/* Left Column: Project info, usage, actions */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* New Project Button */}
          <button
            onClick={() => setShowNewProjectWizard(true)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-medium">New Project</div>
              <div className="text-xs text-muted-foreground">Design and create with Claude</div>
            </div>
          </button>

          <ProjectCard />

          {currentProject && (
            <>
              <UsageCard />
              <QuickActions
                onSave={handleSave}
                onUndo={snapshots.length > 0 ? handleUndo : undefined}
                onStart={handleStart}
              />
              <RecentSessions />
            </>
          )}
        </div>

        {/* Right Column: File Explorer */}
        {currentProject && (
          <div className="w-80 flex-shrink-0 h-full">
            <FileExplorer />
          </div>
        )}
      </div>

      {/* New Project Wizard */}
      <NewProjectWizard
        open={showNewProjectWizard}
        onOpenChange={setShowNewProjectWizard}
        onComplete={handleNewProjectComplete}
      />

      {/* Quick Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Save</DialogTitle>
            <DialogDescription>
              Create a snapshot of your current project state.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Snapshot name (e.g., before-refactor)"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && snapshotName.trim()) {
                  handleConfirmSave();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={!snapshotName.trim() || createSnapshotMutation.isPending}
            >
              {createSnapshotMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Snapshot"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Session Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Session</DialogTitle>
            <DialogDescription>
              Describe what you're working on. This helps track your progress and efficiency.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="What are you working on? (e.g., add user authentication)"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && taskDescription.trim()) {
                  handleStartSession();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartSession}
              disabled={!taskDescription.trim() || createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
