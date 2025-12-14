# Getting Started with Maximus Development

## Quick Start

### Prerequisites
- Node.js 18+
- Rust (via rustup)
- Tauri CLI

### Install Dependencies

```bash
# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# Install Node dependencies
npm install
```

### Project Setup

```bash
# Create the project
npm create tauri-app@latest maximus -- --template react-ts

cd maximus

# Add dependencies
npm install zustand @tanstack/react-query recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Add shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card dialog input tabs badge scroll-area separator
```

### Directory Structure to Create

```bash
# Frontend directories
mkdir -p src/components/{ui,layout,dashboard,snapshots,memory,prompts,analytics,session,settings}
mkdir -p src/{hooks,stores,pages,lib}

# Backend directories  
mkdir -p src-tauri/src/{commands,db,git,tray}
```

### Development

```bash
# Start dev server (frontend + backend)
npm run tauri dev
```

## Implementation Order

### Day 1: App Shell
1. Set up Tauri with React
2. Configure TailwindCSS and shadcn/ui
3. Create AppShell layout with TabBar
4. Add system tray with basic menu
5. Create placeholder pages

### Day 2: Snapshots Core
1. Implement git operations in Rust
2. Create snapshot Tauri commands
3. Build SnapshotList and SnapshotItem components
4. Wire up save/restore functionality
5. Add CLI commands: `max save`, `max undo`

### Day 3: Project & Database
1. Set up SQLite with rusqlite
2. Create database schema
3. Implement project detection
4. Build project selector in header
5. Create Dashboard page layout

### Day 4: Memory System
1. Implement memory storage (JSON)
2. Create memory Tauri commands
3. Build MemoryList and MemoryEditor components
4. Add memory page

### Day 5: Session Logging
1. Create session data structures
2. Implement session logging
3. Build SessionLauncher modal
4. Add RecentSessions component to Dashboard

### Day 6: Analytics & Polish
1. Create UsageStats aggregation
2. Build analytics charts with Recharts
3. Add pre-flight checks
4. Polish UI and fix bugs

## Key Files to Start With

### src/App.tsx
```tsx
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

export default App;
```

### src-tauri/src/main.rs
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::snapshots::create_snapshot,
            commands::snapshots::list_snapshots,
            commands::snapshots::restore_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### src-tauri/Cargo.toml additions
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
rusqlite = { version = "0.31", features = ["bundled"] }
git2 = "0.18"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
```

## Useful Commands

```bash
# Tauri dev with verbose logging
RUST_LOG=debug npm run tauri dev

# Build for production
npm run tauri build

# Run Rust tests
cd src-tauri && cargo test

# Type check frontend
npm run typecheck

# Lint
npm run lint
```

## CI/CD with GitHub Actions

The project includes two workflow files for automated builds:

### Setup

Copy the workflow files to your repo:
```bash
mkdir -p .github/workflows
cp github-workflows/*.yml .github/workflows/
```

### Workflows

**ci.yml** - Runs on every push/PR to `main`:
- Lints and type-checks frontend
- Runs Rust checks (fmt, clippy)
- Runs Rust tests
- Builds debug version to verify compilation

**build.yml** - Runs when you create a version tag:
- Builds release versions for Linux and Windows
- Creates `.deb`, `.AppImage` (Linux)
- Creates `.msi`, `.exe` (Windows)
- Drafts a GitHub Release with all artifacts

### Creating a Release

```bash
# Tag a version
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will:
# 1. Build for Linux and Windows
# 2. Create a draft release with installers attached
# 3. You review and publish the release
```

## Troubleshooting

### Tauri build fails
```bash
# Update Rust
rustup update

# Clear cargo cache
cargo clean
```

### SQLite issues
Make sure you're using `rusqlite` with the `bundled` feature to include SQLite.

### System tray not showing
Check `tauri.conf.json` has tray configuration and the icon files exist.

## Resources

- [Tauri Docs](https://tauri.app/v2/guides/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [git2-rs](https://docs.rs/git2/latest/git2/)
- [rusqlite](https://docs.rs/rusqlite/latest/rusqlite/)
