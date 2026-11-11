import { heroSprite, npcSprite, type PixelSprite } from "./sprites";

const knightAvatarSprite: PixelSprite = {
  palette: {
    k: "#171122",
    m: "#c7ccd6",
    s: "#241a33",
    n: "#5b8cff",
  },
  rows: [
    "....kkkk....",
    "...kmmmmk...",
    "..kmmmmmmk..",
    "..kmsmmsmk..",
    "..kmmmmmmk..",
    "...kmmmmk...",
    "..knnnnnnk..",
    ".knnnnnnnnk.",
    ".knnnnnnnnk.",
    "..knnnnnnk..",
    "...kkkkkk...",
    "............",
  ],
};

const rangerAvatarSprite: PixelSprite = {
  palette: {
    k: "#171122",
    g: "#2f6b34",
    s: "#f2c29b",
    e: "#241a33",
    l: "#3f8a42",
  },
  rows: [
    "....kkkk....",
    "...kggggk...",
    "..kggggggk..",
    ".kggssssggk.",
    ".kgsessesk..",
    ".kgssssssgk.",
    "..kggggggk..",
    ".kllllllllk.",
    ".kllllllllk.",
    "..kllllllk..",
    "...kkkkkk...",
    "............",
  ],
};

const wizardHatSprite: PixelSprite = {
  palette: { 1: "#6b3fd1", 2: "#b388ff" },
  rows: [
    "......11....",
    ".....1211...",
    ".....1221...",
    "....12221...",
    "...1222221..",
    "..12222221..",
    ".1111111111.",
    "..11111111..",
    "............",
    "............",
    "............",
    "............",
  ],
};

const crownHatSprite: PixelSprite = {
  palette: { 3: "#f2c14e", 4: "#ffe38a" },
  rows: [
    "............",
    "..4..33..4..",
    "..34.33.43..",
    "..33333333..",
    ".3333333333.",
    ".3433333433.",
    "..33333333..",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
};

const knightHelmetSprite: PixelSprite = {
  palette: { 3: "#2b2b3a", 4: "#8f9aa6" },
  rows: [
    "...444444...",
    "..44444444..",
    ".4444444444.",
    ".4444444444.",
    ".4443333444.",
    ".4444444444.",
    "..44444444..",
    "...444444...",
    "............",
    "............",
    "............",
    "............",
  ],
};

const glassesHatSprite: PixelSprite = {
  palette: { 3: "#241a33", 4: "#7fd7ff" },
  rows: [
    "............",
    "............",
    "............",
    "............",
    "...33..33...",
    "..3.43.43...",
    "...33..33...",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
};

const AVATAR_SPRITES: Readonly<Record<string, PixelSprite>> = {
  "avatar-hero": heroSprite,
  "avatar-mage": npcSprite,
  "avatar-knight": knightAvatarSprite,
  "avatar-ranger": rangerAvatarSprite,
};

const HAT_SPRITES: Readonly<Record<string, PixelSprite>> = {
  "hat-wizard": wizardHatSprite,
  "hat-crown": crownHatSprite,
  "hat-knight": knightHelmetSprite,
  "hat-glasses": glassesHatSprite,
};

export function spriteForAvatar(spriteId?: string | null): PixelSprite {
  if (!spriteId) return heroSprite;
  return AVATAR_SPRITES[spriteId] ?? heroSprite;
}

export function spriteForHat(spriteId?: string | null): PixelSprite | null {
  if (!spriteId) return null;
  return HAT_SPRITES[spriteId] ?? null;
}

export function composeAvatarSprites(
  avatar: PixelSprite,
  hat: PixelSprite | null,
): PixelSprite {
  if (!hat) return avatar;

  const width = Math.max(
    ...avatar.rows.map((row) => row.length),
    ...hat.rows.map((row) => row.length),
    1,
  );
  const height = Math.max(avatar.rows.length, hat.rows.length);
  const rows: string[] = [];

  for (let y = 0; y < height; y += 1) {
    const base = (avatar.rows[y] ?? "").padEnd(width, ".");
    const overlay = (hat.rows[y] ?? "").padEnd(width, ".");
    let row = "";
    for (let x = 0; x < width; x += 1) {
      const hatChar = overlay[x] ?? ".";
      const hatColor = hat.palette[hatChar];
      row += hatChar !== "." && hatColor ? hatChar : base[x] ?? ".";
    }
    rows.push(row);
  }

  return {
    rows,
    palette: { ...avatar.palette, ...hat.palette },
  };
}
