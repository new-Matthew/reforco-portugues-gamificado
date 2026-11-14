import type { ShopItem } from "../entities/shop";

export function listOwnedItems(
  items: readonly ShopItem[],
  ownedItemIds: readonly string[],
): ShopItem[] {
  const owned = new Set(ownedItemIds);
  return items.filter((item) => owned.has(item.id));
}
