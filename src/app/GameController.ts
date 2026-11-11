import type {
  AnswerFeedback,
  Course,
  CourseSummary,
  LessonOutcome,
  LessonSession,
  MapNode,
  PlayerProgress,
  Question,
  ShopItem,
  ShopItemCategory,
  UserAnswer,
} from "../core/entities/index";
import type { LevelInfo } from "../core/services/GameEngine";
import { GameEngine } from "../core/services/GameEngine";
import {
  createCourseFromDraft,
  createLessonNodeFromDraft,
  type AuthoringResult,
  type CourseDraft,
  type LessonDraft,
} from "../core/services/authoring";

export type Screen = "map" | "lesson";
export type ControllerStatus = "loading" | "ready" | "error";

export interface ControllerSnapshot {
  readonly status: ControllerStatus;
  readonly error: string | null;
  readonly screen: Screen;
  readonly courses: readonly CourseSummary[];
  readonly activeCourseId: string | null;
  readonly nodes: readonly MapNode[];
  readonly player: PlayerProgress;
  readonly levelInfo: LevelInfo;
  readonly maxLives: number;
  readonly shopItems: readonly ShopItem[];
  readonly equippedAvatar: ShopItem | null;
  readonly equippedHat: ShopItem | null;
  readonly unlockedNodeIds: readonly string[];
  readonly session: LessonSession | null;
  readonly currentQuestion: Question | null;
  readonly feedback: AnswerFeedback | null;
  readonly outcome: LessonOutcome | null;
}

export class GameController {
  private readonly listeners = new Set<() => void>();
  private readonly engine: GameEngine;
  private snapshot: ControllerSnapshot;
  private status: ControllerStatus = "loading";
  private error: string | null = null;
  private screen: Screen = "map";
  private activeCourseId: string | null = null;
  private feedback: AnswerFeedback | null = null;
  private outcome: LessonOutcome | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.snapshot = this.build();
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): ControllerSnapshot => this.snapshot;

  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          await this.engine.init();
          const courses = this.engine.listCourses();
          this.activeCourseId = courses[0]?.id ?? null;
          this.status = "ready";
        } catch (error: unknown) {
          this.status = "error";
          this.error = toMessage(error);
        }
        this.emit();
      })();
    }
    return this.initPromise;
  }

  selectCourse(courseId: string): void {
    if (this.engine.getSession()?.status === "active") {
      this.engine.abandonLesson();
    }
    this.activeCourseId = courseId;
    this.screen = "map";
    this.feedback = null;
    this.outcome = null;
    this.emit();
  }

  createCourse(draft: CourseDraft): AuthoringResult<Course> {
    const result = createCourseFromDraft(
      draft,
      this.engine.listCourses().map((course) => course.id),
    );
    if (!result.ok) return result;

    try {
      if (this.engine.getSession()?.status === "active") {
        this.engine.abandonLesson();
      }
      this.engine.upsertCourse(result.value);
      this.activeCourseId = result.value.id;
      this.screen = "map";
      this.feedback = null;
      this.outcome = null;
      this.error = null;
    } catch (error: unknown) {
      const message = toMessage(error);
      this.error = message;
      this.emit();
      return { ok: false, issues: [{ field: "course", message }] };
    }
    this.emit();
    return result;
  }

  publishLesson(draft: LessonDraft): AuthoringResult<MapNode> {
    if (!this.activeCourseId) {
      return {
        ok: false,
        issues: [
          {
            field: "course",
            message: "Selecione ou crie uma trilha antes de publicar.",
          },
        ],
      };
    }

    try {
      const course = this.engine.getCourse(this.activeCourseId);
      const result = createLessonNodeFromDraft(draft, course);
      if (!result.ok) return result;

      this.engine.upsertCourse({
        ...course,
        nodes: [...course.nodes, result.value],
      });
      this.error = null;
      this.emit();
      return result;
    } catch (error: unknown) {
      const message = toMessage(error);
      this.error = message;
      this.emit();
      return { ok: false, issues: [{ field: "publish", message }] };
    }
  }

  startNode(nodeId: string): void {
    if (!this.activeCourseId) return;
    try {
      this.engine.startLesson(this.activeCourseId, nodeId);
      this.screen = "lesson";
      this.feedback = null;
      this.outcome = null;
      this.error = null;
    } catch (error: unknown) {
      this.error = toMessage(error);
    }
    this.emit();
  }

  answer(answer: UserAnswer): void {
    try {
      const feedback = this.engine.answerCurrentQuestion(answer);
      this.feedback = feedback;
      this.error = null;
    } catch (error: unknown) {
      this.error = toMessage(error);
    }
    this.emit();
  }

  advance(): void {
    try {
      const outcome = this.engine.advance();
      this.feedback = null;
      if (outcome) this.outcome = outcome;
      this.error = null;
    } catch (error: unknown) {
      this.error = toMessage(error);
    }
    this.emit();
  }

  retry(): void {
    const session = this.engine.getSession();
    if (!session) return;
    this.activeCourseId = session.courseId;
    this.outcome = null;
    this.feedback = null;
    this.startNode(session.nodeId);
  }

  restartLesson(): void {
    const session = this.engine.getSession();
    if (!session) return;
    if (session.status === "active") {
      this.engine.abandonLesson();
    }
    this.activeCourseId = session.courseId;
    this.outcome = null;
    this.feedback = null;
    this.startNode(session.nodeId);
  }

  purchaseItem(itemId: string): void {
    try {
      this.engine.purchaseItem(itemId);
      this.error = null;
    } catch (error: unknown) {
      this.error = toMessage(error);
    }
    this.emit();
  }

  equipItem(itemId: string): void {
    try {
      this.engine.equipItem(itemId);
      this.error = null;
    } catch (error: unknown) {
      this.error = toMessage(error);
    }
    this.emit();
  }

  unequipItem(category: ShopItemCategory): void {
    try {
      this.engine.unequipItem(category);
      this.error = null;
    } catch (error: unknown) {
      this.error = toMessage(error);
    }
    this.emit();
  }

  backToMap(): void {
    const session = this.engine.getSession();
    if (session?.status === "active") {
      this.engine.abandonLesson();
    }
    this.screen = "map";
    this.feedback = null;
    this.outcome = null;
    this.emit();
  }

  resetProgress(): void {
    this.engine.resetProgress();
    this.screen = "map";
    this.feedback = null;
    this.outcome = null;
    this.emit();
  }

  dismissError(): void {
    this.error = null;
    this.emit();
  }

  private build(): ControllerSnapshot {
    const courses = this.status === "loading" ? [] : this.engine.listCourses();
    let nodes: readonly MapNode[] = [];
    if (this.activeCourseId) {
      try {
        nodes = this.engine.getCourse(this.activeCourseId).nodes;
      } catch {
        nodes = [];
      }
    }

    return {
      status: this.status,
      error: this.error,
      screen: this.screen,
      courses,
      activeCourseId: this.activeCourseId,
      nodes,
      player: this.engine.getPlayer(),
      levelInfo: this.engine.getLevelInfo(),
      maxLives: this.engine.getConfig().maxLives,
      shopItems: this.engine.getShopCatalog(),
      equippedAvatar: this.engine.getEquippedItem("avatar"),
      equippedHat: this.engine.getEquippedItem("hat"),
      unlockedNodeIds: this.activeCourseId
        ? this.engine.getUnlockedNodeIds(this.activeCourseId)
        : [],
      session: this.engine.getSession(),
      currentQuestion: this.engine.getCurrentQuestion(),
      feedback: this.feedback,
      outcome: this.outcome,
    };
  }

  private emit(): void {
    this.snapshot = this.build();
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
