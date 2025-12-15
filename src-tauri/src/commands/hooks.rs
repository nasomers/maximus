use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HooksStatus {
    pub installed: bool,
    pub hooks_path: String,
    pub has_stop_hook: bool,
    pub has_session_start_hook: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ClaudeSettings {
    #[serde(default)]
    hooks: Option<HooksConfig>,
    #[serde(flatten)]
    other: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
struct HooksConfig {
    #[serde(default)]
    stop: Option<Vec<HookEntry>>,
    #[serde(default)]
    session_start: Option<Vec<HookEntry>>,
    #[serde(default)]
    user_prompt_submit: Option<Vec<HookEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct HookEntry {
    #[serde(default)]
    matcher: Option<String>,
    hooks: Vec<HookCommand>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct HookCommand {
    #[serde(rename = "type")]
    hook_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    command: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    timeout: Option<u32>,
}

/// Get the path to the project's .claude directory
fn get_claude_dir(project_path: &str) -> PathBuf {
    PathBuf::from(project_path).join(".claude")
}

/// Get the path to the project's .claude/settings.json
fn get_settings_path(project_path: &str) -> PathBuf {
    get_claude_dir(project_path).join("settings.json")
}

/// Check if hooks are installed for a project
#[tauri::command]
pub fn get_hooks_status(project_path: String) -> Result<HooksStatus, String> {
    let settings_path = get_settings_path(&project_path);

    if !settings_path.exists() {
        return Ok(HooksStatus {
            installed: false,
            hooks_path: settings_path.to_string_lossy().to_string(),
            has_stop_hook: false,
            has_session_start_hook: false,
        });
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let settings: ClaudeSettings = serde_json::from_str(&content)
        .unwrap_or(ClaudeSettings { hooks: None, other: serde_json::Value::Null });

    let has_stop_hook = settings.hooks.as_ref()
        .and_then(|h| h.stop.as_ref())
        .map(|s| !s.is_empty())
        .unwrap_or(false);

    let has_session_start_hook = settings.hooks.as_ref()
        .and_then(|h| h.session_start.as_ref())
        .map(|s| !s.is_empty())
        .unwrap_or(false);

    Ok(HooksStatus {
        installed: has_stop_hook || has_session_start_hook,
        hooks_path: settings_path.to_string_lossy().to_string(),
        has_stop_hook,
        has_session_start_hook,
    })
}

/// Install Maximus hooks into a project's .claude/settings.json
#[tauri::command]
pub fn install_hooks(project_path: String) -> Result<HooksStatus, String> {
    let claude_dir = get_claude_dir(&project_path);
    let settings_path = get_settings_path(&project_path);

    // Create .claude directory if it doesn't exist
    fs::create_dir_all(&claude_dir)
        .map_err(|e| format!("Failed to create .claude directory: {}", e))?;

    // Read existing settings or create new
    let mut settings: serde_json::Value = if settings_path.exists() {
        let content = fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Get the path to our hook scripts
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let bin_dir = home.join(".maximus").join("bin");
    let session_end_script = bin_dir.join("maximus-session-end");
    let inject_context_script = bin_dir.join("maximus-inject-context");

    // Create the hooks configuration with absolute paths
    let stop_hook = serde_json::json!([{
        "hooks": [{
            "type": "command",
            "command": session_end_script.to_string_lossy(),
            "timeout": 30
        }]
    }]);

    let user_prompt_submit_hook = serde_json::json!([{
        "hooks": [{
            "type": "command",
            "command": inject_context_script.to_string_lossy(),
            "timeout": 10
        }]
    }]);

    // Update or create hooks section
    if settings.get("hooks").is_none() {
        settings["hooks"] = serde_json::json!({});
    }

    settings["hooks"]["Stop"] = stop_hook;
    settings["hooks"]["UserPromptSubmit"] = user_prompt_submit_hook;

    // Write back to file
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    // Create the hook scripts in ~/.maximus/bin/
    create_hook_scripts()?;

    Ok(HooksStatus {
        installed: true,
        hooks_path: settings_path.to_string_lossy().to_string(),
        has_stop_hook: true,
        has_session_start_hook: false,
    })
}

/// Remove Maximus hooks from a project
#[tauri::command]
pub fn uninstall_hooks(project_path: String) -> Result<(), String> {
    let settings_path = get_settings_path(&project_path);

    if !settings_path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let mut settings: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    // Remove our hooks
    if let Some(hooks) = settings.get_mut("hooks") {
        if let Some(obj) = hooks.as_object_mut() {
            obj.remove("Stop");
            obj.remove("UserPromptSubmit");
        }
    }

    // Write back
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(())
}

/// Create the hook scripts in ~/.maximus/bin/
fn create_hook_scripts() -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let bin_dir = home.join(".maximus").join("bin");

    fs::create_dir_all(&bin_dir)
        .map_err(|e| format!("Failed to create bin directory: {}", e))?;

    // Create maximus-session-end script
    let session_end_script = r#"#!/bin/bash
# Maximus Session End Hook
# This script is called when a Claude Code session ends
# It generates an AI summary of the session

# Read hook input from stdin
INPUT=$(cat)

# Extract relevant fields
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

# Ensure directories exist
MAXIMUS_DIR="$HOME/.maximus"
SUMMARIES_DIR="$MAXIMUS_DIR/session_summaries"
mkdir -p "$SUMMARIES_DIR"

# Generate summary if we have a transcript
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    # Extract the last ~100 lines of the transcript for context
    TRANSCRIPT_TAIL=$(tail -100 "$TRANSCRIPT_PATH" 2>/dev/null || echo "")

    if [ -n "$TRANSCRIPT_TAIL" ]; then
        # Generate a summary using Claude Code (non-interactive)
        SUMMARY=$(echo "Based on this Claude Code session transcript, provide a brief JSON summary. Include: summary (1-2 sentences of what was accomplished), keyDecisions (array of important decisions made), openThreads (array of unfinished work or next steps), filesTouched (array of files modified). Respond ONLY with valid JSON, no markdown.

Transcript excerpt:
$TRANSCRIPT_TAIL" | claude --print 2>/dev/null || echo "")

        # If we got a summary, save it
        if [ -n "$SUMMARY" ] && echo "$SUMMARY" | jq . >/dev/null 2>&1; then
            # Save the summary with metadata
            cat > "$SUMMARIES_DIR/$SESSION_ID.json" << EOF
{
    "session_id": "$SESSION_ID",
    "cwd": "$CWD",
    "timestamp": "$(date -Iseconds)",
    "summary_data": $SUMMARY
}
EOF
        fi
    fi
fi

# Output JSON to continue (don't block)
echo '{"continue": true}'
"#;

    let session_end_path = bin_dir.join("maximus-session-end");
    fs::write(&session_end_path, session_end_script)
        .map_err(|e| format!("Failed to write session-end script: {}", e))?;

    // Make executable on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = fs::Permissions::from_mode(0o755);
        fs::set_permissions(&session_end_path, perms)
            .map_err(|e| format!("Failed to set permissions: {}", e))?;
    }

    // Create maximus-inject-context script
    let inject_context_script = r#"#!/bin/bash
# Maximus Context Injection Hook
# This script injects project memory context into the prompt

# Read hook input from stdin
INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

# Check if there's a recent session memory to inject
MAXIMUS_DIR="$HOME/.maximus"
CONTEXT_FILE="$MAXIMUS_DIR/context_cache/$(echo "$CWD" | md5sum | cut -d' ' -f1).txt"

if [ -f "$CONTEXT_FILE" ]; then
    # Output the context to be prepended to the prompt
    CONTEXT=$(cat "$CONTEXT_FILE")
    echo "$CONTEXT"
fi
"#;

    let inject_context_path = bin_dir.join("maximus-inject-context");
    fs::write(&inject_context_path, inject_context_script)
        .map_err(|e| format!("Failed to write inject-context script: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = fs::Permissions::from_mode(0o755);
        fs::set_permissions(&inject_context_path, perms)
            .map_err(|e| format!("Failed to set permissions: {}", e))?;
    }

    // Add bin dir to PATH hint
    println!("Hook scripts created in {:?}", bin_dir);
    println!("Make sure {} is in your PATH", bin_dir.display());

    Ok(())
}

/// Get generated session summaries that haven't been imported yet
#[tauri::command]
pub fn get_pending_sessions() -> Result<Vec<serde_json::Value>, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let summaries_dir = home.join(".maximus").join("session_summaries");

    if !summaries_dir.exists() {
        return Ok(vec![]);
    }

    let mut sessions = vec![];

    for entry in fs::read_dir(&summaries_dir)
        .map_err(|e| format!("Failed to read session summaries: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.extension().map(|e| e == "json").unwrap_or(false) {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(session) = serde_json::from_str::<serde_json::Value>(&content) {
                    sessions.push(session);
                }
            }
        }
    }

    Ok(sessions)
}

/// Import a session summary into the database
#[tauri::command]
pub fn import_session_summary(session_id: String, project_id: String) -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let summary_file = home.join(".maximus").join("session_summaries").join(format!("{}.json", session_id));

    if !summary_file.exists() {
        return Err("Summary file not found".to_string());
    }

    let content = fs::read_to_string(&summary_file)
        .map_err(|e| format!("Failed to read summary: {}", e))?;

    let data: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse summary: {}", e))?;

    // Extract summary data
    let summary_data = data.get("summary_data").ok_or("No summary_data in file")?;

    let summary = summary_data.get("summary")
        .and_then(|v| v.as_str())
        .unwrap_or("No summary available")
        .to_string();

    let key_decisions: Vec<String> = summary_data.get("keyDecisions")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();

    let open_threads: Vec<String> = summary_data.get("openThreads")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();

    let files_touched: Vec<String> = summary_data.get("filesTouched")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();

    // Save to database using session_memory command
    let input = crate::commands::session_memory::CreateSessionMemoryInput {
        project_id,
        claude_session_id: Some(session_id.clone()),
        summary,
        key_decisions: Some(key_decisions),
        open_threads: Some(open_threads),
        files_touched: Some(files_touched),
        duration_minutes: None,
    };

    crate::commands::session_memory::save_session_memory(input)?;

    // Remove the processed summary file
    fs::remove_file(&summary_file)
        .map_err(|e| format!("Failed to remove summary file: {}", e))?;

    Ok(())
}

/// Clear a pending session summary
#[tauri::command]
pub fn clear_pending_session(session_id: String) -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let session_file = home.join(".maximus").join("session_summaries").join(format!("{}.json", session_id));

    if session_file.exists() {
        fs::remove_file(&session_file)
            .map_err(|e| format!("Failed to remove session summary: {}", e))?;
    }

    Ok(())
}
