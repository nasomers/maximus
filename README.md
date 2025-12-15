# Maximus

A single desktop app for the entire Claude Code workflow - from project creation to deployment.

## What Is Maximus?

Maximus is a desktop application that wraps your terminal-based Claude Code workflow with project management, safety nets, and quality-of-life tools.

Instead of juggling multiple windows, CLI commands, and manual backups, you work inside Maximus:

1. **Create a project** - Scaffold from templates or initialize existing code
2. **Plan your work** - Document architecture, store project memory, save reusable prompts
3. **Code with confidence** - Full terminal with one-click snapshots before risky changes
4. **Recover from mistakes** - Restore any snapshot instantly when Claude breaks something
5. **Ship it** - Commit, push, and create PRs without leaving the app
6. **Learn and improve** - Track usage, review session history, refine your workflow

## The Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAXIMUS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   CREATE          PLAN            CODE            SHIP          │
│   ──────          ────            ────            ────          │
│   New project     Project memory  Terminal        Git status    │
│   Templates       Prompt library  Snapshots       Commit/Push   │
│   Scaffolding     Architecture    Quick cmds      Pull requests │
│                   notes           File explorer                 │
│                                                                 │
│   ◄──────────────── All in one window ──────────────────►       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Why Maximus Exists

Claude Code is powerful but working with it has friction:

| Friction | How Maximus Helps |
|----------|-------------------|
| Claude sometimes breaks working code | Take snapshots before changes, restore in one click |
| Starting fresh every session | Project memory persists context across sessions |
| Rewriting the same prompts | Prompt library with tags and variables |
| Switching between terminal, git GUI, file browser | Everything in one app |
| No visibility into usage | Built-in analytics from Claude Code stats |
| Accidentally committing secrets | Sensitive file detection blocks dangerous commits |
| Repetitive git commands | GUI buttons for commit, push, pull, PR |
| Settings lost on new machine | Sync prompts and memories to your private GitHub repo |

## Core Features

### Project Management
- **New project wizard** - Create projects from templates (React, Tauri, etc.)
- **Project memory** - Store facts about your codebase that persist across sessions
- **Recent projects** - Quick access to your work

### Prompt Library
- **Save reusable prompts** - Store prompts you use repeatedly
- **Tag organization** - Categorize prompts by purpose (refactor, review, debug, etc.)
- **Variable support** - Use `{{placeholders}}` for dynamic prompts
- **Usage tracking** - See which prompts you use most

### Terminal & Development
- **Full PTY terminal** - Real shell experience, not a limited emulator
- **Quick commands panel** - One-click npm scripts and custom commands
- **File explorer** - Browse and open files without leaving the app
- **Risky command warnings** - Alerts before destructive operations

### Snapshots (Safety Net)
- **One-click save** - Snapshot your entire project state
- **Instant restore** - Undo Claude's mistakes in seconds
- **Time-travel timeline** - Visual history of all snapshots
- **Visual diff viewer** - See exactly what changed between snapshots
- **File-level restore** - Cherry-pick specific files from any point
- **Snapshot comparison** - Compare any two snapshots side-by-side

### GitHub Integration
- **Git status** - See branch, changes, ahead/behind at a glance
- **Commit & push** - Stage, commit, and push with buttons
- **Pull requests** - Create PRs directly from the app
- **Repository setup** - Initialize git and create GitHub repos
- **Sensitive file detection** - Blocks `.env`, keys, credentials from commits

### Analytics
- **Claude Code stats** - Token usage, costs, session history
- **Activity patterns** - When and how you use Claude
- **Model breakdown** - Usage by Opus, Sonnet, Haiku
- **Cost tracking** - Know what you're spending

### Session Memory (Claude Code Hooks)
- **One-click setup** - Click "Enable Session Memory" in the WelcomeBack card
- **Automatic capture** - Hooks capture session data when Claude Code stops
- **AI summaries** - Generate rich summaries with key decisions and open threads
- **Context injection** - Previous session context injected when starting new sessions

### Cloud Sync (In Progress)
- **Cross-machine portability** - Work on multiple dev machines seamlessly
- **Private sync repo** - Your prompts and memories sync to `maximus-sync` (private GitHub repo)
- **Sensitive data scrubbing** - Secrets are stripped before syncing

## What Maximus Is Not

- **Not a Claude Code replacement** - You still use Claude Code in the terminal, Maximus wraps it
- **Not an IDE** - It's a companion app, not a code editor
- **Not cloud-dependent** - All data stays local (optional sync to your own private repo)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Tauri 2.0 (Rust) |
| Frontend | React 18, TypeScript, TailwindCSS |
| Components | shadcn/ui |
| State | Zustand, TanStack Query |
| Database | SQLite |
| Terminal | portable-pty |

## Platform Support

| Platform | Status | Downloads |
|----------|--------|-----------|
| **Linux** | Supported | `.deb`, `.AppImage` |
| **macOS** | Supported | `.dmg`, `.app` |
| **Windows** | Supported | `.msi`, `.exe` |

### Platform Notes

**Linux**
- Full support, tested on Ubuntu 22.04+
- Requires webkit2gtk for the webview

**macOS**
- Full support on macOS 11+
- App is unsigned - on first launch, right-click → Open to bypass Gatekeeper
- Or run: `xattr -cr /Applications/Maximus.app`

**Windows**
- Full support on Windows 10/11
- Terminal auto-detects: PowerShell 7 (pwsh) → Windows PowerShell → cmd.exe

