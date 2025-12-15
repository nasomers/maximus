# Lumen

**Illuminate your Claude sessions.**

The intelligent terminal for Claude Code with semantic output parsing, state detection, and workflow optimization.

## Vision

Lumen is more than a terminal - it's a command center for Claude Code that:
- **Parses Claude's output** into semantic blocks (code, tools, questions, errors)
- **Detects Claude's state** (thinking, writing, tool use, asking, complete)
- **Tracks your workflow** with snapshots, memory, and efficiency metrics
- **Enhances clarity** by structuring raw output into understandable pieces

**Philosophy:**
- Terminal is the center of everything
- Lumen Pulse (state detection) always visible
- Lumen Blocks (semantic parsing) make output scannable
- Every feature must improve efficiency (more code per dollar)
- Looks so good you want to use it

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         HEADER                              │
│  [Project Selector]              [Cost] [Tokens] [Settings] │
├───────────────────────────────────────────┬─────────────────┤
│                                           │                 │
│                                           │  SIDEBAR        │
│           TERMINAL AREA                   │  - Git widget   │
│           - Tabs + Lumen Pulse            │  - Lumen Blocks │
│           - Split panes                   │  - Snapshots    │
│           - Rich parsed output            │  - Quick cmds   │
│                                           │                 │
├───────────────────────────────────────────┴─────────────────┤
│                       BOTTOM BAR                            │
│  [Concise mode] [Failed approaches] [CLAUDE.md] [Cost info] │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### Lumen Pulse (State Detection)
Real-time indicator showing Claude's current state:
- **Idle** - Ready for input
- **Thinking** - Processing/reasoning (purple, pulsing)
- **Writing** - Generating text/code (blue)
- **Tool Use** - Executing tools like Read, Edit, Bash (yellow, spinning)
- **Asking** - Waiting for your answer (orange, bouncing)
- **Error** - Something went wrong (red)
- **Complete** - Task finished (green)

### Lumen Blocks (Semantic Parsing)
Claude's output parsed into collapsible, typed cards:
- **Code blocks** with language detection
- **Tool invocations** (Read, Edit, Bash, etc.)
- **Questions** pinned for easy response
- **Errors** highlighted prominently
- **Diffs** with additions/deletions colored
- Pin important blocks, collapse verbose output

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Tauri 2.0 (Rust)
- **Terminal**: xterm.js + portable-pty
- **Parsing**: Custom Rust parsers for Claude output
- **State**: Zustand (client), TanStack Query (server)
- **Database**: SQLite

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── terminal/        # Terminal, TerminalTabs, ClaudeStateIndicator, SemanticBlock
│   ├── sidebar/         # GitWidget, SnapshotsWidget, QuickCommands
│   ├── header/          # ProjectSelector, CostDisplay, Settings
│   └── bottom-bar/      # ConciseToggle, FailedApproaches, ClaudeMdEditor
├── hooks/               # React Query hooks, useClaudeState, useSemanticBlocks
├── stores/              # Zustand stores
├── lib/                 # Utilities
└── App.tsx              # Main layout (single view, no routing)

src-tauri/
├── src/
│   ├── commands/        # Tauri IPC handlers
│   ├── db/              # SQLite
│   ├── git/             # Git operations (snapshots)
│   └── pty/             # Terminal PTY + claude_parser + semantic_parser
└── Cargo.toml
```

## Data Storage

- **Global** (`~/.lumen/`): lumen.db, prompts/, bin/
- **Per-project** (`project/.lumen/`): memory.json, snapshots/, sessions/, failed_approaches.json

## Design System

### Colors (Dark Theme with Depth)

```css
/* Lumen Pulse States */
--pulse-idle: #71717a;
--pulse-thinking: #a855f7;
--pulse-writing: #3b82f6;
--pulse-tool-use: #eab308;
--pulse-asking: #f97316;
--pulse-error: #ef4444;
--pulse-complete: #22c55e;

/* Backgrounds */
--bg-base: #0a0a0b;
--bg-surface: #111113;
--bg-elevated: #18181b;

/* Semantic Blocks */
--block-code: rgba(59, 130, 246, 0.1);
--block-tool: rgba(234, 179, 8, 0.1);
--block-question: rgba(249, 115, 22, 0.1);
--block-error: rgba(239, 68, 68, 0.1);
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Command palette |
| Ctrl+T | New terminal tab |
| Ctrl+W | Close current tab |
| Ctrl+\ | Toggle split pane |
| Ctrl+S | Create snapshot |
| Ctrl+Z | Restore last snapshot |
| Ctrl+B | Toggle sidebar |
| ? | Keyboard shortcuts cheat sheet |

## Tauri Commands

```rust
// Terminal + Parsing
pty_spawn(id, cwd, cols, rows)
pty_write(id, data)
// Emits: pty-output-{id}, claude-state-{id}, semantic-block-{id}

// Snapshots
create_snapshot(name, description) -> Snapshot
list_snapshots() -> Vec<Snapshot>
restore_snapshot(id)

// Memory
get_memory(project_path) -> Vec<MemoryItem>
set_memory(project_path, key, value)

// Failed Approaches
get_failed_approaches(project_path) -> Vec<FailedApproach>
add_failed_approach(project_path, description)

// Hooks
set_prompt_prefix(prefix)  // For concise mode
get_prompt_prefix()
```

## Conventions

### Naming
- Components: PascalCase (`ClaudeStateIndicator.tsx`)
- Hooks: camelCase with `use` prefix (`useClaudeState.ts`)
- Stores: camelCase with `Store` suffix (`terminalStore.ts`)
- Rust parsers: snake_case (`claude_parser.rs`, `semantic_parser.rs`)

### Feature Naming
- **Lumen Pulse** - State detection indicator
- **Lumen Blocks** - Semantic output parsing
- **Lumen Flow** - Session/workflow management (future)

---
*Lumen - Illuminate your Claude sessions*
