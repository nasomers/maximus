import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { TerminalContainer } from "@/components/terminal/TerminalContainer";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { BottomBar } from "@/components/bottom-bar/BottomBar";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { Toaster } from "@/components/ui/sonner";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTerminalStore } from "@/stores/terminalStore";

const queryClient = new QueryClient();

function AppContent() {
  const { setupComplete } = useSettingsStore();
  const [showSetup, setShowSetup] = useState(false);

  // Check if first-time setup is needed
  useEffect(() => {
    if (!setupComplete) {
      setShowSetup(true);
    }
  }, [setupComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B: Toggle sidebar
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        useTerminalStore.getState().toggleSidebar();
      }

      // Ctrl+T: New tab (handled in TerminalTabs)
      // Ctrl+W: Close tab (handled in TerminalTabs)
      // Ctrl+\: Toggle split (handled in TerminalTabs)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
