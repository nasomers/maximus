use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionMemory {
    pub id: String,
    pub project_id: String,
    pub claude_session_id: Option<String>,
    pub session_date: String,
    pub summary: String,
    pub key_decisions: Vec<String>,
    pub open_threads: Vec<String>,
    pub files_touched: Vec<String>,
    pub duration_minutes: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionMemoryInput {
    pub project_id: String,
    pub claude_session_id: Option<String>,
    pub summary: String,
    pub key_decisions: Option<Vec<String>>,
    pub open_threads: Option<Vec<String>>,
    pub files_touched: Option<Vec<String>>,
    pub duration_minutes: Option<i32>,
}

/// Save a new session memory (AI-generated summary)
#[tauri::command]
pub fn save_session_memory(input: CreateSessionMemoryInput) -> Result<SessionMemory, String> {
    let conn = db::get_connection()?;

    let id = uuid::Uuid::new_v4().to_string();
    let session_date = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let created_at = chrono::Utc::now().to_rfc3339();

    let key_decisions = input.key_decisions.unwrap_or_default();
    let open_threads = input.open_threads.unwrap_or_default();
    let files_touched = input.files_touched.unwrap_or_default();

    let key_decisions_json = serde_json::to_string(&key_decisions)
        .map_err(|e| format!("Failed to serialize key_decisions: {}", e))?;
    let open_threads_json = serde_json::to_string(&open_threads)
        .map_err(|e| format!("Failed to serialize open_threads: {}", e))?;
    let files_touched_json = serde_json::to_string(&files_touched)
        .map_err(|e| format!("Failed to serialize files_touched: {}", e))?;

    conn.execute(
        "INSERT INTO session_memories (id, project_id, claude_session_id, session_date, summary, key_decisions, open_threads, files_touched, duration_minutes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        (
            &id,
            &input.project_id,
            &input.claude_session_id,
            &session_date,
            &input.summary,
            &key_decisions_json,
            &open_threads_json,
            &files_touched_json,
            &input.duration_minutes,
            &created_at,
        ),
    )
    .map_err(|e| format!("Failed to save session memory: {}", e))?;

    Ok(SessionMemory {
        id,
        project_id: input.project_id,
        claude_session_id: input.claude_session_id,
        session_date,
        summary: input.summary,
        key_decisions,
        open_threads,
        files_touched,
        duration_minutes: input.duration_minutes,
        created_at,
    })
}

/// Get session memories for a project
#[tauri::command]
pub fn get_session_memories(project_id: String) -> Result<Vec<SessionMemory>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, claude_session_id, session_date, summary, key_decisions, open_threads, files_touched, duration_minutes, created_at
             FROM session_memories
             WHERE project_id = ?1
             ORDER BY created_at DESC
             LIMIT 50",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let memories = stmt
        .query_map([&project_id], |row| {
            let key_decisions_json: String = row.get::<_, Option<String>>(5)?.unwrap_or_else(|| "[]".to_string());
            let open_threads_json: String = row.get::<_, Option<String>>(6)?.unwrap_or_else(|| "[]".to_string());
            let files_touched_json: String = row.get::<_, Option<String>>(7)?.unwrap_or_else(|| "[]".to_string());

            Ok(SessionMemory {
                id: row.get(0)?,
                project_id: row.get(1)?,
                claude_session_id: row.get(2)?,
                session_date: row.get(3)?,
                summary: row.get(4)?,
                key_decisions: serde_json::from_str(&key_decisions_json).unwrap_or_default(),
                open_threads: serde_json::from_str(&open_threads_json).unwrap_or_default(),
                files_touched: serde_json::from_str(&files_touched_json).unwrap_or_default(),
                duration_minutes: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| format!("Failed to query session memories: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect session memories: {}", e))?;

    Ok(memories)
}

/// Get the most recent session memory for a project
#[tauri::command]
pub fn get_latest_session_memory(project_id: String) -> Result<Option<SessionMemory>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, claude_session_id, session_date, summary, key_decisions, open_threads, files_touched, duration_minutes, created_at
             FROM session_memories
             WHERE project_id = ?1
             ORDER BY created_at DESC
             LIMIT 1",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let memory = stmt
        .query_row([&project_id], |row| {
            let key_decisions_json: String = row.get::<_, Option<String>>(5)?.unwrap_or_else(|| "[]".to_string());
            let open_threads_json: String = row.get::<_, Option<String>>(6)?.unwrap_or_else(|| "[]".to_string());
            let files_touched_json: String = row.get::<_, Option<String>>(7)?.unwrap_or_else(|| "[]".to_string());

            Ok(SessionMemory {
                id: row.get(0)?,
                project_id: row.get(1)?,
                claude_session_id: row.get(2)?,
                session_date: row.get(3)?,
                summary: row.get(4)?,
                key_decisions: serde_json::from_str(&key_decisions_json).unwrap_or_default(),
                open_threads: serde_json::from_str(&open_threads_json).unwrap_or_default(),
                files_touched: serde_json::from_str(&files_touched_json).unwrap_or_default(),
                duration_minutes: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .ok();

    Ok(memory)
}

/// Delete a session memory
#[tauri::command]
pub fn delete_session_memory(memory_id: String) -> Result<(), String> {
    let conn = db::get_connection()?;

    conn.execute("DELETE FROM session_memories WHERE id = ?1", [&memory_id])
        .map_err(|e| format!("Failed to delete session memory: {}", e))?;

    Ok(())
}
