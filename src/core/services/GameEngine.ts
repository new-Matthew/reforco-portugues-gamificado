import type {
  ContentCatalog,
  Course,
  CourseSummary,
  MapNode,
  NodeCompletion,
  PlayerStreak,
  Question,
  ShopItem,
  ShopItemCategory,
  UserAnswer,
} from "../entities/index";
import type { PlayerProgress } from "../entities/index";
import type { AnswerFeedback, LessonOutcome, LessonSession, SessionStatus } from "../entities/index";
import { createInitialProgress, isShopItemCategory } from "../entities/index";
import { DEFAULT_SHOP_CATALOG } from "../data/shopCatalog";
import type { ContentRepository } from "../ports/ContentRepository";
import type { ProgressStore } from "../ports/ProgressStore";
import type { Clock, RandomProvider } from "../ports/system";
import { resolveGameConfig, type GameConfig } from "../config";
import {
  CourseNotFoundError,
  InsufficientCoinsError,
  LessonAlreadyActiveError,
  LessonLockedError,
  NoActiveSessionError,
  NodeNotFoundError,
  QuestionAlreadyAnsweredError,
  QuestionNotAnsweredError,
  ShopItemAlreadyOwnedError,
  ShopItemNotFoundError,
  ShopItemNotOwnedError,
} from "../errors";
import { GameEventEmitter, type GameEvent } from "../events";
import {
  AnswerEvaluatorRegistry,
  createDefaultEvaluatorRegistry,
} from "./answerEvaluators";
import {
  bestCompletion,
  computeLevel,
  computeStars,
  getUnlockedNodeIds,
  isNodeUnlocked,
  nextStreak,
} from "./progression";

export interface GameEngineDependencies {
  readonly repository: ContentRepository;
  readonly progressStore: ProgressStore;
  readonly clock?: Clock;
  readonly random?: RandomProvider;
  readonly evaluator?: AnswerEvaluatorRegistry;
  readonly config?: Partial<GameConfig>;
  readonly events?: GameEventEmitter;
  readonly shopCatalog?: readonly ShopItem[];
}

export interface LevelInfo {
  readonly level: number;
  readonly xpIntoLevel: number;
  readonly xpForNextLevel: number;
}

const systemClock: Clock = { now: () => Date.now() };
const systemRandom: RandomProvider = { next: () => Math.random() };

export class GameEngine {
  private readonly repository: ContentRepository;
  private readonly progressStore: ProgressStore;
  private readonly clock: Clock;
  private readonly random: RandomProvider;
  private readonly evaluator: AnswerEvaluatorRegistry;
  private readonly config: GameConfig;
  private readonly events: GameEventEmitter;
  private readonly shopCatalog: readonly ShopItem[];
  private readonly shopById: Map<string, ShopItem>;

  private catalog: ContentCatalog = { courses: [] };
  private coursesById = new Map<string, Course>();
  private nodesByCourse = new Map<string, Map<string, MapNode>>();
  private player: PlayerProgress;
  private session: LessonSession | null = null;

  constructor(dependencies: GameEngineDependencies) {
    this.repository = dependencies.repository;
    this.progressStore = dependencies.progressStore;
    this.clock = dependencies.clock ?? systemClock;
    this.random = dependencies.random ?? systemRandom;
    this.evaluator = dependencies.evaluator ?? createDefaultEvaluatorRegistry();
    this.config = resolveGameConfig(dependencies.config);
    this.events = dependencies.events ?? new GameEventEmitter();
    this.shopCatalog = normalizeShopCatalog(
      dependencies.shopCatalog ?? DEFAULT_SHOP_CATALOG,
    );
    this.shopById = new Map(this.shopCatalog.map((item) => [item.id, item]));
    this.player = createInitialProgress(this.config.maxLives);
  }

  async init(): Promise<void> {
    const catalog = await this.repository.load();
    this.catalog = catalog;
    this.coursesById = new Map(catalog.courses.map((course) => [course.id, course]));
    this.nodesByCourse = new Map(
      catalog.courses.map((course) => [
        course.id,
        new Map(course.nodes.map((node) => [node.id, node])),
      ]),
    );

    const saved = await this.progressStore.load();
    this.player = saved
      ? normalizeSavedProgress(saved, this.config.maxLives, this.shopCatalog)
      : createInitialProgress(this.config.maxLives);
    if (!saved) {
      this.persist();
    }
    this.events.emit({ type: "progress.changed", player: this.getPlayer() });
  }

