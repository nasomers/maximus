# Maximus

A terminal-first desktop companion for Claude Code. Beautiful, fast, and focused on one thing: making your Claude Code sessions as efficient as possible.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Project ▾]                              [$2.47 ↑]  [⚡ 12.3k]    [⚙]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                │ Git: main ✓           │
│                                                │ +3 files · ahead 2    │
│                                                │ [Commit] [Push]       │
│                                                │─────────────────────  │
│           █ T E R M I N A L █                  │ Snapshots             │
│                                                │ ● 2m ago "pre-refac"  │
│    $ claude                                    │ ○ 1h ago "working"    │
│    ╭────────────────────────────╮              │ [Save] [Undo]         │
│    │ Claude is thinking...     │              │─────────────────────  │
│    ╰────────────────────────────╯              │ Quick Commands        │
│                                                │ ▸ npm run dev         │
│                                                │ ▸ npm test            │
│                                                │ ▸ npm run build       │
├────────────────────────────────────────────────┴───────────────────────┤
│ [✓ concise mode] [2 failed approaches] [CLAUDE.md]    $4.20 · 45.2k tk │
└─────────────────────────────────────────────────────────────────────────┘
```

## Philosophy

**Terminal first.** The terminal is where you work. Everything else supports it.

**Efficiency over features.** Every pixel should help you get more code per dollar.

**Beautiful by default.** Dark theme done right. Smooth animations. No jank.

## Core Features

### Rich Terminal Environment
- **Tabs & splits** - Multiple sessions, side by side
- **Click anything** - File paths open in editor, URLs open in browser
- **Command status** - Exit codes, durations, timestamps
- **Search** - Find anything in scrollback (Ctrl+F)
- **Notifications** - Know when long commands finish

### Claude-Aware
- **Activity indicator** - See when Claude is reading, thinking, writing
- **One-click interrupt** - Stop Claude before it wastes tokens (Escape)
- **Live cost tracking** - See dollars and tokens in real-time
- **Prompt injection** - Auto-add your preferences to every prompt

### Sidebar Widgets (Always Visible)
- **Git status** - Branch, changes, commit & push buttons
- **Snapshots** - Save/restore with one click
- **Quick commands** - npm scripts, custom commands

### Bottom Bar
- **Concise mode toggle** - Inject "be concise" into prompts
- **Failed approaches** - Track what didn't work, prevent repeats
- **CLAUDE.md editor** - Quick access to project context
- **Session cost** - Dollars spent this session
- **Token counter** - Running token total

## Keyboard-Driven

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Command palette |
| Ctrl+T | New terminal tab |
| Ctrl+W | Close tab |
| Ctrl+\ | Split pane |
| Ctrl+S | Quick snapshot |
| Ctrl+Z | Restore last snapshot |
| Ctrl+B | Toggle sidebar |
| Ctrl+Shift+C | Copy last output |
| Escape | Interrupt Claude |
| Ctrl+F | Search terminal |

## Design

**Dark theme** with depth, not flat black. Subtle gradients, glassmorphism, neon accents.

**Smooth animations** everywhere. Panels slide, outputs fade in, success states animate.

**Status at a glance.** Green checkmarks, red X (with shake), pulsing activity dots.

**Great typography.** JetBrains Mono with ligatures. Readable at any size.

**Themes included:** Dracula, Nord, Tokyo Night, Monokai, or our signature look.

## What Maximus Is NOT

- **Not a Claude Code replacement** - It wraps your terminal, Claude runs inside
- **Not an IDE** - It's a terminal companion, not a code editor
- **Not bloated** - Terminal + essential widgets, nothing more

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Tauri 2.0 (Rust) |
| Frontend | React 18, TypeScript, TailwindCSS |
| Components | shadcn/ui + custom |
| State | Zustand, TanStack Query |
| Database | SQLite |
| Terminal | portable-pty, xterm.js |

## Installation

### Download
Grab the latest release for your platform from [Releases](https://github.com/nasomers/maximus/releases).

| Platform | Format |
|----------|--------|
| Linux | `.deb`, `.AppImage` |
| macOS | `.dmg` |
| Windows | `.msi`, `.exe` |

### Build from Source

```bash
# Prerequisites: Node.js 18+, Rust

# Linux dependencies (Ubuntu/Debian)
sudo apt-get install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev

# Build
git clone https://github.com/nasomers/maximus.git
cd maximus
npm install
npm run tauri dev     # Development
npm run tauri build   # Production
```

## Roadmap

### Now
- [ ] Terminal tabs and split panes
- [ ] Sidebar widgets (Git, Snapshots, Quick Commands)
- [ ] Command status indicators
- [ ] Keyboard shortcuts + command palette
- [ ] Bottom bar with cost tracking
- [ ] Visual polish (animations, themes)

### Next
- [ ] Prompt prefix injection via hooks
- [ ] "What failed" memory tracking
- [ ] Claude activity detection
- [ ] Desktop notifications
- [ ] Clickable paths/URLs in terminal

### Later
- [ ] Multi-theme support
- [ ] Sound design
- [ ] Custom theme builder
- [ ] Session recording/replay

## License

MIT
