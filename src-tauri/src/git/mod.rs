use git2::{Repository, Signature, IndexAddOption};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Default patterns to exclude from snapshots (security-sensitive files)
pub const DEFAULT_EXCLUSIONS: &[&str] = &[
    // Environment and secrets
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    // Credentials
    "**/credentials.*",
    "**/secrets.*",
    "**/*.secret",
    "**/secret_key*",
    // Package manager auth
    ".npmrc",
    ".pypirc",
    ".gem/credentials",
    // Cloud provider configs
    ".aws/credentials",
    ".azure/",
    "gcloud/",
    // IDE configs that may have tokens
    ".idea/**/workspace.xml",
    ".vscode/*.log",
    // Lumen internal
    ".lumen/",
    // Common ignores
    "node_modules/",
    "target/",
    ".git/",
    "__pycache__/",
    "*.pyc",
    ".DS_Store",
    "Thumbs.db",
];

/// Check if a file path matches any of the exclusion patterns
pub fn should_exclude(path: &Path, base_path: &Path) -> bool {
    let relative = path.strip_prefix(base_path).unwrap_or(path);
    let path_str = relative.to_string_lossy();

    for pattern in DEFAULT_EXCLUSIONS {
        if glob_match(pattern, &path_str) {
            return true;
        }
    }

    // Also check .gitignore if present
    let gitignore_path = base_path.join(".gitignore");
    if gitignore_path.exists() {
        if let Ok(content) = fs::read_to_string(&gitignore_path) {
            for line in content.lines() {
                let line = line.trim();
                if !line.is_empty() && !line.starts_with('#') {
                    if glob_match(line, &path_str) {
                        return true;
                    }
                }
            }
        }
    }

    false
}

/// Simple glob matching (supports * and **)
fn glob_match(pattern: &str, path: &str) -> bool {
    let pattern = pattern.trim_end_matches('/');
    let path = path.trim_start_matches('/');

    // Handle exact matches
    if pattern == path {
        return true;
    }

    // Handle patterns starting with **/
    if pattern.starts_with("**/") {
        let suffix = &pattern[3..];
        return path.ends_with(suffix) || path.contains(&format!("/{}", suffix));
    }

    // Handle patterns with * wildcard
    if pattern.contains('*') && !pattern.contains("**") {
        let parts: Vec<&str> = pattern.split('*').collect();
        if parts.len() == 2 {
            let matches_start = parts[0].is_empty() || path.starts_with(parts[0]);
            let matches_end = parts[1].is_empty() || path.ends_with(parts[1]);
            return matches_start && matches_end;
        }
    }

    // Handle directory patterns
    if path.starts_with(pattern) {
        return true;
    }

    false
}

/// Get the snapshot repository path for a project
pub fn get_snapshot_repo_path(project_path: &Path) -> PathBuf {
    project_path.join(".lumen").join("snapshots")
}

/// Initialize or open the shadow git repository for snapshots
pub fn init_or_open_repo(project_path: &Path) -> Result<Repository, String> {
    let snapshot_dir = get_snapshot_repo_path(project_path);

    fs::create_dir_all(&snapshot_dir)
        .map_err(|e| format!("Failed to create snapshots directory: {}", e))?;

    let git_dir = snapshot_dir.join(".git");
    if git_dir.exists() {
        Repository::open(&snapshot_dir)
            .map_err(|e| format!("Failed to open repository: {}", e))
    } else {
        let repo = Repository::init(&snapshot_dir)
            .map_err(|e| format!("Failed to initialize repository: {}", e))?;

        // Create initial empty commit
        let sig = Signature::now("Lumen", "lumen@local")
            .map_err(|e| format!("Failed to create signature: {}", e))?;

        {
            let tree_id = {
                let mut index = repo.index().map_err(|e| format!("Failed to get index: {}", e))?;
                index.write_tree().map_err(|e| format!("Failed to write tree: {}", e))?
            };

            let tree = repo.find_tree(tree_id)
                .map_err(|e| format!("Failed to find tree: {}", e))?;

            repo.commit(Some("HEAD"), &sig, &sig, "Initial snapshot", &tree, &[])
                .map_err(|e| format!("Failed to create initial commit: {}", e))?;
        }

        Ok(repo)
    }
}

