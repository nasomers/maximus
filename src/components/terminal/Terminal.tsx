import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useProjectStore } from "@/stores/projectStore";
import { useAppStore } from "@/stores/appStore";
import { useSessionStore, detectRiskyCommand, extractModifiedFiles } from "@/stores/sessionStore";
import { useTerminalStore } from "@/stores/terminalStore";
import "@xterm/xterm/css/xterm.css";

// Common shell prompt patterns (bash, zsh, fish, etc.)
const PROMPT_PATTERNS = [
  /\$\s*$/,                    // bash default: $
  />\s*$/,                     // powershell/cmd: >
  /#\s*$/,                     // root shell: #
  /❯\s*$/,                     // starship/pure: ❯
  /➜\s*$/,                     // oh-my-zsh: ➜
  /\)\s*$/,                    // some prompt ends with )
  /λ\s*$/,                     // lambda prompt
];

interface TerminalProps {
  id?: string;
  onReady?: () => void;
}

export function Terminal({ id = "main", onReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastProjectPathRef = useRef<string | null>(null);
  const inputBufferRef = useRef<string>("");
  const isCommandRunningRef = useRef<boolean>(false);
  const { currentProject } = useProjectStore();
  const { pendingTerminalCommand, setPendingTerminalCommand } = useAppStore();
  const { appendOutput, addModifiedFile, setCurrentRiskyDetection, currentRiskyDetection } = useSessionStore();
  const { setCommandRunning, setCommandComplete } = useTerminalStore();

  // Check if output contains a shell prompt
  const detectPrompt = useCallback((output: string) => {
    // Strip ANSI codes for pattern matching
    const stripped = output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    return PROMPT_PATTERNS.some(pattern => pattern.test(stripped));
  }, []);

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current || xtermRef.current) return;

    // Create xterm instance
    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Monaco, monospace',
      theme: {
        background: "#0a0a0b",
        foreground: "#fafafa",
        cursor: "#fafafa",
        cursorAccent: "#0a0a0b",
        selectionBackground: "#3b82f650",
        black: "#0a0a0b",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#fafafa",
        brightBlack: "#6b7280",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#facc15",
        brightBlue: "#60a5fa",
        brightMagenta: "#c084fc",
        brightCyan: "#22d3ee",
        brightWhite: "#ffffff",
      },
      allowProposedApi: true,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // Open terminal in container
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Spawn PTY on backend
    const cwd = currentProject?.path || undefined;
    try {
      await invoke("pty_spawn", {
        id,
        cols: xterm.cols,
        rows: xterm.rows,
        cwd,
      });

      // Listen for PTY output
      const unlistenOutput = await listen<string>(`pty-output-${id}`, (event) => {
        const output = event.payload;
        xterm.write(output);

        // Track output for analysis
        appendOutput(output);

        // Detect risky commands
        const riskyDetection = detectRiskyCommand(output);
        if (riskyDetection && !currentRiskyDetection) {
          setCurrentRiskyDetection(riskyDetection);
        }

        // Extract modified files
        const files = extractModifiedFiles(output);
        files.forEach((file) => addModifiedFile(file));

        // Detect command completion (prompt returned)
        if (isCommandRunningRef.current && detectPrompt(output)) {
          isCommandRunningRef.current = false;
          setCommandComplete(id);
        }
      });

      // Listen for PTY exit
      const unlistenExit = await listen(`pty-exit-${id}`, () => {
        xterm.write("\r\n\x1b[33m[Process exited]\x1b[0m\r\n");
      });

      // Send input to PTY and track commands
      xterm.onData((data) => {
        // Track input for command detection
        if (data === '\r' || data === '\n') {
          // Enter pressed - if there's a command in the buffer, mark as running
          const command = inputBufferRef.current.trim();
          if (command && !isCommandRunningRef.current) {
            isCommandRunningRef.current = true;
            setCommandRunning(id, command);
          }
          inputBufferRef.current = "";
        } else if (data === '\x7f' || data === '\b') {
          // Backspace
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
        } else if (data.charCodeAt(0) >= 32) {
          // Printable character
          inputBufferRef.current += data;
        }

        invoke("pty_write", { id, data }).catch(console.error);
      });

      // Handle resize
      xterm.onResize(({ cols, rows }) => {
        invoke("pty_resize", { id, cols, rows }).catch(console.error);
      });

      // Store cleanup functions
      (xterm as any)._unlistenOutput = unlistenOutput;
      (xterm as any)._unlistenExit = unlistenExit;

      // Track the initial project path
      lastProjectPathRef.current = currentProject?.path || null;

      setIsReady(true);
      onReady?.();
    } catch (error) {
      console.error("Failed to spawn PTY:", error);
      xterm.write(`\x1b[31mFailed to start terminal: ${error}\x1b[0m\r\n`);
    }
  }, [id, currentProject?.path, onReady, appendOutput, addModifiedFile, setCurrentRiskyDetection, currentRiskyDetection, detectPrompt, setCommandRunning, setCommandComplete]);

  // Initialize terminal
  useEffect(() => {
    initTerminal();

    return () => {
      // Cleanup
      if (xtermRef.current) {
        const xterm = xtermRef.current as any;
        if (xterm._unlistenOutput) xterm._unlistenOutput();
        if (xterm._unlistenExit) xterm._unlistenExit();
        xtermRef.current.dispose();
        xtermRef.current = null;
      }

      // Kill PTY
      invoke("pty_kill", { id }).catch(console.error);
    };
  }, [initTerminal, id]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener("resize", handleResize);

    // Also fit when component becomes visible
    const observer = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  // Handle project changes - cd to new project directory
  useEffect(() => {
    if (isReady && currentProject?.path) {
      const newPath = currentProject.path;
      if (lastProjectPathRef.current !== newPath) {
        // Only cd if path actually changed and we had a previous path
        // (don't cd on initial load - the PTY was spawned with the right cwd)
        if (lastProjectPathRef.current !== null) {
          // Send cd command to change directory
          invoke("pty_write", { id, data: `cd "${newPath}"\n` }).catch(console.error);
        }
        lastProjectPathRef.current = newPath;
      }
    }
  }, [isReady, currentProject?.path, id]);

  // Execute pending commands when ready
  useEffect(() => {
    if (isReady && pendingTerminalCommand) {
      // Small delay to ensure terminal is fully ready
      const timer = setTimeout(async () => {
        // If we have a current project, make sure we're in the right directory first
        if (currentProject?.path && lastProjectPathRef.current !== currentProject.path) {
          await invoke("pty_write", { id, data: `cd "${currentProject.path}"\n` });
          lastProjectPathRef.current = currentProject.path;
          // Small delay after cd before running command
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        invoke("pty_write", { id, data: pendingTerminalCommand + "\n" }).catch(console.error);
        setPendingTerminalCommand(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, pendingTerminalCommand, id, setPendingTerminalCommand, currentProject?.path]);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full bg-[#0a0a0b] rounded-lg overflow-hidden"
      style={{ padding: "8px" }}
    />
  );
}

// Helper to run a command in the terminal
export async function runInTerminal(id: string, command: string) {
  await invoke("pty_write", { id, data: command + "\n" });
}
