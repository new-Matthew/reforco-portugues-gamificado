import type { Course, MapNode, SingleChoiceQuestion } from "../entities/index";

export interface AuthoringIssue {
  readonly field: string;
  readonly message: string;
}

export type AuthoringResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly AuthoringIssue[] };

export interface CourseDraft {
  readonly title: string;
  readonly description?: string;
}

export interface QuestionDraft {
  readonly prompt: string;
  readonly alternatives: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
}

export interface LessonDraft {
  readonly chapter: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly questions: readonly QuestionDraft[];
}

const COLUMN_PATTERN = [0, 2, 1] as const;
const CHOICE_IDS = ["a", "b", "c", "d"] as const;

export function validateQuestionDraft(
  draft: QuestionDraft,
  fieldPrefix = "question",
): AuthoringIssue[] {
  const issues: AuthoringIssue[] = [];

  if (!draft.prompt.trim()) {
    issues.push({
      field: `${fieldPrefix}.prompt`,
      message: "Escreva o enunciado da questão.",
    });
  }

  if (draft.alternatives.length !== 4) {
    issues.push({
      field: `${fieldPrefix}.alternatives`,
      message: "A questão precisa ter exatamente 4 alternativas.",
    });
  }

  draft.alternatives.forEach((alternative, index) => {
    if (!alternative.trim()) {
      issues.push({
        field: `${fieldPrefix}.alternatives.${index}`,
        message: `Preencha a alternativa ${CHOICE_IDS[index] ?? index + 1}.`,
      });
    }
  });

  if (
    !Number.isInteger(draft.correctIndex) ||
    draft.correctIndex < 0 ||
    draft.correctIndex >= draft.alternatives.length
  ) {
    issues.push({
      field: `${fieldPrefix}.correctIndex`,
      message: "Marque uma alternativa correta.",
    });
  }

  if (!draft.explanation.trim()) {
    issues.push({
      field: `${fieldPrefix}.explanation`,
      message: "Inclua uma explicação pedagógica para o aluno.",
    });
  }

  return issues;
}

export function validateLessonDraft(draft: LessonDraft): AuthoringIssue[] {
  const issues: AuthoringIssue[] = [];

  if (!draft.title.trim()) {
    issues.push({ field: "title", message: "Informe o título da lição." });
  }
  if (!draft.chapter.trim()) {
    issues.push({ field: "chapter", message: "Informe o módulo da lição." });
  }
  if (draft.questions.length === 0) {
    issues.push({
      field: "questions",
      message: "Adicione pelo menos uma questão antes de publicar.",
    });
  }

  draft.questions.forEach((question, index) => {
    issues.push(...validateQuestionDraft(question, `questions.${index}`));
  });

  return issues;
}

export function createCourseFromDraft(
  draft: CourseDraft,
  existingCourseIds: readonly string[],
): AuthoringResult<Course> {
  const issues: AuthoringIssue[] = [];

  if (draft.title.trim().length < 3) {
    issues.push({
      field: "title",
      message: "O título da trilha precisa ter ao menos 3 caracteres.",
    });
  }

  if (issues.length > 0) return { ok: false, issues };

  const title = draft.title.trim();
  const id = uniqueId(slugify(title), new Set(existingCourseIds));
  const description = optionalText(draft.description);

  return {
    ok: true,
    value: {
      id,
      subject: "portugues",
      title,
      description,
      version: "1.0.0",
      locale: "pt-BR",
      nodes: [],
    },
  };
}

export function createLessonNodeFromDraft(
  draft: LessonDraft,
  course: Course,
): AuthoringResult<MapNode> {
  const issues = validateLessonDraft(draft);
  if (issues.length > 0) return { ok: false, issues };

  const chapter = draft.chapter.trim();
  const title = draft.title.trim();
  const chapterNodes = course.nodes.filter((node) => node.chapter === chapter);
  const row =
    chapterNodes.length > 0
      ? Math.max(...chapterNodes.map((node) => node.position.y)) + 1
      : 0;
  const column = COLUMN_PATTERN[row % COLUMN_PATTERN.length] ?? 0;

  const nodeId = uniqueId(
    `${course.id}-${slugify(title)}`,
    new Set(course.nodes.map((node) => node.id)),
  );
  const lastNode = course.nodes[course.nodes.length - 1];

  const questions: SingleChoiceQuestion[] = draft.questions.map(
    (question, index) => ({
      id: `${nodeId}-q${index + 1}`,
      type: "single-choice",
      prompt: question.prompt.trim(),
      choices: question.alternatives.map((label, choiceIndex) => ({
        id: CHOICE_IDS[choiceIndex] ?? String(choiceIndex),
        label: label.trim(),
      })),
      correctChoiceId: CHOICE_IDS[question.correctIndex] ?? "a",
      explanation: question.explanation.trim(),
      xp: 10,
    }),
  );

  const node: MapNode = {
    id: nodeId,
    title,
    subtitle:
      optionalText(draft.description) ??
      `${questions.length} ${questions.length === 1 ? "questão" : "questões"}`,
    chapter,
    icon: draft.icon.trim() || "star",
    position: { x: column, y: row },
    unlock: { requires: lastNode ? [lastNode.id] : [] },
    lesson: {
      id: `lesson-${nodeId}`,
      title,
      intro: optionalText(draft.description),
      xpReward: 20 + questions.length * 10,
      coinReward: 5 + questions.length * 2,
      requiredCorrectRatio: 0.75,
      questions,
    },
    reward: {
      itemId: `selo-${nodeId}`,
      label: `Selo: ${title}`,
    },
  };

  return { ok: true, value: node };
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "trilha"
  );
}

function uniqueId(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}
