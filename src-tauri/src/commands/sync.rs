use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncRepoResult {
    pub success: bool,
    pub url: Option<String>,
    pub message: String,
}

/// Create a new lumen-sync private repository
#[tauri::command]
pub fn create_sync_repo() -> Result<SyncRepoResult, String> {
    // Check if gh is authenticated
    let auth_check = Command::new("gh")
        .args(["auth", "status"])
        .output()
        .map_err(|e| format!("Failed to check gh auth: {}", e))?;

    if !auth_check.status.success() {
        return Ok(SyncRepoResult {
            success: false,
            url: None,
            message: "GitHub CLI not authenticated. Run 'gh auth login' first.".to_string(),
        });
    }

    // Get username
    let username_output = Command::new("gh")
        .args(["api", "user", "--jq", ".login"])
        .output()
        .map_err(|e| format!("Failed to get username: {}", e))?;

    let username = String::from_utf8_lossy(&username_output.stdout)
        .trim()
        .to_string();

    if username.is_empty() {
        return Ok(SyncRepoResult {
            success: false,
            url: None,
            message: "Could not determine GitHub username".to_string(),
        });
    }

    // Check if repo already exists
    let repo_check = Command::new("gh")
        .args(["repo", "view", &format!("{}/lumen-sync", username)])
        .output();

    if let Ok(output) = repo_check {
        if output.status.success() {
            // Repo already exists
            return Ok(SyncRepoResult {
                success: true,
                url: Some(format!("github.com/{}/lumen-sync", username)),
                message: "Connected to existing lumen-sync repository".to_string(),
            });
        }
    }

    // Create the repo (FORCED PRIVATE)
    let create_output = Command::new("gh")
        .args([
            "repo",
            "create",
            "lumen-sync",
            "--private",
            "--description",
            "Lumen sync repository - prompts, memories, and settings",
        ])
        .output()
        .map_err(|e| format!("Failed to create repo: {}", e))?;

    if create_output.status.success() {
        // Clone it to ~/.lumen/sync/
        let sync_dir = get_sync_dir()?;

        // Remove existing sync dir if it exists
        if sync_dir.exists() {
            let _ = std::fs::remove_dir_all(&sync_dir);
        }

        // Clone the repo
        let clone_output = Command::new("gh")
            .args([
                "repo",
                "clone",
                &format!("{}/lumen-sync", username),
                sync_dir.to_string_lossy().as_ref(),
            ])
            .output()
            .map_err(|e| format!("Failed to clone repo: {}", e))?;

        if clone_output.status.success() {
            // Initialize directory structure
            init_sync_structure(&sync_dir)?;

            Ok(SyncRepoResult {
                success: true,
                url: Some(format!("github.com/{}/lumen-sync", username)),
                message: "Created and configured lumen-sync repository".to_string(),
            })
        } else {
            Ok(SyncRepoResult {
                success: false,
                url: None,
                message: format!(
                    "Failed to clone repo: {}",
                    String::from_utf8_lossy(&clone_output.stderr)
                ),
            })
        }
    } else {
        Ok(SyncRepoResult {
            success: false,
            url: None,
            message: format!(
                "Failed to create repo: {}",
                String::from_utf8_lossy(&create_output.stderr)
            ),
        })
    }
}

/// Connect to an existing lumen-sync repository
#[tauri::command]
pub fn connect_sync_repo() -> Result<SyncRepoResult, String> {
    // Check if gh is authenticated
    let auth_check = Command::new("gh")
        .args(["auth", "status"])
        .output()
        .map_err(|e| format!("Failed to check gh auth: {}", e))?;

    if !auth_check.status.success() {
        return Ok(SyncRepoResult {
            success: false,
            url: None,
            message: "GitHub CLI not authenticated. Run 'gh auth login' first.".to_string(),
        });
    }

    // Get username
    let username_output = Command::new("gh")
        .args(["api", "user", "--jq", ".login"])
        .output()
        .map_err(|e| format!("Failed to get username: {}", e))?;

    let username = String::from_utf8_lossy(&username_output.stdout)
        .trim()
        .to_string();

    if username.is_empty() {
        return Ok(SyncRepoResult {
            success: false,
            url: None,
            message: "Could not determine GitHub username".to_string(),
        });
    }

    // Check if repo exists
    let repo_check = Command::new("gh")
        .args(["repo", "view", &format!("{}/lumen-sync", username)])
        .output()
        .map_err(|e| format!("Failed to check repo: {}", e))?;

    if !repo_check.status.success() {
        return Ok(SyncRepoResult {
            success: false,
            url: None,
            message: "No lumen-sync repository found. Create one first.".to_string(),
        });
    }

    // Clone it to ~/.lumen/sync/
    let sync_dir = get_sync_dir()?;

    // Remove existing sync dir if it exists
    if sync_dir.exists() {
        let _ = std::fs::remove_dir_all(&sync_dir);
    }

    // Clone the repo
    let clone_output = Command::new("gh")
        .args([
            "repo",
            "clone",
            &format!("{}/lumen-sync", username),
            sync_dir.to_string_lossy().as_ref(),
        ])
        .output()
        .map_err(|e| format!("Failed to clone repo: {}", e))?;

    if clone_output.status.success() {
        Ok(SyncRepoResult {
            success: true,
            url: Some(format!("github.com/{}/lumen-sync", username)),
            message: "Connected to existing lumen-sync repository".to_string(),
        })
    } else {
        Ok(SyncRepoResult {
            success: false,
            url: None,
            message: format!(
                "Failed to clone repo: {}",
                String::from_utf8_lossy(&clone_output.stderr)
            ),
        })
    }
}

