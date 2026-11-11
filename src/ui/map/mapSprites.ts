import type { PixelSprite } from "../pixel/sprites";
import type { DecorationKind } from "./decorations";

const TREE_PALETTE = { h: "#3f8a42", d: "#2f6b34", k: "#5a3a1b" } as const;
const TREE_LIGHT_PALETTE = { o: "#4b9d4f", d: "#2f6b34", k: "#5a3a1b" } as const;
const PINE_PALETTE = { g: "#2f6b34", h: "#3f8a42", k: "#5a3a1b" } as const;
const BUSH_PALETTE = { g: "#3f8a42", h: "#57b85a", d: "#2f6b34" } as const;

const treeSprite: PixelSprite = {
  palette: TREE_PALETTE,
  rows: [
    "................",
    "......hhhh......",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hhhhhhhhhhhh..",
    ".hhhhhhhhhhhhhh.",
    ".hhhhhhhhhhhhhd.",
    "hhhhhhhhhhhhhhd.",
    "hhhhhhhhhhhhhhdd",
    "hhhhhhhhhhhhhddd",
    "hhhhhhhhhhhhdddd",
    ".hhhhhhhhhhdddd.",
    "..hhhhhhhhdddd..",
    "...hhhhhhdddd...",
    "....hhhhdddd....",
    "......kkkk......",
    "......kkkk......",
    "......kkkk......",
    ".....kkkkkk.....",
    "....kkkkkkkk....",
  ],
};

const treeLightSprite: PixelSprite = {
  palette: TREE_LIGHT_PALETTE,
  rows: [
    "..............",
    ".....oooo.....",
    "...oooooooo...",
    "..oooooooooo..",
    ".oooooooooooo.",
    "oooooooooooood",
    "oooooooooooodd",
    "oooooooooooddd",
    ".ooooooooodddd",
    "..oooooooddd..",
    "...oooooddd...",
    "....oooddd....",
    "......kk......",
    "......kk......",
    "......kk......",
    ".....kkkk.....",
    "....kkkkkk....",
  ],
};

const pineSprite: PixelSprite = {
  palette: PINE_PALETTE,
  rows: [
    ".......g.......",
    "......ggg......",
    "......ghg......",
    ".....ggggg.....",
    "....ggggggg....",
    ".....ggggg.....",
    "....ggggggg....",
    "...ggggggggg...",
    "..ggggggggggg..",
    "...ggggggggg...",
    "..ggggggggggg..",
    ".ggggggggggggg.",
    "..ggggggggggg..",
    "..ggggggggggg..",
    "......kkk......",
    "......kkk......",
    "....kkkkkkk....",
  ],
};

const bushSprite: PixelSprite = {
  palette: BUSH_PALETTE,
  rows: [
    "....gggg....",
    "..gghhhhgg..",
    ".ghhhhhhhhg.",
    "ghhhhhhhhhhg",
    "ghhhhhhhhhhd",
    ".ghhhhhhhdd.",
    "..ggdddgg...",
    "....ddd.....",
  ],
};

const mushroomRedSprite: PixelSprite = {
  palette: { r: "#d9534f", w: "#f4e6c8" },
  rows: [
    "..rrrr..",
    ".rrrrrr.",
    "rrrrrrrr",
    "rrrrrrrr",
    "..wwww..",
    "..wwww..",
    "..wwww..",
    "..wwww..",
  ],
};

const mushroomBrownSprite: PixelSprite = {
  palette: { r: "#b07a3f", w: "#f0dfb8" },
  rows: mushroomRedSprite.rows,
};

const stumpSprite: PixelSprite = {
  palette: { b: "#7a4a2b", m: "#c89a5b" },
  rows: [
    ".bbbbbbbb.",
    "bbbbbbbbbb",
    "bmmmmmmmmb",
    "bmmmmmmmmb",
    "bbbbbbbbbb",
    ".bbbbbbbb.",
    ".bbbbbbbb.",
    "..bbbbbb..",
    "..bbbbbb..",
  ],
};

const rockSprite: PixelSprite = {
  palette: { s: "#6b6b78", h: "#9494a3" },
  rows: [
    "...sssss...",
    "..sshhhss..",
    ".sshhhhhss.",
    "sshhhhhhhss",
    "sshhhhhhhss",
    ".sssssssss.",
  ],
};

