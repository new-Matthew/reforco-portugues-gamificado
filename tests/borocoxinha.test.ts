import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildAssetIndex, resolveSpriteAsset } from "../src/content/assetsMap";
import { DEFAULT_SHOP_CATALOG } from "../src/core/data/shopCatalog";
import { createInitialProgress } from "../src/core/entities/player";
import type { PlayerProgress } from "../src/core/entities/player";
import { InsufficientCoinsError } from "../src/core/errors";
import { GameEngine } from "../src/core/services/GameEngine";
import { spriteForAvatar } from "../src/ui/pixel/customizationSprites";
import { PlayerAvatar } from "../src/ui/pixel/PlayerAvatar";
import { heroSprite } from "../src/ui/pixel/sprites";
import {
  buildCatalog,
  FixedClock,
  InMemoryProgressStore,
  SequenceRandom,
  StaticRepository,
} from "./support/fixtures";

async function createEngine(coins: number, saved?: Partial<PlayerProgress>) {
  const store = new InMemoryProgressStore();
  store.saved = { ...createInitialProgress(3), coins, ...saved };
  const engine = new GameEngine({
    repository: new StaticRepository(buildCatalog()),
    progressStore: store,
    clock: new FixedClock(),
    random: new SequenceRandom(),
    config: { maxLives: 3 },
  });
  await engine.init();
  return { engine, store };
}

describe("Borocoxinha", () => {
  it("cadastra o caderno como item de mão de 300 moedas", () => {
    const item = DEFAULT_SHOP_CATALOG.find(
      (entry) => entry.id === "borocoxinha",
    );

    expect(item).toMatchObject({
      id: "borocoxinha",
      name: "Borocoxinha",
      price: 300,
      category: "equipar",
      spriteId: "borocoxinha",
    });
    expect(item?.description?.trim().length ?? 0).toBeGreaterThan(0);
    expect(item?.description).not.toContain("visse");
  });

  it("compra, equipa na mão e persiste entre instâncias da engine", async () => {
    const { engine, store } = await createEngine(300);

    engine.purchaseItem("borocoxinha");
    expect(engine.getPlayer().coins).toBe(0);
    expect(engine.getPlayer().ownedItemIds).toContain("borocoxinha");

    engine.equipItem("borocoxinha");
    expect(engine.getEquippedItem("equipar")?.id).toBe("borocoxinha");

    const reloaded = new GameEngine({
      repository: new StaticRepository(buildCatalog()),
      progressStore: store,
      clock: new FixedClock(),
      random: new SequenceRandom(),
    });
    await reloaded.init();

    expect(reloaded.getEquippedItem("equipar")?.spriteId).toBe("borocoxinha");
    expect(reloaded.getPlayer().equippedItemIds).toContain("borocoxinha");

    reloaded.unequipItem("equipar");
    expect(reloaded.getEquippedItem("equipar")).toBeNull();
  });

  it("bloqueia a compra sem moedas suficientes", async () => {
    const { engine } = await createEngine(299);

    expect(() => engine.purchaseItem("borocoxinha")).toThrow(
      InsufficientCoinsError,
    );
    expect(engine.getPlayer().coins).toBe(299);
    expect(engine.getPlayer().ownedItemIds).toEqual([]);
  });

  it("disponibiliza o avatar da coxinha na seleção", () => {
    const avatarItem = DEFAULT_SHOP_CATALOG.find(
      (entry) => entry.spriteId === "avatar-borocoxinha",
    );
    expect(avatarItem).toMatchObject({
      name: "Avatar Borocoxinha",
      category: "avatar",
    });

    const avatar = spriteForAvatar("avatar-borocoxinha");
    expect(avatar).not.toBe(heroSprite);
    expect(avatar.rows).toHaveLength(12);
    expect(avatar.rows.every((row) => row.length === 12)).toBe(true);
    expect(avatar.palette["g"]).toBe("#f2b134");
    expect(avatar.palette["p"]).toBe("#e85d8a");
    expect(avatar.rows.some((row) => row.includes("w"))).toBe(true);
    expect(avatar.rows.some((row) => row.includes("t"))).toBe(true);
  });

  it("resolve o asset e desenha o item segurado na mão", () => {
    const index = buildAssetIndex({
      "../assets/borocoxinha.png": "/assets/borocoxinha-abc123.png",
    });
    expect(resolveSpriteAsset(index, "borocoxinha")).toBe(
      "/assets/borocoxinha-abc123.png",
    );

    const html = renderToStaticMarkup(
      PlayerAvatar({ heldSpriteId: "borocoxinha", size: 48 }),
    );
    expect(html).toContain("player-avatar__held");
    expect(html).toContain("<img");
  });
});
