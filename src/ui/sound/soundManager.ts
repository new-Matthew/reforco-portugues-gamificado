import { useSyncExternalStore } from "react";
import {
  soundEffects,
  type SoundEffectName,
} from "../../core/soundEffects";

export const SOUND_STORAGE_KEY = "portugues-apps:sound:v1";

export interface SoundPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const listeners = new Set<() => void>();

export function parseSoundPreference(raw: string | null): boolean {
  if (!raw) return false;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "boolean") return parsed;
    if (typeof parsed === "object" && parsed !== null) {
      return (parsed as { muted?: unknown }).muted === true;
    }
    return false;
  } catch {
    return false;
  }
}

export function readSoundMuted(
  storage: SoundPreferenceStorage | null,
): boolean {
  try {
    return parseSoundPreference(storage?.getItem(SOUND_STORAGE_KEY) ?? null);
  } catch {
    return false;
  }
}

export function writeSoundMuted(
  storage: SoundPreferenceStorage | null,
  muted: boolean,
): void {
  try {
    storage?.setItem(SOUND_STORAGE_KEY, JSON.stringify({ muted }));
  } catch {
    // Armazenamento indisponível: a preferência continua só em memória.
  }
}

function getStorage(): SoundPreferenceStorage | null {
  try {
    return typeof globalThis.localStorage === "undefined"
      ? null
      : globalThis.localStorage;
  } catch {
    return null;
  }
}

let muted = readSoundMuted(getStorage());

export function isSoundMuted(): boolean {
  return muted;
}

export function subscribeSoundMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSoundMuted(next: boolean): void {
  if (muted === next) return;
  muted = next;
  writeSoundMuted(getStorage(), next);
  for (const listener of listeners) listener();
}

export function playSoundEffect(effect: SoundEffectName): void {
  if (muted) return;
  soundEffects.play(effect);
}

export function useSoundMuted(): boolean {
  return useSyncExternalStore(
    subscribeSoundMuted,
    isSoundMuted,
    isSoundMuted,
  );
}
