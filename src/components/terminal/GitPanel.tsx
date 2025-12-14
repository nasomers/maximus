import { useState } from "react";
import {
  GitBranch,
  ArrowUp,
  ArrowDown,
  Plus,
  FileEdit,
  Upload,
  Download,
  GitPullRequest,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  Lock,
  Globe,
  User,
  Mail,
  Rocket,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useGitStatus,
  useGhAuthStatus,
  useGitRepoInfo,
  useGitConfig,
  useSetGitConfig,
  useGitCommit,
  useGitPush,
  useGitPull,
  useGitInit,
  useCreateGithubRepo,
  useCreatePr,
} from "@/hooks/useGitHub";
import { useProjectStore } from "@/stores/projectStore";
import { useAppStore } from "@/stores/appStore";

interface GitPanelProps {
  className?: string;
}

export function GitPanel({ className }: GitPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { currentProject } = useProjectStore();

  // Queries
  const { data: ghAuth, isLoading: authLoading } = useGhAuthStatus();
  const { data: repoInfo, isLoading: repoLoading } = useGitRepoInfo();
  const { data: gitStatus, isLoading: statusLoading, error: statusError } = useGitStatus();
  const { data: gitConfig } = useGitConfig();

  const isLoading = authLoading || repoLoading;

  if (!currentProject) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("border-b border-border/50", className)}>
        <div className="flex items-center gap-2 px-3 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading git status...</span>
        </div>
      </div>
    );
  }

  // Determine which state to render
  const showGhNotInstalled = ghAuth && !ghAuth.installed;
  const showGhNotAuthed = ghAuth?.installed && !ghAuth.authenticated;
  const showNoGitRepo = !repoInfo?.isRepo;
  const showNoRemote = repoInfo?.isRepo && !repoInfo.hasRemote;
  const showFullPanel = repoInfo?.isRepo && repoInfo.hasRemote;

  return (
    <div className={cn("border-b border-border/50", className)}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <GitBranch className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium flex-1 text-left">Git</span>
        {ghAuth?.authenticated && ghAuth.username && (
          <span className="text-xs text-muted-foreground">@{ghAuth.username}</span>
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {showGhNotInstalled && <GhNotInstalledState />}
          {showGhNotAuthed && <GhNotAuthedState />}
          {showNoGitRepo && !showGhNotInstalled && !showGhNotAuthed && (
            <NoGitRepoState gitConfig={gitConfig} ghAuth={ghAuth} />
          )}
          {showNoRemote && !showGhNotInstalled && !showGhNotAuthed && (
            <NoRemoteState repoInfo={repoInfo} ghAuth={ghAuth} />
          )}
          {showFullPanel && (
            <FullGitPanel
              gitStatus={gitStatus}
              statusLoading={statusLoading}
              statusError={statusError}
              repoInfo={repoInfo}
              ghAuth={ghAuth}
            />
          )}
        </div>
      )}
    </div>
  );
}

// State: GitHub CLI not installed
function GhNotInstalledState() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-medium text-yellow-500">GitHub CLI not found</p>
          <p className="text-muted-foreground mt-1">
            Install <code className="bg-secondary px-1 rounded">gh</code> for GitHub features
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <button
          onClick={() => handleCopy("brew install gh")}
          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-secondary/50 hover:bg-secondary text-xs font-mono"
        >
          <span>brew install gh</span>
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <span className="text-muted-foreground">copy</span>}
        </button>
        <a
          href="https://cli.github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-secondary/30 hover:bg-secondary/50 text-xs text-muted-foreground"
        >
          <ExternalLink className="w-3 h-3" />
          View install guide
        </a>
      </div>
    </div>
  );
}

// State: GitHub CLI not authenticated
function GhNotAuthedState() {
  const { setActiveTab, setPendingTerminalCommand } = useAppStore();

  const handleAuth = () => {
    setPendingTerminalCommand("gh auth login");
    setActiveTab("terminal");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Github className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-medium text-blue-500">Connect to GitHub</p>
          <p className="text-muted-foreground mt-1">
            Authenticate with GitHub to create repos and PRs
          </p>
        </div>
      </div>
      <Button size="sm" className="w-full h-8 text-xs" onClick={handleAuth}>
        <Github className="w-3.5 h-3.5 mr-1.5" />
        Authenticate with GitHub
      </Button>
    </div>
  );
}

