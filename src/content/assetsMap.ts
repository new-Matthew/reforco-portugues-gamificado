/**
 * Assets are discovered automatically from `src/assets/`.
 *
 * To add a new image, just drop the PNG/WebP/GIF file in `src/assets/`.
 * The importer below maps it by file name, and Vite rewrites the URL for the
 * production bundle, so GitHub Pages keeps working with the relative `base`.
 *
 * The Professora Thaís dialog portrait is imported directly in
 * `TeacherAvatar.tsx` from `personagem-tutorial.jpeg`.
 */
const ASSET_MODULES = import.meta.glob("../assets/*.{png,webp,gif}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/**
 * Optional aliases for the sprite IDs used by the game.
 * If the file is missing, the procedural pixel sprite remains as fallback.
 */
export const SPRITE_ASSET_FILES: Readonly<Record<string, string>> = {
  "avatar-hero": "avatar-hero.png",
  "avatar-mage": "avatar-mago.png",
  "avatar-knight": "avatar-cavaleiro.png",
  "avatar-ranger": "avatar-arqueira.png",
  "hat-wizard": "chapeu-mago.png",
  "hat-crown": "coroa-real.png",
  "hat-knight": "capacete-cavaleiro.png",
  "hat-glasses": "oculos-sol.png",
};

export type AssetIndex = Readonly<Record<string, string>>;

export function fileNameFromAssetPath(path: string): string {
  const normalized = path.split("?")[0] ?? path;
  return normalized.split("/").pop() ?? normalized;
}

export function buildAssetIndex(
  modules: Readonly<Record<string, string>>,
): AssetIndex {
  const index: Record<string, string> = {};
  for (const [path, url] of Object.entries(modules)) {
    const fileName = fileNameFromAssetPath(path);
    index[fileName] = url;
    const lowerCaseName = fileName.toLowerCase();
    if (!(lowerCaseName in index)) index[lowerCaseName] = url;
  }
  return index;
}

export function resolveAssetUrl(
  index: AssetIndex,
  fileName: string,
): string | undefined {
  return index[fileName] ?? index[fileName.toLowerCase()];
}

export function resolveSpriteAsset(
  index: AssetIndex,
  spriteId: string | null | undefined,
): string | undefined {
  if (!spriteId) return undefined;

  const explicitFile = SPRITE_ASSET_FILES[spriteId];
  const candidates = explicitFile
    ? [explicitFile]
    : [
        `${spriteId}.png`,
        `${spriteId}.webp`,
        `${spriteId}.gif`,
      ];

  for (const candidate of candidates) {
    const url = resolveAssetUrl(index, candidate);
    if (url) return url;
  }
  return undefined;
}

export const ASSET_INDEX: AssetIndex = buildAssetIndex(ASSET_MODULES);
