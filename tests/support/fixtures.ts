import type {
  ContentCatalog,
  Course,
  Lesson,
  MapNode,
  Question,
} from "../../src/core/entities/content";
import type { PlayerProgress } from "../../src/core/entities/player";
import type { ContentRepository } from "../../src/core/ports/ContentRepository";
import type { ProgressStore } from "../../src/core/ports/ProgressStore";
import type { Clock, RandomProvider } from "../../src/core/ports/system";

export class InMemoryProgressStore implements ProgressStore {
  saved: PlayerProgress | null = null;

  async load(): Promise<PlayerProgress | null> {
    return this.saved;
  }

  async save(progress: PlayerProgress): Promise<void> {
    this.saved = progress;
  }

  async clear(): Promise<void> {
    this.saved = null;
  }
}

export class StaticRepository implements ContentRepository {
  constructor(private readonly catalog: ContentCatalog) {}

  async load(): Promise<ContentCatalog> {
    return this.catalog;
  }
}

export class FixedClock implements Clock {
  constructor(private current = 1_000) {}

  now(): number {
    return this.current;
  }

  set(value: number): void {
    this.current = value;
  }
}

export class SequenceRandom implements RandomProvider {
  private readonly values: number[];

  constructor(values: readonly number[] = []) {
    this.values = [...values];
  }

  next(): number {
    return this.values.shift() ?? 0;
  }
}

const singleQuestion: Question = {
  id: "q1",
  type: "single-choice",
  prompt: "Qual verbo pertence à 1ª conjugação?",
  choices: [
    { id: "a", label: "amar" },
    { id: "b", label: "vender" },
  ],
  correctChoiceId: "a",
  explanation: "Amar termina em -AR.",
};

const textQuestion: Question = {
  id: "q2",
  type: "text",
  prompt: "Escreva um verbo terminado em -AR.",
  acceptedAnswers: ["Amar"],
};

const firstLesson: Lesson = {
  id: "lesson-1",
  title: "Lição de teste",
  xpReward: 20,
  coinReward: 5,
  requiredCorrectRatio: 1,
  questions: [singleQuestion, textQuestion],
};

const secondLesson: Lesson = {
  id: "lesson-2",
  title: "Lição de teste 2",
  xpReward: 10,
  coinReward: 3,
  requiredCorrectRatio: 1,
  questions: [
    {
      id: "q3",
      type: "single-choice",
      prompt: "Qual verbo termina em -IR?",
      choices: [
        { id: "a", label: "partir" },
        { id: "b", label: "falar" },
      ],
      correctChoiceId: "a",
    },
  ],
};

const firstNode: MapNode = {
  id: "n1",
  title: "Nó inicial",
  position: { x: 0, y: 0 },
  unlock: {},
  lesson: firstLesson,
};

const secondNode: MapNode = {
  id: "n2",
  title: "Nó seguinte",
  position: { x: 1, y: 1 },
  unlock: { requires: ["n1"] },
  lesson: secondLesson,
};

export function buildCatalog(): ContentCatalog {
  const course: Course = {
    id: "curso-teste",
    subject: "portugues",
    title: "Curso de teste",
    version: "1.0.0",
    nodes: [firstNode, secondNode],
  };
  return { courses: [course] };
}
