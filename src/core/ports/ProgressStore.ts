import type { PlayerProgress } from "../entities/player";

export interface ProgressStore {
  load(): Promise<PlayerProgress | null>;
  save(progress: PlayerProgress): Promise<void>;
  clear(): Promise<void>;
}
