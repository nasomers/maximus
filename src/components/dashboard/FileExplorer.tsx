import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, File, FolderOpen, RefreshCw, Eye, EyeOff } from "lucide-react";
import { listDirectory, FileEntry } from "@/lib/tauri";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TreeNodeProps {
  entry: FileEntry;
  level: number;
  showHidden: boolean;
}

function TreeNode({ entry, level, showHidden }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Don't render hidden files if showHidden is false
  if (entry.isHidden && !showHidden) {
    return null;
  }

  const handleToggle = async () => {
    if (!entry.isDir) return;

    if (!isExpanded && children.length === 0) {
      setIsLoading(true);
      try {
        const entries = await listDirectory(entry.path);
        setChildren(entries);
      } catch (error) {
        console.error("Failed to load directory:", error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const paddingLeft = level * 16 + 8;

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center gap-1.5 py-1 px-2 text-sm hover:bg-secondary/50 rounded transition-colors text-left",
          entry.isHidden && "opacity-50"
        )}
        style={{ paddingLeft }}
      >
        {entry.isDir ? (
          <>
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <File className="w-4 h-4 text-muted-foreground" />
          </>
        )}
        <span className="truncate flex-1">{entry.name}</span>
      </button>

      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              level={level + 1}
              showHidden={showHidden}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { currentProject } = useProjectStore();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const loadDirectory = async () => {
    if (!currentProject?.path) return;

    setIsLoading(true);
    try {
      const result = await listDirectory(currentProject.path);
      setEntries(result);
    } catch (error) {
      console.error("Failed to load directory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [currentProject?.path]);

  if (!currentProject) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0">
        <h3 className="font-medium text-sm">Files</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={cn(
              "p-1.5 rounded hover:bg-secondary/50 transition-colors",
              showHidden ? "text-foreground" : "text-muted-foreground"
            )}
            title={showHidden ? "Hide hidden files" : "Show hidden files"}
          >
            {showHidden ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={loadDirectory}
            className="p-1.5 rounded hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {isLoading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No files found
            </div>
          ) : (
            entries.map((entry) => (
              <TreeNode
                key={entry.path}
                entry={entry}
                level={0}
                showHidden={showHidden}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
