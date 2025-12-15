use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryItem {
    pub id: String,
    pub key: String,
    pub value: String,
    pub category: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct MemoryStore {
    items: HashMap<String, MemoryItem>,
}

/// Get the memory file path for a project
fn get_memory_path(project_path: &str) -> std::path::PathBuf {
    Path::new(project_path).join(".lumen").join("memory.json")
}

/// Load memory from disk
fn load_memory(project_path: &str) -> Result<MemoryStore, String> {
    let memory_path = get_memory_path(project_path);

    if !memory_path.exists() {
        return Ok(MemoryStore::default());
    }

    let content = fs::read_to_string(&memory_path)
        .map_err(|e| format!("Failed to read memory file: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse memory file: {}", e))
}

/// Save memory to disk
fn save_memory(project_path: &str, store: &MemoryStore) -> Result<(), String> {
    let memory_path = get_memory_path(project_path);

    // Ensure .lumen directory exists
    if let Some(parent) = memory_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create .lumen directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(store)
        .map_err(|e| format!("Failed to serialize memory: {}", e))?;

    fs::write(&memory_path, content)
        .map_err(|e| format!("Failed to write memory file: {}", e))?;

    Ok(())
}

/// Get all memory items for a project
#[tauri::command]
pub fn get_memory(project_path: String) -> Result<Vec<MemoryItem>, String> {
    let store = load_memory(&project_path)?;
    let mut items: Vec<MemoryItem> = store.items.into_values().collect();

    // Sort by key for consistent ordering
    items.sort_by(|a, b| a.key.cmp(&b.key));

    Ok(items)
}

/// Set or update a memory item
#[tauri::command]
pub fn set_memory(
    project_path: String,
    key: String,
    value: String,
    category: Option<String>,
) -> Result<MemoryItem, String> {
    let mut store = load_memory(&project_path)?;

    let now = chrono::Utc::now().to_rfc3339();

    let item = if let Some(existing) = store.items.get(&key) {
        // Update existing item
        MemoryItem {
            id: existing.id.clone(),
            key: key.clone(),
            value,
            category: category.or_else(|| existing.category.clone()),
            created_at: existing.created_at.clone(),
            updated_at: now,
        }
    } else {
        // Create new item
        MemoryItem {
            id: uuid::Uuid::new_v4().to_string(),
            key: key.clone(),
            value,
            category,
            created_at: now.clone(),
            updated_at: now,
        }
    };

    store.items.insert(key, item.clone());
    save_memory(&project_path, &store)?;

    Ok(item)
}

/// Delete a memory item
#[tauri::command]
pub fn delete_memory(project_path: String, key: String) -> Result<(), String> {
    let mut store = load_memory(&project_path)?;

    if store.items.remove(&key).is_none() {
        return Err(format!("Memory item '{}' not found", key));
    }

    save_memory(&project_path, &store)?;

    Ok(())
}
