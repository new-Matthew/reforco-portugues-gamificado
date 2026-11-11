export type SessionStatus = "active" | "completed" | "failed" | "abandoned";

export interface LessonOutcome {
  readonly courseId: string;
  readonly nodeId: string;
  readonly nodeTitle: string;
  readonly passed: boolean;
  readonly stars: number;
  readonly correctCount: number;
  readonly totalQuestions: number;
  readonly xpEarned: number;
  readonly coinsEarned: number;
  readonly itemId?: string;
  readonly itemLabel?: string;
  readonly isFirstCompletion: boolean;
  readonly unlockedNodeIds: readonly string[];
  readonly levelBefore: number;
  readonly levelAfter: number;
  readonly leveledUp: boolean;
  readonly streakCurrent: number;
  readonly streakBest: number;
  readonly streakIncreased: boolean;
}

export interface LessonSession {
  readonly courseId: string;
  readonly nodeId: string;
  readonly questionIds: readonly string[];
  readonly answers: Readonly<Record<string, boolean>>;
  readonly currentIndex: number;
  readonly correctCount: number;
  readonly wrongCount: number;
  readonly lives: number;
  readonly earnedXp: number;
  readonly status: SessionStatus;
  readonly startedAt: number;
  readonly outcome?: LessonOutcome;
}

export interface AnswerFeedback {
  readonly questionId: string;
  readonly correct: boolean;
  readonly expectedAnswers: readonly string[];
  readonly explanation?: string;
  readonly earnedXp: number;
  readonly livesLeft: number;
  readonly sessionStatus: SessionStatus;
  readonly outcome?: LessonOutcome;
}
