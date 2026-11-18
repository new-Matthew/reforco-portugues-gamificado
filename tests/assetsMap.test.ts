import { describe, expect, it } from "vitest";
import {
  buildAssetIndex,
  fileNameFromAssetPath,
  resolveAssetUrl,
  resolveSpriteAsset,
  SPRITE_ASSET_FILES,
} from "../src/content/assetsMap";

const INDEX = buildAssetIndex({
  "../assets/chapeu-mago.png": "/assets/chapeu-mago-abc123.png",
  "../assets/oculos-sol.png": "/assets/oculos-sol-def456.png",
  "../assets/thais-avatar.png": "/assets/thais-avatar-ghi789.png",
});

describe("assetsMap", () => {
  it("extracts the file name from a Vite asset path", () => {
    expect(fileNameFromAssetPath("../assets/chapeu-mago.png")).toBe(
      "chapeu-mago.png",
    );
    expect(fileNameFromAssetPath("../../src/assets/thais-avatar.png?url")).toBe(
      "thais-avatar.png",
    );
  });

  it("builds an index keyed by file name and lower-case aliases", () => {
    expect(INDEX["chapeu-mago.png"]).toBe("/assets/chapeu-mago-abc123.png");
    expect(resolveAssetUrl(INDEX, "CHAPEU-MAGO.PNG")).toBe(
      "/assets/chapeu-mago-abc123.png",
    );
  });

  it("maps known sprite ids through the explicit file aliases", () => {
    expect(SPRITE_ASSET_FILES["hat-wizard"]).toBe("chapeu-mago.png");
    expect(resolveSpriteAsset(INDEX, "hat-wizard")).toBe(
      "/assets/chapeu-mago-abc123.png",
    );
    expect(resolveSpriteAsset(INDEX, "hat-glasses")).toBe(
      "/assets/oculos-sol-def456.png",
    );
  });

  it("falls back to the sprite id file name for new items", () => {
    const customIndex = buildAssetIndex({
      "../assets/avatar-mago.png": "/assets/avatar-mago-xyz.png",
    });
    expect(resolveSpriteAsset(customIndex, "avatar-mago")).toBe(
      "/assets/avatar-mago-xyz.png",
    );
  });

  it("returns undefined when the sprite has no asset or id", () => {
    expect(resolveSpriteAsset(INDEX, "hat-crown")).toBeUndefined();
    expect(resolveSpriteAsset(INDEX, null)).toBeUndefined();
    expect(resolveAssetUrl(INDEX, "nao-existe.png")).toBeUndefined();
  });
});
