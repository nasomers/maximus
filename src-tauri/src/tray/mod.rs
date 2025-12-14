use std::sync::{Arc, Mutex};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

/// Tray icon states
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayState {
    Normal,
    Syncing,
    Warning,
    Error,
    Success,
}

impl TrayState {
    pub fn icon_filename(&self) -> &'static str {
        match self {
            TrayState::Normal => "icon.png",
            TrayState::Syncing => "icon-syncing.png",
            TrayState::Warning => "icon-warning.png",
            TrayState::Error => "icon-error.png",
            TrayState::Success => "icon-success.png",
        }
    }
}

/// Managed state for the tray icon
pub struct TrayManager {
    state: Mutex<TrayState>,
    usage_item: Mutex<Option<Arc<MenuItem<tauri::Wry>>>>,
}

impl TrayManager {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(TrayState::Normal),
            usage_item: Mutex::new(None),
        }
    }

    pub fn get_state(&self) -> TrayState {
        *self.state.lock().unwrap()
    }

    pub fn set_state(&self, new_state: TrayState) {
        *self.state.lock().unwrap() = new_state;
    }

    pub fn set_usage_item(&self, item: Arc<MenuItem<tauri::Wry>>) {
        *self.usage_item.lock().unwrap() = Some(item);
    }

    pub fn get_usage_item(&self) -> Option<Arc<MenuItem<tauri::Wry>>> {
        self.usage_item.lock().unwrap().clone()
    }
}

