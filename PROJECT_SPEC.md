# Maximus

## Project Vision

Maximus is a desktop companion app for Claude Code that helps developers get more done per session by working smarter. It provides safety nets, persistent context, and efficiency optimization—all through a polished GUI with optional CLI access.

**One-liner:** Get more done per session by working smarter, not harder.

---

## The Problem

Claude Code is powerful but has friction points:

1. **Fear of breaking things**: Claude can make sweeping changes. One bad prompt and your working code is mangled. You're constantly making manual git commits "just in case."

2. **Context amnesia**: Every Claude Code session starts fresh. You re-explain your architecture, your conventions, your auth system—over and over.

3. **Blind usage**: You don't know how much of your subscription you've used, which tasks burn tokens, or whether you're prompting efficiently.

4. **Workflow friction**: Switching between terminal, editor, git, and GitHub interrupts your flow. Simple tasks like "commit and push" require multiple commands.

**Maximus solves all of this** by wrapping Claude Code workflows in a desktop app that provides automatic safety nets, persistent memory, usage visibility, and streamlined git/GitHub operations.

---

## How It All Works Together

### The Daily Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MAXIMUS WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. OPEN PROJECT                                                        │
│     └─> Dashboard shows project status, recent sessions, usage stats    │
│                                                                         │
│  2. START CODING SESSION                                                │
│     └─> Auto-snapshot created (safety net)                              │
│     └─> Project memory loaded (context ready)                           │
│     └─> Terminal ready with quick commands                              │
│                                                                         │
│  3. WORK WITH CLAUDE CODE                                               │
│     └─> Use integrated terminal                                         │
│     └─> Quick commands for common tasks                                 │
│     └─> Git panel shows live status                                     │
│                                                                         │
│  4. SOMETHING GOES WRONG?                                               │
│     └─> One-click restore from snapshot                                 │
│     └─> Time-travel to see what changed                                 │
│     └─> Restore individual files if needed                              │
│                                                                         │
│  5. READY TO COMMIT                                                     │
│     └─> Security check blocks sensitive files                           │
│     └─> One-click commit + push                                         │
│     └─> Create PR without leaving app                                   │
│                                                                         │
│  6. END OF DAY                                                          │
│     └─> Analytics show usage patterns                                   │
│     └─> Session logged for continuity                                   │
│     └─> Memory persists for next time                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Feature Integration Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   PILLAR 1: NEVER LOSE WORK                                             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Snapshots ──────> Time Travel ──────> One-Click Restore        │   │
│   │      │                  │                     │                 │   │
│   │      v                  v                     v                 │   │
│   │  Auto-backup        Visual Diff          File-level Undo        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   PILLAR 2: NEVER LOSE CONTEXT                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Project Memory ────> Session Logs ────> Prompt Library         │   │
│   │      │                    │                   │                 │   │
│   │      v                    v                   v                 │   │
│   │  Key facts persist    What you did      Reusable prompts        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   PILLAR 3: NEVER WASTE USAGE                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Claude Code Stats ──> Usage Dashboard ──> Cost Tracking        │   │
│   │      │                      │                   │               │   │
│   │      v                      v                   v               │   │
│   │  Token counts          Daily patterns      Model breakdown      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   QUALITY OF LIFE                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Terminal ──────> Quick Commands ──────> GitHub Integration     │   │
│   │      │                  │                      │                │   │
│   │      v                  v                      v                │   │
│   │  Full PTY           npm scripts           Commit/Push/PR        │   │
│   │                     + custom              with security         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### A Typical Session

**Scenario**: You're adding authentication to your API.

1. **Open Maximus** → Select your project from the dashboard
2. **Check status** → See you have 3 snapshots from yesterday, last session was "added user model"
3. **Create snapshot** → Click "Save" → Named "before-auth-work" (your safety net)
4. **Open Terminal tab** → Your shell is ready in the project directory
5. **Run Claude Code** → `claude` in terminal → Start working on auth
6. **Claude makes a mess** → Auth code is broken, files are scrambled
7. **Restore** → Click "Undo" → Back to "before-auth-work" in 2 seconds
8. **Try again** → Better prompt this time → Auth works!
9. **Commit** → Type message in Git panel → Click "Commit & Push"
10. **Security check** → Maximus blocks because `.env` would be committed
11. **Fix** → Add `.env` to `.gitignore` → Commit succeeds
12. **Create PR** → Fill in title/body → PR created on GitHub
13. **Check usage** → Analytics tab shows you've used ~50k tokens today

**Total time saved**: ~15 minutes of manual git commands, zero risk of losing work.

---

## The Three Pillars

Everything in Maximus rolls up into three core value propositions:

### 1. Never Lose Work
Snapshots, rollback, safety nets. One-click undo for when Claude Code goes off the rails.

### 2. Never Lose Context
Project memory, session continuity, smart context loading. Claude starts every session already knowing your project.

### 3. Never Waste Usage
Efficiency coaching, scope checking, usage tracking. Maximize what you get from your subscription limits.

---

## Feature Specifications

### Pillar 1: Never Lose Work