/// Get the sync directory path
fn get_sync_dir() -> Result<std::path::PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    Ok(home.join(".lumen").join("sync"))
}

/// Initialize the sync directory structure
fn init_sync_structure(sync_dir: &std::path::Path) -> Result<(), String> {
    // Create directories
    std::fs::create_dir_all(sync_dir.join("prompts"))
        .map_err(|e| format!("Failed to create prompts dir: {}", e))?;
    std::fs::create_dir_all(sync_dir.join("projects"))
        .map_err(|e| format!("Failed to create projects dir: {}", e))?;

    // Create settings.json if it doesn't exist
    let settings_path = sync_dir.join("settings.json");
    if !settings_path.exists() {
        std::fs::write(&settings_path, "{}")
            .map_err(|e| format!("Failed to create settings.json: {}", e))?;
    }

    // Create README
    let readme_path = sync_dir.join("README.md");
    if !readme_path.exists() {
        std::fs::write(
            &readme_path,
            "# Lumen Sync\n\nThis repository contains synced data for [Lumen](https://github.com/nasomers/lumen).\n\n- `prompts/` - Your prompt library\n- `projects/` - Project-specific memories\n- `settings.json` - App preferences\n",
        )
        .map_err(|e| format!("Failed to create README: {}", e))?;
    }

    // Commit the initial structure
    let _ = Command::new("git")
        .current_dir(sync_dir)
        .args(["add", "-A"])
        .output();

    let _ = Command::new("git")
        .current_dir(sync_dir)
        .args(["commit", "-m", "Initialize Lumen sync structure"])
        .output();

    let _ = Command::new("git")
        .current_dir(sync_dir)
        .args(["push"])
        .output();

    Ok(())
}

/// Pull latest from sync repo
#[tauri::command]
pub fn sync_pull() -> Result<SyncRepoResult, String> {
    let sync_dir = get_sync_dir()?;

    if !sync_dir.exists() {
        return Ok(SyncRepoResult {
            success: false,
            url: None,
            message: "Sync not configured".to_string(),
        });
    }

    let output = Command::new("git")
        .current_dir(&sync_dir)
        .args(["pull", "--rebase"])
        .output()
        .map_err(|e| format!("Failed to pull: {}", e))?;

    if output.status.success() {
        Ok(SyncRepoResult {
            success: true,
            url: None,
            message: "Pulled latest changes".to_string(),
        })
    } else {
        Ok(SyncRepoResult {
            success: false,
            url: None,
            message: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }
}

/// Push changes to sync repo
#[tauri::command]
pub fn sync_push() -> Result<SyncRepoResult, String> {
    let sync_dir = get_sync_dir()?;

    if !sync_dir.exists() {
        return Ok(SyncRepoResult {
            success: false,
            url: None,
            message: "Sync not configured".to_string(),
        });
    }

    // Add all changes
    let _ = Command::new("git")
        .current_dir(&sync_dir)
        .args(["add", "-A"])
        .output();

    // Commit if there are changes
    let _ = Command::new("git")
        .current_dir(&sync_dir)
        .args(["commit", "-m", "Sync from Lumen"])
        .output();

    // Push
    let output = Command::new("git")
        .current_dir(&sync_dir)
        .args(["push"])
        .output()
        .map_err(|e| format!("Failed to push: {}", e))?;

    if output.status.success() {
        Ok(SyncRepoResult {
            success: true,
            url: None,
            message: "Pushed changes".to_string(),
        })
    } else {
        Ok(SyncRepoResult {
            success: false,
            url: None,
            message: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }
}
