import { useState } from "react";
import { Terminal } from "@/components/terminal/Terminal";
import { TerminalSidePanel } from "@/components/terminal/TerminalSidePanel";
import { RiskyCommandWarning } from "@/components/terminal/RiskyCommandWarning";
import { useSessionStore } from "@/stores/sessionStore";
import { useProjectStore } from "@/stores/projectStore";
import { PanelRightClose, PanelRight } from "lucide-react";

export function TerminalPage() {
  const { currentProject } = useProjectStore();
  const { currentRiskyDetection, dismissRiskyWarning } = useSessionStore();
  const [showSidePanel, setShowSidePanel] = useState(true);

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