  onEvent(listener: (event: GameEvent) => void): () => void {
    return this.events.on(listener);
  }

  getConfig(): GameConfig {
    return this.config;
  }

  getCatalog(): ContentCatalog {
    return this.catalog;
  }

  upsertCourse(course: Course): void {
    const existingIndex = this.catalog.courses.findIndex(
      (entry) => entry.id === course.id,
    );
    const courses = [...this.catalog.courses];
    if (existingIndex >= 0) {
      courses[existingIndex] = course;
    } else {
      courses.push(course);
    }

    this.catalog = { courses };
    this.coursesById = new Map(courses.map((entry) => [entry.id, entry]));
    this.nodesByCourse = new Map(
      courses.map((entry) => [
        entry.id,
        new Map(entry.nodes.map((node) => [node.id, node])),
      ]),
    );
    this.events.emit({ type: "content.changed", courseId: course.id });
  }

  listCourses(): CourseSummary[] {
    const player = this.player;
    return this.catalog.courses.map((course) => {
      const completedCount = course.nodes.filter(
        (node) => player.completedNodes[node.id] !== undefined,
      ).length;
      return {
        id: course.id,
        title: course.title,
        subject: course.subject,
        description: course.description,
        nodeCount: course.nodes.length,
        completedCount,
      };
    });
  }

  getCourse(courseId: string): Course {
    const course = this.coursesById.get(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }
    return course;
  }

  getNode(courseId: string, nodeId: string): MapNode {
    const node = this.nodesByCourse.get(courseId)?.get(nodeId);
    if (!node) {
      throw new NodeNotFoundError(courseId, nodeId);
    }
    return node;
  }

  getPlayer(): PlayerProgress {
    return {
      xp: this.player.xp,
      coins: this.player.coins,
      lives: this.player.lives,
      completedNodes: { ...this.player.completedNodes },
      inventory: { ...this.player.inventory },
      ownedItemIds: [...this.player.ownedItemIds],
      equippedItemIds: [...this.player.equippedItemIds],
      streak: { ...this.player.streak },
    };
  }

  getShopCatalog(): readonly ShopItem[] {
    return [...this.shopCatalog];
  }

  getEquippedItem(category: ShopItemCategory): ShopItem | null {
    const itemId = this.player.equippedItemIds.find(
      (id) => this.shopById.get(id)?.category === category,
    );
    return itemId ? this.shopById.get(itemId) ?? null : null;
  }

  purchaseItem(itemId: string): PlayerProgress {
    const item = this.requireShopItem(itemId);
    if (this.player.ownedItemIds.includes(item.id)) {
      throw new ShopItemAlreadyOwnedError(item.name);
    }
    if (this.player.coins < item.price) {
      throw new InsufficientCoinsError(item.price, this.player.coins);
    }

    this.player = {
      ...this.player,
      coins: this.player.coins - item.price,
      ownedItemIds: [...this.player.ownedItemIds, item.id],
    };
    this.persist();
    this.events.emit({
      type: "shop.purchased",
      itemId: item.id,
      price: item.price,
    });
    this.events.emit({ type: "progress.changed", player: this.getPlayer() });
    return this.getPlayer();
  }

  equipItem(itemId: string): PlayerProgress {
    const item = this.requireShopItem(itemId);
    if (!this.player.ownedItemIds.includes(item.id)) {
      throw new ShopItemNotOwnedError(item.name);
    }

    const otherEquippedId = this.player.equippedItemIds.find(
      (id) => this.shopById.get(id)?.category === item.category,
    );
    if (otherEquippedId === item.id) {
      return this.getPlayer();
    }

    const equippedItemIds = this.player.equippedItemIds.filter(
      (id) => this.shopById.get(id)?.category !== item.category,
    );
    this.player = {
      ...this.player,
      equippedItemIds: [...equippedItemIds, item.id],
    };
    this.persist();
    this.events.emit({
      type: "shop.equipped",
      itemId: item.id,
      category: item.category,
    });
    this.events.emit({ type: "progress.changed", player: this.getPlayer() });
    return this.getPlayer();
  }