#### Snapshot System
- **Auto-snapshots**: Automatically create checkpoint before each Claude Code session
- **Named snapshots**: User can create named checkpoints with descriptions
- **One-click undo**: Instantly rollback to last snapshot
- **Selective restore**: Restore individual files from a snapshot while keeping others
- **Snapshot browser**: Visual diff between snapshots, see what changed
- **Branch sandbox**: Option to auto-create throwaway git branch for experiments

**Implementation**: Git-based under the hood. Each snapshot is a commit in a shadow `.maximus/snapshots/.git` repo that tracks the project files.

#### Data Model
```typescript
interface Snapshot {
  id: string;              // Git commit SHA
  name: string;            // User-provided or auto-generated
  description?: string;
  timestamp: Date;
  branch: string;          // Git branch at time of snapshot
  filesChanged: number;
  type: 'auto' | 'manual';
}
```

---

### Pillar 2: Never Lose Context

#### Project Memory
Key-value store for project facts that persist across Claude Code sessions.

- **Memory items**: Store architectural decisions, conventions, gotchas
- **Auto-inclusion**: Memory is automatically injected into session context
- **Categories**: Organize by type (architecture, auth, testing, etc.)
- **Quick add**: Add memories from session review or manually

```typescript
interface MemoryItem {
  id: string;
  key: string;           // e.g., "architecture", "auth", "testing"
  value: string;         // The actual content
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Session Logging
Automatic capture of Claude Code sessions for review and learning.

- **Auto-detect**: Detect when Claude Code is running and log activity
- **Markdown export**: Sessions saved as readable markdown
- **Session metadata**: Track files changed, duration, retries, efficiency score
- **Searchable history**: Find past sessions by task, date, or content

```typescript
interface Session {
  id: string;
  projectId: string;
  taskDescription: string;
  startedAt: Date;
  endedAt?: Date;
  filesModified: string[];
  tokensEstimate?: number;
  retryCount: number;
  efficiencyScore?: number;  // Calculated: max(10, 100 - (retries * 15))
  logPath: string;           // Path to markdown log
}
```

#### Context Builder
Smart analysis of codebase to build optimal context for Claude Code.

- **File importance ranking**: Identify key files for a given task
- **Token estimation**: Show token count for files/directories
- **Suggested context**: Based on task description, suggest relevant files
- **Context map**: Cached analysis of project structure

```typescript
interface ContextMap {
  projectRoot: string;
  totalFiles: number;
  totalTokens: number;
  files: FileInfo[];
  lastUpdated: Date;
}

interface FileInfo {
  path: string;
  tokens: number;
  importance: 'high' | 'medium' | 'low';
  type: 'source' | 'config' | 'test' | 'doc' | 'other';
}
```

#### Prompt Library
Save, tag, and retrieve effective prompts.

- **Save prompts**: Store prompts that worked well
- **Tags**: Organize by language, task type, framework
- **Variables**: Support template variables for reuse
- **Search**: Find prompts by tag or content

```typescript
interface Prompt {
  id: string;
  name: string;
  content: string;
  tags: string[];
  variables?: string[];     // e.g., ["componentName", "framework"]
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
}
```

#### CLAUDE.md Generator
Bootstrap project context files quickly.

- **Templates**: Pre-built templates for common project types (API, web app, CLI, library)
- **Auto-detect**: Analyze project and suggest appropriate template
- **Customizable**: Edit generated content before saving

---

### Pillar 3: Never Waste Usage

#### Usage Dashboard
Track and visualize Claude Code usage patterns.

- **Daily/weekly usage**: Visual progress bar of estimated usage
- **Session history**: List of sessions with efficiency scores
- **Trends**: Track efficiency over time
- **Remaining estimate**: "~X tasks remaining at current pace"

```typescript
interface UsageStats {
  date: string;           // ISO date
  sessionsCount: number;
  totalTokensEstimate: number;
  avgEfficiency: number;
  totalRetries: number;
}
```

#### Pre-Flight Check
Validate before starting a Claude Code session.

- **Context scope check**: Warn if context seems too large
- **Task scope check**: Warn if task description is vague or too broad
- **Memory loaded**: Confirm project memory will be included
- **Snapshot ready**: Confirm auto-snapshot will be created

```typescript
interface PreFlightResult {
  passed: boolean;
  checks: {
    contextScoped: { passed: boolean; message?: string };
    taskFocused: { passed: boolean; message?: string };
    memoryLoaded: { passed: boolean; itemCount: number };
    snapshotReady: { passed: boolean };
  };
  suggestions?: string[];
}
```

#### Task Scope Advisor
Help break down large tasks.

- **Scope detection**: Analyze task description for complexity signals
- **Decomposition suggestions**: Recommend breaking into subtasks
- **Historical comparison**: "Similar tasks took X retries on average"

#### Prompt Quality Check
Catch vague prompts before sending.

- **Ambiguity detection**: Flag unclear pronouns, missing specifics
- **Suggestions**: Offer ways to make prompt more specific
- **Skip option**: Power users can bypass

#### Efficiency Learning
Learn from usage patterns over time.

- **Task type analysis**: Track efficiency by type (bug fix, feature, refactor)
- **Pattern detection**: Identify what leads to retries
- **Personalized tips**: Surface relevant suggestions based on history

---

### Extended Feature: Integrated Terminal - IMPLEMENTED

Full PTY terminal embedded in Maximus with developer-focused enhancements.

#### Terminal Features
- **Full PTY emulation**: Via portable-pty, supports interactive programs (vim, htop, etc.)
- **Side panel**: Collapsible panel with quick commands, git status, file explorer
- **Risky command warnings**: Alerts for destructive commands (rm -rf, git reset --hard)
- **Quick commands**: One-click execution of npm scripts and custom commands

#### Terminal Data Model
```typescript
interface QuickCommand {
  id: string;
  name: string;
  command: string;
  category: string;
  description?: string;
}