// State: No git repository
function NoGitRepoState({
  gitConfig,
  ghAuth,
}: {
  gitConfig: { userName?: string; userEmail?: string } | undefined;
  ghAuth: { installed: boolean; authenticated: boolean; username?: string } | undefined;
}) {
  const [showSetup, setShowSetup] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [userName, setUserName] = useState(gitConfig?.userName || "");
  const [userEmail, setUserEmail] = useState(gitConfig?.userEmail || "");

  const { currentProject } = useProjectStore();
  const gitInitMutation = useGitInit();
  const createRepoMutation = useCreateGithubRepo();
  const setConfigMutation = useSetGitConfig();

  const needsGitConfig = !gitConfig?.userName || !gitConfig?.userEmail;
  const canCreateRepo = ghAuth?.installed && ghAuth?.authenticated;

  const handleInitialize = async () => {
    try {
      // Set git config if needed
      if (needsGitConfig && userName && userEmail) {
        await setConfigMutation.mutateAsync({ userName, userEmail });
      }

      // Initialize git
      await gitInitMutation.mutateAsync("main");

      // Create GitHub repo if authenticated and name provided
      if (canCreateRepo && repoName) {
        await createRepoMutation.mutateAsync({
          name: repoName,
          description: null,
          isPrivate,
        });
      }

      setShowSetup(false);
    } catch (error) {
      console.error("Failed to initialize:", error);
    }
  };

  const isLoading = gitInitMutation.isPending || createRepoMutation.isPending || setConfigMutation.isPending;

  if (!showSetup) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
          <GitBranch className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-medium">Not a git repository</p>
            <p className="text-muted-foreground mt-1">Initialize git to track changes</p>
          </div>
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={() => setShowSetup(true)}>
          <Rocket className="w-3.5 h-3.5 mr-1.5" />
          Initialize Repository
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium">Set Up Git Repository</div>

      {/* Git config if needed */}
      {needsGitConfig && (
        <div className="space-y-2 p-2 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground">Git identity (required)</div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="you@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}

      {/* GitHub repo creation */}
      {canCreateRepo && (
        <div className="space-y-2 p-2 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground">Push to GitHub (optional)</div>
          <Input
            placeholder={currentProject?.name || "repository-name"}
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="h-7 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsPrivate(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border transition-colors",
                isPrivate
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Lock className="w-3 h-3" />
              Private
            </button>
            <button
              onClick={() => setIsPrivate(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border transition-colors",
                !isPrivate
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Globe className="w-3 h-3" />
              Public
            </button>
          </div>
        </div>
      )}

      {!canCreateRepo && (
        <p className="text-xs text-muted-foreground">
          Connect to GitHub above to push your code
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setShowSetup(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={handleInitialize}
          disabled={isLoading || (needsGitConfig && (!userName || !userEmail))}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <Check className="w-3 h-3 mr-1" />
          )}
          {repoName ? "Init & Push" : "Initialize"}
        </Button>
      </div>

      {(gitInitMutation.error || createRepoMutation.error) && (
        <p className="text-xs text-red-500">
          {gitInitMutation.error?.message || createRepoMutation.error?.message}
        </p>
      )}
    </div>
  );
}

// State: Git repo but no remote
function NoRemoteState({
  repoInfo,
  ghAuth,
}: {
  repoInfo: { isRepo: boolean; hasRemote: boolean; remoteUrl?: string; branch: string } | undefined;
  ghAuth: { installed: boolean; authenticated: boolean; username?: string } | undefined;
}) {
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const { currentProject } = useProjectStore();

  const createRepoMutation = useCreateGithubRepo();
  const canCreateRepo = ghAuth?.installed && ghAuth?.authenticated;

  const handleCreateRepo = async () => {
    if (!repoName) return;
    try {
      await createRepoMutation.mutateAsync({
        name: repoName,
        description: null,
        isPrivate,
      });
    } catch (error) {
      console.error("Failed to create repo:", error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Branch info */}
      <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-2 py-1.5">
        <GitBranch className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-mono font-medium">{repoInfo?.branch || "main"}</span>
        <span className="ml-auto text-xs text-muted-foreground">local only</span>
      </div>

      {canCreateRepo ? (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Push to GitHub</div>
          <Input
            placeholder={currentProject?.name || "repository-name"}
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="h-7 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsPrivate(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border transition-colors",
                isPrivate
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Lock className="w-3 h-3" />
              Private
            </button>
            <button
              onClick={() => setIsPrivate(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border transition-colors",
                !isPrivate
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Globe className="w-3 h-3" />
              Public
            </button>
          </div>
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleCreateRepo}
            disabled={!repoName || createRepoMutation.isPending}
          >
            {createRepoMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Github className="w-3 h-3 mr-1" />
            )}
            Create GitHub Repository
          </Button>
          {createRepoMutation.error && (
            <p className="text-xs text-red-500">{createRepoMutation.error.message}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Connect to GitHub to push your repository
        </p>
      )}
    </div>
  );
}

// State: Full git panel (has repo and remote)
function FullGitPanel({
  gitStatus,
  statusLoading,
  statusError,
  repoInfo,
  ghAuth,
}: {
  gitStatus: any;
  statusLoading: boolean;
  statusError: Error | null;
  repoInfo: { isRepo: boolean; hasRemote: boolean; remoteUrl?: string; branch: string } | undefined;
  ghAuth: { installed: boolean; authenticated: boolean; username?: string } | undefined;
}) {
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [showPrForm, setShowPrForm] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");

  const commitMutation = useGitCommit();
  const pushMutation = useGitPush();
  const pullMutation = useGitPull();
  const prMutation = useCreatePr();

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    try {
      const result = await commitMutation.mutateAsync(commitMessage);
      if (result.success) {
        setCommitMessage("");
        setShowCommitForm(false);
      }
    } catch (err) {
      console.error("Commit failed:", err);
    }
  };

  const handlePush = async () => {
    try {
      await pushMutation.mutateAsync();
    } catch (err) {
      console.error("Push failed:", err);
    }
  };

  const handlePull = async () => {
    try {
      await pullMutation.mutateAsync();
    } catch (err) {
      console.error("Pull failed:", err);
    }
  };

  const handleCreatePr = async () => {
    if (!prTitle.trim()) return;
    try {
      const result = await prMutation.mutateAsync({ title: prTitle, body: prBody });
      if (result.success) {
        setPrTitle("");
        setPrBody("");
        setShowPrForm(false);
        if (result.url) {
          window.open(result.url, "_blank");
        }
      }
    } catch (err) {
      console.error("PR creation failed:", err);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (statusError || !gitStatus) {
    return (
      <div className="text-xs text-muted-foreground">Failed to load git status</div>
    );
  }

  const hasChanges =
    gitStatus.staged.length > 0 ||
    gitStatus.modified.length > 0 ||
    gitStatus.untracked.length > 0;
  const canPush = gitStatus.ahead > 0 || !repoInfo?.hasRemote;

  // Extract repo name from URL for display
  const repoName = repoInfo?.remoteUrl
    ?.replace(/\.git$/, "")
    .split("/")
    .slice(-2)
    .join("/");

  return (
    <div className="space-y-3">
      {/* Branch + Sync Status */}
      <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-2 py-1.5">
        <GitBranch className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-mono font-medium">{gitStatus.branch}</span>
        {gitStatus.hasRemote && (
          <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
            {gitStatus.ahead > 0 && (
              <span className="flex items-center gap-0.5 text-green-500">
                <ArrowUp className="w-3 h-3" />
                {gitStatus.ahead}
              </span>
            )}
            {gitStatus.behind > 0 && (
              <span className="flex items-center gap-0.5 text-yellow-500">
                <ArrowDown className="w-3 h-3" />
                {gitStatus.behind}
              </span>
            )}
            {gitStatus.ahead === 0 && gitStatus.behind === 0 && (
              <span className="flex items-center gap-0.5 text-green-500">
                <Check className="w-3 h-3" />
                synced
              </span>
            )}
          </div>
        )}
      </div>

      {/* Remote link */}
      {repoName && (
        <a
          href={repoInfo?.remoteUrl?.replace(/\.git$/, "").replace("git@github.com:", "https://github.com/")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Github className="w-3 h-3" />
          {repoName}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {/* Changes Summary */}
      {hasChanges && (
        <div className="grid grid-cols-3 gap-1.5">
          {gitStatus.staged.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs">
              <Check className="w-3 h-3" />
              <span>{gitStatus.staged.length} staged</span>
            </div>
          )}
          {gitStatus.modified.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs">
              <FileEdit className="w-3 h-3" />
              <span>{gitStatus.modified.length} modified</span>
            </div>
          )}
          {gitStatus.untracked.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs">
              <Plus className="w-3 h-3" />
              <span>{gitStatus.untracked.length} new</span>
            </div>
          )}
        </div>
      )}

      {/* Forms */}
      {showCommitForm ? (
        <div className="space-y-2">
          <Input
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommit();
              }
              if (e.key === "Escape") {
                setShowCommitForm(false);
              }
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={handleCommit}
              disabled={!commitMessage.trim() || commitMutation.isPending}
            >
              {commitMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Check className="w-3 h-3 mr-1" />
              )}
              Commit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowCommitForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : showPrForm ? (
        <div className="space-y-2">
          <Input
            placeholder="PR title..."
            value={prTitle}
            onChange={(e) => setPrTitle(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <Textarea
            placeholder="PR description (optional)..."
            value={prBody}
            onChange={(e) => setPrBody(e.target.value)}
            className="text-sm min-h-[60px] resize-none"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={handleCreatePr}
              disabled={!prTitle.trim() || prMutation.isPending}
            >
              {prMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <GitPullRequest className="w-3 h-3 mr-1" />
              )}
              Create PR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowPrForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowCommitForm(true)}
            disabled={!hasChanges}
          >
            <Check className="w-3 h-3 mr-1.5" />
            Commit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={handlePush}
            disabled={pushMutation.isPending || !canPush}
          >
            {pushMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
            ) : (
              <Upload className="w-3 h-3 mr-1.5" />
            )}
            Push
            {gitStatus.ahead > 0 && (
              <span className="ml-1 text-green-500">({gitStatus.ahead})</span>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={handlePull}
            disabled={pullMutation.isPending || !gitStatus.hasRemote}
          >
            {pullMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
            ) : (
              <Download className="w-3 h-3 mr-1.5" />
            )}
            Pull
            {gitStatus.behind > 0 && (
              <span className="ml-1 text-yellow-500">({gitStatus.behind})</span>
            )}
          </Button>
          {ghAuth?.authenticated && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowPrForm(true)}
            >
              <GitPullRequest className="w-3 h-3 mr-1.5" />
              Create PR
            </Button>
          )}
        </div>
      )}

      {/* Success/Error Messages */}
      {pushMutation.isSuccess && (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <Check className="w-3 h-3" />
          {pushMutation.data?.message}
        </p>
      )}
      {pullMutation.isSuccess && (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <Check className="w-3 h-3" />
          {pullMutation.data?.message}
        </p>
      )}
      {commitMutation.isSuccess && commitMutation.data?.success && (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Committed: {commitMutation.data.sha?.substring(0, 7)}
        </p>
      )}
      {prMutation.isSuccess && prMutation.data?.url && (
        <a
          href={prMutation.data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-500 flex items-center gap-1 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          PR created
        </a>
      )}
      {pushMutation.error && (
        <p className="text-xs text-red-500">{pushMutation.error.message}</p>
      )}
      {pullMutation.error && (
        <p className="text-xs text-red-500">{pullMutation.error.message}</p>
      )}
      {commitMutation.error && (
        <p className="text-xs text-red-500">{commitMutation.error.message}</p>
      )}
      {prMutation.error && (
        <p className="text-xs text-red-500">{prMutation.error.message}</p>
      )}
    </div>
  );
}
