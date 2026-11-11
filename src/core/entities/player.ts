export interface NodeCompletion {
  readonly stars: number;
  readonly bestRatio: number;
  readonly completedAt: number;
  readonly lastPlayedAt: number;
}

export interface PlayerStreak {
  readonly current: number;
  readonly best: number;
  readonly lastStudyDay: string | null;
}

export interface PlayerProgress {
  readonly xp: number;
  readonly coins: number;
  readonly lives: number;
  readonly completedNodes: Readonly<Record<string, NodeCompletion>>;
  readonly inventory: Readonly<Record<string, number>>;
  readonly ownedItemIds: readonly string[];
  readonly equippedItemIds: readonly string[];
  readonly streak: PlayerStreak;
}

export function createInitialStreak(): PlayerStreak {
  return {
    current: 0,
    best: 0,
    lastStudyDay: null,
  };
}

export function createInitialProgress(maxLives: number): PlayerProgress {
  return {
    xp: 0,
    coins: 0,
    lives: maxLives,
    completedNodes: {},
    inventory: {},
    ownedItemIds: [],
    equippedItemIds: [],
    streak: createInitialStreak(),
  };
}
