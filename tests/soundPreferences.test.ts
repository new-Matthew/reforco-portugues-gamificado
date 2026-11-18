import { describe, expect, it, vi } from "vitest";
import {
  SOUND_STORAGE_KEY,
  parseSoundPreference,
  readSoundMuted,
  writeSoundMuted,
  type SoundPreferenceStorage,
} from "../src/ui/sound/soundManager";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    values,
  } satisfies SoundPreferenceStorage & { values: Map<string, string> };
}

describe("sound preferences", () => {
  it("parses stored mute values and ignores invalid data", () => {
    expect(parseSoundPreference(null)).toBe(false);
    expect(parseSoundPreference("true")).toBe(true);
    expect(parseSoundPreference("false")).toBe(false);
    expect(parseSoundPreference('{"muted":true}')).toBe(true);
    expect(parseSoundPreference('{"muted":false}')).toBe(false);
    expect(parseSoundPreference('{"muted":"yes"}')).toBe(false);
    expect(parseSoundPreference("not-json")).toBe(false);
  });

  it("reads the preference from the sound storage key", () => {
    const storage = createStorage({
      [SOUND_STORAGE_KEY]: '{"muted":true}',
    });

    expect(readSoundMuted(storage)).toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith(SOUND_STORAGE_KEY);
    expect(readSoundMuted(null)).toBe(false);
  });

  it("writes the preference as json", () => {
    const storage = createStorage();

    writeSoundMuted(storage, true);

    expect(storage.setItem).toHaveBeenCalledWith(
      SOUND_STORAGE_KEY,
      '{"muted":true}',
    );
  });

  it("never throws when storage is unavailable", () => {
    const broken: SoundPreferenceStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readSoundMuted(broken)).toBe(false);
    expect(() => writeSoundMuted(broken, true)).not.toThrow();
    expect(() => writeSoundMuted(null, true)).not.toThrow();
  });
});