  unequipItem(category: ShopItemCategory): PlayerProgress {
    const equippedItemIds = this.player.equippedItemIds.filter(
      (id) => this.shopById.get(id)?.category !== category,
    );
    if (equippedItemIds.length === this.player.equippedItemIds.length) {
      return this.getPlayer();
    }

    this.player = { ...this.player, equippedItemIds };
    this.persist();
    this.events.emit({ type: "shop.equipped", itemId: null, category });
    this.events.emit({ type: "progress.changed", player: this.getPlayer() });
    return this.getPlayer();
  }

  getLevelInfo(): LevelInfo {
    return {
      level: computeLevel(this.player.xp, this.config.xpPerLevel),
      xpIntoLevel: this.player.xp % this.config.xpPerLevel,
      xpForNextLevel: this.config.xpPerLevel,
    };
  }

  getUnlockedNodeIds(courseId: string): string[] {
    const nodes = this.nodesByCourse.get(courseId);
    if (!nodes) return [];
    return getUnlockedNodeIds([...nodes.values()], this.player.completedNodes, this.player.xp);
  }

  getSession(): LessonSession | null {
    return this.session;
  }

  getCurrentQuestion(): Question | null {
    if (!this.session || this.session.status !== "active") return null;
    return this.findQuestion(this.session, this.session.currentIndex);
  }

  startLesson(courseId: string, nodeId: string): LessonSession {
    if (this.session && this.session.status === "active") {
      throw new LessonAlreadyActiveError();
    }
    const node = this.getNode(courseId, nodeId);
    if (!isNodeUnlocked(node, this.player.completedNodes, this.player.xp)) {
      throw new LessonLockedError(node.title);
    }

    this.player = { ...this.player, lives: this.config.maxLives };
    this.persist();

    const session: LessonSession = {
      courseId,
      nodeId,
      questionIds: this.orderQuestionIds(node.lesson.questions),
      answers: {},
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      lives: this.config.maxLives,
      earnedXp: 0,
      status: "active",
      startedAt: this.clock.now(),
    };
    this.session = session;
    this.events.emit({ type: "session.started", courseId, nodeId });
    return session;
  }

  answerCurrentQuestion(answer: UserAnswer): AnswerFeedback {
    const session = this.requireSession();
    if (session.status !== "active") {
      throw new NoActiveSessionError();
    }
    const question = this.getCurrentQuestion();
    if (!question) {
      throw new NoActiveSessionError();
    }
    if (session.answers[question.id] !== undefined) {
      throw new QuestionAlreadyAnsweredError();
    }

    const evaluation = this.evaluator.evaluate(question, answer);
    const earnedXp = evaluation.correct
      ? question.xp ?? this.config.xpPerQuestion
      : 0;

    let updated: LessonSession;
    if (evaluation.correct) {
      updated = {
        ...session,
        answers: { ...session.answers, [question.id]: true },
        correctCount: session.correctCount + 1,
        earnedXp: session.earnedXp + earnedXp,
      };
    } else {
      const lives = Math.max(0, session.lives - 1);
      updated = {
        ...session,
        answers: { ...session.answers, [question.id]: false },
        wrongCount: session.wrongCount + 1,
        lives,
      };
      this.player = { ...this.player, lives: Math.max(0, this.player.lives - 1) };
    }
    this.session = updated;

    let outcome: LessonOutcome | undefined;
    if (!evaluation.correct && updated.lives <= 0) {
      outcome = this.finalizeLesson("failed");
    } else {
      this.persist();
    }

    this.events.emit({
      type: "answer.evaluated",
      questionId: question.id,
      correct: evaluation.correct,
    });

    const current = this.requireSession();
    return {
      questionId: question.id,
      correct: evaluation.correct,
      expectedAnswers: evaluation.expectedAnswers,
      explanation: question.explanation,
      earnedXp,
      livesLeft: current.lives,
      sessionStatus: current.status,
      outcome,
    };
  }

  advance(): LessonOutcome | null {
    const session = this.requireSession();
    if (session.status !== "active") {
      return session.outcome ?? null;
    }

    const currentQuestionId = session.questionIds[session.currentIndex];
    if (currentQuestionId === undefined) {
      return this.finalizeLesson("completed");
    }
    if (session.answers[currentQuestionId] === undefined) {
      throw new QuestionNotAnsweredError();
    }
    if (session.currentIndex >= session.questionIds.length - 1) {
      return this.finalizeLesson("completed");
    }
    this.session = { ...session, currentIndex: session.currentIndex + 1 };
    return null;
  }

