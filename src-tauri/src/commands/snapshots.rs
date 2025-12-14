use crate::db;
use crate::git;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub timestamp: String,
    pub files_changed: i32,
    pub snapshot_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChange {
    pub path: String,
    pub status: String,
    pub additions: i32,
    pub deletions: i32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotDiff {
    pub files: Vec<FileChange>,
    pub total_additions: i32,
    pub total_deletions: i32,
}

/// Get project path from project_id by querying the database
fn get_project_path(project_id: &str) -> Result<String, String> {
    let conn = db::get_connection()?;

    let path: String = conn
        .query_row(
            "SELECT path FROM projects WHERE id = ?1",
            [project_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Project not found: {}", e))?;

    Ok(path)
}

#[tauri::command]
pub fn create_snapshot(
    project_id: String,
    name: String,
    description: Option<String>,
) -> Result<Snapshot, String> {
    let project_path = get_project_path(&project_id)?;
    let path = Path::new(&project_path);

    let info = git::create_snapshot(path, &name, description.as_deref())?;

    Ok(Snapshot {
        id: info.id,
        name: info.name,
        description: info.description,
        timestamp: info.timestamp,
        files_changed: info.files_changed,
        snapshot_type: info.snapshot_type,
    })
}

#[tauri::command]
pub fn list_snapshots(project_id: String) -> Result<Vec<Snapshot>, String> {
    let project_path = get_project_path(&project_id)?;
    let path = Path::new(&project_path);

    let snapshots = git::list_snapshots(path)?;

    Ok(snapshots
        .into_iter()
        .map(|info| Snapshot {
            id: info.id,
            name: info.name,
            description: info.description,
            timestamp: info.timestamp,
            files_changed: info.files_changed,
            snapshot_type: info.snapshot_type,
        })
        .collect())
}

#[tauri::command]
pub fn restore_snapshot(project_id: String, snapshot_id: String) -> Result<(), String> {
    let project_path = get_project_path(&project_id)?;
    let path = Path::new(&project_path);

    git::restore_snapshot(path, &snapshot_id)
}

#[tauri::command]
pub fn get_snapshot_diff(project_id: String, snapshot_id: String) -> Result<SnapshotDiff, String> {
    let project_path = get_project_path(&project_id)?;
    let path = Path::new(&project_path);

    let diff = git::get_snapshot_diff(path, &snapshot_id)?;

    Ok(SnapshotDiff {
        files: diff
            .files
            .into_iter()
            .map(|f| FileChange {
                path: f.path,
                status: f.status,
                additions: f.additions,
                deletions: f.deletions,
            })
            .collect(),
        total_additions: diff.total_additions,
        total_deletions: diff.total_deletions,
    })
}

#[tauri::command]
pub fn get_file_at_snapshot(
    project_id: String,
    snapshot_id: String,
    file_path: String,
) -> Result<Option<String>, String> {
    let project_path = get_project_path(&project_id)?;
    let path = Path::new(&project_path);

    git::get_file_at_snapshot(path, &snapshot_id, &file_path)
}

#[tauri::command]
pub fn compare_snapshots(
    project_id: String,
    from_id: String,
    to_id: String,
) -> Result<SnapshotDiff, String> {
    let project_path = get_project_path(&project_id)?;
    let path = Path::new(&project_path);

    let diff = git::compare_snapshots(path, &from_id, &to_id)?;

    Ok(SnapshotDiff {
        files: diff
            .files
            .into_iter()
            .map(|f| FileChange {
                path: f.path,
                status: f.status,
                additions: f.additions,
                deletions: f.deletions,
            })
            .collect(),
        total_additions: diff.total_additions,
        total_deletions: diff.total_deletions,
    })
}
