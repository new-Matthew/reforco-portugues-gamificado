import { describe, expect, it } from "vitest";
import { createInitialStreak } from "../src/core/entities/player";
import { nextStreak, studyDayKey } from "../src/core/services/progression";
import {
  composeAvatarSprites,
  spriteForAvatar,
  spriteForHat,
} from "../src/ui/pixel/customizationSprites";
import { heroSprite } from "../src/ui/pixel/sprites";

const DAY = new Date(2026, 2, 5, 10, 0, 0).getTime();
const PREVIOUS_DAY = new Date(2026, 2, 4, 23, 0, 0).getTime();

describe("progressão da ofensiva", () => {
  it("gera chaves de dia locais e ignora datas inválidas", () => {
    expect(studyDayKey(DAY)).toBe("2026-03-05");
    expect(studyDayKey(Number.NaN)).toBe("");
  });

  it("inicia, mantém no mesmo dia e soma em dias consecutivos", () => {
    const started = nextStreak(createInitialStreak(), DAY);
    expect(started).toEqual({
      current: 1,
      best: 1,
      lastStudyDay: "2026-03-05",
    });

    expect(nextStreak(started, DAY)).toBe(started);

    const nextDay = nextStreak(started, new Date(2026, 2, 6, 8).getTime());
    expect(nextDay).toEqual({
      current: 2,
      best: 2,
      lastStudyDay: "2026-03-06",
    });
  });

  it("reinicia a sequência após um dia perdido, preservando o recorde", () => {
    const streak = { current: 4, best: 9, lastStudyDay: "2026-03-01" };
    expect(nextStreak(streak, DAY)).toEqual({
      current: 1,
      best: 9,
      lastStudyDay: "2026-03-05",
    });
    expect(nextStreak(createInitialStreak(), PREVIOUS_DAY).current).toBe(1);
  });
});

describe("avatares customizados", () => {
  it("usa fallbacks seguros para sprites desconhecidos", () => {
    expect(spriteForAvatar(undefined)).toBe(heroSprite);
    expect(spriteForAvatar("avatar-inexistente")).toBe(heroSprite);
    expect(spriteForHat(undefined)).toBeNull();
    expect(spriteForHat("hat-inexistente")).toBeNull();
  });

  it("compõe chapéu sobre o avatar mesclando paletas", () => {
    const hat = spriteForHat("hat-wizard");
    if (!hat) throw new Error("Sprite de chapéu ausente.");

    const composed = composeAvatarSprites(heroSprite, hat);

    expect(composed.rows).toHaveLength(heroSprite.rows.length);
    expect(composed.rows[0]).toContain("1");
    expect(composed.palette["1"]).toBe("#6b3fd1");
    expect(composed.palette["k"]).toBe(heroSprite.palette["k"]);
  });

  it("retorna o próprio avatar quando não há chapéu", () => {
    expect(composeAvatarSprites(heroSprite, null)).toBe(heroSprite);
  });
});
