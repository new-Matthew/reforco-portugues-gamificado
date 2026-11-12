import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TUTORIAL_STEPS } from "../src/content/tutorialSteps";
import { LocalStorageTutorialStore } from "../src/infrastructure/persistence/LocalStorageTutorialStore";
import {
  advanceTutorial,
  completeTutorial,
  createInitialTutorialState,
  normalizeTutorialState,
  reopenTutorial,
} from "../src/core/entities/tutorial";
import type { TutorialStore } from "../src/core/ports/TutorialStore";
import { TutorialSession } from "../src/core/services/TutorialSession";

class InMemoryTutorialStore implements TutorialStore {
  completed: boolean | null = null;
  readonly saves: boolean[] = [];

  async loadCompleted(): Promise<boolean | null> {
    return this.completed;
  }

  async saveCompleted(completed: boolean): Promise<void> {
    this.completed = completed;
    this.saves.push(completed);
  }
}

describe("Estado do tutorial", () => {
  it("começa fechado, não concluído e no primeiro passo", () => {
    expect(createInitialTutorialState()).toEqual({
      hasCompletedTutorial: false,
      isTutorialOpen: false,
      currentStepIndex: 0,
    });
  });

  it("avança para o próximo passo mantendo o tutorial aberto", () => {
    const state = advanceTutorial(
      { hasCompletedTutorial: false, isTutorialOpen: true, currentStepIndex: 0 },
      4,
    );

    expect(state).toEqual({
      hasCompletedTutorial: false,
      isTutorialOpen: true,
      currentStepIndex: 1,
    });
  });

  it("conclui e fecha ao avançar a partir do último passo", () => {
    const state = advanceTutorial(
      { hasCompletedTutorial: false, isTutorialOpen: true, currentStepIndex: 3 },
      4,
    );

    expect(state).toEqual({
      hasCompletedTutorial: true,
      isTutorialOpen: false,
      currentStepIndex: 3,
    });
  });

  it("conclui e fecha o tutorial", () => {
    const state = completeTutorial({
      hasCompletedTutorial: false,
      isTutorialOpen: true,
      currentStepIndex: 2,
    });

    expect(state.hasCompletedTutorial).toBe(true);
    expect(state.isTutorialOpen).toBe(false);
  });

  it("reabre no primeiro passo preservando a conclusão", () => {
    const state = reopenTutorial({
      hasCompletedTutorial: true,
      isTutorialOpen: false,
      currentStepIndex: 3,
    });

    expect(state).toEqual({
      hasCompletedTutorial: true,
      isTutorialOpen: true,
      currentStepIndex: 0,
    });
  });

  it("normaliza estados inválidos para o inicial", () => {
    expect(normalizeTutorialState(null)).toEqual(createInitialTutorialState());
    expect(normalizeTutorialState("tutorial")).toEqual(createInitialTutorialState());
    expect(
      normalizeTutorialState({ currentStepIndex: -2, isTutorialOpen: "sim" }),
    ).toEqual(createInitialTutorialState());
  });
});

describe("TutorialSession", () => {
  it("abre automaticamente quando ainda não foi concluído", async () => {
    const session = new TutorialSession(new InMemoryTutorialStore(), 4);
    const state = await session.init();

    expect(state).toEqual({
      hasCompletedTutorial: false,
      isTutorialOpen: true,
      currentStepIndex: 0,
    });
  });

  it("permanece fechado quando a conclusão está persistida", async () => {
    const store = new InMemoryTutorialStore();
    store.completed = true;
    const session = new TutorialSession(store, 4);

    const state = await session.init();

    expect(state).toEqual({
      hasCompletedTutorial: true,
      isTutorialOpen: false,
      currentStepIndex: 0,
    });
  });

  it("persiste a conclusão ao avançar até o fim", async () => {
    const store = new InMemoryTutorialStore();
    const session = new TutorialSession(store, 2);
    await session.init();

    session.advance();
    expect(session.getState().currentStepIndex).toBe(1);
    expect(store.saves).toEqual([]);

    session.advance();
    expect(session.getState().hasCompletedTutorial).toBe(true);
    expect(session.getState().isTutorialOpen).toBe(false);
    expect(store.saves).toEqual([true]);
  });

  it("persiste a conclusão ao pular", async () => {
    const store = new InMemoryTutorialStore();
    const session = new TutorialSession(store, 4);
    await session.init();

    const state = session.skip();

    expect(state.hasCompletedTutorial).toBe(true);
    expect(state.isTutorialOpen).toBe(false);
    expect(store.completed).toBe(true);
  });

  it("permite reabrir após concluir", async () => {
    const store = new InMemoryTutorialStore();
    store.completed = true;
    const session = new TutorialSession(store, 4);
    await session.init();

    const state = session.reopen();

    expect(state).toEqual({
      hasCompletedTutorial: true,
      isTutorialOpen: true,
      currentStepIndex: 0,
    });
  });
});

class MemoryStorage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

describe("LocalStorageTutorialStore", () => {
  const globals = globalThis as unknown as { localStorage?: Storage };
  let previous: Storage | undefined;

  beforeEach(() => {
    previous = globals.localStorage;
    globals.localStorage = new MemoryStorage() as unknown as Storage;
  });

  afterEach(() => {
    globals.localStorage = previous;
  });

  it("retorna null quando nada foi salvo", async () => {
    const store = new LocalStorageTutorialStore();

    await expect(store.loadCompleted()).resolves.toBeNull();
  });

  it("persiste e recupera a conclusão", async () => {
    const store = new LocalStorageTutorialStore();

    await store.saveCompleted(true);

    await expect(store.loadCompleted()).resolves.toBe(true);
  });

  it("ignora conteúdo inválido", async () => {
    globalThis.localStorage.setItem("portugues-apps:tutorial:v1", "{invalido");
    const store = new LocalStorageTutorialStore();

    await expect(store.loadCompleted()).resolves.toBeNull();
  });
});

describe("Conteúdo do tutorial", () => {
  it("define passos com identificadores únicos e textos", () => {
    const ids = TUTORIAL_STEPS.map((step) => step.id);

    expect(TUTORIAL_STEPS.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const step of TUTORIAL_STEPS) {
      expect(step.message.trim().length).toBeGreaterThan(0);
      expect(step.buttonLabel.trim().length).toBeGreaterThan(0);
    }
  });

  it("aponta os passos de destaque para alvos válidos", () => {
    const targeted = TUTORIAL_STEPS.filter((step) => step.targetId !== undefined);

    expect(targeted.length).toBeGreaterThan(0);
    for (const step of targeted) {
      expect(step.targetId).toMatch(/^tutorial-target-/);
    }
  });
});
