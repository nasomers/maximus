# Maximus

## Project Overview

Maximus is a Tauri desktop application that helps developers maximize their Claude Code sessions. It provides three core capabilities:

1. **Never Lose Work** - Git-based snapshots with one-click undo, time-travel timeline
2. **Never Lose Context** - Persistent project memory, session continuity, smart context
3. **Never Waste Usage** - Efficiency tracking, Claude Code analytics integration

## Why Maximus Exists

Claude Code is powerful but has friction:
- **Fear of breaking things** - Claude makes sweeping changes; one bad prompt mangles your code
- **Context amnesia** - Every session starts fresh; you re-explain architecture repeatedly
- **Blind usage** - No visibility into token consumption or prompting efficiency
- **Workflow friction** - Constant switching between terminal, git, and GitHub

**Maximus wraps Claude Code workflows** in a desktop app with automatic safety nets, persistent memory, usage visibility, and streamlined git/GitHub operations.

## The Workflow

```
1. OPEN PROJECT     → Dashboard shows status, recent sessions, usage
2. START SESSION    → Auto-snapshot created, memory loaded, terminal ready
3. WORK             → Integrated terminal with quick commands, live git status
4. SOMETHING WRONG? → One-click restore, time-travel, file-level undo
5. COMMIT           → Security check, one-click push, create PR
6. END OF DAY       → Analytics, session logged, memory persists
```

**Typical time saved**: ~15 min/session on git commands, zero risk of losing work.

## Current Status

**Phase 1 Complete + Extended Features**

The MVP is fully functional with additional quality-of-life features:
- Full Tauri app with system tray
- Integrated terminal with PTY support
- GitHub integration (GUI wrapper for `gh` CLI)
- Snapshot system with visual diff and time-travel
- Claude Code usage analytics
- Project memory system
- Prompt library
- Quick commands panel
- New project wizard with scaffolding

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Zustand
- **Backend**: Tauri 2.0 (Rust)
- **Database**: SQLite (via rusqlite)
- **State**: Zustand for client state, TanStack Query for server state
- **Terminal**: portable-pty for full PTY emulation
- **Git**: Command-line git and `gh` CLI integration

## Architecture

```
src-tauri/           # Rust backend
  src/
    commands/        # Tauri IPC handlers
      analytics.rs   # Usage statistics
      claude_code.rs # Claude Code integration
      github.rs      # Git/GitHub operations (with security checks)
      memory.rs      # Project memory CRUD
      projects.rs    # Project management
      prompts.rs     # Prompt library
      pty.rs         # Terminal PTY operations
      quick_commands.rs # Quick command discovery
      sessions.rs    # Session logging
      snapshots.rs   # Git-based snapshots
      tray.rs        # System tray state
    db/              # SQLite operations
    git/             # Git operations for snapshots
    pty/             # PTY management
    tray/            # System tray setup

src/                 # React frontend
  components/
    ui/              # shadcn components
    layout/          # AppShell, TabBar, Header
    dashboard/       # ProjectCard, UsageCard, QuickActions, RecentSessions, FileExplorer
    terminal/        # Terminal, GitPanel, TerminalSidePanel, RiskyCommandWarning
    project/         # NewProjectWizard
  hooks/             # React Query hooks for all backend operations
  stores/            # Zustand stores (projectStore, settingsStore)
  pages/             # Dashboard, Snapshots, Memory, Prompts, Analytics, TerminalPage
  lib/               # Utilities including tauri.ts invoke wrappers
```

## Key Features

### Terminal Page
Full integrated terminal with:
- **PTY Support**: Real terminal emulation (not just command execution)
- **Side Panel**: Quick commands, git status, file explorer
- **Git Panel**: Complete GitHub integration GUI
- **Risky Command Warning**: Alerts for destructive commands
- **Quick Commands**: npm scripts and custom commands

### GitHub Integration
GUI wrapper for `gh` CLI providing:
- Git repository initialization
- GitHub repo creation (public/private)
- Commit, push, pull operations
- PR creation
- Git config management (user.name, user.email)
- **Security**: Automatic detection and blocking of sensitive files

### Snapshot System
- Manual and auto snapshots before sessions
- Visual diff viewer
- Time-travel timeline for browsing history
- One-click restore
- File-level restore from any snapshot

### Claude Code Analytics
Reads Claude Code's native stats from `~/.claude/`:
- Session history and summaries
- Token usage by model
- Cost tracking
- Activity patterns (hourly, daily)

### UI Polish
- **Toast Notifications**: Using sonner for success/error feedback on operations
- **Delete Confirmations**: AlertDialog prompts before deleting memories or prompts
- **WelcomeBack Component**: Shows last Claude Code session summary on dashboard
- **Real-time Usage**: Header displays today's actual token usage from Claude Code

### Session Memory System
Persistent memory that survives across Claude Code sessions:

**How it works:**
1. **Session End**: Claude Code hook asks Claude to summarize the session
2. **Storage**: Summary saved to SQLite (locally) and sync repo (for portability)
3. **Session Start**: Previous context injected via hook
4. **UI**: "Welcome back" dashboard shows where you left off

