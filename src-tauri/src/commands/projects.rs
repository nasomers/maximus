use crate::db;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub last_opened_at: Option<String>,
    pub created_at: Option<String>,
}

/// List all known projects from the database
#[tauri::command]
pub fn list_projects() -> Result<Vec<Project>, String> {
    let conn = db::get_connection()?;

    let mut stmt = conn
        .prepare("SELECT id, name, path, last_opened_at, created_at FROM projects ORDER BY last_opened_at DESC")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                last_opened_at: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query projects: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect projects: {}", e))?;

    Ok(projects)
}

/// Get project for current working directory, or the most recently opened project
#[tauri::command]
pub fn get_current_project() -> Result<Option<Project>, String> {
    let conn = db::get_connection()?;

    // Try to detect from current working directory
    if let Ok(cwd) = env::current_dir() {
        let cwd_str = cwd.to_string_lossy().to_string();

        // Check if CWD or any parent is a known project
        let mut check_path = Some(cwd.as_path());
        while let Some(path) = check_path {
            let path_str = path.to_string_lossy().to_string();

            let mut stmt = conn
                .prepare("SELECT id, name, path, last_opened_at, created_at FROM projects WHERE path = ?1")
                .map_err(|e| format!("Failed to prepare query: {}", e))?;

            let result = stmt
                .query_row([&path_str], |row| {
                    Ok(Project {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        path: row.get(2)?,
                        last_opened_at: row.get(3)?,
                        created_at: row.get(4)?,
                    })
                });

            if let Ok(project) = result {
                // Update last_opened_at
                let _ = conn.execute(
                    "UPDATE projects SET last_opened_at = ?1 WHERE id = ?2",
                    [&chrono::Utc::now().to_rfc3339(), &project.id],
                );
                return Ok(Some(project));
            }

            check_path = path.parent();
        }
    }

    // Fall back to most recently opened project
    let mut stmt = conn
        .prepare("SELECT id, name, path, last_opened_at, created_at FROM projects ORDER BY last_opened_at DESC LIMIT 1")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let result = stmt.query_row([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            last_opened_at: row.get(3)?,
            created_at: row.get(4)?,
        })
    });

    match result {
        Ok(project) => Ok(Some(project)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to query project: {}", e)),
    }
}

/// Initialize a new project at the given path
#[tauri::command]
pub fn init_project(path: String) -> Result<Project, String> {
    let project_path = Path::new(&path);

    // Validate path exists
    if !project_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    // Check if already initialized
    let lumen_dir = project_path.join(".lumen");
    if lumen_dir.exists() {
        // Check if already in database
        let conn = db::get_connection()?;
        let mut stmt = conn
            .prepare("SELECT id, name, path, last_opened_at, created_at FROM projects WHERE path = ?1")
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        if let Ok(project) = stmt.query_row([&path], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                last_opened_at: row.get(3)?,
                created_at: row.get(4)?,
            })
        }) {
            // Update last_opened_at and return existing project
            let _ = conn.execute(
                "UPDATE projects SET last_opened_at = ?1 WHERE id = ?2",
                [&chrono::Utc::now().to_rfc3339(), &project.id],
            );
            return Ok(project);
        }
    }

    // Extract project name from path
    let name = project_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    // Create .lumen directory
    std::fs::create_dir_all(&lumen_dir)
        .map_err(|e| format!("Failed to create .lumen directory: {}", e))?;

    // Set directory permissions to 700 on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o700);
        std::fs::set_permissions(&lumen_dir, perms)
            .map_err(|e| format!("Failed to set directory permissions: {}", e))?;
    }

    // Create subdirectories
    std::fs::create_dir_all(lumen_dir.join("snapshots"))
        .map_err(|e| format!("Failed to create snapshots directory: {}", e))?;
    std::fs::create_dir_all(lumen_dir.join("sessions"))
        .map_err(|e| format!("Failed to create sessions directory: {}", e))?;

    // Create empty memory.json
    let memory_path = lumen_dir.join("memory.json");
    if !memory_path.exists() {
        std::fs::write(&memory_path, "[]")
            .map_err(|e| format!("Failed to create memory.json: {}", e))?;
    }

    // Generate project ID
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Save to database
    let conn = db::get_connection()?;
    conn.execute(
        "INSERT INTO projects (id, name, path, last_opened_at, created_at) VALUES (?1, ?2, ?3, ?4, ?4)",
        [&id, &name, &path, &now],
    )
    .map_err(|e| format!("Failed to save project to database: {}", e))?;

    let project = Project {
        id,
        name,
        path,
        last_opened_at: Some(now.clone()),
        created_at: Some(now),
    };

    Ok(project)
}

