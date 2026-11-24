import { describe, expect, it } from "vitest";
import quartoAno from "../src/content/packs/portugues/4ano.json";
import quintoAno from "../src/content/packs/portugues/5ano.json";
import { validateContentPacks } from "../src/content/schema/validateContent";
import type { Course } from "../src/core/entities/content";

const packs = [quartoAno, quintoAno];

function requireCourse(courses: readonly Course[], id: string): Course {
  const course = courses.find((entry) => entry.id === id);
  if (!course) throw new Error(`Curso ${id} não encontrado.`);
  return course;
}

describe("conteúdo do Ensino Fundamental I", () => {
  it("valida os packs do 4º e do 5º ano", () => {
    const result = validateContentPacks(packs);
    if (!result.ok) {
      throw new Error(JSON.stringify(result.issues, null, 2));
    }

    expect(result.catalog.courses.map((course) => course.title)).toEqual([
      "Língua Portuguesa · 4º Ano",
      "Língua Portuguesa · 5º Ano",
    ]);
  });

  it("mantém a progressão linear dos níveis e fases", () => {
    const result = validateContentPacks(packs);
    if (!result.ok) throw new Error("Packs inválidos.");

    const quarto = requireCourse(result.catalog.courses, "portugues-4ano");
    const quinto = requireCourse(result.catalog.courses, "portugues-5ano");

    expect(quarto.nodes).toHaveLength(5);
    expect(quinto.nodes).toHaveLength(18);

    for (const course of [quarto, quinto]) {
      expect(course.nodes[0]?.unlock.requires ?? []).toEqual([]);

      for (let index = 1; index < course.nodes.length; index += 1) {
        expect(course.nodes[index]?.unlock.requires).toEqual([
          course.nodes[index - 1]?.id,
        ]);
      }
    }

    expect(quarto.nodes.map((node) => node.title)).toEqual([
      "Nível 1 · Reconhecimento",
      "Nível 2 · Compreensão",
      "Nível 3 · Aplicação",
      "Nível 4 · Análise",
      "Nível 5 · Domínio",
    ]);

    const chapters = new Map<string, typeof quinto.nodes>();
    for (const node of quinto.nodes) {
      const chapter = node.chapter ?? "sem módulo";
      chapters.set(chapter, [...(chapters.get(chapter) ?? []), node]);
    }

    for (const [chapter, nodes] of chapters) {
      expect(nodes, chapter).toHaveLength(3);
      expect(nodes[0]?.title).toContain("Fase 1");
      expect(nodes[1]?.title).toContain("Fase 2");
      expect(nodes[2]?.title).toContain("Fase 3");
      expect(nodes[1]?.unlock.requires).toEqual([nodes[0]?.id]);
      expect(nodes[2]?.unlock.requires).toEqual([nodes[1]?.id]);
    }
  });

  it("garante questões com feedback pedagógico em cada lição", () => {
    const result = validateContentPacks(packs);
    if (!result.ok) throw new Error("Packs inválidos.");

    const quarto = requireCourse(result.catalog.courses, "portugues-4ano");
    const quinto = requireCourse(result.catalog.courses, "portugues-5ano");

    expect(quarto.nodes.map((node) => node.lesson.questions.length)).toEqual([
      5, 4, 5, 4, 4,
    ]);
    expect(quinto.nodes.map((node) => node.lesson.questions.length)).toEqual(
      Array.from({ length: 18 }, () => 5),
    );

    const questionIds = new Set<string>();
    for (const course of [quarto, quinto]) {
      for (const node of course.nodes) {
        expect(node.lesson.requiredCorrectRatio).toBe(0.8);
        expect(node.lesson.intro?.trim().length ?? 0).toBeGreaterThan(0);

        for (const question of node.lesson.questions) {
          expect(question.id, `${node.id} sem id único`).toBeTruthy();
          expect(questionIds.has(question.id), `id repetido: ${question.id}`).toBe(
            false,
          );
          questionIds.add(question.id);
          expect(question.explanation?.trim().length ?? 0).toBeGreaterThan(0);
          expect(question.dicaCearense?.trim().length ?? 0).toBeGreaterThan(0);
        }
      }
    }
  });

  it("mantém diálogos de NPC alinhados à guia", () => {
    const result = validateContentPacks(packs);
    if (!result.ok) throw new Error("Packs inválidos.");

    for (const course of result.catalog.courses) {
      for (const node of course.nodes) {
        expect(node.npc?.speaker, node.id).toBe("Professora Thaís");
        expect(node.npc?.lines.length ?? 0, node.id).toBeGreaterThanOrEqual(2);

        for (const line of node.npc?.lines ?? []) {
          expect(line.trim().length, node.id).toBeGreaterThan(0);
        }
      }
    }
  });
});
