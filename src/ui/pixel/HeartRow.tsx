import { PixelSprite } from "./PixelSprite";
import { heartSprite } from "./sprites";

interface HeartRowProps {
  readonly lives: number;
  readonly max: number;
}

export function HeartRow({ lives, max }: HeartRowProps) {
  const total = Math.max(0, max);
  return (
    <div className="heart-row" aria-label={`${lives} de ${total} vidas`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={index < lives ? "heart heart--full" : "heart heart--empty"}
        >
          <PixelSprite sprite={heartSprite} size={16} />
        </span>
      ))}
    </div>
  );
}