interface PackageScript {
  name: string;
  command: string;
}
```

---

### Extended Feature: GitHub Integration - IMPLEMENTED

GUI wrapper for `gh` CLI providing complete GitHub workflow without leaving Maximus.

#### Capabilities
- **Repository Status**: Branch, ahead/behind counts, staged/modified/untracked files
- **Git Operations**: Stage all, commit, push, pull
- **Repository Setup**: Initialize git, create GitHub repo (public/private)
- **Configuration**: Set git user.name and user.email
- **Pull Requests**: Create PRs with title and body
- **Authentication**: Leverages existing `gh auth` status

#### GitHub Data Models
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

interface GitRepoInfo {
  isRepo: boolean;
  hasRemote: boolean;
  remoteUrl?: string;
  branch: string;
}

interface CreateRepoResult {
  success: boolean;
  url?: string;
  message: string;
}
```

#### UI States (GitPanel)
The GitPanel component handles 5 distinct states:
1. **gh not installed**: Shows installation instructions
2. **gh not authenticated**: Shows `gh auth login` command
3. **No git repo**: Shows "Initialize Repository" wizard
4. **No remote**: Shows "Create GitHub Repo" form
5. **Full panel**: Shows status, commit form, sync buttons

#### Security
All git operations include mandatory sensitive file detection. Operations are blocked if sensitive files would be committed, with clear error messages.

---

### Extended Feature: Claude Code Analytics - IMPLEMENTED

Native integration with Claude Code's statistics for usage tracking.

#### Data Source
Reads from `~/.claude/` directory:
- `statsig/` - Usage statistics
- `projects/` - Project-specific session data

#### Analytics Data Model
```typescript
interface ClaudeCodeStats {
  version: number;
  lastComputedDate: string;
  dailyActivity: ClaudeCodeDailyActivity[];
  dailyModelTokens: ClaudeCodeDailyModelTokens[];
  modelUsage: Record<string, ClaudeCodeModelUsage>;
  totalSessions: number;
  totalMessages: number;
  longestSession: ClaudeCodeLongestSession | null;
  firstSessionDate: string | null;
  hourCounts: Record<string, number>;
}

interface ClaudeCodeModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUsd: number;
}
```

---

### Extended Feature: Session Memory System - PLANNED

Semantic memory that captures the *meaning* of work sessions, enabling true context continuity across sessions and machines.

#### Problem
The existing "Memory" feature is just a key-value store - useful but dumb. It doesn't automatically capture what you did, what decisions were made, or what's left unfinished.

#### Solution: Claude Code Hooks
Leverage Claude Code's hook system (no extra API cost):
1. **Session Start Hook**: Pulls context from previous sessions
2. **Session End Hook**: Claude Code summarizes the session automatically

#### Data Model
```typescript
interface SessionMemory {
  id: string;
  projectId: string;
  sessionDate: string;           // ISO date
  summary: string;               // AI-generated summary of what was done
  keyDecisions: string[];        // Important decisions made during session
  openThreads: string[];         // Unfinished work / next steps
  filesTouched: string[];        // Files that were modified
  durationMinutes: number;
}

interface WelcomeContext {
  projectId: string;
  lastSession: {
    date: string;
    daysAgo: number;
    summary: string;
    openThreads: string[];
  } | null;
  recentMemories: SessionMemory[];  // Last 5 sessions
  suggestedContinuation: string;    // AI-suggested next step
}
```

#### Hook Integration
```bash
# ~/.claude/settings.json (managed by Maximus)
{
  "hooks": {
    "session_start": ["maximus session-start"],
    "session_end": ["maximus session-end --summarize"]
  }
}
```

#### UX: "Welcome Back" Dashboard
When opening a project after time away:
```
┌─────────────────────────────────────────────────────────────┐
│  WELCOME BACK                                               │
│  Last worked on this project 3 days ago                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LAST SESSION (Dec 11)                                      │
│  "Implemented GitHub integration with security features.    │
│   Added sensitive file detection and git wizard."          │
│                                                             │
│  OPEN THREADS                                               │
│  • PR creation flow needs testing                           │
│  • Consider adding branch management                        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SUGGESTED: "Continue with PR creation testing"             │
│                                                             │
│  [ Start Session ]  [ View Full History ]                   │
└─────────────────────────────────────────────────────────────┘
```

---

### Extended Feature: Cloud Sync (Portability) - PLANNED

Sync Maximus data across multiple development machines using a private GitHub repo.

#### Problem
Session memories, prompts, and settings are only stored locally. Developers who work on multiple machines lose context when switching.

