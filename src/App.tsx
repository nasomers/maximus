import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { TerminalContainer } from "@/components/terminal/TerminalContainer";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { BottomBar } from "@/components/bottom-bar/BottomBar";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { KeyboardShortcuts, useKeyboardShortcutsPanel } from "@/components/help/KeyboardShortcuts";
import { Toaster } from "@/components/ui/sonner";
import { useSettingsStore } from "@/stores/settingsStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const queryClient = new QueryClient();

function AppContent() {
  const { setupComplete } = useSettingsStore();
  const [showSetup, setShowSetup] = useState(false);
  const shortcutsPanel = useKeyboardShortcutsPanel();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Check if first-time setup is needed
  useEffect(() => {
    if (!setupComplete) {
      setShowSetup(true);
    }
  }, [setupComplete]);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0b] text-white overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal Area */}
        <TerminalContainer />

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Bottom Bar */}
      <BottomBar />

      {/* First-time setup wizard */}
      <SetupWizard
        open={showSetup}
        onComplete={() => setShowSetup(false)}
      />

      {/* Command Palette */}
      <CommandPalette />

      {/* Keyboard Shortcuts Cheat Sheet */}
      <KeyboardShortcuts open={shortcutsPanel.open} onClose={shortcutsPanel.close} />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#fafafa",
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
