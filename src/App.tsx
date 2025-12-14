import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { TabBar } from "@/components/layout/TabBar";
import { Dashboard } from "@/pages/Dashboard";
import { Snapshots } from "@/pages/Snapshots";
import { TerminalPage } from "@/pages/TerminalPage";
import { Memory } from "@/pages/Memory";
import { Prompts } from "@/pages/Prompts";
import { Analytics } from "@/pages/Analytics";
import { useAppStore } from "@/stores/appStore";
import { useTray } from "@/hooks/useTray";

const queryClient = new QueryClient();

function App() {
  const { activeTab, setActiveTab } = useAppStore();

  // Initialize tray integration
  useTray();

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
    </QueryClientProvider>
  );
}

export default App;
