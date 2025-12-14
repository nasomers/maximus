import { useState } from "react";
import { Terminal } from "@/components/terminal/Terminal";
import { TerminalActionBar } from "@/components/terminal/TerminalActionBar";
import { TerminalSidePanel } from "@/components/terminal/TerminalSidePanel";
import { RiskyCommandWarning } from "@/components/terminal/RiskyCommandWarning";
import { useSessionStore } from "@/stores/sessionStore";
import { useProjectStore } from "@/stores/projectStore";
import { endSession } from "@/lib/tauri";
import { useQueryClient } from "@tanstack/react-query";
import { PanelRightClose, PanelRight } from "lucide-react";

export function TerminalPage() {
  const { currentProject } = useProjectStore();
  const { activeSession, setActiveSession, clearModifiedFiles, clearOutput, setSessionStartTime, currentRiskyDetection, dismissRiskyWarning } = useSessionStore();
  const queryClient = useQueryClient();
  const [showSidePanel, setShowSidePanel] = useState(true);

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await endSession(activeSession.id);
      setActiveSession(null);
      setSessionStartTime(null);
      clearModifiedFiles();
      clearOutput();
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a project to use the terminal</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* Terminal Area */}
      <div className="flex-1 min-w-0 relative overflow-hidden">
        {/* Toggle Side Panel Button */}
        <button
          onClick={() => setShowSidePanel(!showSidePanel)}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border hover:bg-secondary transition-colors"
          title={showSidePanel ? "Hide panel" : "Show panel"}
        >
          {showSidePanel ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRight className="w-4 h-4" />
          )}
        </button>

        {/* Terminal */}
        <div className="h-full w-full">
          <Terminal id="main" />
        </div>

        {/* Floating Action Bar */}
        <TerminalActionBar
          sessionActive={!!activeSession}
          onEndSession={activeSession ? handleEndSession : undefined}
        />

        {/* Risky Command Warning */}
        {currentRiskyDetection && (
          <RiskyCommandWarning
            detection={currentRiskyDetection}
            onDismiss={dismissRiskyWarning}
            onSnapshotCreated={dismissRiskyWarning}
          />
        )}
      </div>

      {/* Side Panel */}
      {showSidePanel && (
        <div className="w-72 h-full border-l border-border bg-card flex-shrink-0 overflow-hidden">
          <TerminalSidePanel terminalId="main" />
        </div>
      )}
    </div>
  );
}
