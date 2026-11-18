import type { CSSProperties } from "react";
import type { PixelSprite as Sprite } from "./sprites";

interface PixelSpriteProps {
  readonly sprite: Sprite;
  readonly size?: number;
  readonly className?: string;
  readonly title?: string;
  readonly style?: CSSProperties;
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

export function PixelSprite({ sprite, size = 64, className, title, style }: PixelSpriteProps) {
  const width = Math.max(...sprite.rows.map((row) => row.length), 1);
  const height = sprite.rows.length;
  const classes = ["pixel-sprite", className].filter(Boolean).join(" ");

  return (
    <svg
      className={classes}
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      role={title ? "img" : "presentation"}
      aria-label={title}
      focusable="false"
      style={style}
    >
      <SpritePixels sprite={sprite} />
    </svg>
  );
}
