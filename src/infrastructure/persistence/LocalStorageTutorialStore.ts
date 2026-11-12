import type { TutorialStore } from "../../core/ports/TutorialStore";

const STORAGE_KEY = "portugues-apps:tutorial:v1";

interface StoredTutorialState {
  readonly completed?: unknown;
}

export class LocalStorageTutorialStore implements TutorialStore {
  async loadCompleted(): Promise<boolean | null> {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return null;
      const completed = (parsed as StoredTutorialState).completed;
      return typeof completed === "boolean" ? completed : null;
    } catch {
      return null;
    }
  }

  async saveCompleted(completed: boolean): Promise<void> {
    try {
      globalThis.localStorage?.setItem(
        STORAGE_KEY,
        JSON.stringify({ completed }),
      );
    } catch {
      // Armazenamento indisponível ou cheio: o tutorial segue em memória.
    }
  }
}
