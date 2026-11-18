import { describe, expect, it } from "vitest";
import { createInitialStreak } from "../src/core/entities/player";
import { nextStreak, studyDayKey } from "../src/core/services/progression";
import {
  hatOffsetY,
  spriteForAvatar,
  spriteForHat,
} from "../src/ui/pixel/customizationSprites";
import { heroSprite, npcSprite } from "../src/ui/pixel/sprites";

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

  it("ancora o item equipado na cabeça do avatar", () => {
    const avatar = spriteForAvatar("avatar-hero");
    const wizard = spriteForHat("hat-wizard");
    const crown = spriteForHat("hat-crown");
    const glasses = spriteForHat("hat-glasses");
    if (!wizard || !crown || !glasses) {
      throw new Error("Sprites de chapéu ausentes.");
    }

    expect(hatOffsetY(wizard, avatar, 48)).toBeCloseTo(-24);
    expect(hatOffsetY(wizard, avatar, 32)).toBeCloseTo(-16);
    expect(hatOffsetY(crown, avatar, 48)).toBeCloseTo(-16);
    expect(hatOffsetY(glasses, avatar, 48)).toBeCloseTo(-4);
  });

  it("mantém o chapéu de mago pontudo e com aba mais larga", () => {
    const hat = spriteForHat("hat-wizard");
    if (!hat) throw new Error("Sprite de chapéu ausente.");
    const filled = (row: string): number =>
      [...row].filter((char) => char !== ".").length;

    expect(filled(hat.rows[0])).toBeLessThan(filled(hat.rows[6]));
    expect(hat.palette["1"]).toBe("#6b3fd1");
    expect(hat.palette["3"]).toBe("#ffe38a");
  });

  it("aplica capa ao avatar de mago", () => {
    const mage = spriteForAvatar("avatar-mage");

    expect(mage).not.toBe(npcSprite);
    expect(mage.rows.some((row) => row.includes("P"))).toBe(true);
    expect(mage.palette["P"]).toBe("#1f2a63");
  });

});
