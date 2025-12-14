import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, GitBranch, Database, Clock, Plus, Loader2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { formatRelativeTime } from "@/lib/utils";
import { initProject } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useSnapshots } from "@/hooks/useSnapshots";
import { useSessions } from "@/hooks/useSessions";

interface StatBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatBadge({ icon, value, label }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 text-sm">
      {icon}
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function ProjectCard() {
  const { currentProject, setCurrentProject } = useProjectStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const queryClient = useQueryClient();
  const { data: snapshots = [] } = useSnapshots();
  const { data: sessions = [] } = useSessions();

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

  if (!currentProject) {
    return (
      <Card className="border-dashed border-2 border-border/50 bg-transparent">
        <CardContent className="p-6">
          <button
            onClick={handleInitProject}
            disabled={isInitializing}
            className="w-full flex flex-col items-center justify-center gap-3 py-4 text-muted-foreground hover:text-foreground transition-colors group disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
              {isInitializing ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Plus className="w-7 h-7" />
              )}
            </div>
            <div className="text-center">
              <h2 className="font-semibold text-foreground">
                {isInitializing ? "Initializing..." : "Initialize Project"}
              </h2>
              <p className="text-sm mt-1">
                {isInitializing
                  ? "Setting up Maximus for your project"
                  : "Select a folder to get started"}
              </p>
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Project icon */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>

            {/* Project info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg truncate">{currentProject.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                  Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {currentProject.path}
              </p>
              {currentProject.lastOpenedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last session {formatRelativeTime(new Date(currentProject.lastOpenedAt))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <StatBadge
              icon={<GitBranch className="w-3.5 h-3.5 text-muted-foreground" />}
              value={snapshots.length}
              label="snapshots"
            />
            <StatBadge
              icon={<Database className="w-3.5 h-3.5 text-muted-foreground" />}
              value={0}
              label="memories"
            />
            <StatBadge
              icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />}
              value={sessions.length}
              label="sessions"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
