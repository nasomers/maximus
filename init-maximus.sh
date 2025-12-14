#!/bin/bash

# Maximus Project Initialization Script
# Run this after creating the base Tauri project

set -e

echo "🚀 Initializing Maximus project structure..."

# Create frontend directories
echo "📁 Creating frontend directories..."
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/dashboard
mkdir -p src/components/snapshots
mkdir -p src/components/memory
mkdir -p src/components/prompts
mkdir -p src/components/analytics
mkdir -p src/components/session
mkdir -p src/components/settings
mkdir -p src/hooks
mkdir -p src/stores
mkdir -p src/pages
mkdir -p src/lib

# Create backend directories
echo "📁 Creating backend directories..."
mkdir -p src-tauri/src/commands
mkdir -p src-tauri/src/db
mkdir -p src-tauri/src/git
mkdir -p src-tauri/src/tray

# Create placeholder files
echo "📄 Creating placeholder files..."

# Layout components
cat > src/components/layout/AppShell.tsx << 'EOF'
import { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { Header } from './Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
EOF

cat > src/components/layout/Header.tsx << 'EOF'
import { useState } from 'react';

export function Header() {
  const [projectName] = useState('inventory-api');
  const [usage] = useState(42);

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{projectName}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">Usage:</div>
        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all" 
            style={{ width: `${usage}%` }}
          />
        </div>
        <span className="text-sm">{usage}%</span>
      </div>
    </header>
  );
}
EOF

cat > src/components/layout/TabBar.tsx << 'EOF'
import { useState } from 'react';
import { Home, History, Brain, FileText, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'snapshots', label: 'Snapshots', icon: History },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'prompts', label: 'Prompts', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function TabBar() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <nav className="flex items-center justify-around border-t border-border py-2">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === id 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </nav>
  );
}
EOF

# Dashboard page
cat > src/pages/Dashboard.tsx << 'EOF'
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { UsageCard } from '../components/dashboard/UsageCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentSessions } from '../components/dashboard/RecentSessions';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <ProjectCard />
      <UsageCard />
      <QuickActions />
      <RecentSessions />
    </div>
  );
}
EOF

# Dashboard components
cat > src/components/dashboard/ProjectCard.tsx << 'EOF'
import { Card, CardContent } from '../ui/card';
import { Folder } from 'lucide-react';

export function ProjectCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Folder className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">inventory-api</h2>
            <p className="text-sm text-muted-foreground">~/projects/inventory-api</p>
            <p className="text-sm text-muted-foreground mt-1">Last session: 2 hours ago</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span>● 3 snapshots</span>
              <span>● 4 memories</span>
              <span>● 12 sessions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
EOF

cat > src/components/dashboard/UsageCard.tsx << 'EOF'
import { Card, CardContent } from '../ui/card';