/// Copy project files to snapshot directory
pub fn copy_project_to_snapshot(project_path: &Path, snapshot_path: &Path) -> Result<i32, String> {
    let mut file_count = 0;

    // Clear existing files in snapshot (except .git)
    for entry in fs::read_dir(snapshot_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.file_name().map(|n| n != ".git").unwrap_or(false) {
            if path.is_dir() {
                fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
            } else {
                fs::remove_file(&path).map_err(|e| e.to_string())?;
            }
        }
    }

    // Copy files from project to snapshot
    for entry in WalkDir::new(project_path)
        .into_iter()
        .filter_entry(|e| !should_exclude(e.path(), project_path))
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // Skip the project root itself
        if path == project_path {
            continue;
        }

        let relative = path.strip_prefix(project_path).map_err(|e| e.to_string())?;
        let dest = snapshot_path.join(relative);

        if path.is_dir() {
            fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = dest.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            fs::copy(path, &dest).map_err(|e| e.to_string())?;
            file_count += 1;
        }
    }

    Ok(file_count)
}

/// Create a new snapshot
pub fn create_snapshot(
    project_path: &Path,
    name: &str,
    description: Option<&str>,
) -> Result<SnapshotInfo, String> {
    let repo = init_or_open_repo(project_path)?;
    let snapshot_path = get_snapshot_repo_path(project_path);

    // Copy project files to snapshot directory
    let files_changed = copy_project_to_snapshot(project_path, &snapshot_path)?;

    // Stage all changes
    let mut index = repo.index().map_err(|e| format!("Failed to get index: {}", e))?;
    index.add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
        .map_err(|e| format!("Failed to add files: {}", e))?;

    // Also stage deletions
    index.update_all(["*"].iter(), None)
        .map_err(|e| format!("Failed to update index: {}", e))?;

    index.write().map_err(|e| format!("Failed to write index: {}", e))?;

    let tree_id = index.write_tree().map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repo.find_tree(tree_id).map_err(|e| format!("Failed to find tree: {}", e))?;

    // Create commit message
    let message = match description {
        Some(desc) => format!("{}\n\n{}", name, desc),
        None => name.to_string(),
    };

    let sig = Signature::now("Lumen", "lumen@local")
        .map_err(|e| format!("Failed to create signature: {}", e))?;

    // Get parent commit
    let parent = repo.head()
        .and_then(|h| h.peel_to_commit())
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;

    let commit_id = repo.commit(Some("HEAD"), &sig, &sig, &message, &tree, &[&parent])
        .map_err(|e| format!("Failed to create commit: {}", e))?;

    Ok(SnapshotInfo {
        id: commit_id.to_string(),
        name: name.to_string(),
        description: description.map(String::from),
        timestamp: chrono::Utc::now().to_rfc3339(),
        files_changed,
        snapshot_type: "manual".to_string(),
    })
}

/// List all snapshots
pub fn list_snapshots(project_path: &Path) -> Result<Vec<SnapshotInfo>, String> {
    let snapshot_path = get_snapshot_repo_path(project_path);
    if !snapshot_path.join(".git").exists() {
        return Ok(vec![]);
    }

    let repo = Repository::open(&snapshot_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let mut revwalk = repo.revwalk().map_err(|e| format!("Failed to create revwalk: {}", e))?;
    revwalk.push_head().map_err(|e| format!("Failed to push HEAD: {}", e))?;

    let mut snapshots = Vec::new();

    for oid in revwalk {
        let oid = oid.map_err(|e| format!("Failed to get oid: {}", e))?;
        let commit = repo.find_commit(oid).map_err(|e| format!("Failed to find commit: {}", e))?;

        // Skip initial commit
        let message = commit.message().unwrap_or("");
        if message == "Initial snapshot" {
            continue;
        }

        // Parse name and description from commit message
        let lines: Vec<&str> = message.lines().collect();
        let name = lines.first().unwrap_or(&"Unnamed").to_string();
        let description = if lines.len() > 2 {
            Some(lines[2..].join("\n"))
        } else {
            None
        };

        // Calculate files changed (diff with parent)
        let files_changed = if let Some(parent_id) = commit.parent_id(0).ok() {
            if let Ok(parent) = repo.find_commit(parent_id) {
                if let (Ok(tree), Ok(parent_tree)) = (commit.tree(), parent.tree()) {
                    if let Ok(diff) = repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None) {
                        diff.stats().map(|s| s.files_changed() as i32).unwrap_or(0)
                    } else {
                        0
                    }
                } else {
                    0
                }
            } else {
                0
            }
        } else {
            0
        };

        let timestamp = chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default();

        snapshots.push(SnapshotInfo {
            id: oid.to_string(),
            name,
            description,
            timestamp,
            files_changed,
            snapshot_type: "manual".to_string(),
        });
    }

    Ok(snapshots)
}

