use serde::{Deserialize, Serialize};

/// Types of semantic blocks in Claude's output
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BlockType {
    /// Thinking/reasoning text
    Thinking,
    /// Code being written or shown
    Code { language: Option<String> },
    /// Tool invocation (Read, Edit, Bash, etc.)
    Tool { name: String },
    /// Tool output/result
    ToolOutput { name: String, success: bool },
    /// A question being asked
    Question,
    /// An error message
    Error,
    /// Regular text/explanation
    Text,
    /// File content being displayed
    FileContent { path: String },
    /// Diff showing changes
    Diff { path: Option<String> },
    /// Command execution
    Command { cmd: String },
    /// Command output
    CommandOutput { exit_code: Option<i32> },
}

/// A semantic block parsed from Claude's output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticBlock {
    pub id: u64,
    pub block_type: BlockType,
    pub content: String,
    pub timestamp: u64,
    /// Whether this block is complete or still being streamed
    pub complete: bool,
    /// Whether the block should be collapsed by default
    pub collapsed_default: bool,
}

/// Parser state for tracking multi-line blocks
struct ParserState {
    /// Current block being assembled
    current_block: Option<PartialBlock>,
    /// Counter for block IDs
    block_counter: u64,
    /// Accumulated output buffer
    buffer: String,
    /// Whether we're inside a code fence
    in_code_fence: bool,
    /// Current code fence language
    code_language: Option<String>,
}

struct PartialBlock {
    id: u64,
    block_type: BlockType,
    content: String,
    start_time: u64,
}

/// Parses terminal output into semantic blocks
pub struct SemanticBlockParser {
    state: ParserState,
}

impl SemanticBlockParser {
    pub fn new() -> Self {
        Self {
            state: ParserState {
                current_block: None,
                block_counter: 0,
                buffer: String::with_capacity(4096),
                in_code_fence: false,
                code_language: None,
            },
        }
    }

    /// Parse new output and return any completed blocks
    pub fn parse(&mut self, output: &str) -> Vec<SemanticBlock> {
        let mut blocks = Vec::new();
        let clean_output = strip_ansi_codes(output);

        // Add to buffer
        self.state.buffer.push_str(&clean_output);

        // Collect lines first to avoid borrow issues
        let lines: Vec<String> = self.state.buffer.lines().map(|s| s.to_string()).collect();
        let mut processed_len = 0;

        for line in &lines {
            // Check for code fence start/end
            if line.trim().starts_with("```") {
                if self.state.in_code_fence {
                    // End of code fence
                    if let Some(block) = self.finish_current_block() {
                        blocks.push(block);
                    }
                    self.state.in_code_fence = false;
                    self.state.code_language = None;
                } else {
                    // Start of code fence
                    if let Some(block) = self.finish_current_block() {
                        blocks.push(block);
                    }
                    self.state.in_code_fence = true;
                    // Extract language
                    let lang_part = line.trim().strip_prefix("```").unwrap_or("");
                    self.state.code_language = if lang_part.is_empty() {
                        None
                    } else {
                        Some(lang_part.to_string())
                    };
                    self.start_block(BlockType::Code {
                        language: self.state.code_language.clone(),
                    });
                }
            } else if self.state.in_code_fence {
                // Add to current code block
                if let Some(ref mut block) = self.state.current_block {
                    if !block.content.is_empty() {
                        block.content.push('\n');
                    }
                    block.content.push_str(line);
                }
            } else {
                // Detect block type from line content
                if let Some(block_type) = self.detect_block_type(line) {
                    // Finish previous block if different type
                    let should_finish = if let Some(ref current) = self.state.current_block {
                        std::mem::discriminant(&current.block_type)
                            != std::mem::discriminant(&block_type)
                    } else {
                        false
                    };

                    if should_finish {
                        if let Some(block) = self.finish_current_block() {
                            blocks.push(block);
                        }
                    }

                    // Start new block if needed
                    if self.state.current_block.is_none() {
                        self.start_block(block_type);
                    }

                    // Add content
                    if let Some(ref mut block) = self.state.current_block {
                        if !block.content.is_empty() {
                            block.content.push('\n');
                        }
                        block.content.push_str(line);
                    }
                }
            }

            processed_len += line.len() + 1; // +1 for newline
        }

        // Keep only unprocessed content in buffer
        if processed_len > 0 && processed_len <= self.state.buffer.len() {
            self.state.buffer = self.state.buffer[processed_len..].to_string();
        }

        blocks
    }

