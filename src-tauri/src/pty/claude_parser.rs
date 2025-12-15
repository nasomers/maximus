use serde::{Deserialize, Serialize};

/// Claude Code's current operational state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ClaudeState {
    /// Idle, waiting for user input
    Idle,
    /// Claude is thinking/processing
    Thinking,
    /// Claude is writing code or text
    Writing,
    /// Claude is executing a tool (bash, edit, etc.)
    ToolUse(String),
    /// Claude is asking a question and waiting for response
    Asking,
    /// An error occurred
    Error,
    /// Task completed successfully
    Complete,
}

impl Default for ClaudeState {
    fn default() -> Self {
        ClaudeState::Idle
    }
}

/// Metadata about the current Claude state
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ClaudeStateInfo {
    pub state: ClaudeState,
    /// Current tool being used (if ToolUse state)
    pub tool_name: Option<String>,
    /// Detected question text (if Asking state)
    pub question: Option<String>,
    /// Approximate progress (0-100) if determinable
    pub progress: Option<u8>,
    /// Whether Claude is waiting for user input
    pub awaiting_input: bool,
}

/// Parser that tracks Claude Code output and determines state
pub struct ClaudeStateParser {
    /// Buffer for accumulating output
    buffer: String,
    /// Current detected state
    current_state: ClaudeStateInfo,
    /// Whether we're inside a Claude output block
    in_claude_block: bool,
    /// Tracks consecutive newlines (for detecting end of output)
    newline_count: u8,
}

impl ClaudeStateParser {
    pub fn new() -> Self {
        Self {
            buffer: String::with_capacity(4096),
            current_state: ClaudeStateInfo::default(),
            in_claude_block: false,
            newline_count: 0,
        }
    }

    /// Parse new output chunk and return state if changed
    pub fn parse(&mut self, output: &str) -> Option<ClaudeStateInfo> {
        let previous_state = self.current_state.state.clone();

        // Add to buffer (keep last 2KB for pattern matching)
        self.buffer.push_str(output);
        if self.buffer.len() > 2048 {
            let drain_to = self.buffer.len() - 2048;
            self.buffer.drain(..drain_to);
        }

        // Detect state from output patterns
        self.detect_state(output);

        // Return state info if state changed
        if self.current_state.state != previous_state {
            Some(self.current_state.clone())
        } else {
            None
        }
    }

    /// Get current state without parsing
    pub fn get_state(&self) -> &ClaudeStateInfo {
        &self.current_state
    }

    /// Reset parser state
    pub fn reset(&mut self) {
        self.buffer.clear();
        self.current_state = ClaudeStateInfo::default();
        self.in_claude_block = false;
        self.newline_count = 0;
    }

    fn detect_state(&mut self, output: &str) {
        // Track newlines for idle detection
        if output.chars().all(|c| c == '\n' || c == '\r') {
            self.newline_count = self.newline_count.saturating_add(1);
        } else {
            self.newline_count = 0;
        }

        // Detect Claude Code specific patterns
        // Note: Claude Code uses ANSI escape codes, so we check for patterns in the visible text

        let clean_output = strip_ansi_codes(output);
        let clean_buffer = strip_ansi_codes(&self.buffer);

        // Check for tool usage patterns
        if let Some(tool) = self.detect_tool_use(&clean_output) {
            self.current_state.state = ClaudeState::ToolUse(tool.clone());
            self.current_state.tool_name = Some(tool);
            self.current_state.awaiting_input = false;
            return;
        }

        // Check for thinking indicator (Claude Code shows ● or spinner)
        if clean_output.contains("⠋") || clean_output.contains("⠙") ||
           clean_output.contains("⠹") || clean_output.contains("⠸") ||
           clean_output.contains("⠼") || clean_output.contains("⠴") ||
           clean_output.contains("⠦") || clean_output.contains("⠧") ||
           clean_output.contains("⠇") || clean_output.contains("⠏") ||
           clean_output.contains("Thinking") || clean_output.contains("thinking...") {
            self.current_state.state = ClaudeState::Thinking;
            self.current_state.awaiting_input = false;
            return;
        }

        // Check for question patterns
        if let Some(question) = self.detect_question(&clean_buffer) {
            self.current_state.state = ClaudeState::Asking;
            self.current_state.question = Some(question);
            self.current_state.awaiting_input = true;
            return;
        }

        // Check for completion patterns
        if clean_output.contains("✓") || clean_output.contains("Done") ||
           clean_output.contains("Completed") || clean_output.contains("finished") {
            self.current_state.state = ClaudeState::Complete;
            self.current_state.awaiting_input = false;
            return;
        }

        // Check for error patterns
        if clean_output.contains("Error:") || clean_output.contains("error:") ||
           clean_output.contains("failed") || clean_output.contains("Failed") ||
           output.contains("\x1b[31m") { // Red color escape
            self.current_state.state = ClaudeState::Error;
            self.current_state.awaiting_input = false;
            return;
        }

        // Check for writing/output mode (substantial text being produced)
        if clean_output.len() > 50 && !clean_output.trim().is_empty() {
            self.current_state.state = ClaudeState::Writing;
            self.current_state.awaiting_input = false;
            return;
        }

        // Check for idle state (prompt visible, waiting for input)
        if self.detect_prompt(&clean_buffer) || self.newline_count > 3 {
            // Check if we see common prompt patterns
            if clean_buffer.contains(">") || clean_buffer.ends_with("$ ") ||
               clean_buffer.ends_with("% ") || clean_buffer.contains("claude>") {
                self.current_state.state = ClaudeState::Idle;
                self.current_state.awaiting_input = true;
                self.current_state.tool_name = None;
                self.current_state.question = None;
            }
        }
    }

