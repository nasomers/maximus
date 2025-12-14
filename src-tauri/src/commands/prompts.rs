use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub name: String,
    pub content: String,
    pub tags: Vec<String>,
    pub variables: Vec<String>,
    pub usage_count: i32,
    pub last_used_at: Option<String>,
    pub created_at: String,
}

/// List all prompts
#[tauri::command]
pub fn list_prompts() -> Result<Vec<Prompt>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, content, tags, variables, usage_count, last_used_at, created_at
             FROM prompts ORDER BY usage_count DESC, name ASC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let prompts = stmt
        .query_map([], |row| {
            let tags_str: String = row.get(3)?;
            let variables_str: String = row.get(4)?;

            Ok(Prompt {
                id: row.get(0)?,
                name: row.get(1)?,
                content: row.get(2)?,
                tags: parse_json_array(&tags_str),
                variables: parse_json_array(&variables_str),
                usage_count: row.get(5)?,
                last_used_at: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| format!("Failed to query prompts: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(prompts)
}

/// Create a new prompt
#[tauri::command]
pub fn create_prompt(
    name: String,
    content: String,
    tags: Vec<String>,
    variables: Vec<String>,
) -> Result<Prompt, String> {
    let conn = db::get_connection()?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let tags_json = serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string());
    let variables_json = serde_json::to_string(&variables).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT INTO prompts (id, name, content, tags, variables, usage_count, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6)",
        rusqlite::params![id, name, content, tags_json, variables_json, now],
    )
    .map_err(|e| format!("Failed to create prompt: {}", e))?;

    Ok(Prompt {
        id,
        name,
        content,
        tags,
        variables,
        usage_count: 0,
        last_used_at: None,
        created_at: now,
    })
}

/// Update an existing prompt
#[tauri::command]
pub fn update_prompt(
    id: String,
    name: String,
    content: String,
    tags: Vec<String>,
    variables: Vec<String>,
) -> Result<Prompt, String> {
    let conn = db::get_connection()?;

    let tags_json = serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string());
    let variables_json = serde_json::to_string(&variables).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "UPDATE prompts SET name = ?1, content = ?2, tags = ?3, variables = ?4 WHERE id = ?5",
        rusqlite::params![name, content, tags_json, variables_json, id],
    )
    .map_err(|e| format!("Failed to update prompt: {}", e))?;

    // Fetch the updated prompt
    get_prompt(id)
}

/// Get a single prompt by ID
#[tauri::command]
pub fn get_prompt(id: String) -> Result<Prompt, String> {
    let conn = db::get_connection()?;

    let prompt = conn
        .query_row(
            "SELECT id, name, content, tags, variables, usage_count, last_used_at, created_at
             FROM prompts WHERE id = ?1",
            [&id],
            |row| {
                let tags_str: String = row.get(3)?;
                let variables_str: String = row.get(4)?;

                Ok(Prompt {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    content: row.get(2)?,
                    tags: parse_json_array(&tags_str),
                    variables: parse_json_array(&variables_str),
                    usage_count: row.get(5)?,
                    last_used_at: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )
        .map_err(|e| format!("Prompt not found: {}", e))?;

    Ok(prompt)
}

/// Delete a prompt
#[tauri::command]
pub fn delete_prompt(id: String) -> Result<(), String> {
    let conn = db::get_connection()?;

    conn.execute("DELETE FROM prompts WHERE id = ?1", [&id])
        .map_err(|e| format!("Failed to delete prompt: {}", e))?;

    Ok(())
}

/// Record usage of a prompt (increment count and update last_used)
#[tauri::command]
pub fn use_prompt(id: String) -> Result<Prompt, String> {
    let conn = db::get_connection()?;
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE prompts SET usage_count = usage_count + 1, last_used_at = ?1 WHERE id = ?2",
        rusqlite::params![now, id],
    )
    .map_err(|e| format!("Failed to update prompt usage: {}", e))?;

    get_prompt(id)
}

/// Parse a JSON array string into a Vec<String>
fn parse_json_array(json_str: &str) -> Vec<String> {
    serde_json::from_str(json_str).unwrap_or_default()
}
