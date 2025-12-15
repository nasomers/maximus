use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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

/// Calculate efficiency score: max(10, 100 - (retries * 15))
fn calculate_efficiency(retries: i32) -> i32 {
    std::cmp::max(10, 100 - retries * 15)
}

#[tauri::command]
pub fn create_session(project_id: String, task: String) -> Result<Session, String> {
    let conn = db::get_connection()?;

    let id = uuid::Uuid::new_v4().to_string();
    let started_at = chrono::Utc::now().to_rfc3339();
    let log_path = format!(".lumen/sessions/{}.md", id);

    // Insert into database
    conn.execute(
        "INSERT INTO sessions (id, project_id, task_description, started_at, log_path) VALUES (?1, ?2, ?3, ?4, ?5)",
        (&id, &project_id, &task, &started_at, &log_path),
    ).map_err(|e| format!("Failed to create session: {}", e))?;

    Ok(Session {
        id,
        project_id,
        task_description: task,
        started_at,
        ended_at: None,
        files_modified: vec![],
        tokens_estimate: None,
        retry_count: 0,
        efficiency_score: None,
        log_path,
    })
}

#[tauri::command]
pub fn end_session(session_id: String) -> Result<Session, String> {
    let conn = db::get_connection()?;

    // Get the session first
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, task_description, started_at, ended_at, retry_count, efficiency_score, log_path FROM sessions WHERE id = ?1",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let session = stmt
        .query_row([&session_id], |row| {
            Ok(Session {
                id: row.get(0)?,
                project_id: row.get(1)?,
                task_description: row.get(2)?,
                started_at: row.get(3)?,
                ended_at: row.get(4)?,
                files_modified: vec![],
                tokens_estimate: None,
                retry_count: row.get::<_, Option<i32>>(5)?.unwrap_or(0),
                efficiency_score: row.get(6)?,
                log_path: row.get(7)?,
            })
        })
        .map_err(|e| format!("Session not found: {}", e))?;

    // Update the session with end time and efficiency
    let ended_at = chrono::Utc::now().to_rfc3339();
    let efficiency_score = calculate_efficiency(session.retry_count);

    conn.execute(
        "UPDATE sessions SET ended_at = ?1, efficiency_score = ?2 WHERE id = ?3",
        (&ended_at, efficiency_score, &session_id),
    )
    .map_err(|e| format!("Failed to end session: {}", e))?;

    Ok(Session {
        id: session.id,
        project_id: session.project_id,
        task_description: session.task_description,
        started_at: session.started_at,
        ended_at: Some(ended_at),
        files_modified: session.files_modified,
        tokens_estimate: session.tokens_estimate,
        retry_count: session.retry_count,
        efficiency_score: Some(efficiency_score),
        log_path: session.log_path,
    })
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodayStats {
    pub session_count: u32,
    pub total_minutes: u32,
    pub estimated_tokens: u64,
    pub estimated_cost: f64,
}

/// Get today's usage statistics across all projects
#[tauri::command]
pub fn get_today_stats() -> Result<TodayStats, String> {
    let conn = db::get_connection()?;

    // Get all sessions from today (using local time)
    let mut stmt = conn
        .prepare(
            "SELECT COUNT(*), COALESCE(SUM(
                CASE
                    WHEN ended_at IS NOT NULL
                    THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
                    ELSE (julianday('now') - julianday(started_at)) * 24 * 60
                END
            ), 0)
            FROM sessions
            WHERE date(started_at) = date('now', 'localtime')"
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let (session_count, total_minutes): (i32, f64) = stmt
        .query_row([], |row| Ok((row.get(0)?, row.get(1)?)))
        .unwrap_or((0, 0.0));

    // Estimate tokens (rough: ~15 tokens per second of active coding)
    let estimated_tokens = (total_minutes * 60.0 * 15.0) as u64;

    // Estimate cost: ~$0.01 per 1K tokens (blended average)
    let estimated_cost = (estimated_tokens as f64 / 1000.0) * 0.01;

    Ok(TodayStats {
        session_count: session_count as u32,
        total_minutes: total_minutes.round() as u32,
        estimated_tokens,
        estimated_cost,
    })
}

#[tauri::command]
pub fn list_sessions(project_id: String) -> Result<Vec<Session>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, task_description, started_at, ended_at, retry_count, efficiency_score, log_path FROM sessions WHERE project_id = ?1 ORDER BY started_at DESC LIMIT 50",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let sessions = stmt
        .query_map([&project_id], |row| {
            Ok(Session {
                id: row.get(0)?,
                project_id: row.get(1)?,
                task_description: row.get(2)?,
                started_at: row.get(3)?,
                ended_at: row.get(4)?,
                files_modified: vec![],
                tokens_estimate: None,
                retry_count: row.get::<_, Option<i32>>(5)?.unwrap_or(0),
                efficiency_score: row.get(6)?,
                log_path: row.get(7)?,
            })
        })
        .map_err(|e| format!("Failed to query sessions: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect sessions: {}", e))?;

    Ok(sessions)
}