export function UsageCard() {
  const usage = 42;
  const sessions = 3;
  const efficiency = 78;
  const remaining = 6;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">Today's Usage</h3>
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-primary transition-all" 
            style={{ width: `${usage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Sessions: {sessions}</span>
          <span>Efficiency: {efficiency}%</span>
          <span>Est. remaining: ~{remaining} tasks</span>
        </div>
      </CardContent>
    </Card>
  );
}
EOF

cat > src/components/dashboard/QuickActions.tsx << 'EOF'
import { Button } from '../ui/button';
import { Save, Undo2, Play } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Button variant="outline" className="h-20 flex-col gap-2">
        <Save className="w-5 h-5" />
        <span>Save</span>
      </Button>
      <Button variant="outline" className="h-20 flex-col gap-2">
        <Undo2 className="w-5 h-5" />
        <span>Undo</span>
      </Button>
      <Button className="h-20 flex-col gap-2">
        <Play className="w-5 h-5" />
        <span>Start</span>
      </Button>
    </div>
  );
}
EOF

cat > src/components/dashboard/RecentSessions.tsx << 'EOF'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const sessions = [
  { id: 1, task: 'auth-refactor', time: 'Today 2:34pm', efficiency: 82, files: 4 },
  { id: 2, task: 'add-validation', time: 'Today 11:20am', efficiency: 91, files: 2 },
  { id: 3, task: 'fix-inventory-bug', time: 'Yesterday', efficiency: 67, files: 6 },
];

export function RecentSessions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.map((session) => (
          <div 
            key={session.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
          >
            <div>
              <div className="font-medium">{session.task}</div>
              <div className="text-sm text-muted-foreground">{session.time}</div>
            </div>
            <div className="text-right">
              <div className="text-sm">{session.efficiency}% eff</div>
              <div className="text-sm text-muted-foreground">{session.files} files</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
EOF

# Stores
cat > src/stores/projectStore.ts << 'EOF'
import { create } from 'zustand';

interface Project {
  id: string;
  name: string;
  path: string;
  lastOpenedAt?: Date;
}

interface ProjectStore {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  projects: [],
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
}));
EOF

# Lib
cat > src/lib/tauri.ts << 'EOF'
import { invoke } from '@tauri-apps/api/core';

// Snapshots
export async function createSnapshot(projectId: string, name: string, description?: string) {
  return invoke('create_snapshot', { projectId, name, description });
}

export async function listSnapshots(projectId: string) {
  return invoke('list_snapshots', { projectId });
}

export async function restoreSnapshot(projectId: string, snapshotId: string) {
  return invoke('restore_snapshot', { projectId, snapshotId });
}

// Memory
export async function getMemory(projectId: string) {
  return invoke('get_memory', { projectId });
}

export async function setMemory(projectId: string, key: string, value: string) {
  return invoke('set_memory', { projectId, key, value });
}

// Projects
export async function listProjects() {
  return invoke('list_projects');
}

export async function initProject(path: string) {
  return invoke('init_project', { path });
}
EOF

cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Rough token estimation: ~4 chars per token
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Efficiency score: 100 - (retries * 15), floor of 10
export function calculateEfficiency(retries: number): number {
  return Math.max(10, 100 - retries * 15);
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return `Today ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (days === 1) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}
EOF

# Rust command stubs
cat > src-tauri/src/commands/mod.rs << 'EOF'
pub mod snapshots;
pub mod memory;
pub mod projects;
pub mod sessions;
EOF

cat > src-tauri/src/commands/snapshots.rs << 'EOF'
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Snapshot {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub timestamp: String,
    pub branch: String,
    pub files_changed: i32,
    pub snapshot_type: String,
}

#[tauri::command]
pub fn create_snapshot(
    project_id: String,
    name: String,
    description: Option<String>,
) -> Result<Snapshot, String> {
    // TODO: Implement git snapshot creation
    Ok(Snapshot {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        description,
        timestamp: chrono::Utc::now().to_rfc3339(),
        branch: "main".to_string(),
        files_changed: 0,
        snapshot_type: "manual".to_string(),
    })
}

#[tauri::command]
pub fn list_snapshots(project_id: String) -> Result<Vec<Snapshot>, String> {
    // TODO: Implement listing from git
    Ok(vec![])
}

#[tauri::command]
pub fn restore_snapshot(project_id: String, snapshot_id: String) -> Result<(), String> {
    // TODO: Implement git restore
    Ok(())
}
EOF

cat > src-tauri/src/commands/memory.rs << 'EOF'
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryItem {
    pub id: String,
    pub key: String,
    pub value: String,
    pub category: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn get_memory(project_id: String) -> Result<Vec<MemoryItem>, String> {
    // TODO: Read from .maximus/memory.json
    Ok(vec![])
}

#[tauri::command]
pub fn set_memory(
    project_id: String,
    key: String,
    value: String,
) -> Result<MemoryItem, String> {
    // TODO: Write to .maximus/memory.json
    Ok(MemoryItem {
        id: uuid::Uuid::new_v4().to_string(),
        key,
        value,
        category: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn delete_memory(project_id: String, key: String) -> Result<(), String> {
    // TODO: Remove from .maximus/memory.json
    Ok(())
}
EOF

cat > src-tauri/src/commands/projects.rs << 'EOF'
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub last_opened_at: Option<String>,
}

#[tauri::command]
pub fn list_projects() -> Result<Vec<Project>, String> {
    // TODO: Read from SQLite
    Ok(vec![])
}

#[tauri::command]
pub fn get_current_project() -> Result<Option<Project>, String> {
    // TODO: Detect from CWD or last opened
    Ok(None)
}

#[tauri::command]
pub fn init_project(path: String) -> Result<Project, String> {
    // TODO: Create .max directory and init
    let name = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Ok(Project {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        path,
        last_opened_at: Some(chrono::Utc::now().to_rfc3339()),
    })
}
EOF

cat > src-tauri/src/commands/sessions.rs << 'EOF'
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub project_id: String,
    pub task_description: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub files_modified: Vec<String>,
    pub tokens_estimate: Option<i32>,
    pub retry_count: i32,
    pub efficiency_score: Option<i32>,
    pub log_path: String,
}

#[tauri::command]
pub fn create_session(project_id: String, task: String) -> Result<Session, String> {
    let id = uuid::Uuid::new_v4().to_string();
    Ok(Session {
        id: id.clone(),
        project_id,
        task_description: task,
        started_at: chrono::Utc::now().to_rfc3339(),
        ended_at: None,
        files_modified: vec![],
        tokens_estimate: None,
        retry_count: 0,
        efficiency_score: None,
        log_path: format!(".maximus/sessions/{}.md", id),
    })
}

#[tauri::command]
pub fn end_session(session_id: String) -> Result<Session, String> {
    // TODO: Update session in DB
    Err("Not implemented".to_string())
}

#[tauri::command]
pub fn list_sessions(project_id: String) -> Result<Vec<Session>, String> {
    // TODO: Read from SQLite
    Ok(vec![])
}
EOF

# DB module
cat > src-tauri/src/db/mod.rs << 'EOF'
use rusqlite::{Connection, Result};

pub fn init_db() -> Result<Connection> {
    let home = dirs::home_dir().expect("Could not find home directory");
    let db_path = home.join(".maximus").join("maximus.db");
    
    // Ensure directory exists
    std::fs::create_dir_all(db_path.parent().unwrap()).ok();
    
    let conn = Connection::open(&db_path)?;
    
    conn.execute_batch(include_str!("schema.sql"))?;
    
    Ok(conn)
}
EOF

cat > src-tauri/src/db/schema.sql << 'EOF'
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  last_opened_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_description TEXT,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  files_modified TEXT,
  tokens_estimate INTEGER,
  retry_count INTEGER DEFAULT 0,
  efficiency_score INTEGER,
  log_path TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  variables TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage stats table
CREATE TABLE IF NOT EXISTS usage_stats (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  project_id TEXT,
  sessions_count INTEGER DEFAULT 0,
  tokens_estimate INTEGER DEFAULT 0,
  avg_efficiency REAL,
  total_retries INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_stats(date);
EOF

echo "✅ Maximus project structure initialized!"
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Start development: npm run tauri dev"
echo ""
echo "See GETTING_STARTED.md for detailed instructions."
EOF
