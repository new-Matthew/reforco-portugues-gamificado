import type { PlayerProgress } from "../../core/entities/player";
import type { ProgressStore } from "../../core/ports/ProgressStore";

const STORAGE_KEY = "portugues-apps:progress:v1";

export class LocalStorageProgressStore implements ProgressStore {
  async load(): Promise<PlayerProgress | null> {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return null;
      return parsed as PlayerProgress;
    } catch {
      return null;
    }
  }

  async save(progress: PlayerProgress): Promise<void> {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Armazenamento indisponível ou cheio: o jogo continua em memória.
    }
  }

  async clear(): Promise<void> {
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // Ignora falhas de limpeza.
    }
  }
}
