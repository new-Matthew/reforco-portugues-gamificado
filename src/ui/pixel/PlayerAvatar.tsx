import type { CSSProperties } from "react";
import { PixelSprite } from "./PixelSprite";
import {
  hatOffsetY,
  spriteForAvatar,
  spriteForHat,
} from "./customizationSprites";

interface PlayerAvatarProps {
  readonly avatarSpriteId?: string | null;
  readonly hatSpriteId?: string | null;
  readonly size?: number;
  readonly title?: string;
  readonly className?: string;
}

export function PlayerAvatar({
  avatarSpriteId,
  hatSpriteId,
  size = 44,
  title = "Avatar do explorador",
  className,
}: PlayerAvatarProps) {
  const avatar = spriteForAvatar(avatarSpriteId);
  const hat = spriteForHat(hatSpriteId);
  const classes = ["player-avatar", className].filter(Boolean).join(" ");
  const style = { "--avatar-size": `${size}px` } as CSSProperties;

  return (
    <div
      className={classes}
      style={style}
      role="img"
      aria-label={title}
    >
      <PixelSprite
        className="player-avatar__base"
        sprite={avatar}
        size={size}
      />
      {hat ? (
        <PixelSprite
          className="player-avatar__hat"
          sprite={hat}
          size={size}
          style={{ top: `${hatOffsetY(hat, avatar, size)}px` }}
        />
      ) : null}
    </div>
  );
}
