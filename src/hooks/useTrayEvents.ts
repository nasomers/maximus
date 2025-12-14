import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

type TrayAction = "quick_save" | "undo_last";

interface UseTrayEventsOptions {
  onQuickSave?: () => void;
  onUndoLast?: () => void;
}

export function useTrayEvents({ onQuickSave, onUndoLast }: UseTrayEventsOptions) {
  useEffect(() => {
    const unlisten = listen<TrayAction>("tray-action", (event) => {
      switch (event.payload) {
        case "quick_save":
          onQuickSave?.();
          break;
        case "undo_last":
          onUndoLast?.();
          break;
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onQuickSave, onUndoLast]);
}