#### Solution: maximus-sync Repository
A dedicated private GitHub repo that stores portable Maximus data.

```
maximus-sync/                  # Private repo (FORCED - cannot be public)
├── settings.json              # App preferences
├── prompts/                   # Prompt library
│   ├── review.md
│   └── refactor.md
└── projects/                  # Per-project memories
    └── {project-hash}/        # SHA256 of project path
        ├── memories.json      # Session summaries
        └── meta.json          # Project metadata
```

#### Local Storage Structure
```
~/.maximus/
├── config.json                # Local config (sync repo URL, etc.)
├── maximus.db                 # SQLite (local cache)
├── sync/                      # Cloned maximus-sync repo
│   └── ...                    # Contents synced from GitHub
└── local/                     # Never synced (large/sensitive)
    └── transcripts/           # Full session logs
```

#### Setup Flow (First-Run Wizard)
1. User opens Maximus for first time on new machine
2. Maximus checks for existing `maximus-sync` repo
3. If found: Clone and restore settings/memories
4. If not found: Create new private repo (FORCED PRIVATE - no option for public)
5. Link complete, auto-sync enabled

**Important**: The setup wizard does NOT offer a public/private choice. The repo is always created as private to prevent accidental exposure of session memories.

#### Sync Operations
```typescript
interface SyncStatus {
  enabled: boolean;
  repoUrl: string | null;        // github.com/user/maximus-sync
  lastSynced: string | null;     // ISO timestamp
  status: 'synced' | 'syncing' | 'offline' | 'error';
  error?: string;
}

// Operations
sync_pull()     // Pull latest from remote
sync_push()     // Push local changes
sync_status()   // Get current sync state
```

#### Auto-Sync Behavior
- **On startup**: Pull latest from sync repo
- **On change**: Debounced push (30s after last change)
- **Conflict resolution**: Last-write-wins (memories are append-mostly)
- **Offline**: Queue changes, sync when online

#### Sensitive Data Scrubbing
Before syncing, scrub potential secrets from memory summaries:
- API keys / tokens (pattern matching)
- Environment variable values
- File paths containing sensitive directories
- Same patterns used for git staging protection

---

## User Interface Specification

### Application Shell

Maximus is a Tauri desktop application with system tray integration.

#### System Tray
- **Icon**: Shows app status (ready, session active)
- **Right-click menu**:
  - Quick Save (snapshot)
  - Undo Last
  - Open Dashboard
  - Today's usage: XX%
  - Settings
  - Quit

#### Main Window
- **Size**: 900x700 default, resizable
- **Navigation**: Tab bar at bottom for main sections
- **Theme**: Dark mode default, light mode option

### Screen Specifications

#### 1. Dashboard (Home)

Primary view showing at-a-glance status.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                 │
│  - Project selector dropdown (left)                                     │
│  - Usage indicator bar (right)                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                           │
│                                                                         │
│  Project Card                                                           │
│  - Project name and path                                                │
│  - Last session timestamp                                               │
│  - Quick stats: snapshots, memories, sessions                           │
│                                                                         │
│  Usage Card                                                             │
│  - Progress bar with percentage                                         │
│  - Sessions today, efficiency, estimated remaining                      │
│                                                                         │
│  Quick Actions (3 large buttons)                                        │
│  - Save Snapshot                                                        │
│  - Undo Last                                                            │
│  - Start Session                                                        │
│                                                                         │
│  Recent Sessions List                                                   │
│  - Task name, time, efficiency score, files changed                     │
│  - Click to view session details                                        │
│                                                                         │
│  Tip Card (contextual)                                                  │
│  - Surface relevant suggestions based on recent activity                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  TAB BAR                                                                │
│  [ Dashboard ]  [ Snapshots ]  [ Memory ]  [ Prompts ]  [ Analytics ]   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2. Session Launcher (Modal)

Triggered by "Start Session" button.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NEW SESSION                                                   [X]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Task Description                                                       │
│  [  Large text input                                                 ]  │
│  [                                                                   ]  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Suggested Context                              Tokens: ~X,XXX          │
│  [ ] Select All                                                         │
│  [x] src/routes/auth.ts                              1,200              │
│  [x] src/services/userService.ts                       890              │
│  [ ] src/routes/inventory.ts                           720              │
│  [+ Add files...]                                                       │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Project Memory (auto-included)                                         │
│  • architecture: repository pattern with services                       │
│  • auth: JWT in httpOnly cookies                                        │
│  [Edit Memory]                                                          │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Suggestions (if any)                                                   │
│  💡 You have a saved prompt "auth-patterns" that might help             │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Pre-Flight Checks                                                      │
│  ✓ Snapshot will be created                                             │
│  ✓ Context is well-scoped                                               │
│  ⚠ Task might be too broad - consider breaking down                     │
│                                                                         │
│                    [ START SESSION ]                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3. Snapshots Screen

