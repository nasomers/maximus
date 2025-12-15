# Maximus

## Vision

Terminal-first desktop companion for Claude Code. Beautiful, fast, efficient.

**Philosophy:**
- Terminal is the center of everything
- Sidebar widgets support the terminal, not the other way around
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
│           - Tabs                          │  - Snapshots    │
│           - Split panes                   │  - Quick cmds   │
│           - Rich output                   │                 │
│                                           │                 │
├───────────────────────────────────────────┴─────────────────┤
│                       BOTTOM BAR                            │
│  [Concise mode] [Failed approaches] [CLAUDE.md] [Cost info] │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui, Framer Motion
- **Backend**: Tauri 2.0 (Rust)
- **Terminal**: xterm.js + portable-pty
- **State**: Zustand (client), TanStack Query (server)
- **Database**: SQLite

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── terminal/        # Terminal, TerminalTabs, TerminalSplit
│   ├── sidebar/         # GitWidget, SnapshotsWidget, QuickCommands
│   ├── header/          # ProjectSelector, CostDisplay, Settings
│   └── bottom-bar/      # ConciseToggle, FailedApproaches, ClaudeMdEditor
├── hooks/               # React Query hooks
├── stores/              # Zustand stores
├── lib/                 # Utilities
└── App.tsx              # Main layout (single view, no routing)

src-tauri/
├── src/
│   ├── commands/        # Tauri IPC handlers
│   ├── db/              # SQLite
│   ├── git/             # Git operations (snapshots)
│   └── pty/             # Terminal PTY
└── Cargo.toml
```

## Design System

### Colors (Dark Theme with Depth)

```css
/* Backgrounds - layered, not flat */
--bg-base: #0a0a0b;           /* Deepest layer */
--bg-surface: #111113;        /* Main surface */
--bg-elevated: #18181b;       /* Cards, panels */
--bg-overlay: #1f1f23;        /* Dropdowns, modals */

/* Borders */
--border-subtle: #27272a;     /* Default borders */
--border-muted: #3f3f46;      /* Hover borders */
--border-focus: #3b82f6;      /* Focus rings */

/* Text */
--text-primary: #fafafa;      /* Primary text */
--text-secondary: #a1a1aa;    /* Secondary text */
--text-muted: #71717a;        /* Disabled/placeholder */

/* Accents */
--accent: #3b82f6;            /* Primary blue */
--accent-hover: #2563eb;      /* Blue hover */
--accent-glow: rgba(59, 130, 246, 0.4);

/* Status */
--success: #22c55e;
--success-glow: rgba(34, 197, 94, 0.4);
--warning: #eab308;
--error: #ef4444;
--error-glow: rgba(239, 68, 68, 0.4);
--info: #06b6d4;
```

### Typography

```css
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Terminal */
--terminal-font-size: 14px;
--terminal-line-height: 1.5;
```

### Effects

```css
/* Glassmorphism */
.glass {
  background: rgba(17, 17, 19, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Glow effects */
.glow-accent {
  box-shadow: 0 0 20px var(--accent-glow);
}
.glow-success {
  box-shadow: 0 0 15px var(--success-glow);
}

/* Focus ring */
.focus-ring {
  outline: none;
  ring: 2px;
  ring-color: var(--accent);
  ring-offset: 2px;
  ring-offset-color: var(--bg-base);
}
```

### Animations

```css
/* Timing */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Easings */
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Common animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px var(--accent-glow); }
  50% { box-shadow: 0 0 20px var(--accent-glow); }
}
```

## Key Components

### Terminal System

```typescript
interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
  ptyId: string;
  isActive: boolean;
}

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string;
  layout: 'single' | 'split-v' | 'split-h';
  splitRatio: number;  // 0.5 = even split
}

// Features:
// - Smooth tab transitions
// - Drag to reorder tabs
// - Double-click tab to rename
// - Ctrl+T new tab, Ctrl+W close
// - Ctrl+\ toggle split
```

### Sidebar Widgets

```typescript
// GitWidget
interface GitWidgetState {
  branch: string;
  ahead: number;
  behind: number;
  changedFiles: number;
  isLoading: boolean;
}
// Shows: branch name, file count badge, ahead/behind
// Actions: Commit button, Push button
// Expand: Full file list with diff preview

// SnapshotsWidget
interface SnapshotsWidgetState {
  recent: Snapshot[];  // Last 5
  isCreating: boolean;
}
// Shows: Recent snapshots with relative time
// Actions: Save (with name input), Undo (restore last)
// Expand: Full timeline view

