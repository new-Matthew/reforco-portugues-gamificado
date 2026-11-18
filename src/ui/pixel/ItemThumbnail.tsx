import { ASSET_INDEX, resolveSpriteAsset } from "../../content/assetsMap";
import type { ShopItem } from "../../core/entities/index";
import { PlayerAvatar } from "./PlayerAvatar";

interface ItemThumbnailProps {
  readonly item: ShopItem;
  readonly avatarSpriteId?: string | null;
  readonly hatSpriteId?: string | null;
  readonly size?: number;
}

export function ItemThumbnail({
  item,
  avatarSpriteId,
  hatSpriteId,
  size = 48,
}: ItemThumbnailProps) {
  const imageUrl = resolveSpriteAsset(ASSET_INDEX, item.spriteId);

  if (imageUrl) {
    return (
      <img
        className="item-thumb item-thumb__image pixel-asset"
        src={imageUrl}
        alt={item.name}
        width={size}
        height={size}
        draggable={false}
      />
    );
  }

  return (
    <PlayerAvatar
      className="item-thumb item-thumb__sprite"
      avatarSpriteId={avatarSpriteId}
      hatSpriteId={hatSpriteId}
      size={size}
      title={`Prévia de ${item.name}`}
    />
  );
}
