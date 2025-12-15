import { useState } from "react";
import { toast } from "sonner";
import {
  usePrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  useUsePrompt,
} from "@/hooks/usePrompts";
import { Prompt } from "@/lib/tauri";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Search,
  Copy,
  Check,
  Tag,
  Variable,
  Sparkles,
  Clock,
  Hash,
} from "lucide-react";

// Extract variables from prompt content (format: {{variable_name}})
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(2, -2).trim()))];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface PromptEditorProps {
  prompt?: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PromptEditor({ prompt, open, onOpenChange }: PromptEditorProps) {
  const [name, setName] = useState(prompt?.name || "");
  const [content, setContent] = useState(prompt?.content || "");
  const [tagsInput, setTagsInput] = useState(prompt?.tags.join(", ") || "");

  const createMutation = useCreatePrompt();
  const updateMutation = useUpdatePrompt();
  const isEditing = !!prompt;

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !prompt) {
      setName("");
      setContent("");
      setTagsInput("");
    } else if (newOpen && prompt) {
      setName(prompt.name);
      setContent(prompt.content);
      setTagsInput(prompt.tags.join(", "));
    }
    onOpenChange(newOpen);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const variables = extractVariables(content);

    try {
      if (isEditing && prompt) {
        await updateMutation.mutateAsync({
          id: prompt.id,
          name: name.trim(),
          content: content.trim(),
          tags,
          variables,
        });
        toast.success("Prompt updated", {
          description: `"${name.trim()}" saved successfully`,
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          content: content.trim(),
          tags,
          variables,
        });
        toast.success("Prompt created", {
          description: `"${name.trim()}" added to library`,
        });
      }
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save prompt", {
        description: e instanceof Error ? e.message : "An error occurred",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Prompt" : "Create Prompt"}
          </DialogTitle>
          <DialogDescription>
            Create reusable prompts with variables using {"{{variable_name}}"} syntax.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g., Code Review, Bug Fix Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="e.g., review, refactor, debug (comma separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt Content</label>
            <textarea
              className="w-full h-64 px-3 py-2 rounded-lg bg-secondary border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              placeholder={`Enter your prompt here...

Use {{variable_name}} for variables that can be filled in later.

Example:
Review the following {{language}} code for:
- {{focus_area}}
- Best practices
- Potential bugs`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {content && extractVariables(content).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Variable className="w-3 h-3" />
                Variables detected: {extractVariables(content).join(", ")}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !content.trim() || isPending}
          >
            {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PromptCardProps {
  prompt: Prompt;
  onEdit: () => void;
  onDelete: () => void;
  onUse: () => void;
}

function PromptCard({ prompt, onEdit, onDelete, onUse }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isLong = prompt.content.length > 150;
  const displayContent = expanded || !isLong ? prompt.content : prompt.content.slice(0, 150) + "...";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    onUse();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {prompt.name}
              {prompt.usageCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                  {prompt.usageCount}x
                </span>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-3 text-xs">
              {prompt.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {prompt.tags.slice(0, 3).join(", ")}
                  {prompt.tags.length > 3 && ` +${prompt.tags.length - 3}`}
                </span>
              )}
              {prompt.variables.length > 0 && (
                <span className="flex items-center gap-1 text-blue-400">
                  <Variable className="w-3 h-3" />
                  {prompt.variables.length} vars
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(prompt.createdAt)}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono bg-secondary/50 rounded-lg p-3">
          {displayContent}
        </pre>
        {isLong && (
          <button
            className="text-xs text-primary mt-2 hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function Prompts() {
  const { data: prompts = [], isLoading } = usePrompts();
  const deleteMutation = useDeletePrompt();
  const useMutation = useUsePrompt();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);

  // Get all unique tags
  const allTags = [...new Set(prompts.flatMap((p) => p.tags))].sort();

  // Filter prompts
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      !search ||
      prompt.name.toLowerCase().includes(search.toLowerCase()) ||
      prompt.content.toLowerCase().includes(search.toLowerCase()) ||
      prompt.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !selectedTag || prompt.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
  };

  const handleAdd = () => {
    setEditingPrompt(null);
    setEditorOpen(true);
  };

  const handleDeleteClick = (prompt: Prompt) => {
    setPromptToDelete(prompt);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return;

    try {
      await deleteMutation.mutateAsync(promptToDelete.id);
      toast.success("Prompt deleted", {
        description: `"${promptToDelete.name}" has been removed`,
      });
    } catch (e) {
      toast.error("Failed to delete prompt", {
        description: e instanceof Error ? e.message : "An error occurred",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setPromptToDelete(null);
    }
  };

  const handleUse = async (id: string) => {
    await useMutation.mutateAsync(id);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Prompt Library</h1>
            <p className="text-sm text-muted-foreground">
              {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          New Prompt
        </Button>
      </div>

      {/* Description */}
      <Card className="bg-secondary/30 border-border/50 mb-4">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Prompts</strong> are reusable templates you can quickly copy into Claude Code.
            Create templates for code reviews, bug fixes, refactoring, or any common task.
            Use <code className="text-xs bg-secondary px-1 rounded">{"{{variable}}"}</code> syntax to add placeholders that you fill in when using the prompt.
            Click the <strong>copy</strong> button on any prompt to copy it to your clipboard.
          </p>
        </CardContent>
      </Card>

      {/* Search and filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap ${
                !selectedTag
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {allTags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap ${
                  selectedTag === tag
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Hash className="w-3 h-3 inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prompt list */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Loading...
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            {prompts.length === 0 ? (
              <>
                <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">No prompts yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Create reusable prompts to speed up your Claude Code sessions.
                </p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No matches found</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 pb-4">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={() => handleEdit(prompt)}
                onDelete={() => handleDeleteClick(prompt)}
                onUse={() => handleUse(prompt.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Editor dialog */}
      <PromptEditor
        prompt={editingPrompt}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{promptToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
