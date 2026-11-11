import { describe, expect, it } from "vitest";
import {
  createCourseFromDraft,
  createLessonNodeFromDraft,
  validateLessonDraft,
  validateQuestionDraft,
  type LessonDraft,
  type QuestionDraft,
} from "../src/core/services/authoring";
import { buildCatalog } from "./support/fixtures";

function validQuestion(overrides: Partial<QuestionDraft> = {}): QuestionDraft {
  return {
    prompt: "Qual é o sujeito da oração?",
    alternatives: ["O menino", "correu", "no parque", "rapidamente"],
    correctIndex: 0,
    explanation: "O menino é o termo sobre o qual se declara algo.",
    ...overrides,
  };
}

function validLesson(overrides: Partial<LessonDraft> = {}): LessonDraft {
  return {
    chapter: "Módulo 01 · Turma",
    title: "Sujeito na prática",
    description: "Identificar o sujeito em orações simples.",
    icon: "star",
    questions: [validQuestion()],
    ...overrides,
  };
}

describe("authoring", () => {
  it("cria uma trilha com id único e sem nós", () => {
    const result = createCourseFromDraft(
      { title: "Trilha da Turma", description: "Conteúdo autoral" },
      ["trilha-da-turma"],
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe("trilha-da-turma-2");
    expect(result.value.nodes).toEqual([]);
    expect(result.value.description).toBe("Conteúdo autoral");
  });

  it("rejeita trilhas com título vazio", () => {
    const result = createCourseFromDraft({ title: "  " }, []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.field).toBe("title");
  });

  it("rejeita questão sem alternativas preenchidas e sem explicação", () => {
    const issues = validateQuestionDraft(
      validQuestion({
        alternatives: ["O menino", "", "", ""],
        explanation: " ",
      }),
    );

    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
        "question.alternatives.1",
        "question.alternatives.2",
        "question.alternatives.3",
        "question.explanation",
      ]),
    );
  });

  it("rejeita lição sem questões", () => {
    const issues = validateLessonDraft(validLesson({ questions: [] }));
    expect(issues.some((issue) => issue.field === "questions")).toBe(true);
  });

  it("gera um nó sequencial com alternativas, resposta correta e desbloqueio", () => {
    const course = buildCatalog().courses[0];
    if (!course) throw new Error("Fixture sem curso.");
    const lastNode = course.nodes[course.nodes.length - 1];
    if (!lastNode) throw new Error("Fixture sem nós.");

    const result = createLessonNodeFromDraft(validLesson(), course);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const node = result.value;
    expect(node.id).toBe("curso-teste-sujeito-na-pratica");
    expect(node.position.x).toBe(0);
    expect(node.position.y).toBe(0);
    expect(node.unlock.requires).toEqual([lastNode.id]);
    expect(node.lesson.questions).toHaveLength(1);
    const question = node.lesson.questions[0];
    expect(question?.type).toBe("single-choice");
    if (question?.type !== "single-choice") return;
    expect(question.choices).toHaveLength(4);
    expect(question.correctChoiceId).toBe("a");
    expect(node.lesson.requiredCorrectRatio).toBe(0.75);
  });

  it("evita colisão de ids ao publicar títulos iguais", () => {
    const course = buildCatalog().courses[0];
    if (!course) throw new Error("Fixture sem curso.");

    const first = createLessonNodeFromDraft(validLesson(), course);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const updated = { ...course, nodes: [...course.nodes, first.value] };
    const second = createLessonNodeFromDraft(validLesson(), updated);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.id).not.toBe(first.value.id);
    expect(second.value.id).toBe("curso-teste-sujeito-na-pratica-2");
    expect(second.value.unlock.requires).toEqual([first.value.id]);
  });
});
