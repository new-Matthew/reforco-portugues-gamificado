export interface TutorialState {
  readonly hasCompletedTutorial: boolean;
  readonly isTutorialOpen: boolean;
  readonly currentStepIndex: number;
}

export function createInitialTutorialState(): TutorialState {
  return {
    hasCompletedTutorial: false,
    isTutorialOpen: false,
    currentStepIndex: 0,
  };
}

export function advanceTutorial(state: TutorialState, totalSteps: number): TutorialState {
  const safeTotal = Math.max(1, Math.floor(totalSteps));
  const nextIndex = state.currentStepIndex + 1;
  if (nextIndex >= safeTotal) {
    return completeTutorial(state);
  }

  return {
    ...state,
    isTutorialOpen: true,
    currentStepIndex: nextIndex,
  };
}

export function completeTutorial(state: TutorialState): TutorialState {
  return {
    hasCompletedTutorial: true,
    isTutorialOpen: false,
    currentStepIndex: state.currentStepIndex,
  };
}

export function reopenTutorial(state: TutorialState): TutorialState {
  return {
    hasCompletedTutorial: state.hasCompletedTutorial,
    isTutorialOpen: true,
    currentStepIndex: 0,
  };
}

export function normalizeTutorialState(value: unknown): TutorialState {
  if (typeof value !== "object" || value === null) {
    return createInitialTutorialState();
  }

  const source = value as Partial<TutorialState>;
  const hasCompletedTutorial = source.hasCompletedTutorial === true;
  const isTutorialOpen = source.isTutorialOpen === true;
  const currentStepIndex =
    typeof source.currentStepIndex === "number" &&
    Number.isInteger(source.currentStepIndex) &&
    source.currentStepIndex >= 0
      ? source.currentStepIndex
      : 0;

  return { hasCompletedTutorial, isTutorialOpen, currentStepIndex };
}
