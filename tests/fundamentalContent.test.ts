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

  it("mantém a progressão em escada com 3 fases por módulo", () => {
    const result = validateContentPacks(packs);
    if (!result.ok) throw new Error("Packs inválidos.");

    const quarto = requireCourse(result.catalog.courses, "portugues-4ano");
    const quinto = requireCourse(result.catalog.courses, "portugues-5ano");

    expect(quarto.nodes).toHaveLength(21);
    expect(quinto.nodes).toHaveLength(18);

    for (const course of [quarto, quinto]) {
      const chapters = new Map<string, typeof course.nodes>();
      for (const node of course.nodes) {
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
    }
  });

  it("garante 5 questões com feedback pedagógico em cada lição", () => {
    const result = validateContentPacks(packs);
    if (!result.ok) throw new Error("Packs inválidos.");

    const questionIds = new Set<string>();
    for (const course of result.catalog.courses) {
      expect(course.nodes[0]?.unlock.requires ?? []).toEqual([]);

      for (const node of course.nodes) {
        expect(node.lesson.questions, node.id).toHaveLength(5);
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
});
