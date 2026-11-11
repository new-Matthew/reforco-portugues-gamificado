import { describe, expect, it } from "vitest";
import type { PlayerProgress } from "../src/core/entities/player";
import { createInitialProgress } from "../src/core/entities/player";
import type { ShopItem } from "../src/core/entities/shop";
import { DEFAULT_SHOP_CATALOG } from "../src/core/data/shopCatalog";
import {
  InsufficientCoinsError,
  ShopItemAlreadyOwnedError,
  ShopItemNotFoundError,
  ShopItemNotOwnedError,
} from "../src/core/errors";
import { GameEngine } from "../src/core/services/GameEngine";
import {
  buildCatalog,
  FixedClock,
  InMemoryProgressStore,
  SequenceRandom,
  StaticRepository,
} from "./support/fixtures";

interface EngineFixture {
  readonly engine: GameEngine;
  readonly store: InMemoryProgressStore;
}

async function createEngine(
  coins: number,
  saved?: Partial<PlayerProgress>,
  shopCatalog: readonly ShopItem[] = DEFAULT_SHOP_CATALOG,
): Promise<EngineFixture> {
  const store = new InMemoryProgressStore();
  store.saved = { ...createInitialProgress(3), coins, ...saved };
  const engine = new GameEngine({
    repository: new StaticRepository(buildCatalog()),
    progressStore: store,
    clock: new FixedClock(),
    random: new SequenceRandom(),
    shopCatalog,
    config: { maxLives: 3 },
  });
  await engine.init();
  return { engine, store };
}

describe("Loja de recompensas", () => {
  it("compra um item, desconta moedas e registra a posse", async () => {
    const { engine } = await createEngine(100);

    engine.purchaseItem("hat-wizard");

    const player = engine.getPlayer();
    expect(player.coins).toBe(70);
    expect(player.ownedItemIds).toContain("hat-wizard");
    expect(player.equippedItemIds).toEqual([]);
    expect(engine.getEquippedItem("hat")).toBeNull();
  });

  it("impede comprar o mesmo item duas vezes", async () => {
    const { engine } = await createEngine(100);

    engine.purchaseItem("hat-wizard");

    expect(() => engine.purchaseItem("hat-wizard")).toThrow(
      ShopItemAlreadyOwnedError,
    );
    expect(engine.getPlayer().coins).toBe(70);
    expect(engine.getPlayer().ownedItemIds).toEqual(["hat-wizard"]);
  });

  it("impede compra sem moedas suficientes e mantém o saldo", async () => {
    const { engine } = await createEngine(10);

    expect(() => engine.purchaseItem("hat-crown")).toThrow(InsufficientCoinsError);
    expect(engine.getPlayer().coins).toBe(10);
    expect(engine.getPlayer().ownedItemIds).toEqual([]);
  });

  it("exige posse antes de equipar e substitui apenas a categoria", async () => {
    const { engine } = await createEngine(200);

    expect(() => engine.equipItem("hat-wizard")).toThrow(ShopItemNotOwnedError);

    engine.purchaseItem("hat-wizard");
    engine.purchaseItem("hat-crown");
    engine.equipItem("hat-wizard");
    engine.equipItem("hat-crown");

    expect(engine.getPlayer().equippedItemIds).toEqual(["hat-crown"]);
    expect(engine.getPlayer().ownedItemIds).toEqual(
      expect.arrayContaining(["hat-wizard", "hat-crown"]),
    );
    expect(engine.getEquippedItem("hat")?.id).toBe("hat-crown");
  });

  it("equipa avatar e chapéu de forma independente", async () => {
    const { engine } = await createEngine(200);

    engine.purchaseItem("avatar-mage");
    engine.purchaseItem("hat-glasses");
    engine.equipItem("avatar-mage");
    engine.equipItem("hat-glasses");

    expect(engine.getEquippedItem("avatar")?.id).toBe("avatar-mage");
    expect(engine.getEquippedItem("hat")?.id).toBe("hat-glasses");

    engine.unequipItem("hat");

    expect(engine.getEquippedItem("hat")).toBeNull();
    expect(engine.getEquippedItem("avatar")?.id).toBe("avatar-mage");
  });

  it("rejeita item inexistente na loja", async () => {
    const { engine } = await createEngine(100);
    expect(() => engine.purchaseItem("item-fantasma")).toThrow(
      ShopItemNotFoundError,
    );
  });

  it("persiste compra e equipamento entre instâncias da engine", async () => {
    const { engine, store } = await createEngine(100);
    engine.purchaseItem("hat-wizard");
    engine.equipItem("hat-wizard");

    const reloaded = new GameEngine({
      repository: new StaticRepository(buildCatalog()),
      progressStore: store,
      clock: new FixedClock(),
      random: new SequenceRandom(),
    });
    await reloaded.init();

    expect(reloaded.getPlayer().coins).toBe(70);
    expect(reloaded.getPlayer().ownedItemIds).toContain("hat-wizard");
    expect(reloaded.getEquippedItem("hat")?.id).toBe("hat-wizard");
  });

  it("normaliza saves antigos e filtra itens equipados inválidos", async () => {
    const legacy = {
      xp: 20,
      coins: 15,
      lives: 2,
      completedNodes: {},
      inventory: {},
      ownedItemIds: ["hat-wizard"],
      equippedItemIds: ["hat-wizard", "item-fantasma", "avatar-mage"],
    } as unknown as PlayerProgress;

    const { engine } = await createEngine(0, legacy);

    const player = engine.getPlayer();
    expect(player.ownedItemIds).toEqual(["hat-wizard"]);
    expect(player.equippedItemIds).toEqual(["hat-wizard"]);
    expect(player.streak).toEqual({ current: 0, best: 0, lastStudyDay: null });
  });

  it("aplica fallbacks em itens de loja incompletos", async () => {
    const incomplete = [
      { id: "item-custom" },
      { id: "" },
      { category: "avatar" },
    ] as unknown as readonly ShopItem[];

    const { engine } = await createEngine(0, undefined, incomplete);
    const items = engine.getShopCatalog();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "item-custom",
      name: "Item item-custom",
      price: 0,
      category: "hat",
      spriteId: "hat-wizard",
    });
  });
});
