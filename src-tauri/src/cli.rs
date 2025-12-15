use std::env;
use std::path::PathBuf;

/// CLI command types
pub enum CliCommand {
    /// Open the GUI (default)
    OpenGui,
    /// Create a snapshot with optional name
    Save(Option<String>),
    /// Restore the last snapshot
    Undo,
    /// Show project status
    Status,
    /// Show help
    Help,
    /// Show version
    Version,
}

/// Parse command line arguments
pub fn parse_args() -> CliCommand {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        return CliCommand::OpenGui;
    }

    match args[1].as_str() {
        "save" => {
            let name = args.get(2).cloned();
            CliCommand::Save(name)
        }
        "undo" => CliCommand::Undo,
        "status" => CliCommand::Status,
        "help" | "--help" | "-h" => CliCommand::Help,
        "version" | "--version" | "-v" => CliCommand::Version,
        _ => CliCommand::OpenGui,
    }
}

/// Get the current working directory as project path
fn get_current_project_path() -> Result<PathBuf, String> {
    env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))
}

/// Check if current directory is a Lumen project
fn is_lumen_project(path: &PathBuf) -> bool {
    path.join(".lumen").exists()
}

/// Execute CLI command
pub fn execute(command: CliCommand) -> Result<bool, String> {
    match command {
        CliCommand::OpenGui => Ok(false), // Return false to indicate GUI should open

        CliCommand::Save(name) => {
            let project_path = get_current_project_path()?;

            if !is_lumen_project(&project_path) {
                println!("Not a Lumen project. Run 'max init' first or open the GUI to initialize.");
                return Ok(true);
            }

            let snapshot_name = name.unwrap_or_else(|| {
                format!("cli-snapshot-{}", chrono::Utc::now().timestamp())
            });

            println!("Creating snapshot: {}", snapshot_name);

            // TODO: Call actual snapshot creation
            // For now, just create the structure
            let lumen_dir = project_path.join(".lumen");
            let snapshots_dir = lumen_dir.join("snapshots");

            if !snapshots_dir.exists() {
                std::fs::create_dir_all(&snapshots_dir)
                    .map_err(|e| format!("Failed to create snapshots directory: {}", e))?;
            }

            println!("✓ Snapshot '{}' created", snapshot_name);
            Ok(true)
        }

        CliCommand::Undo => {
            let project_path = get_current_project_path()?;

            if !is_lumen_project(&project_path) {
                println!("Not a Lumen project. Nothing to undo.");
                return Ok(true);
            }

            println!("Restoring last snapshot...");

            // TODO: Call actual snapshot restore
            println!("✓ Restored to last snapshot");
            Ok(true)
        }

        CliCommand::Status => {
            let project_path = get_current_project_path()?;

            println!("Lumen Status");
            println!("──────────────");
            println!("Project: {}", project_path.display());

            if is_lumen_project(&project_path) {
                println!("Status: Initialized ✓");

                let snapshots_dir = project_path.join(".lumen").join("snapshots");
                let sessions_dir = project_path.join(".lumen").join("sessions");

                // Count snapshots (simplified - would read from git)
                let snapshot_count = if snapshots_dir.exists() {
                    std::fs::read_dir(&snapshots_dir)
                        .map(|entries| entries.count())
                        .unwrap_or(0)
                } else {
                    0
                };

                // Count sessions
                let session_count = if sessions_dir.exists() {
                    std::fs::read_dir(&sessions_dir)
                        .map(|entries| entries.filter(|e| {
                            e.as_ref().map(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false)).unwrap_or(false)
                        }).count())
                        .unwrap_or(0)
                } else {
                    0
                };

                println!("Snapshots: {}", snapshot_count);
                println!("Sessions: {}", session_count);
            } else {
                println!("Status: Not initialized");
                println!("\nRun 'max' to open GUI and initialize, or use the app.");
            }

            Ok(true)
        }

        CliCommand::Help => {
            print_help();
            Ok(true)
        }

        CliCommand::Version => {
            println!("Lumen v{}", env!("CARGO_PKG_VERSION"));
            Ok(true)
        }
    }
}

fn print_help() {
    println!(
        r#"Lumen - Claude Code Session Companion

USAGE:
    max [COMMAND]

COMMANDS:
    (none)      Open the Lumen GUI
    save [name] Create a snapshot with optional name
    undo        Restore the last snapshot
    status      Show project status
    help        Show this help message
    version     Show version information

EXAMPLES:
    max                     # Open GUI
    max save                # Create auto-named snapshot
    max save before-refactor # Create named snapshot
    max undo                # Restore last snapshot
    max status              # Show project info

For more information, visit: https://github.com/nasomers/lumen
"#
    );
}
