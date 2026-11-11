import { describe, expect, it } from "vitest";
import sintaxe from "../src/content/packs/portugues/sintaxe.json";
import verbos from "../src/content/packs/portugues/verbos.json";
import { validateContentPacks } from "../src/content/schema/validateContent";

function cloneVerbos(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(verbos)) as Record<string, unknown>;
}

function firstNode(pack: Record<string, unknown>): Record<string, unknown> {
  const nodes = pack.nodes as Array<Record<string, unknown>>;
  return nodes[0] as Record<string, unknown>;
}

describe("validateContentPacks", () => {
  it("aceita os packs reais de Português", () => {
    const result = validateContentPacks([verbos, sintaxe]);
    if (!result.ok) {
      throw new Error(JSON.stringify(result.issues, null, 2));
    }

    expect(result.catalog.courses.map((course) => course.title)).toEqual([
      "Verbos",
      "Sintaxe",
    ]);
    const verbosCourse = result.catalog.courses[0];
    expect(verbosCourse?.nodes).toHaveLength(8);
    expect(result.catalog.courses[1]?.nodes).toHaveLength(2);
  });

  it("rejeita alternativa correta inexistente", () => {
    const pack = cloneVerbos();
    const node = firstNode(pack);
    const lesson = node.lesson as Record<string, unknown>;
    const questions = lesson.questions as Array<Record<string, unknown>>;
    questions[0]!.correctChoiceId = "z";

    const result = validateContentPacks([pack]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("correctChoiceId"))).toBe(
        true,
      );
    }
  });

  it("rejeita ids de alternativa duplicados", () => {
    const pack = cloneVerbos();
    const node = firstNode(pack);
    const lesson = node.lesson as Record<string, unknown>;
    const questions = lesson.questions as Array<Record<string, unknown>>;
    const choices = questions[0]!.choices as Array<Record<string, unknown>>;
    choices[1]!.id = choices[0]!.id;

    const result = validateContentPacks([pack]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("choices[1].id"))).toBe(
        true,
      );
    }
  });

  it("rejeita dependência de desbloqueio inexistente", () => {
    const pack = cloneVerbos();
    const node = firstNode(pack);
    node.unlock = { requires: ["nao-existe"] };

    const result = validateContentPacks([pack]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.message.includes("nao-existe"))).toBe(
        true,
      );
    }
  });

  it("rejeita ciclos de desbloqueio", () => {
    const pack = cloneVerbos();
    const nodes = pack.nodes as Array<Record<string, unknown>>;
    nodes[0]!.unlock = { requires: ["verbos-terminalidade-er-or"] };

    const result = validateContentPacks([pack]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.message.includes("ciclo"))).toBe(true);
    }
  });

  it("rejeita conteúdo sem perguntas", () => {
    const pack = cloneVerbos();
    const node = firstNode(pack);
    const lesson = node.lesson as Record<string, unknown>;
    lesson.questions = [];

    const result = validateContentPacks([pack]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes(".questions"))).toBe(true);
    }
  });
});
