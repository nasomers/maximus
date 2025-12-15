pub mod cli;
mod commands;
mod db;
mod git;
mod pty;

use commands::{analytics, claude_code, github, hooks, memory, projects, prompts, pty as pty_commands, quick_commands, session_memory, sessions, snapshots, sync};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database on startup
    if let Err(e) = db::init_db() {
        eprintln!("Failed to initialize database: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Snapshot commands
            snapshots::create_snapshot,
            snapshots::list_snapshots,
            snapshots::restore_snapshot,
            snapshots::get_snapshot_diff,
            snapshots::get_file_at_snapshot,
            snapshots::compare_snapshots,
            // Project commands
            projects::list_projects,
            projects::get_current_project,
            projects::init_project,
            projects::delete_project,
            projects::scaffold_project,
            projects::list_directory,
            projects::read_claude_md,
            projects::write_claude_md,
            projects::get_failed_approaches,
            projects::add_failed_approach,
            projects::remove_failed_approach,
            projects::clear_failed_approaches,
            // Session commands
            sessions::create_session,
            sessions::end_session,
            sessions::list_sessions,
            sessions::get_today_stats,
            // Memory commands
            memory::get_memory,
            memory::set_memory,
            memory::delete_memory,
            // Prompt commands
            prompts::list_prompts,
            prompts::create_prompt,
            prompts::update_prompt,
            prompts::get_prompt,
            prompts::delete_prompt,
            prompts::use_prompt,
            // Analytics commands
            analytics::get_daily_stats,
            analytics::get_weekly_stats,
            analytics::get_overall_stats,
            analytics::get_project_stats,
            // PTY commands
            pty_commands::pty_spawn,
            pty_commands::pty_write,
            pty_commands::pty_resize,
            pty_commands::pty_kill,
            // Claude Code integration
            claude_code::get_claude_code_stats,
            claude_code::get_claude_code_sessions,
            claude_code::get_claude_code_projects,
            // Quick commands
            quick_commands::get_package_scripts,
            quick_commands::get_quick_commands,
            // GitHub commands
            github::get_git_status,
            github::git_stage_all,
            github::git_commit,
            github::git_push,
            github::git_pull,
            github::check_gh_cli,
            github::create_pr,
            github::get_gh_auth_status,
            github::get_git_repo_info,
            github::get_git_config,
            github::set_git_config,
            github::git_init,
            github::create_github_repo,
            github::git_add_remote,
            // Sync commands
            sync::create_sync_repo,
            sync::connect_sync_repo,
            sync::sync_pull,
            sync::sync_push,
            // Session memory commands
            session_memory::save_session_memory,
            session_memory::get_session_memories,
            session_memory::get_latest_session_memory,
            session_memory::delete_session_memory,
            // Hooks commands
            hooks::get_hooks_status,
            hooks::install_hooks,
            hooks::uninstall_hooks,
            hooks::get_pending_sessions,
            hooks::import_session_summary,
            hooks::clear_pending_session,
            hooks::set_prompt_prefix,
            hooks::get_prompt_prefix,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
