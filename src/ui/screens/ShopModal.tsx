import { useState } from "react";
import type { ShopItem, ShopItemCategory } from "../../core/entities/index";
import { Modal } from "../pixel/Modal";
import { PixelButton } from "../pixel/PixelButton";
import { PixelSprite } from "../pixel/PixelSprite";
import { PlayerAvatar } from "../pixel/PlayerAvatar";
import { coinSprite } from "../pixel/sprites";
import { InventoryList } from "./InventoryList";

interface ShopModalProps {
  readonly items: readonly ShopItem[];
  readonly coins: number;
  readonly ownedItemIds: readonly string[];
  readonly equippedItemIds: readonly string[];
  readonly onClose: () => void;
  readonly onPurchase: (itemId: string) => void;
  readonly onEquip: (itemId: string) => void;
  readonly onUnequip: (category: ShopItemCategory) => void;
}

type ShopTab = ShopItemCategory | "inventory";

const TABS: readonly { id: ShopTab; label: string }[] = [
  { id: "hat", label: "Chapéus" },
  { id: "avatar", label: "Avatares" },
  { id: "inventory", label: "Inventário" },
];

export function ShopModal({
  items,
  coins,
  ownedItemIds,
  equippedItemIds,
  onClose,
  onPurchase,
  onEquip,
  onUnequip,
}: ShopModalProps) {
  const [category, setCategory] = useState<ShopTab>("hat");
  const equippedAvatar =
    items.find(
      (item) =>
        item.category === "avatar" && equippedItemIds.includes(item.id),
    ) ?? null;
  const equippedHat =
    items.find(
      (item) => item.category === "hat" && equippedItemIds.includes(item.id),
    ) ?? null;
  const visibleItems =
    category === "inventory"
      ? []
      : items.filter((item) => item.category === category);

  return (
    <Modal onClose={onClose} labelledBy="shop-title">
      <div className="shop">
        <div className="shop__head">
          <div>
            <span className="eyebrow">Customização</span>
            <h2 id="shop-title">Loja de recompensas</h2>
          </div>
          <button type="button" className="link-button" onClick={onClose}>
            Fechar ×
          </button>
        </div>

        <div className="shop__balance">
          <PixelSprite sprite={coinSprite} size={16} />
          <strong>{coins}</strong> moedas disponíveis
        </div>

        <div className="shop__tabs" role="group" aria-label="Categorias da loja">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="shop__tab"
              aria-pressed={category === tab.id}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {category === "inventory" ? (
          <InventoryList
            items={items}
            ownedItemIds={ownedItemIds}
            equippedItemIds={equippedItemIds}
            onEquip={onEquip}
            onUnequip={onUnequip}
          />
        ) : visibleItems.length === 0 ? (
          <p className="shop__empty">Nenhum item disponível nesta categoria.</p>
        ) : (
          <ul className="shop__grid">
            {visibleItems.map((item) => {
              const owned = ownedItemIds.includes(item.id);
              const equipped = equippedItemIds.includes(item.id);
              const canAfford = coins >= item.price;
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
                    <span className="shop-item__price">
                      <PixelSprite sprite={coinSprite} size={12} />
                      {item.price}
                    </span>
                  </div>
                  <div className="shop-item__actions">
                    {owned ? (
                      equipped ? (
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
                        <>
                          <span className="shop-item__owned">Comprado</span>
                          <PixelButton onClick={() => onEquip(item.id)}>
                            Equipar
                          </PixelButton>
                        </>
                      )
                    ) : (
                      <PixelButton
                        disabled={!canAfford}
                        onClick={() => onPurchase(item.id)}
                      >
                        {canAfford
                          ? "Comprar"
                          : `Faltam ${item.price - coins}`}
                      </PixelButton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
