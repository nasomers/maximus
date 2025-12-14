use crate::pty::PTY_MANAGER;
use tauri::AppHandle;

#[tauri::command]
pub fn pty_spawn(
    app_handle: AppHandle,
    id: String,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
) -> Result<(), String> {
    let mut manager = PTY_MANAGER.lock().map_err(|e| e.to_string())?;
    manager.spawn(id, app_handle, cols, rows, cwd)
}

#[tauri::command]
pub fn pty_write(id: String, data: String) -> Result<(), String> {
    let mut manager = PTY_MANAGER.lock().map_err(|e| e.to_string())?;
    manager.write(&id, &data)
}

#[tauri::command]
pub fn pty_resize(id: String, cols: u16, rows: u16) -> Result<(), String> {
    let mut manager = PTY_MANAGER.lock().map_err(|e| e.to_string())?;
    manager.resize(&id, cols, rows)
}

#[tauri::command]
pub fn pty_kill(id: String) -> Result<(), String> {
    let mut manager = PTY_MANAGER.lock().map_err(|e| e.to_string())?;
    manager.kill(&id)
}
