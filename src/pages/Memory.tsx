import { useState } from "react";
import { toast } from "sonner";
import { useProjectStore } from "@/stores/projectStore";
import { useMemory, useSetMemory, useDeleteMemory } from "@/hooks/useMemory";
import { MemoryItem } from "@/lib/tauri";
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
  Brain,
  Plus,
  Pencil,
  Trash2,
  Search,
  FolderOpen,
  Sparkles,
  Tag,
  Clock,
} from "lucide-react";

// Predefined categories with icons
const CATEGORIES = [
  { value: "architecture", label: "Architecture", color: "text-blue-400" },
  { value: "conventions", label: "Conventions", color: "text-purple-400" },
  { value: "patterns", label: "Patterns", color: "text-green-400" },
  { value: "context", label: "Context", color: "text-yellow-400" },
  { value: "notes", label: "Notes", color: "text-gray-400" },
];

function getCategoryColor(category?: string) {
  return CATEGORIES.find((c) => c.value === category)?.color || "text-gray-400";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MemoryEditorProps {
  item?: MemoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MemoryEditor({ item, open, onOpenChange }: MemoryEditorProps) {
  const [key, setKey] = useState(item?.key || "");
  const [value, setValue] = useState(item?.value || "");
  const [category, setCategory] = useState(item?.category || "");

  const setMemoryMutation = useSetMemory();
  const isEditing = !!item;

  // Reset form when dialog opens with new item
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !item) {
      setKey("");
      setValue("");
      setCategory("");
    } else if (newOpen && item) {
      setKey(item.key);
      setValue(item.value);
      setCategory(item.category || "");
    }
    onOpenChange(newOpen);
  };

  const handleSave = async () => {
    if (!key.trim() || !value.trim()) return;

    try {
      await setMemoryMutation.mutateAsync({
        key: key.trim(),
        value: value.trim(),
        category: category || undefined,
      });
      onOpenChange(false);
      toast.success(isEditing ? "Memory updated" : "Memory added", {
        description: `"${key.trim()}" saved successfully`,
      });
    } catch (e) {
      toast.error("Failed to save memory", {
        description: e instanceof Error ? e.message : "An error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Memory Item" : "Add Memory Item"}
          </DialogTitle>
          <DialogDescription>
            Store persistent context about your project that carries across Claude sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Key</label>
            <Input
              placeholder="e.g., architecture, conventions, api-patterns"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isEditing}
            />
            <p className="text-xs text-muted-foreground">
              A short identifier for this memory item
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value === category ? "" : cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    category === cat.value
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Value</label>
            <textarea
              className="w-full h-48 px-3 py-2 rounded-lg bg-secondary border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter the context, knowledge, or notes you want Claude to remember..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!key.trim() || !value.trim() || setMemoryMutation.isPending}
          >
            {setMemoryMutation.isPending ? "Saving..." : isEditing ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MemoryCardProps {
  item: MemoryItem;
  onEdit: () => void;
  onDelete: () => void;
}

function MemoryCard({ item, onEdit, onDelete }: MemoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = item.value.length > 200;
  const displayValue = expanded || !isLong ? item.value : item.value.slice(0, 200) + "...";

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{item.key}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              {item.category && (
                <span className={`flex items-center gap-1 ${getCategoryColor(item.category)}`}>
                  <Tag className="w-3 h-3" />
                  {item.category}
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(item.updatedAt)}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
          {displayValue}
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

export function Memory() {
  const { currentProject } = useProjectStore();
  const { data: memories = [], isLoading } = useMemory();
  const deleteMemoryMutation = useDeleteMemory();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MemoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MemoryItem | null>(null);

  // Filter memories
  const filteredMemories = memories.filter((item) => {
    const matchesSearch =
      !search ||
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const categoryCounts = memories.reduce(
    (acc, item) => {
      const cat = item.category || "uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleEdit = (item: MemoryItem) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setEditorOpen(true);
  };

  const handleDeleteClick = (item: MemoryItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteMemoryMutation.mutateAsync(itemToDelete.key);
      toast.success("Memory deleted", {
        description: `"${itemToDelete.key}" has been removed`,
      });
    } catch (e) {
      toast.error("Failed to delete memory", {
        description: e instanceof Error ? e.message : "An error occurred",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <FolderOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No Project Selected</h1>
          <p className="text-muted-foreground">
            Select or initialize a project to manage its memory items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Project Memory</h1>
            <p className="text-sm text-muted-foreground">
              {memories.length} item{memories.length !== 1 ? "s" : ""} stored
            </p>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Memory
        </Button>
      </div>

      {/* Description */}
      <Card className="bg-secondary/30 border-border/50 mb-4">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Memory</strong> stores persistent context about your project that Claude can reference across sessions.
            Add architecture decisions, coding conventions, API patterns, or important notes.
            Memory items are stored per-project and can be copied into your <code className="text-xs bg-secondary px-1 rounded">CLAUDE.md</code> file for Claude Code to use.
          </p>
        </CardContent>
      </Card>

      {/* Search and filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              !selectedCategory
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({memories.length})
          </button>
          {CATEGORIES.filter((cat) => categoryCounts[cat.value]).map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedCategory === cat.value
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label} ({categoryCounts[cat.value] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Memory list */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Loading...
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            {memories.length === 0 ? (
              <>
                <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">No memory items yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Add context about your project that Claude should remember across sessions.
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
            {filteredMemories.map((item) => (
              <MemoryCard
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDeleteClick(item)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Editor dialog */}
      <MemoryEditor
        item={editingItem}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.key}"? This action cannot be undone.
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
