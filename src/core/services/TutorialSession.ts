import {
  advanceTutorial,
  completeTutorial,
  createInitialTutorialState,
  normalizeTutorialState,
  reopenTutorial,
  type TutorialState,
} from "../entities/tutorial";
import type { TutorialStore } from "../ports/TutorialStore";

export class TutorialSession {
  private readonly store: TutorialStore;
  private readonly totalSteps: number;
  private state: TutorialState = createInitialTutorialState();

  constructor(store: TutorialStore, totalSteps: number) {
    this.store = store;
    this.totalSteps = Math.max(1, Math.floor(totalSteps));
  }

  async init(): Promise<TutorialState> {
    const completed = await this.store.loadCompleted();
    this.state = normalizeTutorialState({
      hasCompletedTutorial: completed === true,
      isTutorialOpen: completed !== true,
      currentStepIndex: 0,
    });
    return this.getState();
  }

  getState(): TutorialState {
    return this.state;
  }

  advance(): TutorialState {
    this.state = advanceTutorial(this.state, this.totalSteps);
    if (this.state.hasCompletedTutorial) {
      this.persistCompleted();
    }
    return this.getState();
  }

  skip(): TutorialState {
    this.state = completeTutorial(this.state);
    this.persistCompleted();
    return this.getState();
  }

  reopen(): TutorialState {
    this.state = reopenTutorial(this.state);
    return this.getState();
  }

  private persistCompleted(): void {
    void this.store.saveCompleted(true).catch(() => {
      // Persistência indisponível: o tutorial continua concluído em memória.
    });
  }
}
