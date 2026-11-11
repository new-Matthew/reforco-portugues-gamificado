import { useEffect, useSyncExternalStore } from "react";
import { getGameController } from "./bootstrap";

export function useGame() {
  const controller = getGameController();
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => {
    void controller.init();
  }, [controller]);

  return { snapshot, controller };
}