/// Delete a project from the database (does not delete files)
#[tauri::command]
pub fn delete_project(project_id: String) -> Result<(), String> {
    let conn = db::get_connection()?;

    conn.execute("DELETE FROM sessions WHERE project_id = ?1", [&project_id])
        .map_err(|e| format!("Failed to delete sessions: {}", e))?;

    conn.execute("DELETE FROM projects WHERE id = ?1", [&project_id])
        .map_err(|e| format!("Failed to delete project: {}", e))?;

    Ok(())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_hidden: bool,
}

/// Scaffold a new project with CLAUDE.md and initialize it
#[tauri::command]
pub fn scaffold_project(
    name: String,
    location: String,
    template: String,
    tech_stack: Vec<String>,
    description: String,
    design_prompt: String,
) -> Result<Project, String> {
    let project_path = Path::new(&location).join(&name);

    // Create project directory
    std::fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Generate CLAUDE.md content
    let claude_md = generate_claude_md(&name, &template, &tech_stack, &description, &design_prompt);

    let claude_md_path = project_path.join("CLAUDE.md");
    std::fs::write(&claude_md_path, claude_md)
        .map_err(|e| format!("Failed to write CLAUDE.md: {}", e))?;

    // If there's a design prompt, also create a PROJECT_BRIEF.md
    if !design_prompt.is_empty() {
        let brief_content = format!(
            "# Project Brief\n\n## Vision\n\n{}\n\n## Status\n\n- [ ] Initial design discussion with Claude\n- [ ] Architecture decisions made\n- [ ] Core features implemented\n- [ ] Testing complete\n- [ ] Ready for production\n",
            design_prompt
        );
        let brief_path = project_path.join("PROJECT_BRIEF.md");
        std::fs::write(&brief_path, brief_content)
            .map_err(|e| format!("Failed to write PROJECT_BRIEF.md: {}", e))?;
    }

    // Initialize the project in Lumen
    let project_path_str = project_path.to_string_lossy().to_string();
    init_project(project_path_str)
}

fn generate_claude_md(
    name: &str,
    template: &str,
    tech_stack: &[String],
    description: &str,
    design_prompt: &str,
) -> String {
    let tech_stack_str = if tech_stack.is_empty() {
        "To be determined".to_string()
    } else {
        tech_stack.join(", ")
    };

    let template_guidance = match template {
        "web-app" => "This is a web application project. Focus on responsive design, accessibility, and performance.",
        "api" => "This is an API/backend project. Focus on clean architecture, proper error handling, and documentation.",
        "cli" => "This is a CLI tool. Focus on user-friendly commands, helpful error messages, and good documentation.",
        "desktop" => "This is a desktop application. Focus on native feel, performance, and cross-platform compatibility.",
        _ => "Follow best practices for the chosen technology stack.",
    };

    format!(
r#"# {name}

{description}

## Tech Stack

{tech_stack_str}

## Project Guidelines

{template_guidance}

## Architecture

<!-- Claude will help fill this in during the design phase -->

## Key Decisions

<!-- Document important architectural and design decisions here -->

## File Structure

<!-- Claude will help define this based on the project requirements -->

## Development Notes

{design_prompt}

## Conventions

- Follow standard conventions for the chosen tech stack
- Write clean, maintainable code
- Include appropriate error handling
- Add comments for complex logic
- Write tests for critical functionality

---
*This project is managed with Lumen*
"#,
        name = name,
        description = if description.is_empty() { "A new project" } else { description },
        tech_stack_str = tech_stack_str,
        template_guidance = template_guidance,
        design_prompt = if design_prompt.is_empty() {
            "No initial design brief provided.".to_string()
        } else {
            format!("### Initial Brief\n\n{}", design_prompt)
        },
    )
}