/// Restore a snapshot to the project
pub fn restore_snapshot(project_path: &Path, snapshot_id: &str) -> Result<(), String> {
    let snapshot_path = get_snapshot_repo_path(project_path);
    let repo = Repository::open(&snapshot_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    // Parse the commit ID
    let oid = git2::Oid::from_str(snapshot_id)
        .map_err(|e| format!("Invalid snapshot ID: {}", e))?;

    let commit = repo.find_commit(oid)
        .map_err(|e| format!("Snapshot not found: {}", e))?;

    // Checkout the commit
    let tree = commit.tree().map_err(|e| format!("Failed to get tree: {}", e))?;

    repo.checkout_tree(tree.as_object(), Some(
        git2::build::CheckoutBuilder::new()
            .force()
            .remove_untracked(true)
    )).map_err(|e| format!("Failed to checkout: {}", e))?;

    // Copy files back to project
    for entry in WalkDir::new(&snapshot_path)
        .into_iter()
        .filter_entry(|e| e.file_name() != ".git")
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path == snapshot_path {
            continue;
        }

        let relative = path.strip_prefix(&snapshot_path).map_err(|e| e.to_string())?;
        let dest = project_path.join(relative);

        if path.is_dir() {
            fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = dest.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            fs::copy(path, &dest).map_err(|e| e.to_string())?;
        }
    }

    // Reset to HEAD for future snapshots
    let head = repo.head().map_err(|e| format!("Failed to get HEAD: {}", e))?;
    let head_commit = head.peel_to_commit().map_err(|e| format!("Failed to get HEAD commit: {}", e))?;
    let head_tree = head_commit.tree().map_err(|e| format!("Failed to get HEAD tree: {}", e))?;

    repo.checkout_tree(head_tree.as_object(), Some(
        git2::build::CheckoutBuilder::new().force()
    )).map_err(|e| format!("Failed to reset: {}", e))?;

    Ok(())
}

