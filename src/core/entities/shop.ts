export type ShopItemCategory = "hat" | "avatar";

export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly category: ShopItemCategory;
  readonly spriteId: string;
}

export function isShopItemCategory(value: unknown): value is ShopItemCategory {
  return value === "hat" || value === "avatar";
}
