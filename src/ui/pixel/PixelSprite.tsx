import type { PixelSprite as Sprite } from "./sprites";

interface PixelSpriteProps {
  readonly sprite: Sprite;
  readonly size?: number;
  readonly className?: string;
  readonly title?: string;
}

export function SpritePixels({ sprite }: { readonly sprite: Sprite }) {
  return (
    <>
      {sprite.rows.flatMap((row, y) =>
        [...row].map((char, x) => {
          const fill = char === "." ? undefined : sprite.palette[char];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        }),
      )}
    </>
  );
}

export function PixelSprite({ sprite, size = 64, className, title }: PixelSpriteProps) {
  const width = Math.max(...sprite.rows.map((row) => row.length), 1);
  const height = sprite.rows.length;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      shapeRendering="crispEdges"
      role={title ? "img" : "presentation"}
      aria-label={title}
      focusable="false"
    >
      <SpritePixels sprite={sprite} />
    </svg>
  );
}
