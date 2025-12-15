# Maximus

A desktop companion for Claude Code that eliminates the friction of AI-assisted coding.

## The Problem

Working with Claude Code is powerful, but painful:

| Problem | What Happens |
|---------|--------------|
| **Claude breaks things** | You spend 20 minutes undoing changes manually |
| **Context amnesia** | Every session starts from scratch - "What were we doing?" |
| **Blind usage** | No idea how much quota you've used until you hit the wall |
| **Git friction** | Constantly switching to terminal for commits |

## The Solution

Maximus wraps Claude Code with safety nets and quality-of-life features:

```
Open Project → Create Snapshot → Work in Terminal → Restore if Broken → Commit & Push
```

## Features

### Never Lose Work
- **One-click snapshots** - Save your project state before risky changes
- **Instant restore** - Undo Claude's mistakes in seconds
- **Time-travel timeline** - Visual history of all snapshots
- **File-level restore** - Cherry-pick specific files from any snapshot
- **Visual diff viewer** - See exactly what changed

### Never Lose Context
- **Project memory** - Persistent facts about your codebase
- **Session history** - Track what was done and when
- **Claude Code integration** - Native stats and session data
- **Coming soon**: Semantic session memory with AI-generated summaries

### Never Waste Usage
- **Usage tracking** - See token consumption by model
- **Cost tracking** - Know exactly what you're spending
- **Activity patterns** - Understand your coding habits
- **Session analytics** - Efficiency scores and insights

### Quality of Life
- **Integrated terminal** - Full PTY with quick commands panel
- **GitHub GUI** - Commit, push, pull, create PRs without leaving the app
- **New project wizard** - Scaffold projects from templates
- **Risky command warnings** - Protection from destructive operations
- **Sensitive file detection** - Never accidentally commit secrets

## Screenshots

*Coming soon*

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

## Installation

### Prerequisites
- Node.js 18+
- Rust (via rustup)
- GitHub CLI (`gh`) for GitHub features

### Build from Source

```bash
# Clone the repo
git clone https://github.com/yourusername/maximus.git
cd maximus

# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
src/                    # React frontend
├── components/
│   ├── ui/             # shadcn components
│   ├── layout/         # App shell, tabs, header
│   ├── dashboard/      # Home screen components
│   ├── terminal/       # Terminal + git panel
│   └── snapshots/      # Snapshot management
├── hooks/              # React Query hooks
├── stores/             # Zustand stores
└── pages/              # Main page components

src-tauri/              # Rust backend
├── src/
│   ├── commands/       # Tauri IPC handlers
│   ├── db/             # SQLite operations
│   ├── git/            # Git operations
│   ├── pty/            # Terminal PTY
│   └── tray/           # System tray
```

## Roadmap

### Phase 1: Foundation - Complete
- Tauri app shell with system tray
- Project detection and selection
- Git-based snapshots with restore
- SQLite database
- Dashboard with quick actions

### Phase 1.5: Extended Features - Complete
- Full PTY terminal integration
- GitHub integration (commit, push, pull, PR)
- Claude Code analytics integration
- Time-travel timeline
- Visual diff viewer
- New project wizard

### Phase 2.5: Session Memory & Portability - Planned
- Session memory via Claude Code hooks
- "Welcome Back" dashboard with context
- Cloud sync via private GitHub repo
- Cross-machine portability

### Phase 3: Efficiency Engine - In Progress
- Prompt library
- Usage optimization suggestions
- Task scope advisor

## Development

```bash
# Start dev server
npm run tauri dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build production
npm run tauri build
```

## Security

Maximus takes security seriously:

- **Sensitive file detection** - Blocks committing `.env`, keys, credentials
- **Secure storage** - `~/.maximus/` directory uses 700 permissions
- **No telemetry** - All data stays local (sync is opt-in to your own repo)
- **Open source** - Audit the code yourself

## Contributing

Contributions welcome! Please read the project spec in `PROJECT_SPEC.md` before submitting PRs.

## License

MIT

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Inspired by the need to stop losing work to Claude Code mistakes
