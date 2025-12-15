import { useState, useEffect } from "react";
import {
  FileEdit,
  Clock,
  History,
  ChevronDown,
  ChevronRight,
  File,
  AlertTriangle,
  Brain,
  MessageSquare,
  Copy,
  Check,
  Lightbulb,
  Terminal,
  Play,
  Zap,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/sessionStore";
import { useSnapshots, useRestoreSnapshot } from "@/hooks/useSnapshots";
import { useMemory } from "@/hooks/useMemory";
import { usePrompts } from "@/hooks/usePrompts";
import { usePackageScripts, useQuickCommands } from "@/hooks/useQuickCommands";
import { useSemanticBlocks } from "@/hooks/useSemanticBlocks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ptyWrite } from "@/lib/tauri";
import { GitPanel } from "./GitPanel";
import { SemanticBlockList, PinnedQuestions } from "./SemanticBlock";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  badgeVariant?: "default" | "warning" | "success";
  helpText?: string;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  badgeVariant = "default",
  helpText,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium flex-1 text-left">{title}</span>
        {badge !== undefined && (
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              badgeVariant === "warning" && "bg-yellow-500/20 text-yellow-500",
              badgeVariant === "success" && "bg-green-500/20 text-green-500",
              badgeVariant === "default" && "bg-secondary text-muted-foreground"
            )}
          >
            {badge}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3">
          {helpText && (
            <p className="text-xs text-muted-foreground/70 mb-2 italic">
              {helpText}
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// Copyable item component
function CopyableItem({
  label,
  content,
  sublabel,
}: {
  label: string;
  content: string;
  sublabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-secondary/30 hover:bg-secondary/50 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{label}</div>
        {sublabel && (
          <div className="text-muted-foreground truncate">{sublabel}</div>
        )}
      </div>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
      )}
    </button>
  );
}

export function TerminalSidePanel({ terminalId }: { terminalId?: string }) {
  const { activeSession, sessionStartTime, modifiedFiles, riskyCommandDetected } = useSessionStore();
  const { data: snapshots = [] } = useSnapshots();
  const { data: memories = [] } = useMemory();
  const { data: prompts = [] } = usePrompts();
  const { data: scripts = [] } = usePackageScripts();
  const { data: quickCommands = [] } = useQuickCommands();
  const restoreMutation = useRestoreSnapshot();

  // Semantic blocks for Claude output parsing
  const {
    blocks: semanticBlocks,
    toggleCollapsed,
    togglePinned,
    clearBlocks,
    collapseAll,
    expandAll,
    questionBlocks,
  } = useSemanticBlocks(terminalId || "");

  // Session timer
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!sessionStartTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - sessionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleRestoreSnapshot = async (id: string) => {
    await restoreMutation.mutateAsync(id);
  };

  const handleRunCommand = async (command: string) => {
    if (terminalId) {
      // Send command to terminal + Enter
      await ptyWrite(terminalId, command + "\n");
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {/* Git Status */}
        <GitPanel />

        {/* Pinned Questions - Always visible when present */}
        {questionBlocks.length > 0 && (
          <div className="px-3 py-2">
            <PinnedQuestions questions={questionBlocks} />
          </div>
        )}

        {/* Claude Output Blocks */}
        {terminalId && semanticBlocks.length > 0 && (
          <CollapsibleSection
            title="Claude Output"
            icon={<Layers className="w-4 h-4" />}
            badge={semanticBlocks.length}
            defaultOpen={true}
            helpText="Parsed output from Claude - collapsible for easier reading"
          >
            <SemanticBlockList
              blocks={semanticBlocks}
              onToggleCollapsed={toggleCollapsed}
              onTogglePinned={togglePinned}
              onCollapseAll={collapseAll}
              onExpandAll={expandAll}
              onClear={clearBlocks}
            />
          </CollapsibleSection>
        )}

        {/* Quick Tips */}
        <CollapsibleSection
          title="Quick Tips"
          icon={<Lightbulb className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span><strong>Prompts:</strong> Click to copy, then paste into Claude</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span><strong>Memory:</strong> Context for Claude to reference</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span><strong>Snapshots:</strong> Restore to undo changes</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span><strong>Tip:</strong> Create a snapshot before big changes!</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Quick Commands - npm scripts */}
        {(scripts.length > 0 || quickCommands.length > 0) && (
          <CollapsibleSection
            title="Quick Commands"
            icon={<Zap className="w-4 h-4" />}
            badge={scripts.length + quickCommands.length}
            helpText={terminalId ? "Click to run in terminal" : "Open terminal to run commands"}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {/* npm scripts */}
              {scripts.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    npm scripts
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {scripts.slice(0, 8).map((script) => (
                      <button
                        key={script.name}
                        onClick={() => handleRunCommand(`npm run ${script.name}`)}
                        disabled={!terminalId}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left transition-colors",
                          terminalId
                            ? "bg-secondary/30 hover:bg-secondary/50"
                            : "bg-secondary/20 text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <Play className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="truncate font-medium">{script.name}</span>
                      </button>
                    ))}
                  </div>
                  {scripts.length > 8 && (
                    <p className="text-[10px] text-muted-foreground text-center mt-1">
                      +{scripts.length - 8} more
                    </p>
                  )}
                </div>
              )}

              {/* Quick commands */}
              {quickCommands.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 mt-2">
                    Utilities
                  </div>
                  <div className="space-y-1">
                    {quickCommands.slice(0, 6).map((cmd) => (
                      <button
                        key={cmd.id}
                        onClick={() => handleRunCommand(cmd.command)}
                        disabled={!terminalId}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors",
                          terminalId
                            ? "bg-secondary/30 hover:bg-secondary/50"
                            : "bg-secondary/20 text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <Terminal className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{cmd.name}</span>
                          <span className="text-muted-foreground ml-1 text-[10px]">
                            ({cmd.category})
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Prompts - Most useful for terminal */}
        <CollapsibleSection
          title="Prompts"
          icon={<MessageSquare className="w-4 h-4" />}
          badge={prompts.length || undefined}
          helpText="Click to copy, then paste into Claude Code"
        >
          {prompts.length > 0 ? (
            <div className="space-y-1">
              {prompts.slice(0, 6).map((prompt) => (
                <CopyableItem
                  key={prompt.id}
                  label={prompt.name}
                  content={prompt.content}
                  sublabel={prompt.tags.slice(0, 2).join(", ") || undefined}
                />
              ))}
              {prompts.length > 6 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{prompts.length - 6} more in Prompts tab
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <p>No prompts saved yet.</p>
              <p className="mt-1 text-muted-foreground/70">
                Create reusable prompts in the Prompts tab to quickly copy them here.
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Memory */}
        <CollapsibleSection
          title="Memory"
          icon={<Brain className="w-4 h-4" />}
          badge={memories.length || undefined}
          helpText="Project context - copy into CLAUDE.md or paste to Claude"
        >
          {memories.length > 0 ? (
            <div className="space-y-1">
              {memories.slice(0, 5).map((item) => (
                <CopyableItem
                  key={item.id}
                  label={item.key}
                  content={`## ${item.key}\n${item.value}`}
                  sublabel={item.category || undefined}
                />
              ))}
              {memories.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{memories.length - 5} more in Memory tab
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <p>No memory items yet.</p>
              <p className="mt-1 text-muted-foreground/70">
                Store architecture decisions, conventions, and context in the Memory tab.
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Snapshots */}
        <CollapsibleSection
          title="Snapshots"
          icon={<History className="w-4 h-4" />}
          badge={snapshots.length || undefined}
          helpText="Click Restore to revert your project"
        >
          {snapshots.length > 0 ? (
            <div className="space-y-1">
              {snapshots.slice(0, 5).map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-secondary/30 group"
                >
                  <History className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{snapshot.name}</div>
                    <div className="text-muted-foreground">
                      {new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 opacity-0 group-hover:opacity-100 text-xs"
                    onClick={() => handleRestoreSnapshot(snapshot.id)}
                    disabled={restoreMutation.isPending}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <p>No snapshots yet.</p>
              <p className="mt-1 text-muted-foreground/70">
                Save your project state before making big changes.
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Session Status */}
        <CollapsibleSection
          title="Session"
          icon={<Clock className="w-4 h-4" />}
          badge={activeSession ? "Active" : "Idle"}
          badgeVariant={activeSession ? "success" : "default"}
          defaultOpen={!!activeSession}
        >
          {activeSession ? (
            <div className="space-y-3">
              {/* Task */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Task</div>
                <div className="text-sm">{activeSession.taskDescription}</div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-sm font-mono font-medium">{formatTime(elapsed)}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Files</div>
                  <div className="text-sm font-mono font-medium">{modifiedFiles.length}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <p>No active session.</p>
              <p className="mt-1 text-muted-foreground/70">
                Start a session from the Dashboard to track your work.
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Modified Files */}
        {modifiedFiles.length > 0 && (
          <CollapsibleSection
            title="Modified Files"
            icon={<FileEdit className="w-4 h-4" />}
            badge={modifiedFiles.length}
            badgeVariant="warning"
          >
            <div className="space-y-1">
              {modifiedFiles.slice(0, 8).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-secondary/30"
                >
                  <File className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
              ))}
              {modifiedFiles.length > 8 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{modifiedFiles.length - 8} more
                </p>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Safety Status - Only show if there's a warning */}
        {riskyCommandDetected && (
          <CollapsibleSection
            title="Safety Warning"
            icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}
            defaultOpen={true}
          >
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
              <div className="text-xs text-yellow-500 font-medium mb-1">
                Risky command detected
              </div>
              <div className="text-xs text-muted-foreground">
                Consider creating a snapshot before proceeding.
              </div>
            </div>
          </CollapsibleSection>
        )}
      </div>
    </ScrollArea>
  );
}
