import { describe, expect, it } from "vitest";
import { DEFAULT_SHOP_CATALOG } from "../src/core/data/shopCatalog";
import type { ShopItem } from "../src/core/entities/shop";
import { listOwnedItems } from "../src/core/services/inventory";

const CATALOG: readonly ShopItem[] = [
  {
    id: "hat-a",
    name: "Chapéu A",
    price: 10,
    category: "hat",
    spriteId: "hat-wizard",
  },
  {
    id: "avatar-b",
    name: "Avatar B",
    price: 20,
    category: "avatar",
    spriteId: "avatar-mage",
  },
  {
    id: "hat-c",
    name: "Chapéu C",
    price: 30,
    category: "hat",
    spriteId: "hat-crown",
  },
];

describe("inventário de customização", () => {
  it("lista apenas os itens comprados preservando a ordem do catálogo", () => {
    expect(listOwnedItems(CATALOG, ["hat-c", "hat-a"])).toEqual([
      CATALOG[0],
      CATALOG[2],
    ]);
  });

  it("ignora itens desconhecidos ou ids repetidos", () => {
    expect(listOwnedItems(CATALOG, ["item-fantasma", "avatar-b", "avatar-b"])).toEqual([
      CATALOG[1],
    ]);
  });

  it("retorna lista vazia sem itens comprados", () => {
    expect(listOwnedItems(CATALOG, [])).toEqual([]);
  });

  it("funciona com o catálogo padrão da loja", () => {
    const owned = listOwnedItems(DEFAULT_SHOP_CATALOG, [
      "hat-glasses",
      "avatar-ranger",
    ]);

    expect(owned.map((item) => item.id)).toEqual([
      "hat-glasses",
      "avatar-ranger",
    ]);
  });
});