/// List directory contents for file explorer
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    let read_dir = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let file_name = entry.file_name().to_string_lossy().to_string();
        let file_path = entry.path().to_string_lossy().to_string();
        let is_dir = entry.path().is_dir();
        let is_hidden = file_name.starts_with('.');

        entries.push(FileEntry {
            name: file_name,
            path: file_path,
            is_dir,
            is_hidden,
        });
    }

    // Sort: directories first, then by name (case-insensitive)
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

/// Read CLAUDE.md from a project
#[tauri::command]
pub fn read_claude_md(project_path: String) -> Result<Option<String>, String> {
    let path = Path::new(&project_path).join("CLAUDE.md");

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read CLAUDE.md: {}", e))?;

    Ok(Some(content))
}

/// Write CLAUDE.md to a project
#[tauri::command]
pub fn write_claude_md(project_path: String, content: String) -> Result<(), String> {
    let path = Path::new(&project_path).join("CLAUDE.md");

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write CLAUDE.md: {}", e))?;

    Ok(())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FailedApproach {
    pub id: String,
    pub description: String,
    pub reason: Option<String>,
    pub created_at: String,
}

/// Get failed approaches for a project
#[tauri::command]
pub fn get_failed_approaches(project_path: String) -> Result<Vec<FailedApproach>, String> {
    let path = Path::new(&project_path)
        .join(".lumen")
        .join("failed_approaches.json");

    if !path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read failed approaches: {}", e))?;

    let approaches: Vec<FailedApproach> = serde_json::from_str(&content)
        .unwrap_or_default();

    Ok(approaches)
}

/// Add a failed approach
#[tauri::command]
pub fn add_failed_approach(
    project_path: String,
    description: String,
    reason: Option<String>,
) -> Result<FailedApproach, String> {
    let lumen_dir = Path::new(&project_path).join(".lumen");
    let path = lumen_dir.join("failed_approaches.json");

    // Ensure .lumen directory exists
    fs::create_dir_all(&lumen_dir)
        .map_err(|e| format!("Failed to create .lumen directory: {}", e))?;

    // Load existing approaches
    let mut approaches: Vec<FailedApproach> = if path.exists() {
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read failed approaches: {}", e))?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        vec![]
    };

    // Create new approach
    let approach = FailedApproach {
        id: uuid::Uuid::new_v4().to_string(),
        description,
        reason,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    approaches.push(approach.clone());

    // Save
    let content = serde_json::to_string_pretty(&approaches)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write: {}", e))?;

    Ok(approach)
}

/// Remove a failed approach
#[tauri::command]
pub fn remove_failed_approach(project_path: String, approach_id: String) -> Result<(), String> {
    let path = Path::new(&project_path)
        .join(".lumen")
        .join("failed_approaches.json");

    if !path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read: {}", e))?;

    let mut approaches: Vec<FailedApproach> = serde_json::from_str(&content)
        .unwrap_or_default();

    approaches.retain(|a| a.id != approach_id);

    let content = serde_json::to_string_pretty(&approaches)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write: {}", e))?;

    Ok(())
}

/// Clear all failed approaches
#[tauri::command]
pub fn clear_failed_approaches(project_path: String) -> Result<(), String> {
    let path = Path::new(&project_path)
        .join(".lumen")
        .join("failed_approaches.json");

    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to remove: {}", e))?;
    }

    Ok(())
}
