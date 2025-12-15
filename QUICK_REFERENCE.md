# Maximus Quick Reference

## What Is Maximus?

A desktop companion for Claude Code that eliminates the friction of AI-assisted coding:
- **Problem**: Claude breaks things → **Solution**: One-click snapshot restore
- **Problem**: Context amnesia → **Solution**: Persistent project memory
- **Problem**: Blind usage → **Solution**: Claude Code analytics integration
- **Problem**: Git friction → **Solution**: Integrated GitHub GUI

## Quick Workflow

```
Open Project → Create Snapshot → Work in Terminal → Restore if Broken → Commit & Push
```

## The Three Pillars

| Pillar | Goal | Key Features |
|--------|------|--------------|
| **Never Lose Work** | Safety nets | Snapshots, one-click undo, time-travel timeline, auto-backup |
| **Never Lose Context** | Continuity | Project memory, session logs, Claude Code integration |
| **Never Waste Usage** | Efficiency | Usage tracking, analytics, scope checking |

## Current Features (Phase 1 Complete + Extensions)

### Core
- [x] Tauri app shell with system tray
- [x] Project detection/selection
- [x] Dashboard with project info, usage stats, quick actions
- [x] SQLite database for persistence

### Snapshots
- [x] Git-based snapshot save/restore
- [x] Visual diff viewer
- [x] Time-travel timeline UI
- [x] File-level restore
- [x] Snapshot comparison

### Terminal
- [x] Full PTY terminal integration
- [x] Quick commands panel (npm scripts, custom)
- [x] Risky command warnings
- [x] File explorer in side panel

### GitHub Integration
- [x] Git status display (branch, ahead/behind, changes)
- [x] One-click commit & push
- [x] Pull from remote
- [x] Initialize git repository
- [x] Create GitHub repo (public/private)
- [x] Set git user.name/email
- [x] Create pull requests
- [x] **Security: Sensitive file detection**

### Analytics
- [x] Claude Code stats integration
- [x] Token usage by model
- [x] Cost tracking
- [x] Session history
- [x] Activity patterns

### Memory & Prompts
- [x] Project memory CRUD
- [x] Prompt library with tags
- [x] Variable support in prompts

### Project Management
- [x] New project wizard
- [x] Project scaffolding (templates)
- [x] Recent projects list

