import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  Terminal,
  Brain,
  MessageSquare,
  BarChart3,
  Github,
  Keyboard,
  BookOpen,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Cloud,
  FolderPlus,
  Undo2,
  GitBranch,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type HelpSection = "getting-started" | "features" | "shortcuts" | "tips";

const sections: { id: HelpSection; label: string; icon: React.ElementType }[] = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "features", label: "Features", icon: Zap },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "tips", label: "Tips & Tricks", icon: Lightbulb },
];

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<HelpSection>("getting-started");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Help & Documentation
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(100%-60px)]">
          {/* Sidebar */}
          <div className="w-52 border-r border-border p-3 space-y-1 bg-secondary/20">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all",
                  activeSection === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-border">
              <a
                href="https://github.com/nasomers/maximus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href="https://github.com/nasomers/maximus/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Report Issue
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </div>

            <div className="absolute bottom-4 left-3 right-3 text-center">
              <p className="text-xs text-muted-foreground">Maximus v0.1.0</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === "getting-started" && <GettingStarted />}
            {activeSection === "features" && <Features />}
            {activeSection === "shortcuts" && <Shortcuts />}
            {activeSection === "tips" && <Tips />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GettingStarted() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Welcome to Maximus</h2>
        <p className="text-muted-foreground">
          Maximus is your desktop companion for Claude Code. It wraps your terminal workflow
          with safety nets, project memory, and quality-of-life tools.
        </p>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
          The Basic Workflow
        </h3>
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          <WorkflowStep icon={FolderPlus} label="Select Project" />
          <WorkflowArrow />
          <WorkflowStep icon={Camera} label="Snapshot" />
          <WorkflowArrow />
          <WorkflowStep icon={Terminal} label="Code" />
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-sm mt-2">
          <div className="col-start-3">
            <WorkflowArrow vertical />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          <WorkflowStep icon={GitBranch} label="Push" />
          <WorkflowArrow reverse />
          <WorkflowStep icon={Undo2} label="Restore if needed" />
          <div className="col-span-2" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Quick Start Steps</h3>

        <StepCard
          number={1}
          title="Select or Create a Project"
          description="Click the project dropdown in the header to select an existing project or initialize a new one."
        />

        <StepCard
          number={2}
          title="Create Your First Snapshot"
          description="Before making changes, save a snapshot. This lets you restore if something goes wrong."
        />

        <StepCard
          number={3}
          title="Use the Terminal"
          description="Open the Terminal tab to run Claude Code. Your quick commands and npm scripts are in the side panel."
        />

        <StepCard
          number={4}
          title="Restore if Needed"
          description="If Claude breaks something, go to Snapshots and restore. One click to undo everything."
        />

        <StepCard
          number={5}
          title="Commit and Push"
          description="When you're happy with changes, use the Git panel in Terminal to commit and push."
        />
      </div>
    </div>
  );
}

function Features() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Features Overview</h2>

      <div className="grid gap-4">
        <FeatureCard
          icon={Camera}
          title="Snapshots"
          description="Git-based project snapshots with one-click save and restore. Visual timeline shows your project history. Compare any two snapshots to see exactly what changed."
          color="text-blue-500"
        />

        <FeatureCard
          icon={Terminal}
          title="Terminal"
          description="Full PTY terminal with quick commands panel. Run npm scripts with one click. File explorer for navigation. Risky command warnings protect you from accidents."
          color="text-green-500"
        />

        <FeatureCard
          icon={Brain}
          title="Memory"
          description="Store persistent facts about your project. Architecture decisions, patterns, and context that Claude should know. Survives across sessions."
          color="text-purple-500"
        />

        <FeatureCard
          icon={MessageSquare}
          title="Prompts"
          description="Build a library of reusable prompts. Tag them for organization. Use variables like {{filename}} for dynamic content. Track which prompts you use most."
          color="text-orange-500"
        />

        <FeatureCard
          icon={BarChart3}
          title="Analytics"
          description="See your Claude Code usage at a glance. Token consumption by model, costs, session history, and activity patterns. Know before you hit limits."
          color="text-cyan-500"
        />

        <FeatureCard
          icon={Github}
          title="GitHub Integration"
          description="Full Git GUI in the terminal panel. Stage, commit, push, and pull without typing commands. Create pull requests. Sensitive file detection protects your secrets."
          color="text-pink-500"
        />

        <FeatureCard
          icon={Cloud}
          title="Cloud Sync"
          description="Sync your prompts, memories, and settings across machines. Uses a private GitHub repo (maximus-sync). Sensitive data is scrubbed before syncing."
          color="text-indigo-500"
        />
      </div>
    </div>
  );
}

