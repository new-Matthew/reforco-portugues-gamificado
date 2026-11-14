import type { ShopItem, ShopItemCategory } from "../../core/entities/index";
import { Modal } from "../pixel/Modal";
import { PlayerAvatar } from "../pixel/PlayerAvatar";
import { InventoryList } from "./InventoryList";

interface InventoryModalProps {
  readonly items: readonly ShopItem[];
  readonly ownedItemIds: readonly string[];
  readonly equippedItemIds: readonly string[];
  readonly equippedAvatarSpriteId?: string | null;
  readonly equippedHatSpriteId?: string | null;
  readonly onClose: () => void;
  readonly onEquip: (itemId: string) => void;
  readonly onUnequip: (category: ShopItemCategory) => void;
}

export function InventoryModal({
  items,
  ownedItemIds,
  equippedItemIds,
  equippedAvatarSpriteId,
  equippedHatSpriteId,
  onClose,
  onEquip,
  onUnequip,
}: InventoryModalProps) {
  return (
    <Modal onClose={onClose} labelledBy="inventory-title">
      <div className="shop">
        <div className="shop__head">
          <div>
            <span className="eyebrow">Mochila do explorador</span>
            <h2 id="inventory-title">Inventário</h2>
          </div>
          <button type="button" className="link-button" onClick={onClose}>
            Fechar ×
          </button>
        </div>

        <div className="inventory__current">
          <div className="inventory__current-frame">
            <PlayerAvatar
              avatarSpriteId={equippedAvatarSpriteId}
              hatSpriteId={equippedHatSpriteId}
              size={48}
              title="Visual atualmente equipado"
            />
          </div>
          <div>
            <span className="eyebrow">Visual atual</span>
            <p>
              Escolha uma skin ou chapéu comprado para atualizar seu avatar no
              mapa e na barra superior.
            </p>
          </div>
        </div>

        <InventoryList
          items={items}
          ownedItemIds={ownedItemIds}
          equippedItemIds={equippedItemIds}
          onEquip={onEquip}
          onUnequip={onUnequip}
        />
      </div>
    </Modal>
  );
}
