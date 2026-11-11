export type DecorationKind =
  | "tree"
  | "pine"
  | "bush"
  | "lake"
  | "mushroom"
  | "stump"
  | "rock"
  | "tuft"
  | "flower";

export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export interface Decoration {
  readonly id: string;
  readonly kind: DecorationKind;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly flip: boolean;
  readonly variant: number;
}

export interface DecorationTemplate {
  readonly id: string;
  readonly kind: DecorationKind;
  readonly xRatio: number;
  readonly yRatio: number;
  readonly scale: number;
  readonly flip?: boolean;
  readonly variant?: number;
}

export const DECORATION_WIDTH: Readonly<Record<DecorationKind, number>> = {
  tree: 86,
  pine: 74,
  bush: 56,
  lake: 168,
  mushroom: 18,
  stump: 28,
  rock: 26,
  tuft: 24,
  flower: 18,
};

const KIND_RADIUS: Readonly<Record<DecorationKind, number>> = {
  tree: 42,
  pine: 34,
  bush: 26,
  lake: 86,
  mushroom: 9,
  stump: 14,
  rock: 13,
  tuft: 11,
  flower: 9,
};

const LARGE_KINDS = new Set<DecorationKind>(["tree", "pine", "bush", "lake"]);

export const decorationsArray: readonly DecorationTemplate[] = [
  {
    id: "landmark-tree-west",
    kind: "tree",
    xRatio: 0.03,
    yRatio: 0.3,
    scale: 1.05,
    flip: false,
    variant: 0,
  },
  {
    id: "landmark-tree-east",
    kind: "tree",
    xRatio: 0.97,
    yRatio: 0.84,
    scale: 1.15,
    flip: true,
    variant: 1,
  },
  {
    id: "landmark-pine-east",
    kind: "pine",
    xRatio: 0.94,
    yRatio: 0.2,
    scale: 1,
    flip: true,
    variant: 0,
  },
  {
    id: "landmark-bush-west",
    kind: "bush",
    xRatio: 0.07,
    yRatio: 0.7,
    scale: 1,
    flip: false,
    variant: 0,
  },
  {
    id: "landmark-stump-south",
    kind: "stump",
    xRatio: 0.13,
    yRatio: 0.95,
    scale: 1,
    flip: false,
    variant: 0,
  },
];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedForGroup(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared),
  );
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function minDistanceToPath(
  x: number,
  y: number,
  points: readonly MapPoint[],
): number {
  const first = points[0];
  if (!first) return Number.POSITIVE_INFINITY;
  if (points.length === 1) return Math.hypot(x - first.x, y - first.y);

  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    if (!a || !b) continue;
    best = Math.min(best, distanceToSegment(x, y, a.x, a.y, b.x, b.y));
  }
  return best;
}

interface BuildDecorationsOptions {
  readonly width: number;
  readonly height: number;
  readonly points: readonly MapPoint[];
  readonly seed: number;
  readonly withLake?: boolean;
}

