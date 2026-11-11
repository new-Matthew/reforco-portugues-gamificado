export interface PixelSprite {
  readonly rows: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
}

const PALETTE: Readonly<Record<string, string>> = {
  k: "#171122",
  h: "#7a4a2b",
  s: "#f2c29b",
  e: "#241a33",
  a: "#3b6eea",
  b: "#8a5a2b",
  c: "#c0392b",
  g: "#f2c14e",
  y: "#ffe38a",
  r: "#e74c3c",
  p: "#7b4fd6",
  l: "#4caf50",
  d: "#5a3a1b",
  w: "#ffffff",
};

export const heroSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "....kkkk....",
    "...khhhhk...",
    "..khhhhhhk..",
    "..khsssshk..",
    "..ksessesk..",
    "..kssssssk..",
    "...kssssk...",
    "..kaaaaak...",
    ".kaaaaaaak..",
    ".kbbbbbbbk..",
    "..kbbbbbk...",
    "...kkkkk....",
  ],
};

export const npcSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "....pppp....",
    "...pppppp...",
    "..pppppppp..",
    "...kkkkkk...",
    "..kssssssk..",
    "..ksessesk..",
    "..kssssssk..",
    "..kppppppk..",
    ".kppppppppk.",
    ".kppppppppk.",
    "..kkkkkkkk..",
    "............",
  ],
};

export const chestSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "............",
    ".kkkkkkkkkk.",
    ".kbbbbbbbbk.",
    ".kbggggggbk.",
    ".kbggkkggbk.",
    ".kbggggggbk.",
    ".kkkkkkkkkk.",
    ".kbbbbbbbbk.",
    ".kbbbbbbbbk.",
    ".kbbkkkkbbk.",
    ".kkkkkkkkkk.",
    "............",
  ],
};

export const starSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    ".....gg.....",
    "....gggg....",
    "....gggg....",
    "..gggggggg..",
    ".gggggggggg.",
    "..gggggggg..",
    "...gggggg...",
    "..gggggggg..",
    "..ggg..ggg..",
    "..gg....gg..",
    "............",
    "............",
  ],
};

export const lockSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "...gggggg...",
    "..gg....gg..",
    "..gg....gg..",
    "..gg....gg..",
    ".gggggggggg.",
    ".gggggggggg.",
    ".ggg.gg.ggg.",
    ".gggggggggg.",
    ".gggggggggg.",
    "............",
  ],
};

export const heartSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "..kk..kk..",
    ".krrkkrrk.",
    ".krrrrrrk.",
    ".krrrrrrk.",
    "..krrrrk..",
    "...krrk...",
    "....kk....",
  ],
};

export const coinSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "...gggggg...",
    "..gyyyyyyg..",
    ".gyyyyyyyyg.",
    ".gyyggggyyg.",
    ".gyyggggyyg.",
    ".gyyyyyyyyg.",
    "..gyyyyyyg..",
    "...gggggg...",
  ],
};

export const flameSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "...rr...",
    "..rrrr..",
    "..ryyr..",
    ".rryyrr.",
    ".ryyyyr.",
    ".rywwyr.",
    ".rryyrr.",
    "..rrrr..",
    "...rr...",
  ],
};

export const chestOpenSprite: PixelSprite = {
  palette: PALETTE,
  rows: [
    "..kkkkkkkk..",
    ".kbbbbbbbbk.",
    ".kbggggggbk.",
    ".kkkkkkkkkk.",
    ".kbbbbbbbbk.",
    ".kbgyyyygbk.",
    ".kbgyyyygbk.",
    ".kbbbbbbbbk.",
    ".kbbkkkkbbk.",
    ".kkkkkkkkkk.",
    "............",
    "............",
  ],
};

export function spriteForIcon(icon?: string): PixelSprite {
  switch (icon) {
    case "npc":
      return npcSprite;
    case "chest":
      return chestSprite;
    case "coin":
      return coinSprite;
    default:
      return starSprite;
  }
}
