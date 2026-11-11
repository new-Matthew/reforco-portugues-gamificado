import { describe, expect, it } from "vitest";
import sintaxe from "../src/content/packs/portugues/sintaxe.json";
import verbos from "../src/content/packs/portugues/verbos.json";
import { validateContentPacks } from "../src/content/schema/validateContent";
import { GameEngine } from "../src/core/services/GameEngine";
import {
  FixedClock,
  InMemoryProgressStore,
  SequenceRandom,
  StaticRepository,
} from "./support/fixtures";

describe("extensibilidade por dados", () => {
  it("gera fases de um novo assunto sem alterar a engine", async () => {
    const validation = validateContentPacks([verbos, sintaxe]);
    if (!validation.ok) {
      throw new Error(JSON.stringify(validation.issues, null, 2));
    }

    const engine = new GameEngine({
      repository: new StaticRepository(validation.catalog),
      progressStore: new InMemoryProgressStore(),
      clock: new FixedClock(),
      random: new SequenceRandom(),
    });
    await engine.init();

    expect(engine.listCourses().map((course) => course.title)).toEqual([
      "Verbos",
      "Sintaxe",
    ]);

    // O curso de Sintaxe não existe no código da engine: ele vem apenas do JSON.
    const session = engine.startLesson("portugues-sintaxe", "sintaxe-sujeito-predicado");
    expect(session.questionIds).toHaveLength(3);
    expect(engine.getCurrentQuestion()?.type).toBe("single-choice");

    const feedback = engine.answerCurrentQuestion({ choiceIds: ["a"] });
    expect(feedback.correct).toBe(true);
  });

  it("mantém os pré-requisitos encadeados do curso de verbos", async () => {
    const validation = validateContentPacks([verbos]);
    if (!validation.ok) {
      throw new Error(JSON.stringify(validation.issues, null, 2));
    }
    const course = validation.catalog.courses[0];
    expect(course).toBeDefined();
    if (!course) return;

    const first = course.nodes[0];
    expect(first?.unlock.requires).toEqual([]);

    for (let index = 1; index < course.nodes.length; index += 1) {
      const previous = course.nodes[index - 1]?.id;
      expect(course.nodes[index]?.unlock.requires).toEqual([previous]);
    }
  });
});
