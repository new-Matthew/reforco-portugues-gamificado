import type { ShopItem, ShopItemCategory } from "../../core/entities/index";
import { listOwnedItems } from "../../core/services/inventory";
import { PixelButton } from "../pixel/PixelButton";
import { PlayerAvatar } from "../pixel/PlayerAvatar";

interface InventoryListProps {
  readonly items: readonly ShopItem[];
  readonly ownedItemIds: readonly string[];
  readonly equippedItemIds: readonly string[];
  readonly onEquip: (itemId: string) => void;
  readonly onUnequip: (category: ShopItemCategory) => void;
}

const CATEGORY_LABELS: Readonly<Record<ShopItemCategory, string>> = {
  hat: "Chapéu",
  avatar: "Avatar",
};

export function InventoryList({
  items,
  ownedItemIds,
  equippedItemIds,
  onEquip,
  onUnequip,
}: InventoryListProps) {
  const ownedItems = listOwnedItems(items, ownedItemIds);
  const equippedAvatar =
    items.find(
      (item) =>
        item.category === "avatar" && equippedItemIds.includes(item.id),
    ) ?? null;
  const equippedHat =
    items.find(
      (item) => item.category === "hat" && equippedItemIds.includes(item.id),
    ) ?? null;

  if (ownedItems.length === 0) {
    return (
      <p className="shop__empty">
        Seu inventário está vazio. Compre itens na loja para personalizar o
        explorador.
      </p>
    );
  }

  return (
    <ul className="shop__grid" aria-label="Itens do inventário">
      {ownedItems.map((item) => {
        const equipped = equippedItemIds.includes(item.id);
        const previewAvatarId =
          item.category === "avatar"
            ? item.spriteId
            : equippedAvatar?.spriteId ?? "avatar-hero";
        const previewHatId =
          item.category === "hat" ? item.spriteId : equippedHat?.spriteId ?? null;

        return (
          <li key={item.id} className="shop-item">
            <div className="shop-item__preview">
              <PlayerAvatar
                avatarSpriteId={previewAvatarId}
                hatSpriteId={previewHatId}
                size={54}
                title={`Prévia de ${item.name}`}
              />
            </div>
            <div className="shop-item__info">
              <strong>{item.name}</strong>
              <p>{item.description ?? "Item de customização pixel art."}</p>
              <span className="shop-item__category">
                {CATEGORY_LABELS[item.category]}
              </span>
            </div>
            <div className="shop-item__actions">
              {equipped ? (
                <>
                  <span className="shop-item__equipped">Equipado</span>
                  <PixelButton
                    variant="ghost"
                    onClick={() => onUnequip(item.category)}
                  >
                    Remover
                  </PixelButton>
                </>
              ) : (
                <PixelButton onClick={() => onEquip(item.id)}>
                  Equipar
                </PixelButton>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
