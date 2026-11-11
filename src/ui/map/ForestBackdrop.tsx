import { useId, useMemo } from "react";
import { SpritePixels } from "../pixel/PixelSprite";
import type { PixelSprite } from "../pixel/sprites";
import {
  buildDecorations,
  DECORATION_WIDTH,
  type Decoration,
  type MapPoint,
} from "./decorations";
import { spriteForDecoration } from "./mapSprites";

interface ForestBackdropProps {
  readonly width: number;
  readonly height: number;
  readonly points: readonly MapPoint[];
  readonly seed: number;
  readonly withLake?: boolean;
}

function spriteWidth(sprite: PixelSprite): number {
  return Math.max(...sprite.rows.map((row) => row.length), 1);
}

function decorationTransform(decoration: Decoration): string {
  const sprite = spriteForDecoration(decoration.kind, decoration.variant);
  const width = spriteWidth(sprite);
  const height = sprite.rows.length;
  const scale = (DECORATION_WIDTH[decoration.kind] * decoration.scale) / width;
  const scaleX = decoration.flip ? -scale : scale;
  const anchorY = decoration.kind === "lake" ? -height / 2 : -height;

  return `translate(${decoration.x} ${decoration.y}) scale(${scaleX} ${scale}) translate(${-width / 2} ${anchorY})`;
}

export function ForestBackdrop({
  width,
  height,
  points,
  seed,
  withLake = false,
}: ForestBackdropProps) {
  const reactId = useId();
  const uid = reactId.replace(/[^a-zA-Z0-9_-]/g, "");

  const decorations = useMemo(
    () => buildDecorations({ width, height, points, seed, withLake }),
    [width, height, points, seed, withLake],
  );

  const spriteDefs = useMemo(() => {
    const definitions = new Map<string, PixelSprite>();
    for (const decoration of decorations) {
      definitions.set(
        `${decoration.kind}-${decoration.variant}`,
        spriteForDecoration(decoration.kind, decoration.variant),
      );
    }
    return [...definitions.entries()];
  }, [decorations]);

  return (
    <svg
      className="trail-backdrop"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {spriteDefs.map(([key, sprite]) => (
          <g id={`${uid}-${key}`} key={key}>
            <SpritePixels sprite={sprite} />
          </g>
        ))}
      </defs>

      {decorations.map((decoration) => (
        <use
          key={decoration.id}
          href={`#${uid}-${decoration.kind}-${decoration.variant}`}
          transform={decorationTransform(decoration)}
        />
      ))}
    </svg>
  );
}
