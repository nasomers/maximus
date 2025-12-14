use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStats {
    pub date: String,
    pub session_count: i32,
    pub total_minutes: i32,
    pub tokens_estimate: i32,
    pub files_modified: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeeklyStats {
    pub week_start: String,
    pub session_count: i32,
    pub total_minutes: i32,
    pub tokens_estimate: i32,
    pub avg_session_length: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverallStats {
    pub total_sessions: i32,
    pub total_minutes: i32,
    pub total_tokens: i32,
    pub avg_session_length: f64,
    pub most_productive_day: Option<String>,
    pub longest_session_minutes: i32,
    pub total_files_modified: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStats {
    pub project_id: String,
    pub project_name: String,
    pub session_count: i32,
    pub total_minutes: i32,
    pub tokens_estimate: i32,
}

/// Get daily stats for the last N days
#[tauri::command]
pub fn get_daily_stats(days: i32) -> Result<Vec<DailyStats>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare(
            "SELECT
                DATE(started_at) as date,
                COUNT(*) as session_count,
                COALESCE(SUM(
                    CASE WHEN ended_at IS NOT NULL
                    THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
                    ELSE 0 END
                ), 0) as total_minutes,
                COALESCE(SUM(tokens_estimate), 0) as tokens_estimate,
                COALESCE(SUM(
                    CASE WHEN files_modified IS NOT NULL AND files_modified != '' AND files_modified != '[]'
                    THEN (LENGTH(files_modified) - LENGTH(REPLACE(files_modified, ',', '')) + 1)
                    ELSE 0 END
                ), 0) as files_modified
             FROM sessions
             WHERE started_at >= DATE('now', ? || ' days')
             GROUP BY DATE(started_at)
             ORDER BY date DESC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let stats = stmt
        .query_map([format!("-{}", days)], |row| {
            Ok(DailyStats {
                date: row.get(0)?,
                session_count: row.get(1)?,
                total_minutes: row.get::<_, f64>(2)? as i32,
                tokens_estimate: row.get(3)?,
                files_modified: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query daily stats: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(stats)
}

/// Get weekly stats for the last N weeks
#[tauri::command]
pub fn get_weekly_stats(weeks: i32) -> Result<Vec<WeeklyStats>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare(
            "SELECT
                DATE(started_at, 'weekday 0', '-6 days') as week_start,
                COUNT(*) as session_count,
                COALESCE(SUM(
                    CASE WHEN ended_at IS NOT NULL
                    THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
                    ELSE 0 END
                ), 0) as total_minutes,
                COALESCE(SUM(tokens_estimate), 0) as tokens_estimate,
                COALESCE(AVG(
                    CASE WHEN ended_at IS NOT NULL
                    THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
                    ELSE NULL END
                ), 0) as avg_session_length
             FROM sessions
             WHERE started_at >= DATE('now', ? || ' weeks')
             GROUP BY week_start
             ORDER BY week_start DESC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let stats = stmt
        .query_map([format!("-{}", weeks)], |row| {
            Ok(WeeklyStats {
                week_start: row.get(0)?,
                session_count: row.get(1)?,
                total_minutes: row.get::<_, f64>(2)? as i32,
                tokens_estimate: row.get(3)?,
                avg_session_length: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query weekly stats: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(stats)
}

/// Get overall stats
#[tauri::command]
pub fn get_overall_stats() -> Result<OverallStats, String> {
    let conn = db::get_connection()?;

    // Get basic aggregates
    let (total_sessions, total_minutes, total_tokens, avg_session_length, longest_session, total_files) = conn
        .query_row(
            "SELECT
                COUNT(*) as total_sessions,
                COALESCE(SUM(
                    CASE WHEN ended_at IS NOT NULL
                    THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
                    ELSE 0 END
                ), 0) as total_minutes,
                COALESCE(SUM(tokens_estimate), 0) as total_tokens,
                COALESCE(AVG(
                    CASE WHEN ended_at IS NOT NULL
                    THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
                    ELSE NULL END
                ), 0) as avg_session_length,
                COALESCE(MAX(
                    CASE WHEN ended_at IS NOT NULL
                    THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
                    ELSE 0 END
                ), 0) as longest_session,
                COALESCE(SUM(
                    CASE WHEN files_modified IS NOT NULL AND files_modified != '' AND files_modified != '[]'
                    THEN (LENGTH(files_modified) - LENGTH(REPLACE(files_modified, ',', '')) + 1)
                    ELSE 0 END
                ), 0) as total_files
             FROM sessions",
            [],
            |row| {
                Ok((
                    row.get::<_, i32>(0)?,
                    row.get::<_, f64>(1)? as i32,
                    row.get::<_, i32>(2)?,
                    row.get::<_, f64>(3)?,
                    row.get::<_, f64>(4)? as i32,
                    row.get::<_, i32>(5)?,
                ))
            },
        )
        .unwrap_or((0, 0, 0, 0.0, 0, 0));

    // Get most productive day (day of week with most sessions)
    let most_productive_day: Option<String> = conn
        .query_row(
            "SELECT
                CASE CAST(strftime('%w', started_at) AS INTEGER)
                    WHEN 0 THEN 'Sunday'
                    WHEN 1 THEN 'Monday'
                    WHEN 2 THEN 'Tuesday'
                    WHEN 3 THEN 'Wednesday'
                    WHEN 4 THEN 'Thursday'
                    WHEN 5 THEN 'Friday'
                    WHEN 6 THEN 'Saturday'
                END as day_name
             FROM sessions
             GROUP BY strftime('%w', started_at)
             ORDER BY COUNT(*) DESC
             LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    Ok(OverallStats {
        total_sessions,
        total_minutes,
        total_tokens,
        avg_session_length,
        most_productive_day,
        longest_session_minutes: longest_session,
        total_files_modified: total_files,
    })
}

/// Get stats by project
#[tauri::command]
pub fn get_project_stats() -> Result<Vec<ProjectStats>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare(
            "SELECT
                s.project_id,
                COALESCE(p.name, 'Unknown') as project_name,
                COUNT(*) as session_count,
                COALESCE(SUM(
                    CASE WHEN s.ended_at IS NOT NULL
                    THEN (julianday(s.ended_at) - julianday(s.started_at)) * 24 * 60
                    ELSE 0 END
                ), 0) as total_minutes,
                COALESCE(SUM(s.tokens_estimate), 0) as tokens_estimate
             FROM sessions s
             LEFT JOIN projects p ON s.project_id = p.id
             GROUP BY s.project_id
             ORDER BY session_count DESC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let stats = stmt
        .query_map([], |row| {
            Ok(ProjectStats {
                project_id: row.get(0)?,
                project_name: row.get(1)?,
                session_count: row.get(2)?,
                total_minutes: row.get::<_, f64>(3)? as i32,
                tokens_estimate: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query project stats: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(stats)
}
