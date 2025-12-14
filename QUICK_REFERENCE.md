# Maximus Quick Reference

## The Three Pillars

| Pillar | Goal | Key Features |
|--------|------|--------------|
| **Never Lose Work** | Safety nets | Snapshots, one-click undo, auto-backup |
| **Never Lose Context** | Continuity | Project memory, session logs, warm starts |
| **Never Waste Usage** | Efficiency | Usage tracking, scope checking, suggestions |

## MVP Features (Phase 1)

- [x] Tauri app shell
- [ ] System tray with quick actions
- [ ] Project detection/selection
- [ ] Dashboard layout
- [ ] Snapshot save/restore (git-based)
- [ ] Basic session logging
- [ ] SQLite database
- [ ] CLI: `max`, `max save`, `max undo`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri 2.0 (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Database | SQLite (rusqlite) |
| Git Ops | git2-rs |

## CLI Commands

```bash
max                  # Open GUI
max save [name]      # Create snapshot
max undo             # Rollback last snapshot
max status           # Show project status
max memory set K V   # Store memory item
max go               # Pre-flight + start session
```

## Tauri Commands

```rust
// Snapshots
create_snapshot(project_id, name, description) -> Snapshot
list_snapshots(project_id) -> Vec<Snapshot>
restore_snapshot(project_id, snapshot_id) -> ()

// Memory
get_memory(project_id) -> Vec<MemoryItem>
set_memory(project_id, key, value) -> MemoryItem
delete_memory(project_id, key) -> ()

// Projects
list_projects() -> Vec<Project>
init_project(path) -> Project
```

## Data Storage

```
~/.maximus/                        # Global
├── config.json
├── prompts/
└── maximus.db                     # SQLite

project/.maximus/                  # Per-project
├── memory.json
├── context_map.json
├── snapshots/.git/            # Shadow git repo
└── sessions/
```

## Key Data Types

```typescript
interface Snapshot {
  id: string;        // Git SHA
  name: string;
  timestamp: Date;
  type: 'auto' | 'manual';
}

interface MemoryItem {
  key: string;       // e.g., "architecture"
  value: string;
}

interface Session {
  taskDescription: string;
  filesModified: string[];
  retryCount: number;
  efficiencyScore: number;  // max(10, 100 - (retries * 15))
}
```

## UI Screens

1. **Dashboard** - Project card, usage bar, quick actions, recent sessions
2. **Snapshots** - List, restore, compare
3. **Memory** - CRUD for project facts
4. **Prompts** - Save, tag, search, use
5. **Analytics** - Usage charts, efficiency trends
6. **Settings** - App preferences

## Design Colors (Dark)

| Element | Color |
|---------|-------|
| Background | `#0a0a0b` |
| Card | `#141416` |
| Border | `#27272a` |
| Text | `#fafafa` |
| Muted | `#a1a1aa` |
| Accent | `#3b82f6` |
| Success | `#22c55e` |
| Warning | `#eab308` |
| Error | `#ef4444` |

## Development Commands

```bash
npm run tauri dev       # Start dev server
npm run tauri build     # Production build
cargo test              # Run Rust tests
npm run lint            # Lint frontend
```

## File Structure Highlights

```
src/
├── components/
│   ├── layout/         # AppShell, TabBar, Header
│   ├── dashboard/      # ProjectCard, UsageCard, QuickActions
│   └── ...
├── hooks/              # useSnapshots, useMemory, etc.
├── stores/             # Zustand stores
├── pages/              # Page components
└── lib/
    ├── tauri.ts        # Invoke wrappers
    └── utils.ts        # Helpers

src-tauri/src/
├── commands/           # Tauri handlers
├── db/                 # SQLite
└── git/                # Snapshot operations
```

## Success Metrics

- Time to first snapshot: < 2 clicks
- Session start time: < 30 seconds
- Undo recovery: < 5 seconds
- Context accuracy: 80%+ relevant suggestions
- Efficiency improvement: 20%+ fewer retries
