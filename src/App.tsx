import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { TabBar } from "@/components/layout/TabBar";
import { Dashboard } from "@/pages/Dashboard";
import { Snapshots } from "@/pages/Snapshots";
import { TerminalPage } from "@/pages/TerminalPage";
import { Memory } from "@/pages/Memory";
import { Prompts } from "@/pages/Prompts";
import { Analytics } from "@/pages/Analytics";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/stores/appStore";
import { useSettingsStore } from "@/stores/settingsStore";

const queryClient = new QueryClient();

function App() {
  const { activeTab, setActiveTab } = useAppStore();
  const { setupComplete } = useSettingsStore();
  const [showSetup, setShowSetup] = useState(false);

  // Check if first-time setup is needed
  useEffect(() => {
    if (!setupComplete) {
      setShowSetup(true);
    }
  }, [setupComplete]);

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "terminal":
        return (
          <div className="h-full -m-4">
            <TerminalPage />
          </div>
        );
      case "snapshots":
        return <Snapshots />;
      case "memory":
        return <Memory />;
      case "prompts":
        return <Prompts />;
      case "analytics":
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <AppShell>{renderPage()}</AppShell>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* First-time setup wizard */}
      <SetupWizard
        open={showSetup}
        onComplete={() => setShowSetup(false)}
      />

      {/* Toast notifications */}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
