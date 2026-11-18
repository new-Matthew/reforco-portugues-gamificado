import { heroSprite, type PixelSprite } from "./sprites";

export interface HatSprite extends PixelSprite {
  readonly anchorRow: number;
  readonly targetRow: number;
}

const mageAvatarSprite: PixelSprite = {
  palette: {
    k: "#171122",
    p: "#7b4fd6",
    P: "#1f2a63",
    s: "#f2c29b",
    e: "#241a33",
    y: "#ffe38a",
  },
  rows: [
    "....pppp....",
    "...pppppp...",
    "..pppppppp..",
    "...kkkkkk...",
    "..kssssssk..",
    "..ksessesk..",
    "..kssssssk..",
    "..kppppppk..",
    ".kPppppppPk.",
    "kPppyyppppPk",
    "kPppppppppPk",
    ".kPPPPPPPPk.",
  ],
};

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

const wizardHatSprite: HatSprite = {
  palette: { 1: "#6b3fd1", 2: "#b388ff", 3: "#ffe38a" },
  anchorRow: 7,
  targetRow: 1,
  rows: [
    "......11....",
    ".....1211...",
    ".....1221...",
    "....12221...",
    "....122221..",
    "...1222221..",
    "..1111111111",
    "..1311111131",
    "............",
    "............",
    "............",
    "............",
  ],
};

const crownHatSprite: HatSprite = {
  palette: { 3: "#f2c14e", 4: "#ffe38a" },
  anchorRow: 5,
  targetRow: 1,
  rows: [
    "..3..33..3..",
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
    "............",
  ],
};

const knightHelmetSprite: HatSprite = {
  palette: { 3: "#2b2b3a", 4: "#8f9aa6" },
  anchorRow: 7,
  targetRow: 6,
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

const glassesHatSprite: HatSprite = {
  palette: { 3: "#241a33", 4: "#7fd7ff" },
  anchorRow: 5,
  targetRow: 4,
  rows: [
    "............",
    "............",
    "............",
    "............",
    "...33..33...",
    "..3.43.43...",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
};

const AVATAR_SPRITES: Readonly<Record<string, PixelSprite>> = {
  "avatar-hero": heroSprite,
  "avatar-mage": mageAvatarSprite,
  "avatar-knight": knightAvatarSprite,
  "avatar-ranger": rangerAvatarSprite,
};

const HAT_SPRITES: Readonly<Record<string, HatSprite>> = {
  "hat-wizard": wizardHatSprite,
  "hat-crown": crownHatSprite,
  "hat-knight": knightHelmetSprite,
  "hat-glasses": glassesHatSprite,
};

export function spriteForAvatar(spriteId?: string | null): PixelSprite {
  if (!spriteId) return heroSprite;
  return AVATAR_SPRITES[spriteId] ?? heroSprite;
}

export function spriteForHat(spriteId?: string | null): HatSprite | null {
  if (!spriteId) return null;
  return HAT_SPRITES[spriteId] ?? null;
}

export function hatOffsetY(
  hat: HatSprite,
  avatar: PixelSprite,
  size: number,
): number {
  const avatarWidth = Math.max(...avatar.rows.map((row) => row.length), 1);
  const hatWidth = Math.max(...hat.rows.map((row) => row.length), 1);
  return (
    hat.targetRow * (size / avatarWidth) -
    hat.anchorRow * (size / hatWidth)
  );
}
