import { useState } from "react";
import {
  FolderPlus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileCode,
  MessageSquare,
  Check,
  Folder,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

interface NewProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (project: ProjectConfig) => void;
}

export interface ProjectConfig {
  name: string;
  location: string;
  template: string;
  techStack: string[];
  description: string;
  designPrompt: string;
}

const TEMPLATES = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start from scratch with just a CLAUDE.md",
    icon: FileCode,
  },
  {
    id: "web-app",
    name: "Web Application",
    description: "React, Vue, or vanilla web app",
    icon: Rocket,
  },
  {
    id: "api",
    name: "API / Backend",
    description: "REST API, GraphQL, or microservice",
    icon: Sparkles,
  },
  {
    id: "cli",
    name: "CLI Tool",
    description: "Command-line application",
    icon: FileCode,
  },
  {
    id: "desktop",
    name: "Desktop App",
    description: "Tauri, Electron, or native app",
    icon: FolderPlus,
  },
  {
    id: "custom",
    name: "Custom / Other",
    description: "Define your own project type",
    icon: MessageSquare,
  },
];

const TECH_STACKS: Record<string, { id: string; name: string }[]> = {
  "web-app": [
    { id: "react-ts", name: "React + TypeScript" },
    { id: "react-js", name: "React + JavaScript" },
    { id: "vue", name: "Vue.js" },
    { id: "svelte", name: "Svelte" },
    { id: "nextjs", name: "Next.js" },
    { id: "vanilla", name: "Vanilla JS/TS" },
  ],
  api: [
    { id: "node-express", name: "Node.js + Express" },
    { id: "node-fastify", name: "Node.js + Fastify" },
    { id: "python-fastapi", name: "Python + FastAPI" },
    { id: "python-flask", name: "Python + Flask" },
    { id: "rust-axum", name: "Rust + Axum" },
    { id: "go-gin", name: "Go + Gin" },
  ],
  cli: [
    { id: "node-cli", name: "Node.js CLI" },
    { id: "python-cli", name: "Python CLI" },
    { id: "rust-cli", name: "Rust CLI" },
    { id: "go-cli", name: "Go CLI" },
  ],
  desktop: [
    { id: "tauri-react", name: "Tauri + React" },
    { id: "electron-react", name: "Electron + React" },
    { id: "tauri-vue", name: "Tauri + Vue" },
  ],
  blank: [],
  custom: [],
};

const STEPS = [
  { id: "basics", title: "Project Basics", icon: Folder },
  { id: "template", title: "Template", icon: FileCode },
  { id: "design", title: "Design Brief", icon: MessageSquare },
  { id: "review", title: "Review", icon: Check },
];

export function NewProjectWizard({ open, onOpenChange, onComplete }: NewProjectWizardProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ProjectConfig>({
    name: "",
    location: "",
    template: "",
    techStack: [],
    description: "",
    designPrompt: "",
  });

  const handleSelectLocation = async () => {
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: "Select Parent Folder for Project",
    });

    if (selected) {
      setConfig((prev) => ({ ...prev, location: selected as string }));
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    onComplete(config);
    onOpenChange(false);
    // Reset for next time
    setStep(0);
    setConfig({
      name: "",
      location: "",
      template: "",
      techStack: [],
      description: "",
      designPrompt: "",
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return config.name.trim() && config.location;
      case 1:
        return config.template;
      case 2:
        return true; // Design brief is optional
      case 3:
        return true;
      default:
        return false;
    }
  };

  const selectedTemplate = TEMPLATES.find((t) => t.id === config.template);
  const availableTechStacks = TECH_STACKS[config.template] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project with Claude-ready configuration
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] px-2">
          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project Name</label>
                <Input
                  placeholder="my-awesome-project"
                  value={config.name}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      name: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be the folder name
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Select folder..."
                    value={config.location}
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleSelectLocation}>
                    <Folder className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Project will be created at: {config.location && config.name
                    ? `${config.location}/${config.name}`
                    : "..."}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Brief Description (optional)
                </label>
                <Input
                  placeholder="A web app that does..."
                  value={config.description}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* Step 2: Template */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Project Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          template: template.id,
                          techStack: [],
                        }))
                      }
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                        config.template === template.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      )}
                    >
                      <template.icon
                        className={cn(
                          "w-5 h-5 mt-0.5",
                          config.template === template.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <div>
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {availableTechStacks.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">Tech Stack</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTechStacks.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            techStack: prev.techStack.includes(tech.id)
                              ? prev.techStack.filter((t) => t !== tech.id)
                              : [...prev.techStack, tech.id],
                          }))
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm border transition-all",
                          config.techStack.includes(tech.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {tech.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Design Brief */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Design with Claude</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Describe what you want to build. Claude will help you spec it out
                      and create your CLAUDE.md with architecture decisions, patterns,
                      and implementation guidance.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  What do you want to build?
                </label>
                <textarea
                  className="w-full h-32 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="I want to build a task management app with the following features:&#10;- User authentication&#10;- Create/edit/delete tasks&#10;- Drag and drop to reorder&#10;- Due dates and reminders&#10;- Tags and categories"
                  value={config.designPrompt}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, designPrompt: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be as detailed as you like. You'll continue this conversation with Claude
                  in the terminal.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claude will help refine requirements, suggest architecture, and create specs</span>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Project Name</span>
                  <span className="text-sm font-medium">{config.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-mono text-xs">{config.location}/{config.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Template</span>
                  <span className="text-sm font-medium">{selectedTemplate?.name}</span>
                </div>
                {config.techStack.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tech Stack</span>
                    <span className="text-sm">{config.techStack.join(", ")}</span>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  What happens next
                </h4>
                <ol className="text-xs text-muted-foreground space-y-1.5 ml-6 list-decimal">
                  <li>Create project folder with CLAUDE.md</li>
                  <li>Initialize project in Lumen</li>
                  <li>Open terminal with Claude ready</li>
                  {config.designPrompt && (
                    <li>Start design conversation with your brief</li>
                  )}
                  <li>Begin coding with snapshots enabled</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="bg-primary">
              <Rocket className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