#[derive(Debug, Clone)]
pub struct SnapshotInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub timestamp: String,
    pub files_changed: i32,
    pub snapshot_type: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FileChange {
    pub path: String,
    pub status: String, // "added", "modified", "deleted", "renamed"
    pub additions: i32,
    pub deletions: i32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct SnapshotDiff {
    pub files: Vec<FileChange>,
    pub total_additions: i32,
    pub total_deletions: i32,
}

/// Get the diff for a specific snapshot (compared to its parent)
pub fn get_snapshot_diff(project_path: &Path, snapshot_id: &str) -> Result<SnapshotDiff, String> {
    let snapshot_path = get_snapshot_repo_path(project_path);
    let repo = Repository::open(&snapshot_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let oid = git2::Oid::from_str(snapshot_id)
        .map_err(|e| format!("Invalid snapshot ID: {}", e))?;

    let commit = repo.find_commit(oid)
        .map_err(|e| format!("Snapshot not found: {}", e))?;

    let tree = commit.tree().map_err(|e| format!("Failed to get tree: {}", e))?;

    // Get parent commit tree (or empty tree if this is the first commit)
    let parent_tree = commit.parent(0)
        .ok()
        .and_then(|p| p.tree().ok());

    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)
        .map_err(|e| format!("Failed to create diff: {}", e))?;

    let mut files = Vec::new();
    let mut total_additions = 0;
    let mut total_deletions = 0;

    diff.foreach(
        &mut |delta, _| {
            let status = match delta.status() {
                git2::Delta::Added => "added",
                git2::Delta::Deleted => "deleted",
                git2::Delta::Modified => "modified",
                git2::Delta::Renamed => "renamed",
                git2::Delta::Copied => "copied",
                _ => "unknown",
            };

            let path = delta.new_file().path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            files.push(FileChange {
                path,
                status: status.to_string(),
                additions: 0,
                deletions: 0,
            });
            true
        },
        None,
        None,
        Some(&mut |_delta, _hunk, line| {
            match line.origin() {
                '+' => total_additions += 1,
                '-' => total_deletions += 1,
                _ => {}
            }
            true
        }),
    ).map_err(|e| format!("Failed to iterate diff: {}", e))?;

    Ok(SnapshotDiff {
        files,
        total_additions,
        total_deletions,
    })
}

/// Get file content at a specific snapshot
pub fn get_file_at_snapshot(
    project_path: &Path,
    snapshot_id: &str,
    file_path: &str,
) -> Result<Option<String>, String> {
    let snapshot_path = get_snapshot_repo_path(project_path);
    let repo = Repository::open(&snapshot_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let oid = git2::Oid::from_str(snapshot_id)
        .map_err(|e| format!("Invalid snapshot ID: {}", e))?;

    let commit = repo.find_commit(oid)
        .map_err(|e| format!("Snapshot not found: {}", e))?;

    let tree = commit.tree().map_err(|e| format!("Failed to get tree: {}", e))?;

    match tree.get_path(Path::new(file_path)) {
        Ok(entry) => {
            let blob = repo.find_blob(entry.id())
                .map_err(|e| format!("Failed to find blob: {}", e))?;

            if blob.is_binary() {
                Ok(Some("[Binary file]".to_string()))
            } else {
                Ok(Some(String::from_utf8_lossy(blob.content()).to_string()))
            }
        }
        Err(_) => Ok(None), // File doesn't exist at this snapshot
    }
}

/// Compare two snapshots
pub fn compare_snapshots(
    project_path: &Path,
    from_id: &str,
    to_id: &str,
) -> Result<SnapshotDiff, String> {
    let snapshot_path = get_snapshot_repo_path(project_path);
    let repo = Repository::open(&snapshot_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let from_oid = git2::Oid::from_str(from_id)
        .map_err(|e| format!("Invalid from snapshot ID: {}", e))?;
    let to_oid = git2::Oid::from_str(to_id)
        .map_err(|e| format!("Invalid to snapshot ID: {}", e))?;

    let from_commit = repo.find_commit(from_oid)
        .map_err(|e| format!("From snapshot not found: {}", e))?;
    let to_commit = repo.find_commit(to_oid)
        .map_err(|e| format!("To snapshot not found: {}", e))?;

    let from_tree = from_commit.tree().map_err(|e| format!("Failed to get from tree: {}", e))?;
    let to_tree = to_commit.tree().map_err(|e| format!("Failed to get to tree: {}", e))?;

    let diff = repo.diff_tree_to_tree(Some(&from_tree), Some(&to_tree), None)
        .map_err(|e| format!("Failed to create diff: {}", e))?;

    let mut files = Vec::new();
    let mut total_additions = 0;
    let mut total_deletions = 0;

    diff.foreach(
        &mut |delta, _| {
            let status = match delta.status() {
                git2::Delta::Added => "added",
                git2::Delta::Deleted => "deleted",
                git2::Delta::Modified => "modified",
                git2::Delta::Renamed => "renamed",
                git2::Delta::Copied => "copied",
                _ => "unknown",
            };

            let path = delta.new_file().path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            files.push(FileChange {
                path,
                status: status.to_string(),
                additions: 0,
                deletions: 0,
            });
            true
        },
        None,
        None,
        Some(&mut |_delta, _hunk, line| {
            match line.origin() {
                '+' => total_additions += 1,
                '-' => total_deletions += 1,
                _ => {}
            }
            true
        }),
    ).map_err(|e| format!("Failed to iterate diff: {}", e))?;

    Ok(SnapshotDiff {
        files,
        total_additions,
        total_deletions,
    })
}