Manage and restore checkpoints.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SNAPSHOTS                                        [ + New Snapshot ]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Snapshot List                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ ● before-auth-refactor                              [Restore] [⋯] │ │
│  │   Today 2:30pm · 12 files · main branch · Manual                  │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ ● auto-session-1702834521                           [Restore] [⋯] │ │
│  │   Today 11:15am · 8 files · main branch · Auto                    │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ ● working-inventory-crud                            [Restore] [⋯] │ │
│  │   Yesterday 4:45pm · 15 files · feature/inventory · Manual        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Compare Mode                                                           │
│  [ Select snapshot ] vs [ Select snapshot ]  [ Compare ]                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4. Memory Screen

Manage project context that persists across sessions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROJECT MEMORY                                     [ + Add Memory ]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  These facts are automatically included in every session:               │
│                                                                         │
│  Memory List                                                            │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ architecture                                          [Edit] [X]  │ │
│  │ Repository pattern with services layer. Controllers are thin,     │ │
│  │ business logic lives in services.                                 │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ auth                                                  [Edit] [X]  │ │
│  │ JWT stored in httpOnly cookies. Refresh tokens rotate on use.     │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ testing                                               [Edit] [X]  │ │
│  │ Vitest for unit, supertest for integration. 80% coverage target.  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Import/Export                                                          │
│  [ Import from CLAUDE.md ]  [ Export to CLAUDE.md ]                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 5. Prompts Screen

Save and organize effective prompts.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROMPT LIBRARY                                      [ + New Prompt ]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Search: [                    ]   Filter: [ All Tags      v]            │
│                                                                         │
│  Prompt Grid/List                                                       │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ zod-validation                                         [Use] [⋯]  │ │
│  │ Add Zod validation schema for request body with proper error...   │ │
│  │ Tags: typescript, validation, zod                                 │ │
│  │ Used 8 times · Last used 2 days ago                               │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ refactor-extract                                       [Use] [⋯]  │ │
│  │ Extract the {functionName} function into a separate module...     │ │
│  │ Tags: refactoring, typescript                                     │ │
│  │ Used 3 times · Last used 1 week ago                               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 6. Analytics Screen

Visualize usage patterns and efficiency.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ANALYTICS                                          Period: [This Week] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Overview Cards                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│  │ Sessions: 14    │ │ Avg Efficiency  │ │ Time Saved      │           │
│  │                 │ │ 78%             │ │ ~4.5 hours      │           │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘           │
│                                                                         │
│  Usage Chart (bar chart by day)                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │   █                                                                │ │
│  │   █  █        █                                                    │ │
│  │   █  █  █  █  █  █  █                                              │ │
│  │  Mon Tue Wed Thu Fri Sat Sun                                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Efficiency by Task Type                                                │
│  Bug fixes:      ████████████████████████████ 94%                       │
│  Refactoring:    ██████████████████████░░░░░░ 78%                       │
│  New features:   ████████████████░░░░░░░░░░░░ 61%                       │
│                                                                         │
│  Insights                                                               │
│  💡 Your new feature tasks average 2.4 retries. Try breaking them      │
│     into smaller subtasks.                                              │
│                                                                         │
│  Session History Table                                                  │
│  ┌──────────┬────────────────────┬────────────┬─────────┬───────────┐  │
│  │ Date     │ Task               │ Efficiency │ Retries │ Files     │  │
│  ├──────────┼────────────────────┼────────────┼─────────┼───────────┤  │
│  │ Today    │ auth-refactor      │ 82%        │ 1       │ 4         │  │
│  │ Today    │ add-validation     │ 91%        │ 0       │ 2         │  │
│  └──────────┴────────────────────┴────────────┴─────────┴───────────┘  │
│                                                                         │
│  [ Export Data ]                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 7. Settings Screen

Configure app behavior.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SETTINGS                                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  General                                                                │
│  ─────────────────────────────────────────────────────────────────────  │
│  Theme:                    [ Dark  v]                                   │
│  Start on login:           [x]                                          │
│  Start minimized:          [x]                                          │
│                                                                         │
│  Snapshots                                                              │
│  ─────────────────────────────────────────────────────────────────────  │
│  Auto-snapshot before sessions:     [x]                                 │
│  Keep snapshots for:                [ 30 days v]                        │
│  Max snapshots per project:         [ 50      ]                         │
│                                                                         │
│  Efficiency                                                             │
│  ─────────────────────────────────────────────────────────────────────  │
│  Show pre-flight checks:            [x]                                 │
│  Warn on broad tasks:               [x]                                 │
│  Warn on large context:             [x]                                 │
│  Large context threshold:           [ 50000 ] tokens                    │
│                                                                         │
│  Projects                                                               │
│  ─────────────────────────────────────────────────────────────────────  │
│  Project directories:                                                   │
│  ~/projects                                               [Remove]      │
│  ~/work                                                   [Remove]      │
│  [ + Add Directory ]                                                    │
│                                                                         │
│  Data                                                                   │
│  ─────────────────────────────────────────────────────────────────────  │
│  [ Export All Data ]  [ Clear Analytics ]  [ Reset All ]                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TAURI SHELL                                   │
│              (Rust: filesystem, git ops, system tray)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                        REACT + TYPESCRIPT                               │
│               (Vite, TailwindCSS, shadcn/ui, Zustand)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                           LOCAL DATA                                    │
│              (SQLite via better-sqlite3, JSON files)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Frontend
- **React 18** with TypeScript
- **Vite** for fast dev builds
- **TailwindCSS** for styling
- **shadcn/ui** for polished components
- **Zustand** for state management
- **TanStack Query** for async state
- **Recharts** for analytics visualizations

