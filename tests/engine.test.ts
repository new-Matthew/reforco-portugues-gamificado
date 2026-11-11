import { describe, expect, it } from "vitest";
import type { Question } from "../src/core/entities/content";
import { createDefaultEvaluatorRegistry } from "../src/core/services/answerEvaluators";
import { LessonLockedError } from "../src/core/errors";
import { GameEngine } from "../src/core/services/GameEngine";
import {
  buildCatalog,
  FixedClock,
  InMemoryProgressStore,
  SequenceRandom,
  StaticRepository,
} from "./support/fixtures";

function createEngine(
  options: { store?: InMemoryProgressStore; maxLives?: number } = {},
): { engine: GameEngine; store: InMemoryProgressStore } {
  const store = options.store ?? new InMemoryProgressStore();
  const engine = new GameEngine({
    repository: new StaticRepository(buildCatalog()),
    progressStore: store,
    clock: new FixedClock(1_000),
    random: new SequenceRandom(),
    config: { maxLives: options.maxLives ?? 3 },
  });
  return { engine, store };
}

describe("GameEngine", () => {
  it("desbloqueia apenas o primeiro nó e bloqueia os dependentes", async () => {
    const { engine } = createEngine();
    await engine.init();

    expect(engine.getUnlockedNodeIds("curso-teste")).toEqual(["n1"]);
    expect(() => engine.startLesson("curso-teste", "n2")).toThrow(LessonLockedError);
    expect(engine.getSession()).toBeNull();
  });

  it("conclui a lição, concede recompensas e libera o próximo nó", async () => {
    const { engine } = createEngine();
    await engine.init();

    engine.startLesson("curso-teste", "n1");

    const first = engine.answerCurrentQuestion({ choiceIds: ["a"] });
    expect(first.correct).toBe(true);
    expect(first.livesLeft).toBe(3);
    expect(engine.advance()).toBeNull();

    const second = engine.answerCurrentQuestion({ text: "  AMAR  " });
    expect(second.correct).toBe(true);

    const outcome = engine.advance();
    expect(outcome).not.toBeNull();
    expect(outcome?.passed).toBe(true);
    expect(outcome?.stars).toBe(3);
    expect(outcome?.correctCount).toBe(2);
    expect(outcome?.xpEarned).toBe(40);
    expect(outcome?.coinsEarned).toBe(20);
    expect(outcome?.isFirstCompletion).toBe(true);

    const player = engine.getPlayer();
    expect(player.xp).toBe(40);
    expect(player.coins).toBe(20);
    expect(player.completedNodes.n1?.stars).toBe(3);
    expect(engine.getUnlockedNodeIds("curso-teste")).toEqual(["n1", "n2"]);
  });

  it("consome vidas e reprova a lição quando as vidas acabam", async () => {
    const { engine } = createEngine({ maxLives: 2 });
    await engine.init();

    engine.startLesson("curso-teste", "n1");

    const first = engine.answerCurrentQuestion({ choiceIds: ["b"] });
    expect(first.correct).toBe(false);
    expect(first.livesLeft).toBe(1);
    expect(first.outcome).toBeUndefined();
    engine.advance();

    const second = engine.answerCurrentQuestion({ text: "errado" });
    expect(second.correct).toBe(false);
    expect(second.livesLeft).toBe(0);
    expect(second.outcome?.passed).toBe(false);
    expect(second.outcome?.stars).toBe(0);

    const final = engine.advance();
    expect(final?.passed).toBe(false);
    expect(final?.xpEarned).toBe(0);
    expect(engine.getPlayer().xp).toBe(0);
    expect(engine.getPlayer().completedNodes.n1).toBeUndefined();
  });

  it("reduz recompensas ao repetir uma lição já concluída", async () => {
    const { engine } = createEngine();
    await engine.init();

    engine.startLesson("curso-teste", "n1");
    engine.answerCurrentQuestion({ choiceIds: ["a"] });
    engine.advance();
    engine.answerCurrentQuestion({ text: "amar" });
    const firstOutcome = engine.advance();
    expect(firstOutcome?.isFirstCompletion).toBe(true);

    engine.startLesson("curso-teste", "n1");
    engine.answerCurrentQuestion({ choiceIds: ["a"] });
    engine.advance();
    engine.answerCurrentQuestion({ text: "amar" });
    const replay = engine.advance();

    expect(replay?.isFirstCompletion).toBe(false);
    expect(replay?.passed).toBe(true);
    expect(replay?.xpEarned).toBe(10);
    expect(replay?.coinsEarned).toBe(5);
    expect(engine.getPlayer().xp).toBe(50);
  });

  it("persiste o progresso entre instâncias da engine", async () => {
    const store = new InMemoryProgressStore();
    const { engine } = createEngine({ store });
    await engine.init();

    engine.startLesson("curso-teste", "n1");
    engine.answerCurrentQuestion({ choiceIds: ["a"] });
    engine.advance();
    engine.answerCurrentQuestion({ text: "amar" });
    engine.advance();

    const reloaded = createEngine({ store });
    await reloaded.engine.init();

    expect(reloaded.engine.getPlayer().xp).toBe(40);
    expect(reloaded.engine.getPlayer().coins).toBe(20);
    expect(reloaded.engine.getPlayer().completedNodes.n1?.stars).toBe(3);
    expect(reloaded.engine.getUnlockedNodeIds("curso-teste")).toEqual(["n1", "n2"]);
  });
});

describe("AnswerEvaluatorRegistry", () => {
  const registry = createDefaultEvaluatorRegistry();

  const textQuestion: Question = {
    id: "t1",
    type: "text",
    prompt: "Escreva o verbo pôr.",
    acceptedAnswers: ["pôr"],
  };

  it("ignora caixa e espaços, mas preserva acentos", () => {
    expect(registry.evaluate(textQuestion, { text: "  PÔR " }).correct).toBe(true);
    expect(registry.evaluate(textQuestion, { text: "por" }).correct).toBe(false);
  });

  it("exige o conjunto exato em múltipla escolha", () => {
    const question: Question = {
      id: "m1",
      type: "multiple-choice",
      prompt: "Quais são da 2ª conjugação?",
      choices: [
        { id: "a", label: "vender" },
        { id: "b", label: "pôr" },
        { id: "c", label: "partir" },
      ],
      correctChoiceIds: ["a", "b"],
    };

    expect(registry.evaluate(question, { choiceIds: ["a", "b"] }).correct).toBe(true);
    expect(registry.evaluate(question, { choiceIds: ["b", "a"] }).correct).toBe(true);
    expect(registry.evaluate(question, { choiceIds: ["a"] }).correct).toBe(false);
    expect(registry.evaluate(question, { choiceIds: ["a", "b", "c"] }).correct).toBe(
      false,
    );
  });
});
