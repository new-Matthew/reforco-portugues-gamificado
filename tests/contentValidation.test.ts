import { describe, expect, it } from "vitest";
import quartoAno from "../src/content/packs/portugues/4ano.json";
import quintoAno from "../src/content/packs/portugues/5ano.json";
import { validateContentPacks } from "../src/content/schema/validateContent";

function cloneQuartoAno(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(quartoAno)) as Record<string, unknown>;
}

function firstNode(pack: Record<string, unknown>): Record<string, unknown> {
  const nodes = pack.nodes as Array<Record<string, unknown>>;
  return nodes[0] as Record<string, unknown>;
}

describe("validateContentPacks", () => {
  it("aceita os packs reais do Ensino Fundamental I", () => {
    const result = validateContentPacks([quartoAno, quintoAno]);
    if (!result.ok) {
      throw new Error(JSON.stringify(result.issues, null, 2));
    }

    expect(result.catalog.courses.map((course) => course.title)).toEqual([
      "Língua Portuguesa · 4º Ano",
      "Língua Portuguesa · 5º Ano",
    ]);
    expect(result.catalog.courses[0]?.nodes).toHaveLength(21);
    expect(result.catalog.courses[1]?.nodes).toHaveLength(18);
  });

  it("rejeita alternativa correta inexistente", () => {
    const pack = cloneQuartoAno();
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
    const pack = cloneQuartoAno();
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
    const pack = cloneQuartoAno();
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
    const pack = cloneQuartoAno();
    const nodes = pack.nodes as Array<Record<string, unknown>>;
    nodes[0]!.unlock = { requires: ["p4-ort-r-s-f3"] };

    const result = validateContentPacks([pack]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.message.includes("ciclo"))).toBe(true);
    }
  });

  it("rejeita conteúdo sem perguntas", () => {
    const pack = cloneQuartoAno();
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