impl Default for TrayManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Update the usage text in the tray menu
pub fn update_tray_menu_usage<R: Runtime>(app: &AppHandle<R>, text: &str) -> Result<(), String> {
    if let Some(manager) = app.try_state::<TrayManager>() {
        if let Some(item) = manager.get_usage_item() {
            item.set_text(text).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Load icon for the given state
/// Uses programmatically generated colored icons for consistent state indication
fn load_tray_icon<R: Runtime>(_app: &AppHandle<R>, state: TrayState) -> Image<'static> {
    create_colored_icon(state)
}

/// Create a clean, modern rounded square icon with "M"
/// Uses anti-aliasing for smooth edges
fn create_colored_icon(state: TrayState) -> Image<'static> {
    let size = 64u32; // Higher resolution for better quality

    // State-based accent color
    let (ar, ag, ab) = match state {
        TrayState::Normal => (99, 102, 241),   // Indigo
        TrayState::Syncing => (139, 92, 246),  // Purple
        TrayState::Warning => (245, 158, 11),  // Amber
        TrayState::Error => (239, 68, 68),     // Red
        TrayState::Success => (34, 197, 94),   // Green
    };

    let mut pixels = Vec::with_capacity((size * size * 4) as usize);

    for y in 0..size {
        for x in 0..size {
            let (r, g, b, a) = get_modern_icon_pixel(x, y, size, (ar, ag, ab));
            pixels.push(r);
            pixels.push(g);
            pixels.push(b);
            pixels.push(a);
        }
    }

    Image::new_owned(pixels, size, size)
}

/// Create a modern rounded square icon pixel
fn get_modern_icon_pixel(x: u32, y: u32, size: u32, accent: (u8, u8, u8)) -> (u8, u8, u8, u8) {
    let fx = x as f32;
    let fy = y as f32;
    let fs = size as f32;

    // Normalize to 0-1
    let nx = fx / fs;
    let ny = fy / fs;

    // Rounded square parameters
    let padding = 0.08;
    let corner_radius = 0.22;

    // Check if inside rounded square
    let in_square = is_in_rounded_rect(nx, ny, padding, 1.0 - padding, padding, 1.0 - padding, corner_radius);

    if !in_square {
        return (0, 0, 0, 0); // Transparent
    }

    // Background gradient (dark to darker)
    let bg_top = (30, 32, 38);
    let bg_bottom = (20, 22, 28);
    let t = ny;
    let bg_r = (bg_top.0 as f32 * (1.0 - t) + bg_bottom.0 as f32 * t) as u8;
    let bg_g = (bg_top.1 as f32 * (1.0 - t) + bg_bottom.1 as f32 * t) as u8;
    let bg_b = (bg_top.2 as f32 * (1.0 - t) + bg_bottom.2 as f32 * t) as u8;

    // Draw "M" letter
    if is_modern_m(nx, ny) {
        // Gradient M from accent color to slightly lighter
        let m_r = accent.0.saturating_add(20);
        let m_g = accent.1.saturating_add(20);
        let m_b = accent.2.saturating_add(20);
        return (m_r, m_g, m_b, 255);
    }

    // Small accent dot in corner (status indicator)
    let dot_cx = 0.78;
    let dot_cy = 0.22;
    let dot_r = 0.08;
    let dist_to_dot = ((nx - dot_cx).powi(2) + (ny - dot_cy).powi(2)).sqrt();
    if dist_to_dot < dot_r {
        return (accent.0, accent.1, accent.2, 255);
    }

    (bg_r, bg_g, bg_b, 255)
}

/// Check if point is inside a rounded rectangle
fn is_in_rounded_rect(x: f32, y: f32, left: f32, right: f32, top: f32, bottom: f32, radius: f32) -> bool {
    // Check corners
    let corners = [
        (left + radius, top + radius),     // top-left
        (right - radius, top + radius),    // top-right
        (left + radius, bottom - radius),  // bottom-left
        (right - radius, bottom - radius), // bottom-right
    ];

    // If in corner region, check circle distance
    if x < left + radius && y < top + radius {
        return ((x - corners[0].0).powi(2) + (y - corners[0].1).powi(2)).sqrt() <= radius;
    }
    if x > right - radius && y < top + radius {
        return ((x - corners[1].0).powi(2) + (y - corners[1].1).powi(2)).sqrt() <= radius;
    }
    if x < left + radius && y > bottom - radius {
        return ((x - corners[2].0).powi(2) + (y - corners[2].1).powi(2)).sqrt() <= radius;
    }
    if x > right - radius && y > bottom - radius {
        return ((x - corners[3].0).powi(2) + (y - corners[3].1).powi(2)).sqrt() <= radius;
    }

    // Inside main rectangle area
    x >= left && x <= right && y >= top && y <= bottom
}

/// Modern, clean M letter design
fn is_modern_m(nx: f32, ny: f32) -> bool {
    // M bounds - centered and proportional
    let m_left = 0.20;
    let m_right = 0.80;
    let m_top = 0.28;
    let m_bottom = 0.72;
    let stroke = 0.11;

    if nx < m_left || nx > m_right || ny < m_top || ny > m_bottom {
        return false;
    }

    // Left vertical bar
    if nx <= m_left + stroke {
        return true;
    }

    // Right vertical bar
    if nx >= m_right - stroke {
        return true;
    }

    // Left diagonal (top-left going down to center)
    let diag_progress = (ny - m_top) / (m_bottom - m_top);
    let left_diag_x = m_left + stroke / 2.0 + diag_progress * (0.5 - m_left - stroke / 2.0);
    if (nx - left_diag_x).abs() < stroke / 2.0 && diag_progress < 0.55 {
        return true;
    }

    // Right diagonal (top-right going down to center)
    let right_diag_x = m_right - stroke / 2.0 - diag_progress * (m_right - stroke / 2.0 - 0.5);
    if (nx - right_diag_x).abs() < stroke / 2.0 && diag_progress < 0.55 {
        return true;
    }

    false
}

/// Update the tray icon to a new state
pub fn update_tray_state<R: Runtime>(app: &AppHandle<R>, state: TrayState) -> Result<(), String> {
    // Update the managed state
    if let Some(manager) = app.try_state::<TrayManager>() {
        manager.set_state(state);
    }

    // Get the tray icon and update it
    if let Some(tray) = app.tray_by_id("main-tray") {
        let icon = load_tray_icon(app, state);
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;

        // Update tooltip to reflect state
        let tooltip = match state {
            TrayState::Normal => "Maximus",
            TrayState::Syncing => "Maximus - Syncing...",
            TrayState::Warning => "Maximus - Warning",
            TrayState::Error => "Maximus - Error",
            TrayState::Success => "Maximus - Success",
        };
        tray.set_tooltip(Some(tooltip)).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Set up the system tray with menu items
pub fn setup_tray(app: &tauri::App<tauri::Wry>) -> Result<(), Box<dyn std::error::Error>> {
    // Register the tray manager state
    let manager = TrayManager::new();

    // Create menu items - clean, minimal design without emojis
    let quick_save = MenuItem::with_id(app, "quick_save", "Quick Save", true, None::<&str>)?;
    let undo_last = MenuItem::with_id(app, "undo_last", "Undo Last", true, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let open_dashboard =
        MenuItem::with_id(app, "open_dashboard", "Open Dashboard", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let usage_display =
        MenuItem::with_id(app, "usage", "Today: No sessions yet", false, None::<&str>)?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    // Store the usage menu item for later updates
    manager.set_usage_item(Arc::new(usage_display.clone()));
    app.manage(manager);

    // Build the menu
    let menu = Menu::with_items(
        app,
        &[
            &quick_save,
            &undo_last,
            &separator1,
            &open_dashboard,
            &separator2,
            &usage_display,
            &separator3,
            &quit,
        ],
    )?;

    // Get the initial icon (blue circle for normal state)
    let initial_icon = create_colored_icon(TrayState::Normal);

    // Create the tray icon with an ID so we can reference it later
    let _tray: TrayIcon<tauri::Wry> = TrayIconBuilder::with_id("main-tray")
        .icon(initial_icon)
        .menu(&menu)
        .tooltip("Maximus")
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quick_save" => {
                println!("Quick save clicked");
                // Show syncing state
                let _ = update_tray_state(app, TrayState::Syncing);

                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-action", "quick_save");
                }
            }
            "undo_last" => {
                println!("Undo last clicked");
                let _ = update_tray_state(app, TrayState::Syncing);

                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-action", "undo_last");
                }
            }
            "open_dashboard" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
