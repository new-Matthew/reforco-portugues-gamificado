import { describe, expect, it } from "vitest";
import sextoAno from "../src/content/packs/portugues/6ano.json";
import {
  clampTrailColumn,
  computeTrailLayout,
  trailNodeTop,
} from "../src/ui/map/trailLayout";

const WIDTHS = [1440, 900, 560, 430, 390, 320, 240];

function nodesFrom6ano() {
  return sextoAno.nodes;
}

describe("layout da trilha", () => {
  it("mantém todos os pontos e cards dentro do container em várias larguras", () => {
    const nodes = nodesFrom6ano();

    for (const width of WIDTHS) {
      const layout = computeTrailLayout(nodes, width);
      const halfNode = 44;

      expect(layout.points).toHaveLength(nodes.length);
      expect(layout.height).toBeGreaterThan(0);

      for (const point of layout.points) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(point.x).toBeGreaterThanOrEqual(halfNode);
        expect(point.x).toBeLessThanOrEqual(width - halfNode);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it("corrige colunas fora do intervalo 0–2 em vez de vazar pela borda", () => {
    const nodes = [
      { position: { x: -5, y: 0 } },
      { position: { x: 0, y: 1 } },
      { position: { x: 1, y: 2 } },
      { position: { x: 2, y: 3 } },
      { position: { x: 18, y: 4 } },
    ];

    const result = computeTrailLayout(nodes, 390);
    const clamped = computeTrailLayout(
      nodes.map((node) => ({
        position: { x: clampTrailColumn(node.position.x), y: node.position.y },
      })),
      390,
    );

    expect(result.points).toEqual(clamped.points);
    for (const point of result.points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(390);
    }
  });

  it("usa largura de segurança quando a medição ainda é zero", () => {
    const layout = computeTrailLayout(nodesFrom6ano(), 0);

    expect(layout.points).toHaveLength(nodesFrom6ano().length);
    for (const point of layout.points) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(44);
      expect(point.x).toBeLessThanOrEqual(320 - 44);
    }
  });

  it("alimenta todos os packs com posições de coluna válidas", () => {
    for (const node of sextoAno.nodes) {
      expect(node.position.x).toBeGreaterThanOrEqual(0);
      expect(node.position.x).toBeLessThanOrEqual(2);
    }
  });

  it("posiciona cada fase na sua linha correspondente", () => {
    const nodes = nodesFrom6ano();
    const layout = computeTrailLayout(nodes, 390);

    nodes.forEach((node, index) => {
      expect(trailNodeTop(node, layout.baseY)).toBe(
        layout.points[index]!.y - 41,
      );
    });
  });
});
