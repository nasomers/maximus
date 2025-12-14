use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use std::fs;

/// Sensitive file patterns that should NEVER be committed
const SENSITIVE_PATTERNS: &[&str] = &[
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
    "credentials.json",
    "secrets.json",
    "service-account.json",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    "id_rsa",
    "id_ed25519",
    ".npmrc",  // Can contain auth tokens
    ".pypirc", // Can contain auth tokens
];

/// Check if a filename matches sensitive patterns
fn is_sensitive_file(filename: &str) -> bool {
    let lower = filename.to_lowercase();

    for pattern in SENSITIVE_PATTERNS {
        if pattern.starts_with('*') {
            // Wildcard pattern like *.pem
            let suffix = &pattern[1..];
            if lower.ends_with(suffix) {
                return true;
            }
        } else if lower == *pattern || lower.ends_with(&format!("/{}", pattern)) {
            return true;
        }
    }

    // Also check for common secret indicators in filename
    if lower.contains("secret") && !lower.contains("example") && !lower.contains("sample") {
        return true;
    }
    if lower.contains("password") && !lower.contains("example") && !lower.contains("sample") {
        return true;
    }
    if lower.contains("apikey") || lower.contains("api_key") || lower.contains("api-key") {
        return true;
    }

    false
}

/// Scan directory for sensitive files that would be committed
fn find_sensitive_files(project_path: &Path) -> Vec<String> {
    let mut sensitive_files = Vec::new();

    // Get list of files that would be staged (respecting .gitignore)
    let output = Command::new("git")
        .current_dir(project_path)
        .args(["ls-files", "--others", "--exclude-standard"])
        .output();

    if let Ok(out) = output {
        let files = String::from_utf8_lossy(&out.stdout);
        for file in files.lines() {
            if is_sensitive_file(file) {
                sensitive_files.push(file.to_string());
            }
        }
    }

    // Also check for sensitive files that might exist but aren't in .gitignore
    fn scan_dir(dir: &Path, base: &Path, sensitive: &mut Vec<String>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                let name = entry.file_name().to_string_lossy().to_string();

                // Skip hidden dirs except for sensitive dotfiles we want to catch
                if name.starts_with('.') && !name.starts_with(".env") && !name.starts_with(".npmrc") && !name.starts_with(".pypirc") {
                    continue;
                }

                // Skip common non-sensitive directories
                if name == "node_modules" || name == "target" || name == "dist" || name == ".git" {
                    continue;
                }

                if path.is_file() {
                    let relative = path.strip_prefix(base).unwrap_or(&path);
                    let rel_str = relative.to_string_lossy().to_string();
                    if is_sensitive_file(&rel_str) {
                        // Check if it's already in .gitignore
                        let check = Command::new("git")
                            .current_dir(base)
                            .args(["check-ignore", "-q", &rel_str])
                            .status();

                        // If check-ignore returns non-zero, file is NOT ignored
                        if check.map(|s| !s.success()).unwrap_or(true) {
                            sensitive.push(rel_str);
                        }
                    }
                } else if path.is_dir() {
                    scan_dir(&path, base, sensitive);
                }
            }
        }
    }

    scan_dir(project_path, project_path, &mut sensitive_files);

    // Deduplicate
    sensitive_files.sort();
    sensitive_files.dedup();

    sensitive_files
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    pub branch: String,
    pub ahead: i32,
    pub behind: i32,
    pub staged: Vec<String>,
    pub modified: Vec<String>,
    pub untracked: Vec<String>,
    pub has_remote: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitResult {
    pub success: bool,
    pub message: String,
    pub sha: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitPushResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrResult {
    pub success: bool,
    pub message: String,
    pub url: Option<String>,
}

/// Get git status for a project
#[tauri::command]
pub fn get_git_status(project_path: String) -> Result<GitStatus, String> {
    let path = Path::new(&project_path);

    if !path.join(".git").exists() {
        return Err("Not a git repository".to_string());
    }

    // Get current branch
    let branch_output = Command::new("git")
        .current_dir(&path)
        .args(["branch", "--show-current"])
        .output()
        .map_err(|e| format!("Failed to get branch: {}", e))?;

    let branch = String::from_utf8_lossy(&branch_output.stdout)
        .trim()
        .to_string();

    // Get ahead/behind counts
    let (ahead, behind, has_remote) = get_ahead_behind(&path, &branch);

    // Get status
    let status_output = Command::new("git")
        .current_dir(&path)
        .args(["status", "--porcelain"])
        .output()
        .map_err(|e| format!("Failed to get status: {}", e))?;

    let status_lines = String::from_utf8_lossy(&status_output.stdout);

    let mut staged = Vec::new();
    let mut modified = Vec::new();
    let mut untracked = Vec::new();

    for line in status_lines.lines() {
        if line.len() < 3 {
            continue;
        }
        let index = line.chars().next().unwrap_or(' ');
        let worktree = line.chars().nth(1).unwrap_or(' ');
        let file = line[3..].to_string();

        match index {
            'A' | 'M' | 'D' | 'R' | 'C' => staged.push(file.clone()),
            _ => {}
        }

        match worktree {
            'M' | 'D' => modified.push(file.clone()),
            '?' => untracked.push(file),
            _ => {}
        }
    }

    Ok(GitStatus {
        branch,
        ahead,
        behind,
        staged,
        modified,
        untracked,
        has_remote,
    })
}

fn get_ahead_behind(path: &Path, branch: &str) -> (i32, i32, bool) {
    // Check if we have a remote tracking branch
    let remote_output = Command::new("git")
        .current_dir(path)
        .args(["rev-parse", "--abbrev-ref", &format!("{}@{{upstream}}", branch)])
        .output();

    if let Ok(output) = remote_output {
        if output.status.success() {
            // Get ahead/behind
            let ab_output = Command::new("git")
                .current_dir(path)
                .args(["rev-list", "--left-right", "--count", &format!("{}...{}@{{upstream}}", branch, branch)])
                .output();

            if let Ok(ab) = ab_output {
                let counts = String::from_utf8_lossy(&ab.stdout);
                let parts: Vec<&str> = counts.trim().split('\t').collect();
                if parts.len() == 2 {
                    let ahead = parts[0].parse().unwrap_or(0);
                    let behind = parts[1].parse().unwrap_or(0);
                    return (ahead, behind, true);
                }
            }
        }
    }

    (0, 0, false)
}

/// Stage all changes
#[tauri::command]
pub fn git_stage_all(project_path: String) -> Result<(), String> {
    let path = Path::new(&project_path);

    // SECURITY CHECK: Scan for sensitive files BEFORE staging
    let sensitive_files = find_sensitive_files(path);
    if !sensitive_files.is_empty() {
        return Err(format!(
            "SECURITY WARNING: Cannot stage - sensitive files detected:\n- {}\n\nAdd them to .gitignore first.",
            sensitive_files.join("\n- ")
        ));
    }

    let output = Command::new("git")
        .current_dir(&project_path)
        .args(["add", "-A"])
        .output()
        .map_err(|e| format!("Failed to stage: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

/// Create a commit
#[tauri::command]
pub fn git_commit(project_path: String, message: String) -> Result<GitCommitResult, String> {
    // First stage all
    git_stage_all(project_path.clone())?;

    let output = Command::new("git")
        .current_dir(&project_path)
        .args(["commit", "-m", &message])
        .output()
        .map_err(|e| format!("Failed to commit: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("nothing to commit") {
            return Ok(GitCommitResult {
                success: false,
                message: "Nothing to commit".to_string(),
                sha: None,
            });
        }
        return Err(stderr.to_string());
    }

    // Get the commit SHA
    let sha_output = Command::new("git")
        .current_dir(&project_path)
        .args(["rev-parse", "HEAD"])
        .output()
        .ok();

    let sha = sha_output.and_then(|o| {
        if o.status.success() {
            Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
        } else {
            None
        }
    });

    Ok(GitCommitResult {
        success: true,
        message: "Committed successfully".to_string(),
        sha,
    })
}

/// Push to remote
#[tauri::command]
pub fn git_push(project_path: String) -> Result<GitPushResult, String> {
    let output = Command::new("git")
        .current_dir(&project_path)
        .args(["push"])
        .output()
        .map_err(|e| format!("Failed to push: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Check if we need to set upstream
        if stderr.contains("no upstream branch") {
            // Get current branch and push with -u
            let branch_output = Command::new("git")
                .current_dir(&project_path)
                .args(["branch", "--show-current"])
                .output()
                .map_err(|e| format!("Failed to get branch: {}", e))?;

            let branch = String::from_utf8_lossy(&branch_output.stdout).trim().to_string();

            let push_output = Command::new("git")
                .current_dir(&project_path)
                .args(["push", "-u", "origin", &branch])
                .output()
                .map_err(|e| format!("Failed to push: {}", e))?;

            if !push_output.status.success() {
                return Err(String::from_utf8_lossy(&push_output.stderr).to_string());
            }

            return Ok(GitPushResult {
                success: true,
                message: format!("Pushed and set upstream for {}", branch),
            });
        }
        return Err(stderr.to_string());
    }

    Ok(GitPushResult {
        success: true,
        message: "Pushed successfully".to_string(),
    })
}

/// Pull from remote
#[tauri::command]
pub fn git_pull(project_path: String) -> Result<GitPushResult, String> {
    let output = Command::new("git")
        .current_dir(&project_path)
        .args(["pull"])
        .output()
        .map_err(|e| format!("Failed to pull: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(GitPushResult {
        success: true,
        message: String::from_utf8_lossy(&output.stdout).trim().to_string(),
    })
}

/// Check if gh CLI is available
#[tauri::command]
pub fn check_gh_cli() -> bool {
    Command::new("gh")
        .args(["--version"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GhAuthStatus {
    pub installed: bool,
    pub authenticated: bool,
    pub username: Option<String>,
    pub scopes: Vec<String>,
}

/// Get GitHub CLI auth status with user info
#[tauri::command]
pub fn get_gh_auth_status() -> GhAuthStatus {
    // Check if gh is installed
    let installed = check_gh_cli();
    if !installed {
        return GhAuthStatus {
            installed: false,
            authenticated: false,
            username: None,
            scopes: vec![],
        };
    }

    // Check auth status
    let output = Command::new("gh")
        .args(["auth", "status"])
        .output();

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let stderr = String::from_utf8_lossy(&o.stderr);
            let combined = format!("{}{}", stdout, stderr);

            // gh auth status outputs to stderr typically
            let authenticated = o.status.success() || combined.contains("Logged in to");

            // Extract username from output like "Logged in to github.com account username"
            let username = combined
                .lines()
                .find(|line| line.contains("Logged in to"))
                .and_then(|line| line.split("account ").nth(1))
                .map(|s| s.split_whitespace().next().unwrap_or("").to_string())
                .filter(|s| !s.is_empty());

            // Extract scopes if present
            let scopes: Vec<String> = combined
                .lines()
                .find(|line| line.contains("Token scopes:"))
                .map(|line| {
                    line.split("Token scopes:")
                        .nth(1)
                        .unwrap_or("")
                        .split(',')
                        .map(|s| s.trim().trim_matches('\'').to_string())
                        .filter(|s| !s.is_empty())
                        .collect()
                })
                .unwrap_or_default();

            GhAuthStatus {
                installed: true,
                authenticated,
                username,
                scopes,
            }
        }
        Err(_) => GhAuthStatus {
            installed: true,
            authenticated: false,
            username: None,
            scopes: vec![],
        },
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRepoInfo {
    pub is_repo: bool,
    pub has_remote: bool,
    pub remote_url: Option<String>,
    pub branch: String,
}

/// Get git repository info for a project
#[tauri::command]
pub fn get_git_repo_info(project_path: String) -> GitRepoInfo {
    let path = Path::new(&project_path);

    // Check if it's a git repo
    if !path.join(".git").exists() {
        return GitRepoInfo {
            is_repo: false,
            has_remote: false,
            remote_url: None,
            branch: String::new(),
        };
    }

    // Get current branch
    let branch = Command::new("git")
        .current_dir(&path)
        .args(["branch", "--show-current"])
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|| "main".to_string());

    // Get remote URL
    let remote_output = Command::new("git")
        .current_dir(&path)
        .args(["remote", "get-url", "origin"])
        .output();

    let (has_remote, remote_url) = match remote_output {
        Ok(o) if o.status.success() => {
            let url = String::from_utf8_lossy(&o.stdout).trim().to_string();
            (true, Some(url))
        }
        _ => (false, None),
    };

    GitRepoInfo {
        is_repo: true,
        has_remote,
        remote_url,
        branch,
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitConfig {
    pub user_name: Option<String>,
    pub user_email: Option<String>,
}

/// Get git config (user.name and user.email)
#[tauri::command]
pub fn get_git_config() -> GitConfig {
    let name = Command::new("git")
        .args(["config", "--global", "user.name"])
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty());

    let email = Command::new("git")
        .args(["config", "--global", "user.email"])
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty());

    GitConfig {
        user_name: name,
        user_email: email,
    }
}

/// Set git config (user.name and user.email)
#[tauri::command]
pub fn set_git_config(user_name: String, user_email: String) -> Result<(), String> {
    Command::new("git")
        .args(["config", "--global", "user.name", &user_name])
        .output()
        .map_err(|e| format!("Failed to set user.name: {}", e))?;

    Command::new("git")
        .args(["config", "--global", "user.email", &user_email])
        .output()
        .map_err(|e| format!("Failed to set user.email: {}", e))?;

    Ok(())
}

/// Initialize a git repository
#[tauri::command]
pub fn git_init(project_path: String, default_branch: Option<String>) -> Result<(), String> {
    let branch = default_branch.unwrap_or_else(|| "main".to_string());

    let output = Command::new("git")
        .current_dir(&project_path)
        .args(["init", "-b", &branch])
        .output()
        .map_err(|e| format!("Failed to init git: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRepoResult {
    pub success: bool,
    pub url: Option<String>,
    pub message: String,
}

/// Create a GitHub repository using gh CLI
#[tauri::command]
pub fn create_github_repo(
    project_path: String,
    name: String,
    description: Option<String>,
    is_private: bool,
) -> Result<CreateRepoResult, String> {
    if !check_gh_cli() {
        return Err("GitHub CLI (gh) is not installed".to_string());
    }

    let path = Path::new(&project_path);

    // SECURITY CHECK: Scan for sensitive files BEFORE staging anything
    let sensitive_files = find_sensitive_files(path);
    if !sensitive_files.is_empty() {
        return Ok(CreateRepoResult {
            success: false,
            url: None,
            message: format!(
                "SECURITY WARNING: The following sensitive files would be committed:\n- {}\n\nPlease add them to .gitignore first.",
                sensitive_files.join("\n- ")
            ),
        });
    }

    // Check if there are any commits - if not, we need to create an initial commit
    let has_commits = Command::new("git")
        .current_dir(&project_path)
        .args(["rev-parse", "HEAD"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if !has_commits {
        // Stage all files
        let add_output = Command::new("git")
            .current_dir(&project_path)
            .args(["add", "-A"])
            .output()
            .map_err(|e| format!("Failed to stage files: {}", e))?;

        if !add_output.status.success() {
            return Ok(CreateRepoResult {
                success: false,
                url: None,
                message: format!("Failed to stage files: {}", String::from_utf8_lossy(&add_output.stderr)),
            });
        }

        // Create initial commit
        let commit_output = Command::new("git")
            .current_dir(&project_path)
            .args(["commit", "-m", "Initial commit"])
            .output()
            .map_err(|e| format!("Failed to create initial commit: {}", e))?;

        if !commit_output.status.success() {
            let stderr = String::from_utf8_lossy(&commit_output.stderr);
            // If nothing to commit, that's okay for empty projects
            if !stderr.contains("nothing to commit") {
                return Ok(CreateRepoResult {
                    success: false,
                    url: None,
                    message: format!("Failed to create initial commit: {}", stderr),
                });
            }
        }
    }

    let mut args = vec![
        "repo".to_string(),
        "create".to_string(),
        name.clone(),
        if is_private { "--private".to_string() } else { "--public".to_string() },
        "--source".to_string(),
        ".".to_string(),
        "--push".to_string(),
    ];

    if let Some(desc) = description {
        args.push("--description".to_string());
        args.push(desc);
    }

    let output = Command::new("gh")
        .current_dir(&project_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to create repo: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Ok(CreateRepoResult {
            success: false,
            url: None,
            message: stderr.to_string(),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    // Extract URL from output
    let url = stdout
        .lines()
        .find(|line| line.contains("github.com"))
        .map(|s| s.trim().to_string());

    Ok(CreateRepoResult {
        success: true,
        url,
        message: "Repository created successfully".to_string(),
    })
}

/// Add a remote to an existing git repository
#[tauri::command]
pub fn git_add_remote(project_path: String, url: String) -> Result<(), String> {
    let output = Command::new("git")
        .current_dir(&project_path)
        .args(["remote", "add", "origin", &url])
        .output()
        .map_err(|e| format!("Failed to add remote: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // If remote already exists, try to set-url instead
        if stderr.contains("already exists") {
            let set_output = Command::new("git")
                .current_dir(&project_path)
                .args(["remote", "set-url", "origin", &url])
                .output()
                .map_err(|e| format!("Failed to set remote URL: {}", e))?;

            if !set_output.status.success() {
                return Err(String::from_utf8_lossy(&set_output.stderr).to_string());
            }
        } else {
            return Err(stderr.to_string());
        }
    }

    Ok(())
}

/// Create a PR using gh CLI
#[tauri::command]
pub fn create_pr(
    project_path: String,
    title: String,
    body: String,
) -> Result<PrResult, String> {
    // Check if gh is available
    if !check_gh_cli() {
        return Err("GitHub CLI (gh) is not installed".to_string());
    }

    // Make sure we're up to date
    git_push(project_path.clone())?;

    let output = Command::new("gh")
        .current_dir(&project_path)
        .args(["pr", "create", "--title", &title, "--body", &body])
        .output()
        .map_err(|e| format!("Failed to create PR: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    // The URL is usually on the last line
    let url = stdout.lines().last().map(|s| s.trim().to_string());

    Ok(PrResult {
        success: true,
        message: "PR created successfully".to_string(),
        url,
    })
}
