use tauri::AppHandle;

use crate::tray::{update_tray_state, update_tray_menu_usage, TrayState};
use crate::commands::sessions::get_today_stats;

/// Set the tray icon state from the frontend
///
/// Valid states: "normal", "syncing", "warning", "error", "success"
#[tauri::command]
pub fn set_tray_state(app: AppHandle, state: String) -> Result<(), String> {
    let tray_state = match state.to_lowercase().as_str() {
        "normal" => TrayState::Normal,
        "syncing" => TrayState::Syncing,
        "warning" => TrayState::Warning,
        "error" => TrayState::Error,
        "success" => TrayState::Success,
        _ => return Err(format!("Invalid tray state: {}", state)),
    };

    update_tray_state(&app, tray_state)
}

/// Update the tray menu usage display with current stats
#[tauri::command]
pub fn update_tray_usage(app: AppHandle) -> Result<(), String> {
    // Get today's stats
    let stats = get_today_stats()?;

    // Format the usage text
    let usage_text = if stats.session_count == 0 {
        "Today: No sessions yet".to_string()
    } else {
        let hours = stats.total_minutes / 60;
        let mins = stats.total_minutes % 60;
        let time_str = if hours > 0 {
            format!("{}h {}m", hours, mins)
        } else {
            format!("{}m", mins)
        };
        format!("Today: {} sessions, {}", stats.session_count, time_str)
    };

    // Update the menu item using the tray module function
    update_tray_menu_usage(&app, &usage_text)
}

/// Flash the tray icon (show success/error briefly, then return to normal)
#[tauri::command]
pub async fn flash_tray_state(app: AppHandle, state: String, duration_ms: Option<u64>) -> Result<(), String> {
    let tray_state = match state.to_lowercase().as_str() {
        "success" => TrayState::Success,
        "error" => TrayState::Error,
        "warning" => TrayState::Warning,
        _ => return Err(format!("Invalid flash state: {}", state)),
    };

    // Set the temporary state
    update_tray_state(&app, tray_state)?;

    // Wait for the specified duration (default 2 seconds)
    let duration = duration_ms.unwrap_or(2000);
    tokio::time::sleep(tokio::time::Duration::from_millis(duration)).await;

    // Return to normal state
    update_tray_state(&app, TrayState::Normal)
}
