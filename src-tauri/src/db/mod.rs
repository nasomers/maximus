use rusqlite::{Connection, Result};
use std::path::PathBuf;

/// Get the path to the database file
fn get_db_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let lumen_dir = home.join(".lumen");

    // Create directory if it doesn't exist
    std::fs::create_dir_all(&lumen_dir)
        .map_err(|e| format!("Failed to create .lumen directory: {}", e))?;

    // Set directory permissions to 700 on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o700);
        let _ = std::fs::set_permissions(&lumen_dir, perms);
    }

    Ok(lumen_dir.join("lumen.db"))
}

/// Initialize the database and create tables
pub fn init_db() -> Result<(), String> {
    let db_path = get_db_path()?;

    let conn =
        Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))?;

    // Create tables
    conn.execute_batch(
        r#"
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

        -- Session memories table (AI-generated summaries)
        CREATE TABLE IF NOT EXISTS session_memories (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            claude_session_id TEXT,
            session_date TEXT NOT NULL,
            summary TEXT NOT NULL,
            key_decisions TEXT,
            open_threads TEXT,
            files_touched TEXT,
            duration_minutes INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
        CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_stats(date);
        CREATE INDEX IF NOT EXISTS idx_session_memories_project ON session_memories(project_id);
        CREATE INDEX IF NOT EXISTS idx_session_memories_date ON session_memories(session_date);
        "#,
    )
    .map_err(|e| format!("Failed to create tables: {}", e))?;

    Ok(())
}

/// Get a connection to the database
pub fn get_connection() -> Result<Connection, String> {
    let db_path = get_db_path()?;
    Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))
}
