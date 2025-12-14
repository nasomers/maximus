import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/appStore";

export function useTray() {
  const [initialized, setInitialized] = useState(false);
  const { setActiveTab } = useAppStore();

  // Delay initialization to avoid startup issues
  useEffect(() => {
    const timer = setTimeout(() => setInitialized(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Update tray usage periodically (only after initialized)
  useEffect(() => {
    if (!initialized) return;

    const initTray = async () => {
      try {
        // Dynamically import to avoid startup crash
        const { updateTrayUsage } = await import("@/lib/tauri");
        const { listen } = await import("@tauri-apps/api/event");

        // Initial update
        updateTrayUsage().catch(console.error);

        // Update every 30 seconds
        const interval = setInterval(() => {
          updateTrayUsage().catch(console.error);
        }, 30000);

        // Listen for tray action events
        const unlisten = await listen<string>("tray-action", async (event) => {
          const action = event.payload;

          if (action === "open_dashboard") {
            setActiveTab("dashboard");
          }

          // Update usage after any action
          updateTrayUsage().catch(console.error);
        });

        // Return cleanup function
        return () => {
          clearInterval(interval);
          unlisten();
        };
      } catch (error) {
        console.error("Failed to initialize tray:", error);
      }
    };

    let cleanup: (() => void) | undefined;
    initTray().then((fn) => {
      cleanup = fn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [initialized, setActiveTab]);
}
