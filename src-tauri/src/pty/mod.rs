pub mod claude_parser;
pub mod semantic_parser;

use portable_pty::{native_pty_system, CommandBuilder, PtySize, MasterPty, Child};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};

use claude_parser::ClaudeStateParser;
use semantic_parser::SemanticBlockParser;

/// Check if an executable exists in PATH (Windows only)
#[cfg(windows)]
fn which_exists(cmd: &str) -> bool {
    std::process::Command::new("where")
        .arg(cmd)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Manages PTY instances
pub struct PtyManager {
    ptys: HashMap<String, PtyInstance>,
}

struct PtyInstance {
    master: Box<dyn MasterPty + Send>,
    child: Box<dyn Child + Send + Sync>,
    writer: Box<dyn Write + Send>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            ptys: HashMap::new(),
        }
    }

    /// Spawn a new PTY with a shell
    pub fn spawn(
        &mut self,
        id: String,
        app_handle: AppHandle,
        cols: u16,
        rows: u16,
        cwd: Option<String>,
    ) -> Result<(), String> {
        let pty_system = native_pty_system();

        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        // Determine shell based on platform
        #[cfg(windows)]
        let (shell, shell_args): (String, Vec<&str>) = {
            // On Windows, prefer PowerShell 7 (pwsh) > Windows PowerShell > cmd
            if which_exists("pwsh") {
                ("pwsh".to_string(), vec!["-NoLogo"])
            } else if which_exists("powershell") {
                ("powershell".to_string(), vec!["-NoLogo"])
            } else {
                (std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string()), vec![])
            }
        };

        #[cfg(not(windows))]
        let (shell, shell_args): (String, Vec<&str>) = {
            // On Unix, use $SHELL or fall back to bash
            let sh = std::env::var("SHELL")
                .unwrap_or_else(|_| "/bin/bash".to_string());
            (sh, vec!["-l"]) // -l for login shell
        };

        let mut cmd = CommandBuilder::new(&shell);
        for arg in shell_args {
            cmd.arg(arg);
        }

        // Set working directory if provided
        if let Some(dir) = cwd {
            cmd.cwd(&dir);
        }

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {}", e))?;

        // Get writer for stdin
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to get writer: {}", e))?;

        // Clone for reader thread
        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone reader: {}", e))?;

        let pty_id = id.clone();
        let app = app_handle.clone();

        // Spawn thread to read PTY output and emit to frontend
        thread::spawn(move || {
            let mut buf = [0u8; 4096];
            let mut claude_parser = ClaudeStateParser::new();
            let mut semantic_parser = SemanticBlockParser::new();

            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();

                        // Parse for Claude state changes
                        if let Some(state_info) = claude_parser.parse(&data) {
                            let _ = app.emit(&format!("claude-state-{}", pty_id), &state_info);
                        }

                        // Parse for semantic blocks
                        let blocks = semantic_parser.parse(&data);
                        for block in blocks {
                            let _ = app.emit(&format!("semantic-block-{}", pty_id), &block);
                        }

                        // Always emit the raw output for terminal display
                        let _ = app.emit(&format!("pty-output-{}", pty_id), data);
                    }
                    Err(_) => break,
                }
            }

            // Flush any remaining semantic blocks
            if let Some(block) = semantic_parser.flush() {
                let _ = app.emit(&format!("semantic-block-{}", pty_id), &block);
            }

            // Notify that PTY has closed
            let _ = app.emit(&format!("pty-exit-{}", pty_id), ());
        });

        self.ptys.insert(
            id,
            PtyInstance {
                master: pair.master,
                child,
                writer,
            },
        );

        Ok(())
    }

    /// Write data to PTY stdin
    pub fn write(&mut self, id: &str, data: &str) -> Result<(), String> {
        let pty = self
            .ptys
            .get_mut(id)
            .ok_or_else(|| "PTY not found".to_string())?;

        pty.writer
            .write_all(data.as_bytes())
            .map_err(|e| format!("Failed to write: {}", e))?;

        pty.writer
            .flush()
            .map_err(|e| format!("Failed to flush: {}", e))?;

        Ok(())
    }

    /// Resize PTY
    pub fn resize(&mut self, id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let pty = self
            .ptys
            .get_mut(id)
            .ok_or_else(|| "PTY not found".to_string())?;

        pty.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to resize: {}", e))?;

        Ok(())
    }

    /// Kill PTY process
    pub fn kill(&mut self, id: &str) -> Result<(), String> {
        if let Some(mut pty) = self.ptys.remove(id) {
            let _ = pty.child.kill();
        }
        Ok(())
    }
}

// Global PTY manager wrapped in mutex
lazy_static::lazy_static! {
    pub static ref PTY_MANAGER: Arc<Mutex<PtyManager>> = Arc::new(Mutex::new(PtyManager::new()));
}