const mossyRockSprite: PixelSprite = {
  palette: { s: "#5d6b5a", h: "#7f8f78" },
  rows: rockSprite.rows,
};

const tuftSprite: PixelSprite = {
  palette: { g: "#3f8a42" },
  rows: [
    "..g....",
    ".gg.g..",
    ".ggggg.",
    "..ggg..",
    "..ggg..",
  ],
};

const flowerPinkSprite: PixelSprite = {
  palette: { p: "#ff9ecb", g: "#3f8a42" },
  rows: [
    "...p...",
    "..ppp..",
    "...p...",
    "..gg...",
    ".gggg..",
    "..gg...",
    "..gg...",
  ],
};

const flowerYellowSprite: PixelSprite = {
  palette: { p: "#ffd75c", g: "#3f8a42" },
  rows: flowerPinkSprite.rows,
};

const LAKE_WIDTH = 34;
const LAKE_HEIGHT = 20;

function createLakeSprite(): PixelSprite {
  const rows: string[][] = [];

  for (let y = 0; y < LAKE_HEIGHT; y += 1) {
    const row: string[] = [];
    for (let x = 0; x < LAKE_WIDTH; x += 1) {
      const nx = (x - (LAKE_WIDTH - 1) / 2) / ((LAKE_WIDTH - 1) / 2);
      const ny = (y - (LAKE_HEIGHT - 1) / 2) / ((LAKE_HEIGHT - 1) / 2);
      const wobble = Math.sin(x * 1.9) * 0.04 + Math.cos(y * 2.3) * 0.04;
      const distance = nx * nx + ny * ny + wobble;

      if (distance < 0.72) row.push("d");
      else if (distance < 0.94) row.push("m");
      else if (distance < 1.04) row.push("k");
      else row.push(".");
    }
    rows.push(row);
  }

  const paint = (x: number, y: number, char: string): void => {
    const row = rows[y];
    if (row && x >= 0 && x < LAKE_WIDTH) row[x] = char;
  };

  const waves: readonly (readonly [number, number])[] = [
    [8, 8],
    [9, 8],
    [10, 8],
    [11, 8],
    [20, 6],
    [21, 6],
    [22, 6],
    [15, 12],
    [16, 12],
    [17, 12],
    [18, 12],
    [10, 14],
    [11, 14],
    [23, 10],
    [24, 10],
  ];
  for (const [x, y] of waves) paint(x, y, "s");
  paint(9, 7, "w");
  paint(21, 5, "w");
  paint(16, 11, "w");

  const lilies: readonly (readonly [number, number, string])[] = [
    [13, 13, "l"],
    [14, 13, "l"],
    [13, 12, "p"],
    [22, 8, "l"],
    [23, 8, "l"],
    [23, 7, "l"],
    [18, 15, "l"],
  ];
  for (const [x, y, char] of lilies) paint(x, y, char);

  return {
    palette: {
      k: "#12364a",
      m: "#2f7fae",
      d: "#1f5f8b",
      s: "#7fd7ff",
      w: "#c8f5ff",
      l: "#4fa64f",
      p: "#ff9ecb",
    },
    rows: rows.map((row) => row.join("")),
  };
}

const lakeSprite = createLakeSprite();

const SPRITES: Record<DecorationKind, readonly PixelSprite[]> = {
  tree: [treeSprite, treeLightSprite],
  pine: [pineSprite],
  bush: [bushSprite],
  lake: [lakeSprite],
  mushroom: [mushroomRedSprite, mushroomBrownSprite],
  stump: [stumpSprite],
  rock: [rockSprite, mossyRockSprite],
  tuft: [tuftSprite],
  flower: [flowerPinkSprite, flowerYellowSprite],
};

export function spriteForDecoration(
  kind: DecorationKind,
  variant: number,
): PixelSprite {
  const variants = SPRITES[kind];
  const sprite = variants[Math.abs(variant) % variants.length];
  if (sprite) return sprite;
  const fallback = variants[0];
  if (!fallback) throw new Error(`Nenhum sprite para decoração: ${kind}`);
  return fallback;
}
