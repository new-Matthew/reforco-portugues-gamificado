interface Point {
  readonly x: number;
  readonly y: number;
}

interface Segment {
  readonly a: Point;
  readonly b: Point;
  readonly c1: Point;
  readonly c2: Point;
}

interface Stone {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tone: number;
  readonly moss: boolean;
}

interface Tuft {
  readonly x: number;
  readonly y: number;
  readonly variant: number;
}

interface Slab {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tone: number;
}

export interface TrailPathProps {
  readonly points: readonly Point[];
  readonly width: number;
  readonly height: number;
}

const STONE_TONES = ["#65563f", "#77674d", "#8a7a5c"] as const;
const STONE_HIGHLIGHTS = ["#8a7a5c", "#9c8c6c", "#b0a07c"] as const;
const SLAB_TONES = ["#9c8c6c", "#8a7a5c", "#b0a07c"] as const;
const SLAB_HIGHLIGHTS = ["#c9bb98", "#b8a984", "#d6c8a4"] as const;

function buildSegments(points: readonly Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    segments.push({
      a,
      b,
      c1: { x: a.x + dx * 0.12, y: a.y + dy * 0.48 },
      c2: { x: a.x + dx * 0.88, y: a.y + dy * 0.52 },
    });
  }
  return segments;
}

function cubicAt(segment: Segment, t: number): Point {
  const mt = 1 - t;
  const { a, b, c1, c2 } = segment;
  return {
    x:
      mt * mt * mt * a.x +
      3 * mt * mt * t * c1.x +
      3 * mt * t * t * c2.x +
      t * t * t * b.x,
    y:
      mt * mt * mt * a.y +
      3 * mt * mt * t * c1.y +
      3 * mt * t * t * c2.y +
      t * t * t * b.y,
  };
}

function buildDecor(segments: readonly Segment[]): {
  stones: Stone[];
  tufts: Tuft[];
} {
  const stones: Stone[] = [];
  const tufts: Tuft[] = [];

  segments.forEach((segment, segmentIndex) => {
    const dx = segment.b.x - segment.a.x;
    const dy = segment.b.y - segment.a.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const steps = Math.max(4, Math.round(length / 32));

    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      const point = cubicAt(segment, t);
      const side = step % 2 === 0 ? 1 : -1;
      const offset = side * 6.5;
      const seed = step + segmentIndex;

      stones.push({
        x: point.x + normalX * offset,
        y: point.y + normalY * offset,
        width: seed % 3 === 0 ? 9 : 7,
        height: seed % 4 === 0 ? 6 : 5,
        tone: seed % 3,
        moss: seed % 5 === 0,
      });

      if (step % 3 === 0) {
        const tuftSide = seed % 2 === 0 ? 1 : -1;
        tufts.push({
          x: point.x + normalX * tuftSide * 13,
          y: point.y + normalY * tuftSide * 13,
          variant: seed % 3,
        });
      }
    }
  });

  return { stones, tufts };
}

function buildSlabs(segments: readonly Segment[]): Slab[] {
  const slabs: Slab[] = [];

  segments.forEach((segment, segmentIndex) => {
    const length = Math.hypot(
      segment.b.x - segment.a.x,
      segment.b.y - segment.a.y,
    );
    const count = Math.max(1, Math.round(length / 130));

    for (let index = 0; index < count; index += 1) {
      const t = (index + 0.5) / count;
      const point = cubicAt(segment, t);
      const seed = segmentIndex * 19 + index;
      slabs.push({
        x: point.x + ((seed % 3) - 1) * 4,
        y: point.y + ((seed % 5) - 2) * 2,
        width: seed % 4 === 0 ? 20 : 16,
        height: seed % 5 === 0 ? 11 : 9,
        tone: seed % 3,
      });
    }
  });

  return slabs;
}

export function TrailPath({ points, width, height }: TrailPathProps) {
  if (points.length < 2) return null;

  const segments = buildSegments(points);
  const { stones, tufts } = buildDecor(segments);
  const slabs = buildSlabs(segments);

  let road = `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 0}`;
  for (const segment of segments) {
    road += ` C ${segment.c1.x} ${segment.c1.y} ${segment.c2.x} ${segment.c2.y} ${segment.b.x} ${segment.b.y}`;
  }

  return (
    <svg
      className="trail-path"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <path d={road} fill="none" stroke="#20180f" strokeWidth={26} strokeLinecap="round" opacity={0.7} />
      <path d={road} fill="none" stroke="#6b543a" strokeWidth={20} strokeLinecap="round" />
      <path d={road} fill="none" stroke="#876a46" strokeWidth={14} strokeLinecap="round" />
      <path
        d={road}
        fill="none"
        stroke="#a8895c"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="2 12"
        opacity={0.7}
      />

      {slabs.map((slab, index) => (
        <g key={`slab-${index}`}>
          <rect
            x={slab.x - slab.width / 2 - 1}
            y={slab.y - slab.height / 2 - 1}
            width={slab.width + 2}
            height={slab.height + 2}
            fill="#2b2118"
            opacity={0.6}
          />
          <rect
            x={slab.x - slab.width / 2}
            y={slab.y - slab.height / 2}
            width={slab.width}
            height={slab.height}
            fill={SLAB_TONES[slab.tone]}
          />
          <rect
            x={slab.x - slab.width / 2 + 1}
            y={slab.y - slab.height / 2 + 1}
            width={slab.width - 2}
            height={2}
            fill={SLAB_HIGHLIGHTS[slab.tone]}
            opacity={0.8}
          />
        </g>
      ))}

      {stones.map((stone, index) => (
        <g key={`stone-${index}`}>
          <rect
            x={stone.x - stone.width / 2 - 1}
            y={stone.y - stone.height / 2 - 1}
            width={stone.width + 2}
            height={stone.height + 2}
            fill="#0b0913"
            opacity={0.65}
          />
          <rect
            x={stone.x - stone.width / 2}
            y={stone.y - stone.height / 2}
            width={stone.width}
            height={stone.height}
            fill={STONE_TONES[stone.tone]}
          />
          <rect
            x={stone.x - stone.width / 2 + 1}
            y={stone.y - stone.height / 2 + 1}
            width={stone.width - 2}
            height={Math.max(1, stone.height / 2 - 1)}
            fill={STONE_HIGHLIGHTS[stone.tone]}
            opacity={0.7}
          />
          {stone.moss ? (
            <rect
              x={stone.x + stone.width / 2 - 3}
              y={stone.y + stone.height / 2 - 3}
              width={3}
              height={3}
              fill="#3f7d3a"
            />
          ) : null}
        </g>
      ))}

      {tufts.map((tuft, index) => (
        <g key={`tuft-${index}`}>
          <rect x={tuft.x - 4} y={tuft.y + 1} width={2} height={3} fill="#2f6b34" />
          <rect x={tuft.x - 1} y={tuft.y} width={2} height={4} fill="#3f8a42" />
          <rect x={tuft.x + 2} y={tuft.y + 1} width={2} height={3} fill="#2f6b34" />
          {tuft.variant === 0 ? (
            <rect x={tuft.x} y={tuft.y - 3} width={2} height={2} fill="#ffcf5c" />
          ) : null}
          {tuft.variant === 2 ? (
            <rect x={tuft.x - 3} y={tuft.y - 2} width={2} height={2} fill="#b388ff" />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