// QuickCommandsWidget
interface QuickCommandsState {
  scripts: PackageScript[];  // From package.json
  pinned: string[];          // User-pinned commands
}
// Shows: npm scripts, custom commands
// Actions: Click to run, drag to reorder
// Right-click: Pin, Edit, Delete
```

### Bottom Bar

```typescript
interface BottomBarState {
  conciseMode: boolean;        // Inject "be concise" via hooks
  failedApproaches: FailedApproach[];
  sessionCost: number;         // Dollars
  sessionTokens: number;       // Token count
}

interface FailedApproach {
  id: string;
  description: string;
  reason: string;
  createdAt: string;
}
// Failed approaches get injected into prompts:
// "Previously tried X, didn't work because Y. Don't repeat this."
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Command palette |
| Ctrl+T | New terminal tab |
| Ctrl+W | Close current tab |
| Ctrl+Tab | Next tab |
| Ctrl+Shift+Tab | Previous tab |
| Ctrl+1-9 | Jump to tab N |
| Ctrl+\ | Toggle split pane |
| Ctrl+S | Create snapshot |
| Ctrl+Z | Restore last snapshot |
| Ctrl+B | Toggle sidebar |
| Ctrl+F | Search in terminal |
| Ctrl+Shift+C | Copy last command output |
| Escape | Interrupt Claude / Cancel |
| F11 | Toggle fullscreen |

## Tauri Commands

```rust
// Terminal
pty_spawn(id: String, cwd: String, cols: u16, rows: u16)
pty_write(id: String, data: String)
pty_resize(id: String, cols: u16, rows: u16)
pty_kill(id: String)

// Snapshots
create_snapshot(name: String, description: Option<String>) -> Snapshot
list_snapshots() -> Vec<Snapshot>
restore_snapshot(id: String)
get_snapshot_diff(id: String) -> SnapshotDiff

// Git
get_git_status() -> GitStatus
git_commit(message: String) -> Result
git_push() -> Result
git_pull() -> Result

// Project
get_current_project() -> Option<Project>
list_projects() -> Vec<Project>
init_project(path: String) -> Project

// Quick Commands
get_package_scripts() -> Vec<PackageScript>
get_quick_commands() -> Vec<QuickCommand>
save_quick_command(cmd: QuickCommand)

// Settings
get_settings() -> Settings
save_settings(settings: Settings)
```

## Implementation Priority

### Phase 1: Terminal Excellence
1. Tab system with smooth animations
2. Split pane support (vertical/horizontal)
3. Command status (exit code with icon, duration)
4. Search in scrollback (Ctrl+F)
5. Keyboard shortcuts (Ctrl+T, Ctrl+W, etc.)

### Phase 2: Sidebar Widgets
1. Collapsible sidebar with animation
2. Git widget (status + commit/push)
3. Snapshots widget (recent + save/undo)
4. Quick commands widget
5. Resize handle for sidebar width

### Phase 3: Bottom Bar
1. Live cost/token display
2. Concise mode toggle
3. Failed approaches tracker
4. CLAUDE.md quick editor modal

### Phase 4: Polish & Delight
1. All animations tuned
2. Glow effects on focus/active
3. Sound effects (optional)
4. Theme system
5. Command palette (Ctrl+K)

## Visual Polish Checklist

- [ ] Smooth 200ms transitions on all panels
- [ ] Tab hover states with subtle glow
- [ ] Active tab indicator (bottom border glow)
- [ ] Exit code: green checkmark fades in, red X shakes
- [ ] Duration fades in after command completes
- [ ] Sidebar collapse is animated slide
- [ ] Widget expand/collapse is smooth accordion
- [ ] Button press has subtle scale (0.98)
- [ ] Focus rings are consistent (2px accent)
- [ ] Loading spinners are smooth, not janky
- [ ] Empty states have personality
- [ ] Tooltips appear after 500ms delay

## Conventions

### React
- Functional components with hooks only
- TypeScript strict mode
- Tailwind for all styling
- Framer Motion for complex animations
- Zustand for local state
- TanStack Query for server state

### Naming
- Components: PascalCase (`TerminalTabs.tsx`)
- Hooks: camelCase with `use` prefix (`useTerminal.ts`)
- Stores: camelCase with `Store` suffix (`terminalStore.ts`)
- Utils: camelCase (`formatDuration.ts`)
- Rust: snake_case (`git_status.rs`)

### Component Structure
```typescript
// ComponentName.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  // props
}

export function ComponentName({ ...props }: ComponentNameProps) {
  // hooks first
  // derived state
  // handlers
  // render
}
```
