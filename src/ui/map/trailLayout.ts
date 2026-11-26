export const TRAIL_ROW_HEIGHT = 152;
export const TRAIL_NODE_CENTER_Y = 41;
export const TRAIL_TOP_PAD = 48;
export const TRAIL_BOTTOM_PAD = 40;

const MAX_COLUMN = 2;
const NODE_HALF_EXTENT = 44;
const MIN_COLUMN_INSET = 24;
const COLUMN_INSET_RATIO = 0.18;
const FALLBACK_WIDTH = 320;

export interface TrailPoint {
  readonly x: number;
  readonly y: number;
}

interface TrailNodeLike {
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
}

export interface TrailLayout {
  readonly baseY: number;
  readonly height: number;
  readonly points: readonly TrailPoint[];
}

export function clampTrailColumn(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_COLUMN, Math.max(0, value));
}

export function trailNodeTop(node: TrailNodeLike, baseY: number): number {
  return TRAIL_TOP_PAD + (node.position.y - baseY) * TRAIL_ROW_HEIGHT;
}

export function computeTrailLayout(
  nodes: readonly TrailNodeLike[],
  width: number,
): TrailLayout {
  if (nodes.length === 0) {
    return {
      baseY: 0,
      height: TRAIL_TOP_PAD + TRAIL_ROW_HEIGHT + TRAIL_BOTTOM_PAD,
      points: [],
    };
  }

  const firstRow = Math.min(...nodes.map((node) => node.position.y));
  const lastRow = Math.max(
    ...nodes.map((node) => node.position.y - firstRow),
  );
  const height =
    TRAIL_TOP_PAD + (lastRow + 1) * TRAIL_ROW_HEIGHT + TRAIL_BOTTOM_PAD;

  const measuredWidth =
    Number.isFinite(width) && width > 0 ? width : FALLBACK_WIDTH;
  const horizontalInset = Math.min(
    NODE_HALF_EXTENT + 8,
    Math.max(MIN_COLUMN_INSET, measuredWidth * COLUMN_INSET_RATIO),
  );
  const usableWidth = Math.max(1, measuredWidth - horizontalInset * 2);
  const columnWidth = usableWidth / 3;
  const minCenterX = Math.min(NODE_HALF_EXTENT, measuredWidth / 2);
  const maxCenterX = Math.max(minCenterX, measuredWidth - NODE_HALF_EXTENT);

  const points = nodes.map((node) => {
    const column = clampTrailColumn(node.position.x);
    const center = horizontalInset + (column + 0.5) * columnWidth;
    return {
      x: Math.min(Math.max(center, minCenterX), maxCenterX),
      y: trailNodeTop(node, firstRow) + TRAIL_NODE_CENTER_Y,
    };
  });

  return { baseY: firstRow, height, points };
}