  abandonLesson(): void {
    if (!this.session) return;
    this.session = { ...this.session, status: "abandoned" };
  }

  resetProgress(): void {
    this.session = null;
    this.player = createInitialProgress(this.config.maxLives);
    this.persist();
    this.events.emit({ type: "progress.changed", player: this.getPlayer() });
  }

  private findQuestion(session: LessonSession, index: number): Question | null {
    const questionId = session.questionIds[index];
    if (questionId === undefined) return null;
    const node = this.getNode(session.courseId, session.nodeId);
    return node.lesson.questions.find((question) => question.id === questionId) ?? null;
  }

  private orderQuestionIds(questions: readonly Question[]): string[] {
    const ids = questions.map((question) => question.id);
    if (!this.config.shuffleQuestions) return ids;

    const shuffled = [...ids];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.min(index, Math.floor(this.random.next() * (index + 1)));
      const swap = shuffled[index];
      shuffled[index] = shuffled[target];
      shuffled[target] = swap;
    }
    return shuffled;
  }

  private requireSession(): LessonSession {
    if (!this.session) {
      throw new NoActiveSessionError();
    }
    return this.session;
  }

  private requireShopItem(itemId: string): ShopItem {
    const item = this.shopById.get(itemId);
    if (!item) {
      throw new ShopItemNotFoundError(itemId);
    }
    return item;
  }

  private finalizeLesson(status: Extract<SessionStatus, "completed" | "failed">): LessonOutcome {
    const session = this.requireSession();
    const node = this.getNode(session.courseId, session.nodeId);
    const total = session.questionIds.length;
    const ratio = total > 0 ? session.correctCount / total : 0;
    const requiredRatio =
      node.lesson.requiredCorrectRatio ?? this.config.defaultRequiredCorrectRatio;
    const passed = status === "completed" && ratio >= requiredRatio;
    const stars = passed
      ? Math.max(1, computeStars(ratio, this.config.starThresholds))
      : 0;

    const previous = this.player.completedNodes[node.id];
    const isFirstCompletion = previous === undefined;
    const multiplier = isFirstCompletion ? 1 : this.config.replayXpMultiplier;

    const xpEarned = passed
      ? Math.round((node.lesson.xpReward + session.earnedXp) * multiplier)
      : 0;
    const coinsEarned = passed
      ? Math.round(
          (node.lesson.coinReward + stars * this.config.coinsPerStar) * multiplier,
        )
      : 0;

    const now = this.clock.now();
    const itemId = passed && isFirstCompletion ? node.reward?.itemId : undefined;
    const itemLabel = passed && isFirstCompletion ? node.reward?.label : undefined;
    const levelBefore = computeLevel(this.player.xp, this.config.xpPerLevel);
    const previousStreak = this.player.streak;
    const streak = passed ? nextStreak(previousStreak, now) : previousStreak;
    const streakIncreased =
      streak.current > previousStreak.current ||
      streak.lastStudyDay !== previousStreak.lastStudyDay;

    let completedNodes = this.player.completedNodes;
    let inventory = this.player.inventory;
    if (passed) {
      completedNodes = {
        ...completedNodes,
        [node.id]: bestCompletion(previous, stars, ratio, now),
      };
      if (itemId) {
        inventory = { ...inventory, [itemId]: (inventory[itemId] ?? 0) + 1 };
      }
    }

    this.player = {
      ...this.player,
      xp: this.player.xp + xpEarned,
      coins: this.player.coins + coinsEarned,
      completedNodes,
      inventory,
      streak,
    };
    const levelAfter = computeLevel(this.player.xp, this.config.xpPerLevel);

    const outcome: LessonOutcome = {
      courseId: session.courseId,
      nodeId: node.id,
      nodeTitle: node.title,
      passed,
      stars,
      correctCount: session.correctCount,
      totalQuestions: total,
      xpEarned,
      coinsEarned,
      itemId,
      itemLabel,
      isFirstCompletion,
      unlockedNodeIds: this.getUnlockedNodeIds(session.courseId),
      levelBefore,
      levelAfter,
      leveledUp: levelAfter > levelBefore,
      streakCurrent: streak.current,
      streakBest: streak.best,
      streakIncreased,
    };

    this.session = { ...session, status, outcome };

    if (passed) {
      this.events.emit({
        type: "lesson.completed",
        courseId: session.courseId,
        nodeId: node.id,
        stars,
        xpEarned,
        coinsEarned,
        isFirstCompletion,
      });
      if (streakIncreased) {
        this.events.emit({
          type: "streak.changed",
          current: streak.current,
          best: streak.best,
        });
      }
    } else {
      this.events.emit({
        type: "session.failed",
        courseId: session.courseId,
        nodeId: node.id,
      });
    }

    this.persist();
    this.events.emit({ type: "progress.changed", player: this.getPlayer() });
    return outcome;
  }

  private persist(): void {
    void this.progressStore.save(this.getPlayer()).catch((error: unknown) => {
      this.events.emit({
        type: "persistence.error",
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }
}

function toFinite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSavedProgress(
  saved: PlayerProgress,
  maxLives: number,
  shopCatalog: readonly ShopItem[],
): PlayerProgress {
  const source = saved as Partial<PlayerProgress>;
  const completedNodes: Record<string, NodeCompletion> = {};
  for (const [id, entry] of Object.entries(source.completedNodes ?? {})) {
    if (!entry || typeof entry !== "object") continue;
    const completion = entry as Partial<NodeCompletion>;
    completedNodes[id] = {
      stars: clamp(toFinite(completion.stars, 0), 0, 3),
      bestRatio: clamp(toFinite(completion.bestRatio, 0), 0, 1),
      completedAt: toFinite(completion.completedAt, 0),
      lastPlayedAt: toFinite(completion.lastPlayedAt, 0),
    };
  }

  const inventory: Record<string, number> = {};
  for (const [id, amount] of Object.entries(source.inventory ?? {})) {
    inventory[id] = Math.max(0, Math.floor(toFinite(amount, 0)));
  }

  const shopById = new Map(shopCatalog.map((item) => [item.id, item]));
  const ownedSource = Array.isArray(source.ownedItemIds) ? source.ownedItemIds : [];
  const ownedItemIds = [
    ...new Set(
      ownedSource.filter(
        (id): id is string => typeof id === "string" && shopById.has(id),
      ),
    ),
  ];

  const equippedSource = Array.isArray(source.equippedItemIds)
    ? source.equippedItemIds
    : [];
  const equippedByCategory = new Map<ShopItemCategory, string>();
  for (const id of equippedSource) {
    if (typeof id !== "string") continue;
    const item = shopById.get(id);
    if (!item || !ownedItemIds.includes(id)) continue;
    equippedByCategory.set(item.category, id);
  }

  return {
    xp: Math.max(0, toFinite(source.xp, 0)),
    coins: Math.max(0, toFinite(source.coins, 0)),
    lives: clamp(toFinite(source.lives, maxLives), 0, maxLives),
    completedNodes,
    inventory,
    ownedItemIds,
    equippedItemIds: [...equippedByCategory.values()],
    streak: normalizeStreak(source.streak),
  };
}

function normalizeStreak(streak: Partial<PlayerStreak> | undefined): PlayerStreak {
  const current = Math.max(0, Math.floor(toFinite(streak?.current, 0)));
  const best = Math.max(current, Math.floor(toFinite(streak?.best, 0)));
  const lastStudyDay =
    typeof streak?.lastStudyDay === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(streak.lastStudyDay)
      ? streak.lastStudyDay
      : null;

  return {
    current,
    best,
    lastStudyDay,
  };
}

function normalizeShopCatalog(items: readonly ShopItem[]): readonly ShopItem[] {
  const normalized: ShopItem[] = [];
  const seen = new Set<string>();

  for (const raw of items) {
    const source = raw as Partial<ShopItem>;
    if (typeof source.id !== "string") continue;
    const id = source.id.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const category = isShopItemCategory(source.category) ? source.category : "hat";
    const name =
      typeof source.name === "string" && source.name.trim().length > 0
        ? source.name.trim()
        : `Item ${id}`;
    const description =
      typeof source.description === "string" ? source.description : undefined;
    const price = Math.max(0, Math.floor(toFinite(source.price, 0)));
    const spriteId =
      typeof source.spriteId === "string" && source.spriteId.trim().length > 0
        ? source.spriteId.trim()
        : category === "avatar"
          ? "avatar-hero"
          : "hat-wizard";

    normalized.push({ id, name, description, price, category, spriteId });
  }

  return normalized;
}
