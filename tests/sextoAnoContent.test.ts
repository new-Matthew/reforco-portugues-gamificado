import { describe, expect, it } from "vitest";
import sextoAno from "../src/content/packs/portugues/6ano.json";
import { validateContentPacks } from "../src/content/schema/validateContent";
import { GameController } from "../src/app/GameController";
import type { Course, Question } from "../src/core/entities/content";
import { GameEngine } from "../src/core/services/GameEngine";
import { TutorialSession } from "../src/core/services/TutorialSession";
import {
  FixedClock,
  InMemoryProgressStore,
  SequenceRandom,
  StaticRepository,
} from "./support/fixtures";

const packs = [sextoAno];

function loadSextoAno(): Course {
  const result = validateContentPacks(packs);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.issues, null, 2));
  }
  const course = result.catalog.courses.find(
    (entry) => entry.id === "portugues-6ano",
  );
  if (!course) throw new Error("Curso do 6º ano não encontrado.");
  return course;
}

function answerCorrectly(engine: GameEngine): void {
  const question = engine.getCurrentQuestion();
  if (!question) throw new Error("Não há pergunta ativa para responder.");

  if (question.type === "single-choice") {
    engine.answerCurrentQuestion({ choiceIds: [question.correctChoiceId] });
  } else if (question.type === "multiple-choice") {
    engine.answerCurrentQuestion({ choiceIds: question.correctChoiceIds });
  } else {
    engine.answerCurrentQuestion({ text: question.acceptedAnswers[0] });
  }
}

function uniqueChoiceIds(question: Question): string[] {
  if (question.type === "text") return [];
  return question.choices.map((choice) => choice.id);
}

