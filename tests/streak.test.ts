import { describe, expect, it } from "vitest";
import type { LessonOutcome } from "../src/core/entities/session";
import { GameEngine } from "../src/core/services/GameEngine";
import {
  buildCatalog,
  FixedClock,
  InMemoryProgressStore,
  SequenceRandom,
  StaticRepository,
} from "./support/fixtures";

const DAY_ONE = new Date(2026, 0, 10, 12, 0, 0).getTime();
const DAY_TWO = new Date(2026, 0, 11, 9, 0, 0).getTime();
const DAY_FIVE = new Date(2026, 0, 14, 18, 0, 0).getTime();

function createEngine(
  clock = new FixedClock(DAY_ONE),
  options: { store?: InMemoryProgressStore; maxLives?: number } = {},
): { engine: GameEngine; store: InMemoryProgressStore; clock: FixedClock } {
  const store = options.store ?? new InMemoryProgressStore();
  const engine = new GameEngine({
    repository: new StaticRepository(buildCatalog()),
    progressStore: store,
    clock,
    random: new SequenceRandom(),
    config: { maxLives: options.maxLives ?? 3 },
  });
  return { engine, store, clock };
}

function completeFirstNode(engine: GameEngine): LessonOutcome {
  engine.startLesson("curso-teste", "n1");
  engine.answerCurrentQuestion({ choiceIds: ["a"] });
  engine.advance();
  engine.answerCurrentQuestion({ text: "amar" });
  const outcome = engine.advance();
  if (!outcome) throw new Error("Lição não foi finalizada.");
  return outcome;
}

describe("Ofensiva diária", () => {
  it("inicia em 1 ao concluir a primeira lição aprovada do dia", async () => {
    const { engine } = createEngine();
    await engine.init();

    const outcome = completeFirstNode(engine);

    expect(outcome.streakCurrent).toBe(1);
    expect(outcome.streakBest).toBe(1);
    expect(outcome.streakIncreased).toBe(true);
    expect(engine.getPlayer().streak).toEqual({
      current: 1,
      best: 1,
      lastStudyDay: "2026-01-10",
    });
  });

  it("não duplica a ofensiva no mesmo dia", async () => {
    const { engine } = createEngine();
    await engine.init();

    completeFirstNode(engine);
    const replay = completeFirstNode(engine);

    expect(replay.streakCurrent).toBe(1);
    expect(replay.streakIncreased).toBe(false);
    expect(engine.getPlayer().streak.current).toBe(1);
  });

  it("soma 1 em dia consecutivo e reinicia após um dia perdido", async () => {
    const clock = new FixedClock(DAY_ONE);
    const { engine } = createEngine(clock);
    await engine.init();

    completeFirstNode(engine);
    clock.set(DAY_TWO);
    const secondDay = completeFirstNode(engine);
    expect(secondDay.streakCurrent).toBe(2);
    expect(secondDay.streakBest).toBe(2);

    clock.set(DAY_FIVE);
    const afterGap = completeFirstNode(engine);
    expect(afterGap.streakCurrent).toBe(1);
    expect(afterGap.streakBest).toBe(2);
    expect(engine.getPlayer().streak.lastStudyDay).toBe("2026-01-14");
  });

  it("não aumenta a ofensiva quando a lição é reprovada", async () => {
    const { engine } = createEngine(new FixedClock(DAY_ONE), { maxLives: 1 });
    await engine.init();

    engine.startLesson("curso-teste", "n1");
    const feedback = engine.answerCurrentQuestion({ choiceIds: ["b"] });

    expect(feedback.outcome?.passed).toBe(false);
    expect(engine.getPlayer().streak.current).toBe(0);
    expect(engine.getPlayer().streak.lastStudyDay).toBeNull();
  });

  it("persiste a ofensiva entre instâncias da engine", async () => {
    const store = new InMemoryProgressStore();
    const clock = new FixedClock(DAY_ONE);
    const { engine } = createEngine(clock, { store });
    await engine.init();

    completeFirstNode(engine);
    clock.set(DAY_TWO);
    completeFirstNode(engine);

    const reloaded = createEngine(clock, { store });
    await reloaded.engine.init();

    expect(reloaded.engine.getPlayer().streak).toEqual({
      current: 2,
      best: 2,
      lastStudyDay: "2026-01-11",
    });
  });

  it("normaliza ofensiva ausente ou inválida em saves antigos", async () => {
    const store = new InMemoryProgressStore();
    store.saved = {
      xp: 40,
      coins: 20,
      lives: 3,
      completedNodes: {},
      inventory: {},
    } as unknown as typeof store.saved;

    const { engine } = createEngine(undefined, { store });
    await engine.init();

    expect(engine.getPlayer().streak).toEqual({
      current: 0,
      best: 0,
      lastStudyDay: null,
    });
    expect(engine.getPlayer().ownedItemIds).toEqual([]);
    expect(engine.getPlayer().equippedItemIds).toEqual([]);
  });

  it("reporta nível anterior e posterior ao concluir", async () => {
    const { engine } = createEngine();
    await engine.init();

    const outcome = completeFirstNode(engine);

    expect(outcome.levelBefore).toBe(1);
    expect(outcome.levelAfter).toBe(1);
    expect(outcome.leveledUp).toBe(false);
    expect(outcome.streakBest).toBe(1);
  });
});
