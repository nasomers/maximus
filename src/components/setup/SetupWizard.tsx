import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Github,
  Cloud,
  Check,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  Rocket,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MaximusLogo } from "@/components/ui/MaximusLogo";
import { useSettingsStore } from "@/stores/settingsStore";
import { useGhAuthStatus } from "@/hooks/useGitHub";
import { invoke } from "@tauri-apps/api/core";

interface SetupWizardProps {
  open: boolean;
  onComplete: () => void;
}

type SetupStep = "welcome" | "github" | "sync" | "complete";

export function SetupWizard({ open, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<SetupStep>("welcome");
  const { setSetupComplete } = useSettingsStore();

  const handleComplete = () => {
    setSetupComplete(true);
    onComplete();
  };

  const handleSkipSync = () => {
    setStep("complete");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === "welcome" && <WelcomeStep onNext={() => setStep("github")} />}
        {step === "github" && (
          <GithubStep
            onNext={() => setStep("sync")}
            onSkip={() => setStep("sync")}
          />
        )}
        {step === "sync" && (
          <SyncStep
            onNext={() => setStep("complete")}
            onSkip={handleSkipSync}
          />
        )}
        {step === "complete" && <CompleteStep onFinish={handleComplete} />}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
          {(["welcome", "github", "sync", "complete"] as SetupStep[]).map((s) => (
            <div
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step === s ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="p-8 text-center">
      <MaximusLogo size="lg" state="normal" className="mx-auto mb-6" />
      <h1 className="text-2xl font-bold mb-2">Welcome to Maximus</h1>
      <p className="text-muted-foreground mb-8">
        Your desktop companion for Claude Code.
        Let's get you set up in just a few steps.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <FeaturePreview
          icon={<div className="text-2xl">📸</div>}
          title="Snapshots"
          description="Never lose work"
        />
        <FeaturePreview
          icon={<div className="text-2xl">🧠</div>}
          title="Memory"
          description="Keep context"
        />
        <FeaturePreview
          icon={<div className="text-2xl">📊</div>}
          title="Analytics"
          description="Track usage"
        />
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Get Started
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function GithubStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const { data: ghAuth, isLoading, refetch } = useGhAuthStatus();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("gh auth login");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const isAuthenticated = ghAuth?.authenticated;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Github className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">GitHub Authentication</h2>
          <p className="text-sm text-muted-foreground">Required for git and sync features</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : isAuthenticated ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-500/10 text-green-500 px-4 py-3 rounded-lg">
            <Check className="w-5 h-5" />
            <div>
              <div className="font-medium">Authenticated</div>
              <div className="text-sm opacity-80">Logged in as {ghAuth.username}</div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-yellow-500/10 text-yellow-500 px-4 py-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <div>
              <div className="font-medium">Not Authenticated</div>
              <div className="text-sm opacity-80">GitHub CLI needs to be set up</div>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="text-sm mb-3">Run this command in your terminal:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded font-mono text-sm">
                gh auth login
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-secondary rounded transition-colors"
                title="Copy command"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!ghAuth?.installed && (
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Don't have GitHub CLI installed?</p>
              <a
                href="https://cli.github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Install GitHub CLI
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary px-4 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              <Loader2 className="w-4 h-4" />
              Check Again
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SyncStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { setSyncSettings } = useSettingsStore();
  const { data: ghAuth } = useGhAuthStatus();

  const handleCreateSyncRepo = async () => {
    if (!ghAuth?.authenticated) {
      setError("Please authenticate with GitHub first");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Try to create the repo using gh CLI
      const result = await invoke<{ success: boolean; url?: string; message: string }>(
        "create_sync_repo"
      );

      if (result.success && result.url) {
        setSyncSettings({
          enabled: true,
          repoUrl: result.url,
          status: "synced",
        });
        setSuccess(true);
      } else {
        setError(result.message || "Failed to create sync repository");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectExisting = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Try to find existing maximus-sync repo
      const result = await invoke<{ success: boolean; url?: string; message: string }>(
        "connect_sync_repo"
      );

      if (result.success && result.url) {
        setSyncSettings({
          enabled: true,
          repoUrl: result.url,
          status: "synced",
        });
        setSuccess(true);
      } else {
        setError(result.message || "No existing sync repository found");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Cloud className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Cloud Sync</h2>
          <p className="text-sm text-muted-foreground">Sync settings across machines (optional)</p>
        </div>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-500/10 text-green-500 px-4 py-3 rounded-lg">
            <Check className="w-5 h-5" />
            <div>
              <div className="font-medium">Sync Configured</div>
              <div className="text-sm opacity-80">Your maximus-sync repo is ready</div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-secondary/30 rounded-lg p-4">
            <h3 className="font-medium mb-2">What gets synced?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>- Your prompt library</li>
              <li>- Session memories (AI summaries)</li>
              <li>- App settings and preferences</li>
            </ul>
            <p className="text-xs text-green-500 mt-3">
              Sensitive data is automatically scrubbed before syncing
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleCreateSyncRepo}
              disabled={isCreating || !ghAuth?.authenticated}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              Create maximus-sync Repo
            </button>

            <button
              onClick={handleConnectExisting}
              disabled={isCreating || !ghAuth?.authenticated}
              className="w-full flex items-center justify-center gap-2 bg-secondary px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect Existing Repo
            </button>
          </div>

          {!ghAuth?.authenticated && (
            <p className="text-xs text-muted-foreground text-center">
              GitHub authentication required for cloud sync
            </p>
          )}

          <button
            onClick={onSkip}
            className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Skip - I'll set this up later
          </button>
        </div>
      )}
    </div>
  );
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
        <Rocket className="w-8 h-8 text-green-500" />
      </div>

      <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
      <p className="text-muted-foreground mb-8">
        Maximus is ready to help you code with Claude.
      </p>

      <div className="bg-secondary/30 rounded-lg p-4 text-left mb-8">
        <h3 className="font-medium mb-3">Quick Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            Select a project from the header dropdown
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            Create a snapshot before making changes
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            Use the terminal tab to run Claude Code
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">4.</span>
            Restore snapshots if something breaks
          </li>
        </ul>
      </div>

      <button
        onClick={onFinish}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <Rocket className="w-4 h-4" />
        Start Using Maximus
      </button>
    </div>
  );
}

function FeaturePreview({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-secondary/30 rounded-lg p-3">
      <div className="mb-2">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
