# Maximus

## Project Overview

Maximus is a Tauri desktop application that helps developers maximize their Claude Code sessions. It provides three core capabilities:

1. **Never Lose Work** - Git-based snapshots with one-click undo
2. **Never Lose Context** - Persistent project memory and session continuity
3. **Never Waste Usage** - Efficiency tracking and optimization suggestions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Zustand
- **Backend**: Tauri 2.0 (Rust)
- **Database**: SQLite (via rusqlite)
- **State**: Zustand for client state, TanStack Query for server state

## Architecture

```
src-tauri/           # Rust backend
  src/
    commands/        # Tauri IPC handlers
    db/              # SQLite operations  
    git/             # Git operations for snapshots
    tray/            # System tray

src/                 # React frontend
  components/
    ui/              # shadcn components
    layout/          # App shell, tabs, header
    dashboard/       # Home screen components
    snapshots/       # Snapshot management
    memory/          # Project memory
    prompts/         # Prompt library
    analytics/       # Usage stats
    session/         # Session launcher
    settings/        # Settings form
  hooks/             # React hooks for data fetching
  stores/            # Zustand stores
  pages/             # Main page components
  lib/               # Utilities
```

## Key Data Structures

### Snapshot
```typescript
interface Snapshot {
  id: string;           // Git commit SHA
  name: string;
  description?: string;
  timestamp: Date;
  branch: string;
  filesChanged: number;
  type: 'auto' | 'manual';
}
```

### Memory Item
```typescript
interface MemoryItem {
  id: string;
  key: string;           // e.g., "architecture"
  value: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session
```typescript
interface Session {
  id: string;
  projectId: string;
  taskDescription: string;
  startedAt: Date;
  endedAt?: Date;
  filesModified: string[];
  tokensEstimate?: number;      // ~4 chars = 1 token (estimated)
  retryCount: number;
  efficiencyScore?: number;     // max(10, 100 - (retries * 15))
  logPath: string;
}
```

### Prompt
```typescript
interface Prompt {
  id: string;
  name: string;
  content: string;
  tags: string[];
  variables?: string[];
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
}
```

## Data Storage

- **Global** (`~/.maximus/`): config.json, prompts/, maximus.db
- **Per-project** (`project/.maximus/`): memory.json, context_map.json, snapshots/, sessions/

## Conventions

### Code Style
- Functional React components with hooks
- TypeScript strict mode
- Prefer composition over inheritance
- Use shadcn/ui components where possible
- Tailwind for styling, no CSS files

### File Naming
- React components: PascalCase (`SnapshotList.tsx`)
- Hooks: camelCase with `use` prefix (`useSnapshots.ts`)
- Utilities: camelCase (`tokenEstimate.ts`)
- Rust: snake_case (`snapshot_commands.rs`)

### Tauri Commands
All Tauri commands follow this pattern:
```rust
#[tauri::command]
fn command_name(param: Type) -> Result<ReturnType, String> {
    // implementation
}
```

Frontend calls:
```typescript
import { invoke } from '@tauri-apps/api/core';
const result = await invoke<ReturnType>('command_name', { param: value });
```

## Current Phase

**Phase 1: Foundation (MVP)**
- Tauri app shell with system tray
- Project detection and selection
- Dashboard layout
- Snapshot save/restore
- Basic session logging
- SQLite setup
- CLI basics

## Commands Reference

### CLI
```bash
max                  # Open GUI
max save [name]      # Create snapshot
max undo             # Rollback last snapshot
max status           # Show project status
```

### Tauri Commands (src-tauri)
```rust
// Snapshots
create_snapshot(project_id, name, description) -> Snapshot
list_snapshots(project_id) -> Vec<Snapshot>
restore_snapshot(project_id, snapshot_id) -> ()

// Memory
get_memory(project_id) -> Vec<MemoryItem>
set_memory(project_id, key, value) -> MemoryItem
delete_memory(project_id, key) -> ()

// Sessions
create_session(project_id, task) -> Session
end_session(session_id) -> Session
list_sessions(project_id) -> Vec<Session>

// Projects
list_projects() -> Vec<Project>
get_current_project() -> Option<Project>
init_project(path) -> Project
```

## Design System

### Colors (Dark Theme)
- Background: `#0a0a0b`
- Card: `#141416`
- Border: `#27272a`
- Text: `#fafafa` (primary), `#a1a1aa` (secondary)
- Accent: `#3b82f6` (blue)
- Success: `#22c55e`, Warning: `#eab308`, Error: `#ef4444`

### Component Library
Using shadcn/ui. Install components as needed:
```bash
npx shadcn@latest add button card dialog input
```

## Testing

- Frontend: Vitest + React Testing Library
- Rust: Built-in cargo test
- E2E: Consider Playwright for Tauri

## Build & Run

```bash
# Development
npm run tauri dev

# Build
npm run tauri build

# Run CLI only
cargo run --manifest-path src-tauri/Cargo.toml -- [args]
```

## Important Notes

1. **Snapshots use a shadow git repo** in `.maximus/snapshots/` - don't interfere with the main project's git
2. **SQLite is single-writer** - use transactions appropriately
3. **System tray** should always be accessible even when main window is closed
4. **All file paths** should handle cross-platform differences
5. **Token estimation** is approximate - use 4 chars ≈ 1 token as baseline

## Security Requirements

1. **Snapshot exclusions**: Always respect `.gitignore` + default exclusions for secrets (`.env*`, `*.pem`, `credentials.*`, etc.)
2. **Directory permissions**: Create `~/.maximus/` and `project/.maximus/` with 700 permissions
3. **Sensitive file warnings**: Warn users before snapshotting files matching secret patterns
4. **Support `.maximusignore`**: Project-specific exclusions beyond `.gitignore`

See PROJECT_SPEC.md "Security Considerations" for full details and default exclusion patterns.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session detection | Manual (user clicks Start/End) | Simpler, cross-platform, no false positives |
| Token estimation | Character ratio (~4 chars = 1 token) | Anthropic hasn't released Claude's tokenizer; this is their recommended heuristic |
| Efficiency scoring | `max(10, 100 - (retries × 15))` | Retry-based is actionable; users can improve prompts |
| Prompt storage | Global only (`~/.maximus/prompts/`) | Prompts are reusable templates; project specifics go in Memory |
| Snapshot storage | Shadow git repo (`.maximus/snapshots/.git`) | Clean separation from project git, full diff/restore features |