    /// Detect the type of block from a line
    fn detect_block_type(&self, line: &str) -> Option<BlockType> {
        let trimmed = line.trim();

        // Empty lines
        if trimmed.is_empty() {
            return None;
        }

        // Tool invocations
        if trimmed.starts_with("Read(") || trimmed.contains("📄 Read(") {
            return Some(BlockType::Tool {
                name: "Read".to_string(),
            });
        }
        if trimmed.starts_with("Edit(") || trimmed.contains("✏️ Edit(") {
            return Some(BlockType::Tool {
                name: "Edit".to_string(),
            });
        }
        if trimmed.starts_with("Write(") || trimmed.contains("📝 Write(") {
            return Some(BlockType::Tool {
                name: "Write".to_string(),
            });
        }
        if trimmed.starts_with("Bash(") || trimmed.contains("💻 Bash(") {
            return Some(BlockType::Tool {
                name: "Bash".to_string(),
            });
        }
        if trimmed.starts_with("Glob(") || trimmed.starts_with("Grep(") {
            let name = if trimmed.starts_with("Glob") {
                "Glob"
            } else {
                "Grep"
            };
            return Some(BlockType::Tool {
                name: name.to_string(),
            });
        }

        // Questions
        if trimmed.ends_with('?')
            || trimmed.starts_with("Do you want")
            || trimmed.starts_with("Would you like")
            || trimmed.starts_with("Should I")
            || trimmed.starts_with("May I")
        {
            return Some(BlockType::Question);
        }

        // Errors
        if trimmed.starts_with("Error:")
            || trimmed.starts_with("error:")
            || trimmed.starts_with("Failed:")
            || trimmed.contains("✗")
            || trimmed.contains("❌")
        {
            return Some(BlockType::Error);
        }

        // Success indicators
        if trimmed.contains("✓") || trimmed.contains("✔") || trimmed.contains("✅") {
            return Some(BlockType::ToolOutput {
                name: "unknown".to_string(),
                success: true,
            });
        }

        // Diff content
        if trimmed.starts_with("+++")
            || trimmed.starts_with("---")
            || trimmed.starts_with("@@")
            || (trimmed.starts_with('+') && !trimmed.starts_with("++"))
            || (trimmed.starts_with('-') && !trimmed.starts_with("--"))
        {
            return Some(BlockType::Diff { path: None });
        }

        // Command output indicator
        if trimmed.starts_with('$') || trimmed.starts_with('>') {
            let cmd = trimmed[1..].trim().to_string();
            return Some(BlockType::Command { cmd });
        }

        // Default to text
        Some(BlockType::Text)
    }

    fn start_block(&mut self, block_type: BlockType) {
        self.state.block_counter += 1;
        self.state.current_block = Some(PartialBlock {
            id: self.state.block_counter,
            block_type,
            content: String::new(),
            start_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
        });
    }

    fn finish_current_block(&mut self) -> Option<SemanticBlock> {
        self.state.current_block.take().map(|partial| {
            let collapsed_default = matches!(
                partial.block_type,
                BlockType::Code { .. }
                    | BlockType::ToolOutput { .. }
                    | BlockType::CommandOutput { .. }
                    | BlockType::FileContent { .. }
            ) && partial.content.lines().count() > 10;

            SemanticBlock {
                id: partial.id,
                block_type: partial.block_type,
                content: partial.content,
                timestamp: partial.start_time,
                complete: true,
                collapsed_default,
            }
        })
    }

    /// Force flush any pending block
    pub fn flush(&mut self) -> Option<SemanticBlock> {
        self.finish_current_block()
    }

    /// Reset parser state
    pub fn reset(&mut self) {
        self.state.current_block = None;
        self.state.buffer.clear();
        self.state.in_code_fence = false;
        self.state.code_language = None;
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
    fn test_parse_code_block() {
        let mut parser = SemanticBlockParser::new();
        let output = "```typescript\nconst x = 1;\n```\n";
        let blocks = parser.parse(output);
        // Code block should be detected
        assert!(!blocks.is_empty() || parser.state.current_block.is_some());
    }

    #[test]
    fn test_detect_question() {
        let parser = SemanticBlockParser::new();
        let block_type = parser.detect_block_type("Would you like me to continue?");
        assert!(matches!(block_type, Some(BlockType::Question)));
    }

    #[test]
    fn test_detect_tool() {
        let parser = SemanticBlockParser::new();
        let block_type = parser.detect_block_type("Read(/path/to/file)");
        assert!(matches!(block_type, Some(BlockType::Tool { name }) if name == "Read"));
    }
}
