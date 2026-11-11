import { PixelSprite } from "./PixelSprite";
import { composeAvatarSprites, spriteForAvatar, spriteForHat } from "./customizationSprites";

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
  const sprite = composeAvatarSprites(
    spriteForAvatar(avatarSpriteId),
    spriteForHat(hatSpriteId),
  );

  return (
    <PixelSprite
      sprite={sprite}
      size={size}
      title={title}
      className={className}
    />
  );
}