### Planned (Phase 1.5)
- [ ] Session Memory System (Claude Code hooks for auto-capture)
- [ ] "Welcome Back" dashboard with last session context
- [ ] Cloud Sync via private `maximus-sync` repo
- [ ] Cross-machine portability
- [ ] Sensitive data scrubbing for synced content

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri 2.0 (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Database | SQLite (rusqlite) |
| Terminal | portable-pty |
| Git | git CLI + gh CLI |

## Pages

| Page | Purpose |
|------|---------|
| Dashboard | Project overview, quick actions, recent sessions |
| Terminal | Full PTY terminal with side panel |
| Snapshots | Snapshot list, diff viewer, time-travel |
| Memory | Project facts and context |
| Prompts | Reusable prompt templates |
| Analytics | Usage stats, Claude Code integration |

## Key Tauri Commands

### GitHub/Git
```rust
get_git_status(project_path) -> GitStatus
git_stage_all(project_path) -> ()        // Security checked
git_commit(project_path, message) -> GitCommitResult
git_push(project_path) -> GitPushResult
git_pull(project_path) -> GitPushResult
git_init(project_path, branch) -> ()
create_github_repo(...) -> CreateRepoResult  // Security checked
create_pr(project_path, title, body) -> PrResult
get_gh_auth_status() -> GhAuthStatus
```

### Snapshots
```rust
create_snapshot(project_id, name, description) -> Snapshot
list_snapshots(project_id) -> Vec<Snapshot>
restore_snapshot(project_id, snapshot_id) -> ()
get_snapshot_diff(project_id, snapshot_id) -> SnapshotDiff
```

### Projects
```rust
list_projects() -> Vec<Project>
init_project(path) -> Project
scaffold_project(name, location, template, ...) -> Project
```

### Memory
```rust
get_memory(project_path) -> Vec<MemoryItem>
set_memory(project_path, key, value, category) -> MemoryItem
delete_memory(project_path, key) -> ()
```

### Terminal
```rust
pty_spawn(id, cols, rows, cwd) -> ()
pty_write(id, data) -> ()
pty_resize(id, cols, rows) -> ()
pty_kill(id) -> ()
```

### Claude Code
```rust
get_claude_code_stats() -> ClaudeCodeStats
get_claude_code_sessions(project_path) -> Vec<ClaudeCodeSession>
```

## Security Features

### Sensitive File Protection
Automatically blocks staging/pushing files matching:
- `.env*` - Environment files
- `*.pem`, `*.key`, `*.p12`, `*.pfx` - Certificates/keys
- `credentials.json`, `secrets.json` - Credential files
- `id_rsa`, `id_ed25519` - SSH keys
- `.npmrc`, `.pypirc` - Package manager auth
- Files with `secret`, `password`, `apikey` in name

### Behavior
- Clear error message listing detected files
- Instructs user to add to `.gitignore`
- Cannot be bypassed

## Data Storage

```
~/.maximus/                        # Global
├── config.json
├── prompts/
└── maximus.db                     # SQLite

~/.claude/                         # Claude Code (read-only)
├── statsig/
└── projects/

project/.maximus/                  # Per-project
├── memory.json
├── context_map.json
├── snapshots/.git/                # Shadow git repo
└── sessions/
```

## Key Data Types

```typescript
interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  hasRemote: boolean;
}

interface GhAuthStatus {
  installed: boolean;
  authenticated: boolean;
  username?: string;
  scopes: string[];
}

interface Snapshot {
  id: string;        // Git SHA
  name: string;
  timestamp: string;
  filesChanged: number;
  snapshotType: 'auto' | 'manual';
}

interface MemoryItem {
  key: string;
  value: string;
  category?: string;
}

interface Session {
  taskDescription: string;
  filesModified: string[];
  retryCount: number;
  efficiencyScore: number;
}
```

## React Hooks

| Hook | Purpose |
|------|---------|
| `useGitStatus()` | Git status with auto-refresh |
| `useGhAuthStatus()` | GitHub CLI auth status |
| `useGitRepoInfo()` | Repository info |
| `useGitCommit()` | Commit mutation |
| `useGitPush()` | Push mutation |
| `useGitPull()` | Pull mutation |
| `useCreateGithubRepo()` | Create repo mutation |
| `useSnapshots()` | Snapshot list |
| `useCreateSnapshot()` | Create snapshot mutation |
| `useRestoreSnapshot()` | Restore mutation |
| `useMemory()` | Memory items |
| `usePrompts()` | Prompt library |
| `useClaudeCodeStats()` | Claude Code analytics |
| `useQuickCommands()` | npm scripts + custom commands |

## UI Components

### Layout
- `AppShell` - Main app wrapper with header
- `TabBar` - Bottom navigation
- `Header` - Project selector, usage bar

### Dashboard
- `ProjectCard` - Current project info
- `UsageCard` - Today's stats
- `QuickActions` - Save/Undo/Start buttons
- `RecentSessions` - Session list
- `FileExplorer` - Directory browser

### Terminal
- `Terminal` - PTY terminal component
- `TerminalSidePanel` - Collapsible side panel
- `GitPanel` - GitHub integration UI
- `RiskyCommandWarning` - Destructive command alert

### Project
- `NewProjectWizard` - Multi-step project creation

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
npm run typecheck       # TypeScript check
npm run lint            # Lint frontend
cargo test              # Run Rust tests
```

## Prerequisites

- Node.js 18+
- Rust (via rustup)
- Tauri CLI (`cargo install tauri-cli`)
- GitHub CLI (`gh`) for GitHub features

## File Structure

```
src/
├── components/
│   ├── ui/             # shadcn components
│   ├── layout/         # AppShell, TabBar, Header
│   ├── dashboard/      # ProjectCard, UsageCard, etc.
│   ├── terminal/       # Terminal, GitPanel, etc.
│   └── project/        # NewProjectWizard
├── hooks/              # useGitHub, useSnapshots, etc.
├── stores/             # Zustand stores
├── pages/              # Page components
└── lib/
    └── tauri.ts        # Invoke wrappers + types

src-tauri/src/
├── commands/           # All Tauri command handlers
├── db/                 # SQLite operations
├── git/                # Snapshot git operations
├── pty/                # Terminal PTY
└── tray/               # System tray
```

## Key Decisions

| Area | Decision | Why |
|------|----------|-----|
| Terminal | Full PTY | Real shell experience |
| GitHub | `gh` CLI wrapper | Existing auth, reliable |
| Security | Block sensitive files | Prevent leaks |
| Snapshots | Shadow git repo | Clean separation |
| Analytics | Read Claude Code files | Native integration |