**What gets remembered:**
- Session summaries (what you worked on)
- Key decisions made
- Open threads (unfinished work)
- Files touched

**No extra API costs** - uses Claude Code hooks within your existing subscription.

### Cloud Sync (Portability)
Sync prompts, settings, and memories across machines via a private GitHub repo.

**Architecture:**
```
YOUR PROJECT REPO (github.com/you/my-app)
├── src/
├── .maximus/              # Gitignored - local snapshots only
└── ...

SYNC REPO (github.com/you/maximus-sync) [PRIVATE]
├── prompts/               # Your prompt library
├── settings.json          # App preferences
└── projects/
    └── {project-hash}/    # Per-project memories
        ├── memories.json
        └── sessions.json
```

**Sync behavior:**
- Pull on Maximus startup
- Push after changes (debounced 30s)
- Works offline (syncs when reconnected)
- Sensitive data scrubbed before sync

**First-run setup:**
- Maximus guides you to create `maximus-sync` repo (FORCED PRIVATE - no public option)
- Or connect to existing one on new machine
- Repo name is forced to `maximus-sync` for consistency

## Data Structures

### Snapshot
```typescript
interface Snapshot {
  id: string;           // Git commit SHA
  name: string;
  description?: string;
  timestamp: string;
  filesChanged: number;
  snapshotType: 'auto' | 'manual';
}
```

### GitStatus
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
```

### GhAuthStatus
```typescript
interface GhAuthStatus {
  installed: boolean;
  authenticated: boolean;
  username?: string;
  scopes: string[];
}
```

### Session Memory
```typescript
interface SessionMemory {
  id: string;
  projectId: string;
  sessionDate: string;
  summary: string;              // AI-generated summary of what was done
  keyDecisions: string[];       // Important decisions made
  openThreads: string[];        // Unfinished work / next steps
  filesTouched: string[];       // Files that were modified
  durationMinutes: number;
}
```

### Welcome Context
```typescript
interface WelcomeContext {
  projectId: string;
  lastSession: {
    date: string;
    daysAgo: number;
    summary: string;
    openThreads: string[];
  } | null;
  recentMemories: SessionMemory[];
  suggestedContinuation: string;
}
```

### Sync Status
```typescript
interface SyncStatus {
  enabled: boolean;
  repoUrl: string | null;
  lastSynced: string | null;
  status: 'synced' | 'syncing' | 'offline' | 'error';
}
```

### Session
```typescript
interface Session {
  id: string;
  projectId: string;
  taskDescription: string;
  startedAt: string;
  endedAt?: string;
  filesModified: string[];
  tokensEstimate?: number;
  retryCount: number;
  efficiencyScore?: number;
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
  variables: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}
```

## Commands Reference

### Tauri Commands - GitHub/Git
```rust
// Git status and operations
get_git_status(project_path) -> GitStatus
git_stage_all(project_path) -> ()           // With security check
git_commit(project_path, message) -> GitCommitResult
git_push(project_path) -> GitPushResult
git_pull(project_path) -> GitPushResult

