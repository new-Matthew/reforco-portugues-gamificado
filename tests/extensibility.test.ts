import { describe, expect, it } from "vitest";
import quartoAno from "../src/content/packs/portugues/4ano.json";
import quintoAno from "../src/content/packs/portugues/5ano.json";
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
    const validation = validateContentPacks([quartoAno, quintoAno]);
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
      "Língua Portuguesa · 4º Ano",
      "Língua Portuguesa · 5º Ano",
    ]);

    // O curso do 4º ano não existe no código da engine: ele vem apenas do JSON.
    const session = engine.startLesson("portugues-4ano", "p4-n1-reconhecimento");
    expect(session.questionIds).toHaveLength(5);
    expect(engine.getCurrentQuestion()?.type).toBe("single-choice");

    const feedback = engine.answerCurrentQuestion({ choiceIds: ["c"] });
    expect(feedback.correct).toBe(true);
  });

  it("mantém os pré-requisitos encadeados dos cursos", () => {
    const validation = validateContentPacks([quartoAno, quintoAno]);
    if (!validation.ok) {
      throw new Error(JSON.stringify(validation.issues, null, 2));
    }

    for (const course of validation.catalog.courses) {
      const first = course.nodes[0];
      expect(first?.unlock.requires).toEqual([]);

      for (let index = 1; index < course.nodes.length; index += 1) {
        const previous = course.nodes[index - 1]?.id;
        expect(course.nodes[index]?.unlock.requires).toEqual([previous]);
      }
    }
  });
});
