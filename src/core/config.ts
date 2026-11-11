export interface StarThresholds {
  readonly three: number;
  readonly two: number;
  readonly one: number;
}

export interface GameConfig {
  readonly maxLives: number;
  readonly xpPerQuestion: number;
  readonly xpPerLevel: number;
  readonly replayXpMultiplier: number;
  readonly coinsPerStar: number;
  readonly defaultRequiredCorrectRatio: number;
  readonly shuffleQuestions: boolean;
  readonly starThresholds: StarThresholds;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxLives: 3,
  xpPerQuestion: 10,
  xpPerLevel: 100,
  replayXpMultiplier: 0.25,
  coinsPerStar: 5,
  defaultRequiredCorrectRatio: 1,
  shuffleQuestions: false,
  starThresholds: { three: 1, two: 0.75, one: 0.5 },
};

export function resolveGameConfig(partial?: Partial<GameConfig>): GameConfig {
  return {
    ...DEFAULT_GAME_CONFIG,
    ...partial,
    starThresholds: {
      ...DEFAULT_GAME_CONFIG.starThresholds,
      ...partial?.starThresholds,
    },
  };
}