## Installation

### Download Release (Recommended)

Download the latest release for your platform from [GitHub Releases](https://github.com/nasomers/maximus/releases).

### Build from Source

#### Prerequisites
- Node.js 18+
- Rust (via [rustup](https://rustup.rs))
- GitHub CLI (`gh`) for GitHub features

#### Linux Dependencies
```bash
# Ubuntu/Debian
sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
```

#### Build
```bash
git clone https://github.com/nasomers/maximus.git
cd maximus
npm install
npm run tauri dev     # Development
npm run tauri build   # Production build
```

Build outputs:
- Linux: `src-tauri/target/release/bundle/deb/` and `appimage/`
- macOS: `src-tauri/target/release/bundle/dmg/` and `macos/`
- Windows: `src-tauri/target/release/bundle/msi/` and `nsis/`

## Roadmap

### Complete
- Project creation and management
- Snapshot system with time-travel and restore
- Full terminal integration with quick commands
- GitHub integration (commit, push, pull, PR)
- Claude Code analytics integration
- Prompt library with tags and variables
- Project memory system (manual key-value storage)
- Visual diff viewer and snapshot comparison
- "Welcome back" dashboard with session context
- Session memory hooks infrastructure (Claude Code integration)
- Toast notifications for user feedback
- Delete confirmation dialogs for Memory and Prompts
- Real-time usage stats in header from Claude Code data

### In Progress
- Cross-machine sync via private `maximus-sync` GitHub repo

### Future Ideas

#### Token Efficiency (Get More Code Per Dollar)

**Prompt Prefix Injection** *(High Priority)*
- Auto-inject user preferences into every prompt via `UserPromptSubmit` hook
- Per-project settings: "be concise," "no over-engineering," "match existing patterns"
- Toggle between "verbose" and "code only" modes
- Reduces wasted output tokens on explanations you don't need

**Live Cost Indicator** *(High Priority)*
- Real-time token counter visible during sessions
- Estimated dollar cost updated live
- Makes waste immediately visible so you can course-correct

**"What Failed" Memory** *(High Priority)*
- Track rejected approaches per project
- Auto-inject as context: "Previously tried X, didn't work because Y"
- Prevents Claude from repeating the same mistakes across sessions

**Spend Alerts**
- Configurable thresholds: notify at $10/day, $30/week, etc.
- Visual warning when approaching limits
- Daily/weekly spending summaries

#### Session Efficiency

**Codebase Index**
- Pre-compute project structure on init (file tree, exports, component list)
- Inject summary at session start so Claude doesn't re-explore
- Update index when files change
- Reduces "orientation" token burn at session start

**Activity Indicator**
- Parse terminal output to show what Claude is doing
- "Reading files (3)..." "Running command..." "Writing code..."
- Helps you know when to interrupt vs. wait

**Prominent Interrupt Button**
- Very visible "Stop" button during Claude operations
- Quick redirect input without losing context
- Cancel before Claude wastes tokens on wrong approach

**Approach Preview**
- Surface Claude's plan before it starts coding
- Approve/reject before token spend
- Catches wrong directions early

#### Context Continuity

**Semantic Memory System** *(Ambitious)*
- Similar to [RLabs Memory](https://github.com/RLabs-Inc/memory)
- AI-curated memories extracted from session transcripts
- Selective injection based on message relevance
- Only surfaces what matters for the current prompt

**Session Handoff Notes**
- Prompt to capture decisions at session end
- Structured format: decisions made, open threads, next steps
- Auto-inject on next session start

**CLAUDE.md Integration**
- UI for editing CLAUDE.md directly in Maximus
- Templates for common sections (architecture, patterns, conventions)
- Reminder to update after significant sessions

#### Snapshots & Safety

**Auto-Checkpoint on Risky Commands**
- Detect risky operations before they run
- Auto-create snapshot with option to cancel
- More proactive than current warning system

**Snapshot Annotations**
- Add notes to snapshots after the fact
- "This was before the auth refactor that broke everything"
- Searchable snapshot history

#### Analytics & Insights

**Cost Per Task Type**
- Track which types of prompts cost most
- "Refactoring costs 3x more than bug fixes"
- Optimize workflow based on data

**Session Efficiency Score**
- Tokens spent vs. code output ratio
- Track improvement over time
- Identify wasteful patterns

**Command Success Rate**
- Which Claude commands succeed vs. fail
- Which file types cause most retries
- Data-driven workflow optimization

#### UX Improvements

**Keyboard Shortcuts**
- Global hotkeys for common actions
- Quick snapshot: Cmd+S
- Interrupt Claude: Escape
- Toggle terminal panel: Cmd+T

**Compact Mode**
- Minimal UI for focused coding
- Just terminal + essential controls
- Expand panels on demand

**Multi-Terminal Tabs**
- Multiple terminal instances
- Different directories/tasks in parallel
- Tab-based switching

### Revisit / Reconsider
- Session memory AI summaries (may be redundant with CLAUDE.md discipline)
- Prompt library (evaluate actual usage after daily use)
- Project memory key-value store (may overlap with CLAUDE.md)

## Security

- Sensitive file detection prevents committing secrets
- Local-first: all data in `~/.maximus/` with 700 permissions
- Sync repo is forced private (no option to make it public)
- No telemetry or analytics sent anywhere
- Open source - audit it yourself

## License

MIT