export function buildDecorations({
  width,
  height,
  points,
  seed,
  withLake = false,
}: BuildDecorationsOptions): Decoration[] {
  const random = mulberry32(seed);
  const decorations: Decoration[] = [];
  const occupied: { x: number; y: number; radius: number }[] = [];

  const nodeClear = (x: number, y: number, padding: number): boolean =>
    points.every((point) => Math.hypot(x - point.x, y - point.y) >= padding);

  const decorClear = (x: number, y: number, padding: number): boolean =>
    occupied.every(
      (entry) => Math.hypot(x - entry.x, y - entry.y) >= entry.radius + padding,
    );

  const canPlace = (x: number, y: number, kind: DecorationKind): boolean => {
    const large = LARGE_KINDS.has(kind);
    return (
      nodeClear(x, y, large ? 92 : 44) &&
      minDistanceToPath(x, y, points) >= (large ? 72 : 20) &&
      decorClear(x, y, large ? 12 : 8)
    );
  };

  const add = (
    kind: DecorationKind,
    x: number,
    y: number,
    scale: number,
    variant: number,
    flip: boolean,
  ): void => {
    decorations.push({
      id: `decor-${decorations.length}`,
      kind,
      x: Math.round(x),
      y: Math.round(y),
      scale,
      variant,
      flip,
    });
    occupied.push({ x, y, radius: KIND_RADIUS[kind] });
  };

  if (withLake) {
    const lakeWidth = DECORATION_WIDTH.lake;
    const lakeHeight = lakeWidth * (20 / 34);
    const margin = 10;
    const candidates = [
      { x: margin + lakeWidth / 2, y: margin + lakeHeight / 2 },
      { x: width - margin - lakeWidth / 2, y: margin + lakeHeight / 2 },
      { x: margin + lakeWidth / 2, y: height - margin - lakeHeight / 2 },
      { x: width - margin - lakeWidth / 2, y: height - margin - lakeHeight / 2 },
    ];

    let best: MapPoint | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const candidate of candidates) {
      const nodeGap = points.reduce(
        (gap, point) =>
          Math.min(gap, Math.hypot(candidate.x - point.x, candidate.y - point.y)),
        Number.POSITIVE_INFINITY,
      );
      const score = Math.min(
        nodeGap,
        minDistanceToPath(candidate.x, candidate.y, points) + 24,
      );
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best && bestScore > 80) {
      add("lake", best.x, best.y, 1, 0, false);
    }
  }

  for (const template of decorationsArray) {
    const x = template.xRatio * width;
    const y = template.yRatio * height;
    if (!canPlace(x, y, template.kind)) continue;
    add(
      template.kind,
      x,
      y,
      template.scale,
      template.variant ?? 0,
      template.flip ?? false,
    );
  }

  const sideTrees: readonly DecorationKind[] = ["tree", "tree", "pine", "bush"];
  for (const kind of sideTrees) {
    for (let attempt = 0; attempt < 28; attempt += 1) {
      const side = random() < 0.5 ? -1 : 1;
      const edge = random() * width * 0.16;
      const x = side < 0 ? edge : width - edge;
      const y = 30 + random() * Math.max(1, height - 60);
      if (!canPlace(x, y, kind)) continue;
      add(kind, x, y, 0.85 + random() * 0.3, Math.floor(random() * 3), random() < 0.5);
      break;
    }
  }

  for (let index = 0; index < 4; index += 1) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const x = 24 + random() * Math.max(1, width - 48);
      const y = 30 + random() * Math.max(1, height - 60);
      const kind: DecorationKind = random() < 0.6 ? "bush" : "tree";
      if (!canPlace(x, y, kind)) continue;
      add(kind, x, y, 0.8 + random() * 0.3, Math.floor(random() * 3), random() < 0.5);
      break;
    }
  }

  const smallKinds: readonly DecorationKind[] = [
    "tuft",
    "flower",
    "mushroom",
    "rock",
    "stump",
  ];
  for (let index = 0; index < 18; index += 1) {
    if (points.length < 2) break;

    const segmentIndex = Math.floor(random() * (points.length - 1));
    const a = points[segmentIndex];
    const b = points[segmentIndex + 1];
    if (!a || !b) continue;

    const t = random();
    const pathX = a.x + (b.x - a.x) * t;
    const pathY = a.y + (b.y - a.y) * t;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const side = random() < 0.5 ? -1 : 1;
    const offset = 26 + random() * 30;
    const x = pathX + normalX * side * offset;
    const y = pathY + normalY * side * offset;
    const kind =
      smallKinds[Math.floor(random() * smallKinds.length)] ?? "tuft";

    if (!canPlace(x, y, kind)) continue;
    add(kind, x, y, 0.8 + random() * 0.5, Math.floor(random() * 3), random() < 0.5);
  }

  for (let index = 0; index < 12; index += 1) {
    const x = random() * width;
    const y = 24 + random() * Math.max(1, height - 48);
    if (!canPlace(x, y, "tuft")) continue;
    add("tuft", x, y, 0.8 + random() * 0.5, Math.floor(random() * 2), random() < 0.5);
  }

  return decorations.sort((a, b) => {
    const rank = (decoration: Decoration): number =>
      decoration.kind === "lake" ? 0 : 1;
    return rank(a) - rank(b) || a.y - b.y;
  });
}