    fn detect_tool_use(&self, output: &str) -> Option<String> {
        // Claude Code tool indicators
        let tool_patterns = [
            ("Read(", "Read"),
            ("Edit(", "Edit"),
            ("Write(", "Write"),
            ("Bash(", "Bash"),
            ("Glob(", "Glob"),
            ("Grep(", "Grep"),
            ("LS(", "List"),
            ("TodoRead", "Todo"),
            ("TodoWrite", "Todo"),
            ("WebFetch", "Web"),
            ("WebSearch", "Search"),
            ("Task(", "Task"),
        ];

        for (pattern, name) in tool_patterns {
            if output.contains(pattern) {
                return Some(name.to_string());
            }
        }

        // Also check for "Running:" or "Executing:" patterns
        if output.contains("Running:") || output.contains("Executing:") {
            return Some("Command".to_string());
        }

        None
    }

    fn detect_question(&self, buffer: &str) -> Option<String> {
        // Look for question patterns in recent output
        let lines: Vec<&str> = buffer.lines().rev().take(10).collect();

        for line in lines {
            let trimmed = line.trim();
            // Check if line ends with ? and has meaningful content
            if trimmed.ends_with('?') && trimmed.len() > 10 {
                return Some(trimmed.to_string());
            }
            // Check for common question prefixes
            if trimmed.starts_with("Do you want") ||
               trimmed.starts_with("Would you like") ||
               trimmed.starts_with("Should I") ||
               trimmed.starts_with("Can I") ||
               trimmed.starts_with("May I") {
                return Some(trimmed.to_string());
            }
        }
        None
    }

    fn detect_prompt(&self, buffer: &str) -> bool {
        // Check if buffer ends with common prompt patterns
        let trimmed = buffer.trim_end();
        trimmed.ends_with(">") ||
        trimmed.ends_with("$ ") ||
        trimmed.ends_with("% ") ||
        trimmed.ends_with(": ") ||
        trimmed.contains("Enter your") ||
        trimmed.contains("Type your")
    }
}

/// Strip ANSI escape codes from string
fn strip_ansi_codes(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '\x1b' {
            // Skip escape sequence
            if chars.peek() == Some(&'[') {
                chars.next(); // consume '['
                // Skip until we hit a letter (end of escape sequence)
                while let Some(&next) = chars.peek() {
                    chars.next();
                    if next.is_ascii_alphabetic() {
                        break;
                    }
                }
            }
        } else {
            result.push(c);
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_strip_ansi() {
        let input = "\x1b[32mHello\x1b[0m World";
        assert_eq!(strip_ansi_codes(input), "Hello World");
    }

    #[test]
    fn test_detect_thinking() {
        let mut parser = ClaudeStateParser::new();
        let state = parser.parse("⠋ Thinking...");
        assert!(state.is_some());
        assert_eq!(state.unwrap().state, ClaudeState::Thinking);
    }

    #[test]
    fn test_detect_tool_use() {
        let mut parser = ClaudeStateParser::new();
        let state = parser.parse("Read(/path/to/file)");
        assert!(state.is_some());
        assert_eq!(state.unwrap().state, ClaudeState::ToolUse("Read".to_string()));
    }
}
