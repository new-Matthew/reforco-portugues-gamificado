import type { PlayerProgress } from "./entities/player";
import type { ShopItemCategory } from "./entities/shop";

export type GameEvent =
  | { readonly type: "session.started"; readonly courseId: string; readonly nodeId: string }
  | { readonly type: "answer.evaluated"; readonly questionId: string; readonly correct: boolean }
  | { readonly type: "session.failed"; readonly courseId: string; readonly nodeId: string }
  | {
      readonly type: "lesson.completed";
      readonly courseId: string;
      readonly nodeId: string;
      readonly stars: number;
      readonly xpEarned: number;
      readonly coinsEarned: number;
      readonly isFirstCompletion: boolean;
    }
  | { readonly type: "progress.changed"; readonly player: PlayerProgress }
  | {
      readonly type: "shop.purchased";
      readonly itemId: string;
      readonly price: number;
    }
  | {
      readonly type: "shop.equipped";
      readonly itemId: string | null;
      readonly category: ShopItemCategory;
    }
  | {
      readonly type: "streak.changed";
      readonly current: number;
      readonly best: number;
    }
  | { readonly type: "content.changed"; readonly courseId: string }
  | { readonly type: "persistence.error"; readonly message: string };

export type GameEventListener = (event: GameEvent) => void;

export class GameEventEmitter {
  private readonly listeners = new Set<GameEventListener>();

  on(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: GameEvent): void {
    for (const listener of [...this.listeners]) {
      listener(event);
    }
  }
}
