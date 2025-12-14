use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// Daily activity from Claude Code
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivity {
    pub date: String,
    pub message_count: u32,
    pub session_count: u32,
    pub tool_call_count: u32,
}

/// Daily token usage by model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyModelTokens {
    pub date: String,
    pub tokens_by_model: HashMap<String, u64>,
}

/// Model usage stats
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ModelUsage {
    #[serde(default)]
    pub input_tokens: u64,
    #[serde(default)]
    pub output_tokens: u64,
    #[serde(default)]
    pub cache_read_input_tokens: u64,
    #[serde(default)]
    pub cache_creation_input_tokens: u64,
    #[serde(default)]
    pub web_search_requests: u32,
    #[serde(default)]
    pub cost_usd: f64,
}

/// Longest session info
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LongestSession {
    pub session_id: String,
    pub duration: u64,
    pub message_count: u32,
    pub timestamp: String,
}

/// Claude Code stats cache structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeCodeStats {
    pub version: u32,
    pub last_computed_date: String,
    #[serde(default)]
    pub daily_activity: Vec<DailyActivity>,
    #[serde(default)]
    pub daily_model_tokens: Vec<DailyModelTokens>,
    #[serde(default)]
    pub model_usage: HashMap<String, ModelUsage>,
    #[serde(default)]
    pub total_sessions: u32,
    #[serde(default)]
    pub total_messages: u32,
    pub longest_session: Option<LongestSession>,
    pub first_session_date: Option<String>,
    #[serde(default)]
    pub hour_counts: HashMap<String, u32>,
}

/// Session summary from project JSONL files
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummary {
    pub summary: String,
    #[serde(default)]
    pub leaf_uuid: Option<String>,
}

/// Claude Code session info
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeCodeSession {
    pub id: String,
    pub summary: String,
    pub project_path: String,
    pub file_path: String,
    pub file_size: u64,
    pub modified: String,
}

/// Get the Claude Code home directory
fn get_claude_home() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".claude"))
}

/// Read Claude Code stats from stats-cache.json
#[tauri::command]
pub fn get_claude_code_stats() -> Result<ClaudeCodeStats, String> {
    let claude_home = get_claude_home().ok_or("Could not find home directory")?;
    let stats_path = claude_home.join("stats-cache.json");

    if !stats_path.exists() {
        return Err("Claude Code stats not found. Is Claude Code installed?".to_string());
    }

    let content = fs::read_to_string(&stats_path)
        .map_err(|e| format!("Failed to read stats file: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stats file: {}", e))
}

/// Get Claude Code sessions for a specific project
#[tauri::command]
pub fn get_claude_code_sessions(project_path: String) -> Result<Vec<ClaudeCodeSession>, String> {
    let claude_home = get_claude_home().ok_or("Could not find home directory")?;
    let projects_dir = claude_home.join("projects");

    if !projects_dir.exists() {
        return Ok(vec![]);
    }

    // Convert project path to Claude Code's directory naming convention
    // /home/ghost/dev_projects/maximus -> -home-ghost-dev-projects-maximus
    let dir_name = project_path.replace('/', "-");
    let dir_name = if dir_name.starts_with('-') {
        dir_name
    } else {
        format!("-{}", dir_name)
    };

    let project_dir = projects_dir.join(&dir_name);
    if !project_dir.exists() {
        return Ok(vec![]);
    }

    let mut sessions = Vec::new();

    // Read all JSONL files in the project directory
    if let Ok(entries) = fs::read_dir(&project_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "jsonl") {
                if let Ok(metadata) = fs::metadata(&path) {
                    let file_size = metadata.len();
                    let modified = metadata
                        .modified()
                        .ok()
                        .and_then(|t| {
                            let datetime: chrono::DateTime<chrono::Utc> = t.into();
                            Some(datetime.to_rfc3339())
                        })
                        .unwrap_or_default();

                    // Read first line to get summary
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Some(first_line) = content.lines().next() {
                            // Try to parse as summary
                            if let Ok(summary_obj) =
                                serde_json::from_str::<serde_json::Value>(first_line)
                            {
                                if summary_obj.get("type").and_then(|v| v.as_str())
                                    == Some("summary")
                                {
                                    let summary = summary_obj
                                        .get("summary")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("Untitled Session")
                                        .to_string();

                                    let id = path
                                        .file_stem()
                                        .map(|s| s.to_string_lossy().to_string())
                                        .unwrap_or_default();

                                    sessions.push(ClaudeCodeSession {
                                        id,
                                        summary,
                                        project_path: project_path.clone(),
                                        file_path: path.to_string_lossy().to_string(),
                                        file_size,
                                        modified,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Sort by modified date, newest first
    sessions.sort_by(|a, b| b.modified.cmp(&a.modified));

    Ok(sessions)
}

/// Get all Claude Code projects
#[tauri::command]
pub fn get_claude_code_projects() -> Result<Vec<String>, String> {
    let claude_home = get_claude_home().ok_or("Could not find home directory")?;
    let projects_dir = claude_home.join("projects");

    if !projects_dir.exists() {
        return Ok(vec![]);
    }

    let mut projects = Vec::new();

    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                // Convert directory name back to path
                // -home-ghost-dev-projects-maximus -> /home/ghost/dev_projects/maximus
                let dir_name = entry.file_name().to_string_lossy().to_string();
                let path = dir_name.replace('-', "/");
                // Fix double slashes at start
                let path = if path.starts_with("//") {
                    path[1..].to_string()
                } else {
                    path
                };
                projects.push(path);
            }
        }
    }

    Ok(projects)
}