#### Backend (Tauri/Rust)
- **Tauri 2.0** for desktop shell
- **System tray** integration
- **Native file dialogs**
- **Git operations** via git2-rs or command execution
- **SQLite** for structured data
- **File watching** for project detection

### File Structure

```
max/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/             # Tauri command handlers
│   │   │   ├── snapshots.rs
│   │   │   ├── memory.rs
│   │   │   ├── sessions.rs
│   │   │   ├── projects.rs
│   │   │   └── analytics.rs
│   │   ├── db/                   # Database operations
│   │   │   ├── mod.rs
│   │   │   └── schema.rs
│   │   ├── git/                  # Git operations for snapshots
│   │   │   └── mod.rs
│   │   └── tray/                 # System tray
│   │       └── mod.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                          # React frontend
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── Header.tsx
│   │   ├── dashboard/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── UsageCard.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── RecentSessions.tsx
│   │   │   └── TipCard.tsx
│   │   ├── snapshots/
│   │   │   ├── SnapshotList.tsx
│   │   │   ├── SnapshotItem.tsx
│   │   │   └── CompareView.tsx
│   │   ├── memory/
│   │   │   ├── MemoryList.tsx
│   │   │   ├── MemoryItem.tsx
│   │   │   └── MemoryEditor.tsx
│   │   ├── prompts/
│   │   │   ├── PromptLibrary.tsx
│   │   │   ├── PromptCard.tsx
│   │   │   └── PromptEditor.tsx
│   │   ├── analytics/
│   │   │   ├── OverviewCards.tsx
│   │   │   ├── UsageChart.tsx
│   │   │   ├── EfficiencyBreakdown.tsx
│   │   │   └── SessionTable.tsx
│   │   ├── session/
│   │   │   ├── SessionLauncher.tsx
│   │   │   ├── ContextSelector.tsx
│   │   │   └── PreFlightChecks.tsx
│   │   └── settings/
│   │       └── SettingsForm.tsx
│   │
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useSnapshots.ts
│   │   ├── useMemory.ts
│   │   ├── useSessions.ts
│   │   ├── usePrompts.ts
│   │   └── useAnalytics.ts
│   │
│   ├── stores/
│   │   ├── projectStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── lib/
│   │   ├── tauri.ts              # Tauri invoke wrappers
│   │   ├── tokens.ts             # Token estimation
│   │   └── utils.ts
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Snapshots.tsx
│   │   ├── Memory.tsx
│   │   ├── Prompts.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

### Data Storage

#### Global Data (`~/.maximus/`)
```
~/.maximus/
├── config.json               # Global settings
├── prompts/                  # Prompt library (markdown files)
│   ├── zod-validation.md
│   └── refactor-extract.md
├── maximus.db                    # SQLite database
└── logs/                     # App logs
```

#### Project Data (`project/.maximus/`)
```
project/.maximus/
├── config.json               # Project-specific settings
├── memory.json               # Project memory items
├── context_map.json          # Cached codebase analysis
├── snapshots/                # Git-based checkpoints
│   └── .git/                 # Shadow git repo
└── sessions/                 # Session logs
    ├── 2024-12-15-auth.md
    └── 2024-12-15-validation.md
```

### Database Schema (SQLite)

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  last_opened_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_description TEXT,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  files_modified TEXT,  -- JSON array
  tokens_estimate INTEGER,
  retry_count INTEGER DEFAULT 0,
  efficiency_score INTEGER,
  log_path TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Prompts table
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,  -- JSON array
  variables TEXT,  -- JSON array
  usage_count INTEGER DEFAULT 0,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage stats table (daily aggregates)
CREATE TABLE usage_stats (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,  -- ISO date string
  project_id TEXT,
  sessions_count INTEGER DEFAULT 0,
  tokens_estimate INTEGER DEFAULT 0,
  avg_efficiency REAL,
  total_retries INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Indexes
CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_started ON sessions(started_at);
CREATE INDEX idx_usage_date ON usage_stats(date);
```

---

## CLI Specification

While the GUI is primary, Maximus includes a CLI for scripting and terminal-native workflows.

### Commands

```bash
# Main entry - opens GUI
max

# Quick actions (no GUI)
max save [name]              # Create snapshot
max undo                     # Rollback to last snapshot
max status                   # Show project status

# Project management
max init                     # Initialize Maximus in current directory
max projects                 # List known projects

# Memory
max memory list              # Show all memory items
max memory set <key> <value> # Add/update memory
max memory delete <key>      # Remove memory item

# Prompts
max prompt list              # List saved prompts
max prompt show <name>       # Display prompt content
max prompt save <name>       # Save new prompt (opens editor)

# Snapshots
max snap list                # List snapshots
max snap restore <id>        # Restore specific snapshot
max snap diff <id1> <id2>    # Compare snapshots

# Session
max go                       # Pre-flight + start session
max log                      # Show current/last session log

# Analytics
max stats                    # Show usage statistics
max stats --week             # Weekly breakdown

# Utility
max --version                # Version info
max --help                   # Help
max --headless               # Run without GUI
```