describe("conteúdo do 6º ano", () => {
  it("carrega e valida a estrutura do pack", () => {
    const course = loadSextoAno();

    expect(course.title).toBe("Língua Portuguesa · 6º Ano");
    expect(course.subject).toBe("portugues");
    expect(course.version).toBe("1.0.0");
    expect(course.nodes).toHaveLength(10);

    const itemIds = new Set<string>();
    for (const node of course.nodes) {
      expect(node.id, node.id).toBeTruthy();
      expect(node.title, node.id).toMatch(/Fase \d+/);
      expect(node.subtitle?.trim().length ?? 0, node.id).toBeGreaterThan(0);
      expect(node.chapter, node.id).toBe("Módulo 06 · Fonologia e morfologia");
      expect(node.position, node.id).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
      });
      expect(node.position.x, node.id).toBeGreaterThanOrEqual(0);
      expect(node.position.x, node.id).toBeLessThanOrEqual(2);
      expect(node.reward?.itemId, node.id).toBeTruthy();
      expect(node.reward?.label?.trim().length ?? 0, node.id).toBeGreaterThan(0);

      const itemId = node.reward?.itemId;
      if (itemId) {
        expect(itemIds.has(itemId), `recompensa repetida: ${itemId}`).toBe(false);
        itemIds.add(itemId);
      }
    }
  });

  it("mantém a progressão linear das fases", () => {
    const course = loadSextoAno();

    expect(course.nodes[0]?.unlock.requires ?? []).toEqual([]);

    for (let index = 1; index < course.nodes.length; index += 1) {
      expect(course.nodes[index]?.unlock.requires).toEqual([
        course.nodes[index - 1]?.id,
      ]);
    }

    expect(course.nodes.map((node) => node.title)).toEqual([
      "Fase 1 · Fonema e letra",
      "Fase 2 · Encontros vocálicos",
      "Fase 3 · Encontros consonantais e dígrafos",
      "Fase 4 · Divisão silábica",
      "Fase 5 · Acentuação gráfica",
      "Fase 6 · Substantivos e adjetivos",
      "Fase 7 · Artigos e numerais",
      "Fase 8 · Pronomes",
      "Fase 9 · Frase, oração e período",
      "Fase 10 · Sujeito e predicado",
    ]);
  });

  it("garante a integridade das questões e das respostas corretas", () => {
    const course = loadSextoAno();
    const questionIds = new Set<string>();

    for (const node of course.nodes) {
      expect(node.lesson.requiredCorrectRatio, node.id).toBe(0.8);
      expect(node.lesson.intro?.trim().length ?? 0, node.id).toBeGreaterThan(0);
      expect(node.lesson.questions, node.id).toHaveLength(5);

      for (const question of node.lesson.questions) {
        expect(questionIds.has(question.id), `id repetido: ${question.id}`).toBe(
          false,
        );
        questionIds.add(question.id);

        expect(question.prompt.trim().length, question.id).toBeGreaterThan(0);
        expect(question.explanation?.trim().length ?? 0, question.id).toBeGreaterThan(
          0,
        );
        expect(question.dicaCearense?.trim().length ?? 0, question.id).toBeGreaterThan(
          0,
        );

        const choiceIds = uniqueChoiceIds(question);
        expect(new Set(choiceIds).size, question.id).toBe(choiceIds.length);

        if (question.type === "single-choice") {
          expect(question.choices.length, question.id).toBeGreaterThanOrEqual(2);
          expect(
            choiceIds.includes(question.correctChoiceId),
            `${question.id} aponta para alternativa inexistente`,
          ).toBe(true);
        } else if (question.type === "multiple-choice") {
          expect(question.choices.length, question.id).toBeGreaterThanOrEqual(2);
          expect(question.correctChoiceIds.length, question.id).toBeGreaterThan(0);
          for (const correctId of question.correctChoiceIds) {
            expect(
              choiceIds.includes(correctId),
              `${question.id} aponta para alternativa inexistente`,
            ).toBe(true);
          }
        } else {
          expect(question.acceptedAnswers.length, question.id).toBeGreaterThan(0);
          expect(
            question.acceptedAnswers.every((answer) => answer.trim().length > 0),
            question.id,
          ).toBe(true);
        }
      }
    }
  });

  it("preserva o texto integral dos enunciados e alinha a resposta ao gabarito", () => {
    const course = loadSextoAno();

    const rawPrompts = sextoAno.nodes.flatMap((node) =>
      node.lesson.questions.map((question) => question.prompt),
    );
    const parsedPrompts = course.nodes.flatMap((node) =>
      node.lesson.questions.map((question) => question.prompt),
    );

    expect(parsedPrompts).toEqual(rawPrompts);
    expect(parsedPrompts).toHaveLength(50);
    expect(parsedPrompts.every((prompt) => prompt.startsWith("[Nível"))).toBe(true);
    expect(parsedPrompts).toContain(
      "[Nível 3 · Aplicação] Quantos fonemas existem na palavra 'carro'?",
    );

    const digraphQuestion = course.nodes
      .flatMap((node) => node.lesson.questions)
      .find((question) => question.id === "p6-port-f3-q5");
    expect(digraphQuestion?.type).toBe("text");
    if (digraphQuestion?.type === "text") {
      expect(digraphQuestion.acceptedAnswers).toContain("2");
    }
  });

  it("mantém as dicas e os diálogos da Professora Thaís", () => {
    const course = loadSextoAno();

    for (const node of course.nodes) {
      expect(node.npc?.speaker, node.id).toBe("Professora Thaís");
      expect(node.npc?.lines.length ?? 0, node.id).toBeGreaterThanOrEqual(2);

      for (const line of node.npc?.lines ?? []) {
        expect(line.trim().length, node.id).toBeGreaterThan(0);
      }

      for (const question of node.lesson.questions) {
        expect(question.dicaCearense?.trim().length ?? 0, question.id).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it("integra a trilha à seleção e à progressão de fases da engine", async () => {
    const result = validateContentPacks(packs);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));

    const engine = new GameEngine({
      repository: new StaticRepository(result.catalog),
      progressStore: new InMemoryProgressStore(),
      clock: new FixedClock(),
      random: new SequenceRandom(),
    });
    await engine.init();

    expect(engine.listCourses().map((course) => course.id)).toContain(
      "portugues-6ano",
    );

    const session = engine.startLesson("portugues-6ano", "p6-port-f1");
    expect(session.questionIds).toHaveLength(5);
    expect(engine.getCurrentQuestion()?.type).toBe("single-choice");

    for (let index = 0; index < session.questionIds.length; index += 1) {
      answerCorrectly(engine);
      engine.advance();
    }

    const outcome = engine.getSession()?.outcome;
    expect(outcome?.passed).toBe(true);
    expect(engine.getUnlockedNodeIds("portugues-6ano")).toContain("p6-port-f2");
  });

  it("expõe a trilha no controlador e inicia a primeira fase", async () => {
    const result = validateContentPacks(packs);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));

    const engine = new GameEngine({
      repository: new StaticRepository(result.catalog),
      progressStore: new InMemoryProgressStore(),
      clock: new FixedClock(1_000),
      random: new SequenceRandom(),
      config: { maxLives: 3 },
    });
    const tutorial = new TutorialSession(
      {
        loadCompleted: async () => true,
        saveCompleted: async () => {},
      },
      1,
    );
    const controller = new GameController(engine, tutorial);
    await controller.init();

    expect(controller.getSnapshot().courses.map((course) => course.id)).toContain(
      "portugues-6ano",
    );

    controller.selectCourse("portugues-6ano");
    controller.startNode("p6-port-f1");

    const snapshot = controller.getSnapshot();
    expect(snapshot.screen).toBe("lesson");
    expect(snapshot.nodes).toHaveLength(10);
    expect(snapshot.session?.questionIds).toHaveLength(5);
  });
});