// GitHub CLI integration
check_gh_cli() -> bool
get_gh_auth_status() -> GhAuthStatus
get_git_repo_info(project_path) -> GitRepoInfo
get_git_config() -> GitConfig
set_git_config(user_name, user_email) -> ()
git_init(project_path, default_branch) -> ()
create_github_repo(project_path, name, description, is_private) -> CreateRepoResult  // With security check
git_add_remote(project_path, url) -> ()
create_pr(project_path, title, body) -> PrResult
```

### Tauri Commands - Snapshots
```rust
create_snapshot(project_id, name, description) -> Snapshot
list_snapshots(project_id) -> Vec<Snapshot>
restore_snapshot(project_id, snapshot_id) -> ()
get_snapshot_diff(project_id, snapshot_id) -> SnapshotDiff
get_file_at_snapshot(project_id, snapshot_id, file_path) -> String
compare_snapshots(project_id, from_id, to_id) -> SnapshotDiff
```

### Tauri Commands - Projects
```rust
list_projects() -> Vec<Project>
get_current_project() -> Option<Project>
init_project(path) -> Project
delete_project(project_id) -> ()
scaffold_project(name, location, template, tech_stack, description, design_prompt) -> Project
list_directory(path) -> Vec<FileEntry>
```

### Tauri Commands - Memory
```rust
get_memory(project_path) -> Vec<MemoryItem>
set_memory(project_path, key, value, category) -> MemoryItem
delete_memory(project_path, key) -> ()
```

### Tauri Commands - Sessions
```rust
create_session(project_id, task) -> Session
end_session(session_id) -> Session
list_sessions(project_id) -> Vec<Session>
get_today_stats() -> TodayStats
```

### Tauri Commands - Prompts
```rust
list_prompts() -> Vec<Prompt>
create_prompt(name, content, tags, variables) -> Prompt
update_prompt(id, name, content, tags, variables) -> Prompt
get_prompt(id) -> Prompt
delete_prompt(id) -> ()
use_prompt(id) -> Prompt  // Increments usage count
```

### Tauri Commands - Analytics
```rust
get_daily_stats(days) -> Vec<DailyStats>
get_weekly_stats(weeks) -> Vec<WeeklyStats>
get_overall_stats() -> OverallStats
get_project_stats() -> Vec<ProjectStats>
```

### Tauri Commands - Claude Code Integration
```rust
get_claude_code_stats() -> ClaudeCodeStats
get_claude_code_sessions(project_path) -> Vec<ClaudeCodeSession>
get_claude_code_projects() -> Vec<String>
```

### Tauri Commands - Terminal
```rust
pty_spawn(id, cols, rows, cwd) -> ()
pty_write(id, data) -> ()
pty_resize(id, cols, rows) -> ()
pty_kill(id) -> ()
```

### Tauri Commands - Quick Commands
```rust
get_package_scripts(project_path) -> Vec<PackageScript>
get_quick_commands(project_path) -> Vec<QuickCommand>
```

### Tauri Commands - Tray
```rust
set_tray_state(state) -> ()
flash_tray_state(state, duration_ms) -> ()
update_tray_usage() -> ()
```

## Security

### Sensitive File Protection
The GitHub integration includes automatic detection and blocking of sensitive files before staging or pushing:

**Protected Patterns:**
- `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`
- `credentials.json`, `secrets.json`, `service-account.json`
- `*.pem`, `*.key`, `*.p12`, `*.pfx`
- `id_rsa`, `id_ed25519` (SSH keys)
- `.npmrc`, `.pypirc` (auth tokens)
- Files containing `secret`, `password`, `apikey` in name

**Behavior:**
- `git_stage_all()` blocks if sensitive files detected
- `create_github_repo()` blocks if sensitive files would be committed
- Clear error messages listing detected files
- Instructs user to add files to `.gitignore`

### Directory Permissions
- `~/.maximus/` created with 700 permissions
- `project/.maximus/` created with 700 permissions

### Snapshot Exclusions
Snapshots respect:
- Project's `.gitignore`
- Default exclusion patterns for secrets
- Optional `.maximusignore` for project-specific exclusions

## Data Storage

```
~/.maximus/
├── config.json                 # Local config (sync repo URL, settings)
├── maximus.db                  # SQLite (local cache of memories)
├── sync/                       # Cloned maximus-sync repo
│   ├── prompts/                # Prompt library (synced)
│   ├── settings.json           # App preferences (synced)
│   └── projects/               # Per-project memories (synced)
│       └── {project-hash}/
│           ├── memories.json   # Session summaries
│           └── sessions.json   # Session metadata
└── local/                      # Never synced
    └── transcripts/            # Full session logs (large)

project/.maximus/               # Gitignored by default
└── snapshots/                  # Git-based snapshots (local only)

~/.claude/                      # Claude Code data (read-only)
├── statsig/                    # Usage statistics
└── projects/                   # Session data
```

**Sync repo** (`github.com/you/maximus-sync`):
- ALWAYS private (forced by setup wizard - no public option)
- Repo name forced to `maximus-sync` for consistency
- Contains: prompts, settings, session memories (scrubbed of secrets)
- Auto-synced on startup and after changes (debounced)

## Conventions

### Code Style
- Functional React components with hooks
- TypeScript strict mode
- Prefer composition over inheritance
- Use shadcn/ui components where possible
- Tailwind for styling, no CSS files

### File Naming
- React components: PascalCase (`GitPanel.tsx`)
- Hooks: camelCase with `use` prefix (`useGitHub.ts`)
- Utilities: camelCase (`tokenEstimate.ts`)
- Rust: snake_case (`github.rs`)

### Tauri Commands Pattern
```rust
#[tauri::command]
pub fn command_name(param: Type) -> Result<ReturnType, String> {
    // implementation
}
```

Frontend calls:
```typescript
import { invoke } from '@tauri-apps/api/core';
const result = await invoke<ReturnType>('command_name', { param: value });
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

## Build & Run

```bash
# Development
npm run tauri dev

# Build
npm run tauri build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Terminal | Full PTY via portable-pty | Real terminal experience, supports interactive programs |
| GitHub integration | `gh` CLI wrapper | Leverages existing auth, well-tested, full GitHub API |
| Security checks | Block on sensitive files | Prevent accidental secret exposure |
| Session detection | Manual (user clicks Start/End) | Simpler, no false positives |
| Token estimation | Character ratio (~4 chars = 1 token) | Anthropic's recommended heuristic |
| Efficiency scoring | `max(10, 100 - (retries × 15))` | Retry-based is actionable |
| Snapshot storage | Shadow git repo | Clean separation from project git |

## Important Notes

1. **Snapshots use a shadow git repo** in `.maximus/snapshots/` - don't interfere with the main project's git
2. **GitHub operations require `gh` CLI** - install with `brew install gh` or equivalent
3. **Security checks are mandatory** - cannot bypass sensitive file detection
4. **SQLite is single-writer** - use transactions appropriately
5. **System tray** should always be accessible even when main window is closed
6. **All file paths** should handle cross-platform differences
7. **Token estimation** is approximate - use 4 chars ≈ 1 token as baseline