---

## Development Phases

### Phase 1: Foundation (MVP) - COMPLETE
**Goal**: Core loop working end-to-end

- [x] Tauri app shell with system tray
- [x] Project detection and selection
- [x] Dashboard with basic layout
- [x] Snapshot save/restore (git-based)
- [x] Snapshot security: exclusions, sensitive file detection
- [x] Basic session logging
- [x] SQLite database setup
- [x] Secure directory permissions (700 for ~/.maximus/, project/.maximus/)
- [ ] CLI: `max`, `max save`, `max undo` (GUI-focused instead)

### Phase 1.5: Extended Features - COMPLETE
**Goal**: Quality-of-life additions

- [x] Full PTY terminal integration
- [x] Quick commands panel (npm scripts, custom commands)
- [x] Risky command warnings
- [x] GitHub integration (full `gh` CLI wrapper)
- [x] Git operations: init, commit, push, pull, PR creation
- [x] Security: Sensitive file detection before git operations
- [x] Time-travel timeline for snapshots
- [x] Visual diff viewer
- [x] Claude Code analytics integration
- [x] New project wizard with scaffolding

### Phase 2: Context Intelligence - MOSTLY COMPLETE
**Goal**: Smart context management

- [x] Project memory CRUD
- [ ] Memory auto-injection into sessions
- [ ] Context map generation
- [ ] Token estimation
- [ ] Session launcher modal with pre-flight
- [ ] Pre-flight checks
- [ ] CLAUDE.md import/export

### Phase 2.5: Session Memory & Portability - PLANNED
**Goal**: True context continuity across sessions and machines

- [ ] Session Memory System (Claude Code hooks integration)
- [ ] Session end hook to capture AI-generated summaries
- [ ] Session start hook to inject previous context
- [ ] "Welcome Back" dashboard component
- [ ] Cloud Sync setup wizard (FORCED PRIVATE `maximus-sync` repo)
- [ ] Auto-sync: pull on startup, push on changes (debounced)
- [ ] Sensitive data scrubbing before sync
- [ ] Cross-machine portability

### Phase 3: Efficiency Engine - PARTIALLY COMPLETE
**Goal**: Usage optimization

- [x] Prompt library CRUD
- [x] Usage tracking and dashboard
- [x] Analytics visualizations (via Claude Code integration)
- [ ] Efficiency scoring display
- [ ] Task scope advisor
- [ ] Prompt quality checker
- [ ] Pattern learning (basic)

### Phase 4: Polish
**Goal**: Production-ready

- [ ] Settings screen
- [ ] Onboarding flow
- [ ] Keyboard shortcuts
- [x] Snapshot comparison view
- [ ] Export/import functionality
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Cross-platform testing

---

## Design Tokens

### Colors (Dark Theme)
```css
--background: #0a0a0b;
--card: #141416;
--card-hover: #1c1c1f;
--border: #27272a;
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--text-muted: #71717a;
--accent: #3b82f6;         /* Blue */
--accent-hover: #2563eb;
--success: #22c55e;
--warning: #eab308;
--error: #ef4444;
```

