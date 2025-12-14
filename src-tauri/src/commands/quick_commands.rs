use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageScript {
    pub name: String,
    pub command: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickCommand {
    pub id: String,
    pub name: String,
    pub command: String,
    pub category: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PackageJson {
    scripts: Option<HashMap<String, String>>,
}

/// Read npm scripts from package.json
#[tauri::command]
pub fn get_package_scripts(project_path: String) -> Result<Vec<PackageScript>, String> {
    let pkg_path = Path::new(&project_path).join("package.json");

    if !pkg_path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&pkg_path)
        .map_err(|e| format!("Failed to read package.json: {}", e))?;

    let pkg: PackageJson = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse package.json: {}", e))?;

    let scripts = pkg
        .scripts
        .unwrap_or_default()
        .into_iter()
        .map(|(name, command)| PackageScript { name, command })
        .collect();

    Ok(scripts)
}

/// Get suggested quick commands based on project type
#[tauri::command]
pub fn get_quick_commands(project_path: String) -> Result<Vec<QuickCommand>, String> {
    let path = Path::new(&project_path);
    let mut commands = Vec::new();

    // Detect project type and suggest commands

    // Node.js / npm
    if path.join("package.json").exists() {
        commands.push(QuickCommand {
            id: "npm-install".to_string(),
            name: "Install".to_string(),
            command: "npm install".to_string(),
            category: "npm".to_string(),
            description: Some("Install dependencies".to_string()),
        });

        commands.push(QuickCommand {
            id: "npm-update".to_string(),
            name: "Update".to_string(),
            command: "npm update".to_string(),
            category: "npm".to_string(),
            description: Some("Update dependencies".to_string()),
        });
    }

    // Cargo / Rust
    if path.join("Cargo.toml").exists() {
        commands.push(QuickCommand {
            id: "cargo-build".to_string(),
            name: "Build".to_string(),
            command: "cargo build".to_string(),
            category: "cargo".to_string(),
            description: Some("Build the project".to_string()),
        });

        commands.push(QuickCommand {
            id: "cargo-test".to_string(),
            name: "Test".to_string(),
            command: "cargo test".to_string(),
            category: "cargo".to_string(),
            description: Some("Run tests".to_string()),
        });

        commands.push(QuickCommand {
            id: "cargo-check".to_string(),
            name: "Check".to_string(),
            command: "cargo check".to_string(),
            category: "cargo".to_string(),
            description: Some("Check for errors".to_string()),
        });
    }

    // Git commands (always available)
    commands.push(QuickCommand {
        id: "git-status".to_string(),
        name: "Status".to_string(),
        command: "git status".to_string(),
        category: "git".to_string(),
        description: Some("Show working tree status".to_string()),
    });

    commands.push(QuickCommand {
        id: "git-diff".to_string(),
        name: "Diff".to_string(),
        command: "git diff".to_string(),
        category: "git".to_string(),
        description: Some("Show changes".to_string()),
    });

    commands.push(QuickCommand {
        id: "git-log".to_string(),
        name: "Log".to_string(),
        command: "git log --oneline -10".to_string(),
        category: "git".to_string(),
        description: Some("Show recent commits".to_string()),
    });

    // Python
    if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() {
        commands.push(QuickCommand {
            id: "pip-install".to_string(),
            name: "Install".to_string(),
            command: "pip install -r requirements.txt".to_string(),
            category: "python".to_string(),
            description: Some("Install Python dependencies".to_string()),
        });
    }

    Ok(commands)
}