function Shortcuts() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>

      <div className="space-y-4">
        <ShortcutGroup title="Navigation">
          <ShortcutRow keys={["Ctrl", "1"]} action="Go to Dashboard" />
          <ShortcutRow keys={["Ctrl", "2"]} action="Go to Terminal" />
          <ShortcutRow keys={["Ctrl", "3"]} action="Go to Snapshots" />
          <ShortcutRow keys={["Ctrl", "4"]} action="Go to Memory" />
          <ShortcutRow keys={["Ctrl", "5"]} action="Go to Prompts" />
          <ShortcutRow keys={["Ctrl", "6"]} action="Go to Analytics" />
        </ShortcutGroup>

        <ShortcutGroup title="Actions">
          <ShortcutRow keys={["Ctrl", "S"]} action="Save snapshot" />
          <ShortcutRow keys={["Ctrl", "Z"]} action="Undo (restore last snapshot)" />
          <ShortcutRow keys={["Ctrl", "`"]} action="Focus terminal" />
          <ShortcutRow keys={["Ctrl", ","]} action="Open settings" />
          <ShortcutRow keys={["Ctrl", "?"]} action="Open help" />
        </ShortcutGroup>

        <ShortcutGroup title="Terminal">
          <ShortcutRow keys={["Ctrl", "C"]} action="Cancel command" />
          <ShortcutRow keys={["Ctrl", "L"]} action="Clear terminal" />
          <ShortcutRow keys={["Ctrl", "K"]} action="Clear terminal (alt)" />
          <ShortcutRow keys={["Up"]} action="Previous command" />
          <ShortcutRow keys={["Down"]} action="Next command" />
        </ShortcutGroup>
      </div>
    </div>
  );
}

function Tips() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Tips & Tricks</h2>

      <div className="space-y-4">
        <TipCard
          title="Snapshot Before Risky Operations"
          description="Always create a snapshot before asking Claude to refactor, delete, or make major changes. It takes one second and can save hours."
          type="warning"
        />

        <TipCard
          title="Use Memory for Context"
          description="Store important facts in Memory: your tech stack, coding conventions, folder structure. Claude can reference these in future sessions."
          type="info"
        />

        <TipCard
          title="Build a Prompt Library"
          description="Save prompts you use often. 'Review this code for security issues' or 'Refactor this to use TypeScript' - save once, use forever."
          type="info"
        />

        <TipCard
          title="Check Sensitive Files"
          description="Maximus blocks commits containing .env, API keys, and credentials. If you get blocked, add those files to .gitignore."
          type="warning"
        />

        <TipCard
          title="Use Quick Commands"
          description="The Terminal side panel shows all npm scripts from package.json. One click to run build, test, or any custom script."
          type="info"
        />

        <TipCard
          title="Compare Snapshots"
          description="Not sure what changed? Use snapshot comparison to see a diff between any two points in time."
          type="info"
        />

        <TipCard
          title="Set Up Cloud Sync"
          description="If you work on multiple machines, set up cloud sync. Your prompts and settings follow you everywhere."
          type="info"
        />
      </div>
    </div>
  );
}

// Helper Components

function WorkflowStep({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function WorkflowArrow({ vertical, reverse }: { vertical?: boolean; reverse?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center", vertical && "rotate-90")}>
      <ChevronRight className={cn("w-4 h-4 text-muted-foreground", reverse && "rotate-180")} />
    </div>
  );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className={cn("w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function ShortcutGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">{title}</h3>
      <div className="space-y-1 bg-secondary/30 rounded-lg p-3">
        {children}
      </div>
    </div>
  );
}

function ShortcutRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{action}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center">
            <kbd className="px-2 py-0.5 bg-background rounded text-xs font-mono border border-border">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function TipCard({ title, description, type }: {
  title: string;
  description: string;
  type: "info" | "warning";
}) {
  return (
    <div className={cn(
      "p-4 rounded-lg border-l-4",
      type === "info"
        ? "bg-blue-500/5 border-blue-500"
        : "bg-yellow-500/5 border-yellow-500"
    )}>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