### Typography
```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Spacing
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

---

## Success Metrics

1. **Time to first snapshot**: < 2 clicks from app open
2. **Session start time**: < 30 seconds from task idea to Claude Code ready
3. **Undo recovery**: < 5 seconds to rollback
4. **Context accuracy**: 80%+ of suggested files are relevant
5. **Efficiency improvement**: 20%+ fewer retries after 2 weeks of use

---

## Design Decisions

### 1. Claude Code Detection: Manual Sessions

**Decision**: Users manually start/end sessions via the Maximus UI.

**Rationale**:
- The UI already has a "Start Session" button - natural workflow
- No platform-specific detection code (Linux/Windows)
- No edge cases with multiple terminals or false positives
- Auto-detection can be added as a future enhancement

**Workflow**: Click "Start" → auto-snapshot created → run Claude Code → click "End" → session logged.

---

### 2. Token Estimation: Character Ratio

**Decision**: Use ~4 characters = 1 token, displayed as estimates.

**Rationale**:
- Anthropic hasn't released Claude's tokenizer publicly
- tiktoken is OpenAI's tokenizer - would give precise but *wrong* numbers for Claude
- The 4 chars/token heuristic is what Anthropic recommends for estimation
- For "is my context too big?" decisions, ±20% accuracy is sufficient

**UI**: Show as "~12,500 tokens (estimated)" to be transparent about precision.

---

### 3. Efficiency Scoring: Retry-Based

**Decision**: `efficiency = 100 - (retries × 15)` with a floor of 10%.

**Scale**:
| Retries | Score | Meaning |
|---------|-------|---------|
| 0 | 100% | Perfect |
| 1 | 85% | Great |
| 2 | 70% | Good |
| 3 | 55% | Okay |
| 4 | 40% | Rough |
| 5+ | 25-10% | Struggled |

**Rationale**:
- Retries directly measure what costs users time and tokens
- Actionable feedback: high retries → prompt may have been too vague
- Simple to understand and track over time
- Display raw retry count alongside score for full context

---

### 4. Prompt Storage: Global Only

**Decision**: All prompts stored in `~/.maximus/prompts/`, available across all projects.

**Rationale**:
- Prompts are reusable task templates ("Add validation", "Write tests")
- Project-specific knowledge belongs in Memory, not prompts
- When a session starts, Claude gets prompt + project memory together
- Avoids fragmenting the prompt library across projects
- Variants can be saved as separate prompts ("auth-jwt" vs "auth-session")

---

### 5. Snapshot Storage: Shadow Git Repository

**Decision**: Snapshots stored in a separate git repo at `.maximus/snapshots/.git`.

**Rationale**:
- Clean separation from project's git history (no checkpoint commits polluting `git log`)
- Full git features: efficient delta storage, diffing, partial file restore
- Works on any project, even those not using git
- One-click undo via checkout from shadow repo
- `.maximus/` added to project's `.gitignore`

**Implementation**: Use git2-rs to manage the shadow repo that tracks project root.

---

## Security Considerations

### Primary Concern: Snapshots Capturing Secrets

The shadow git repo snapshots the entire project directory, which may include sensitive files:
- `.env` files with API keys
- `credentials.json`, `*.pem`, private keys
- Config files with database passwords
- `.npmrc` / `.pypirc` with auth tokens

#### Mitigations (Required for Phase 1)

1. **Respect `.gitignore`**: When creating snapshots, honor the project's existing `.gitignore` rules
2. **Default exclusions**: Always exclude common secret patterns regardless of `.gitignore`
3. **Custom exclusions**: Support `.maximusignore` file for project-specific additions
4. **Sensitive file warning**: Alert user in UI when snapshot includes files matching sensitive patterns

#### Default Exclusion Patterns

```rust
const DEFAULT_SNAPSHOT_EXCLUSIONS: &[&str] = &[
    // Environment and secrets
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",

    // Credentials
    "**/credentials.*",
    "**/secrets.*",
    "**/*.secret",
    "**/secret_key*",

    // Package manager auth
    ".npmrc",
    ".pypirc",
    ".gem/credentials",

    // Cloud provider configs with potential secrets
    ".aws/credentials",
    ".azure/",
    "gcloud/",

    // IDE and local configs that may have tokens
    ".idea/**/workspace.xml",
    ".vscode/*.log",
];
```

#### UI Requirements

**First-run notice** (shown once):
> "Maximus excludes common secret files (.env, keys, credentials) from snapshots. Review Settings → Snapshot Exclusions to customize."

**Snapshot creation**: If files matching sensitive patterns are detected and NOT excluded, show warning:
> "⚠️ This snapshot may include sensitive files: .env.local, api_key.json. [Exclude] [Include Anyway]"

---

### Secondary Security Measures

| Area | Risk | Mitigation |
|------|------|------------|
| **Data directory permissions** | Other users on machine could read ~/.maximus/ | Create with 700 (owner-only) permissions on Linux |
| **Project data permissions** | .maximus/ in project readable by others | Create with restrictive permissions |
| **SQLite database** | Session data, prompts stored unencrypted | Acceptable for local app; document that data is local-only |
| **Session logs** | May contain sensitive content user typed | Store with 600 permissions; consider optional encryption later |
| **Tauri IPC** | Malicious web content invoking commands | Use Tauri 2.0 strict command allowlisting (default) |

---

### GitHub Integration Security - IMPLEMENTED

The GitHub integration includes mandatory security checks that cannot be bypassed:

#### Sensitive File Detection
Before any `git add` or `create_github_repo` operation, the system scans for sensitive files:

```rust
const SENSITIVE_PATTERNS: &[&str] = &[
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
    "credentials.json",
    "secrets.json",
    "service-account.json",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    "id_rsa",
    "id_ed25519",
    ".npmrc",
    ".pypirc",
];
```

Additionally, files containing `secret`, `password`, or `apikey` in their names are flagged.

#### Behavior
1. **git_stage_all()**: Blocks with error listing sensitive files
2. **git_commit()**: Inherits protection from stage_all
3. **create_github_repo()**: Checks before creating repo, blocks with warning
4. All operations provide clear error messages instructing user to add files to `.gitignore`

#### Example Error Message
```
SECURITY WARNING: Cannot stage - sensitive files detected:
- .env
- config/credentials.json

Add them to .gitignore first.
```

---

### Implementation Checklist (Phase 1) - COMPLETE

- [x] Implement snapshot exclusion system respecting `.gitignore`
- [x] Add default exclusion patterns for common secrets
- [ ] Support `.maximusignore` file (planned)
- [x] Create `~/.maximus/` with 700 permissions
- [x] Create `project/.maximus/` with 700 permissions
- [x] Add sensitive file detection for git operations
- [ ] Show first-run security notice (planned)

### Implementation Checklist (GitHub Security) - COMPLETE

- [x] Sensitive file pattern matching
- [x] Block git_stage_all on sensitive files
- [x] Block create_github_repo on sensitive files
- [x] Clear error messages with file list
- [x] Instructions to add to .gitignore
- [x] Check both tracked and untracked files
- [x] Respect existing .gitignore patterns
