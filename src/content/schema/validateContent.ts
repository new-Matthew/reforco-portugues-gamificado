import type {
  Choice,
  ContentCatalog,
  Course,
  Lesson,
  MapNode,
  MultipleChoiceQuestion,
  NpcDialog,
  NodeReward,
  Question,
  QuestionType,
  SingleChoiceQuestion,
  TextQuestion,
  UnlockRule,
} from "../../core/entities/content";

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type ValidationResult =
  | { readonly ok: true; readonly catalog: ContentCatalog }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

type Dict = Record<string, unknown>;

const QUESTION_TYPES: readonly QuestionType[] = [
  "single-choice",
  "multiple-choice",
  "text",
];

export function validateContentPacks(packs: readonly unknown[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(packs) || packs.length === 0) {
    return {
      ok: false,
      issues: [{ path: "$", message: "é necessário ao menos um pacote de conteúdo" }],
    };
  }

  const courses: Course[] = [];
  const courseIds = new Set<string>();

  packs.forEach((raw, index) => {
    const path = `$[${index}]`;
    if (!isRecord(raw)) {
      issues.push({ path, message: "deve ser um objeto" });
      return;
    }

    const course = parseCourse(raw, path, issues);
    if (!course) return;

    if (courseIds.has(course.id)) {
      issues.push({ path: `${path}.id`, message: `curso duplicado "${course.id}"` });
      return;
    }
    courseIds.add(course.id);
    courses.push(course);
  });

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, catalog: { courses } };
}

function parseCourse(
  raw: Dict,
  path: string,
  issues: ValidationIssue[],
): Course | null {
  const id = readString(raw, "id", path, issues);
  const subject = readString(raw, "subject", path, issues);
  const title = readString(raw, "title", path, issues);
  const version = readString(raw, "version", path, issues);
  const description = readOptionalString(raw, "description", path, issues);
  const locale = readOptionalString(raw, "locale", path, issues);

  const nodesRaw = raw.nodes;
  if (!Array.isArray(nodesRaw) || nodesRaw.length === 0) {
    issues.push({ path: `${path}.nodes`, message: "deve ser uma lista não vazia de nós" });
    return null;
  }

  const nodes: MapNode[] = [];
  const nodeIds = new Set<string>();
  const lessonIds = new Set<string>();

  nodesRaw.forEach((nodeRaw, index) => {
    const nodePath = `${path}.nodes[${index}]`;
    if (!isRecord(nodeRaw)) {
      issues.push({ path: nodePath, message: "deve ser um objeto" });
      return;
    }
    const node = parseNode(nodeRaw, nodePath, issues);
    if (!node) return;

    if (nodeIds.has(node.id)) {
      issues.push({ path: `${nodePath}.id`, message: `nó duplicado "${node.id}"` });
      return;
    }
    if (lessonIds.has(node.lesson.id)) {
      issues.push({
        path: `${nodePath}.lesson.id`,
        message: `lição duplicada "${node.lesson.id}" no curso`,
      });
      return;
    }
    nodeIds.add(node.id);
    lessonIds.add(node.lesson.id);
    nodes.push(node);
  });

  if (!id || !subject || !title || !version) return null;
  if (nodes.length !== nodesRaw.length) return null;

  validateUnlockGraph(nodes, path, issues);
  if (issues.length > 0) return null;

  return { id, subject, title, version, description, locale, nodes };
}

function parseNode(raw: Dict, path: string, issues: ValidationIssue[]): MapNode | null {
  const id = readString(raw, "id", path, issues);
  const title = readString(raw, "title", path, issues);
  const subtitle = readOptionalString(raw, "subtitle", path, issues);
  const chapter = readOptionalString(raw, "chapter", path, issues);
  const icon = readOptionalString(raw, "icon", path, issues);

  const positionRaw = raw.position;
  let position: { x: number; y: number } | null = null;
  if (!isRecord(positionRaw)) {
    issues.push({ path: `${path}.position`, message: "deve ser um objeto { x, y }" });
  } else {
    const x = readNumber(positionRaw, "x", `${path}.position`, issues, { required: true });
    const y = readNumber(positionRaw, "y", `${path}.position`, issues, { required: true });
    if (x !== undefined && y !== undefined) {
      position = { x, y };
    }
  }

  const unlock = parseUnlock(raw.unlock, `${path}.unlock`, issues);

  let lesson: Lesson | null = null;
  if (!isRecord(raw.lesson)) {
    issues.push({ path: `${path}.lesson`, message: "deve ser um objeto de lição" });
  } else {
    lesson = parseLesson(raw.lesson, `${path}.lesson`, issues);
  }

  const npc = raw.npc === undefined ? undefined : parseNpc(raw.npc, `${path}.npc`, issues);
  const reward =
    raw.reward === undefined ? undefined : parseReward(raw.reward, `${path}.reward`, issues);

  if (!id || !title || !position || !lesson) return null;
  return { id, title, subtitle, chapter, icon, position, unlock, lesson, npc, reward };
}

function parseUnlock(raw: unknown, path: string, issues: ValidationIssue[]): UnlockRule {
  if (raw === undefined) return {};
  if (!isRecord(raw)) {
    issues.push({ path, message: "deve ser um objeto" });
    return {};
  }

  let requires: string[] | undefined;
  if (raw.requires !== undefined) {
    requires = readStringArray(raw, "requires", path, issues, {
      required: true,
      minLength: 0,
    });
  }

  let minXp: number | undefined;
  if (raw.minXp !== undefined) {
    minXp = readNumber(raw, "minXp", path, issues, { required: true, min: 0 });
  }

  return { requires, minXp };
}

function parseLesson(raw: Dict, path: string, issues: ValidationIssue[]): Lesson | null {
  const id = readString(raw, "id", path, issues);
  const title = readString(raw, "title", path, issues);
  const intro = readOptionalString(raw, "intro", path, issues);
  const xpReward = readNumber(raw, "xpReward", path, issues, { required: true, min: 0 });
  const coinReward = readNumber(raw, "coinReward", path, issues, { required: true, min: 0 });

  let requiredCorrectRatio: number | undefined;
  if (raw.requiredCorrectRatio !== undefined) {
    requiredCorrectRatio = readNumber(raw, "requiredCorrectRatio", path, issues, {
      required: true,
      min: 0.0001,
      max: 1,
    });
  }

  const questionsRaw = raw.questions;
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    issues.push({ path: `${path}.questions`, message: "deve ter ao menos uma pergunta" });
    return null;
  }

  const questions: Question[] = [];
  const questionIds = new Set<string>();
  questionsRaw.forEach((questionRaw, index) => {
    const questionPath = `${path}.questions[${index}]`;
    if (!isRecord(questionRaw)) {
      issues.push({ path: questionPath, message: "deve ser um objeto" });
      return;
    }
    const question = parseQuestion(questionRaw, questionPath, issues);
    if (!question) return;
    if (questionIds.has(question.id)) {
      issues.push({ path: `${questionPath}.id`, message: `pergunta duplicada "${question.id}"` });
      return;
    }
    questionIds.add(question.id);
    questions.push(question);
  });

  if (!id || !title || xpReward === undefined || coinReward === undefined) return null;
  if (questions.length !== questionsRaw.length) return null;

  return { id, title, intro, xpReward, coinReward, requiredCorrectRatio, questions };
}

function parseQuestion(
  raw: Dict,
  path: string,
  issues: ValidationIssue[],
): Question | null {
  const id = readString(raw, "id", path, issues);
  const prompt = readString(raw, "prompt", path, issues);
  const explanation = readOptionalString(raw, "explanation", path, issues);
  const xp =
    raw.xp === undefined
      ? undefined
      : readNumber(raw, "xp", path, issues, { required: true, min: 0 });

  const type = raw.type;
  if (typeof type !== "string" || !QUESTION_TYPES.includes(type as QuestionType)) {
    issues.push({
      path: `${path}.type`,
      message: `deve ser um de: ${QUESTION_TYPES.join(", ")}`,
    });
    return null;
  }

  if (!id || !prompt) return null;

  if (type === "single-choice") {
    const choices = parseChoices(raw.choices, `${path}.choices`, issues);
    const correctChoiceId = readString(raw, "correctChoiceId", path, issues);
    if (!choices || !correctChoiceId) return null;
    if (!choices.some((choice) => choice.id === correctChoiceId)) {
      issues.push({
        path: `${path}.correctChoiceId`,
        message: `não existe entre as alternativas`,
      });
      return null;
    }
    const question: SingleChoiceQuestion = {
      id,
      type,
      prompt,
      explanation,
      xp,
      choices,
      correctChoiceId,
    };
    return question;
  }

  if (type === "multiple-choice") {
    const choices = parseChoices(raw.choices, `${path}.choices`, issues);
    const correctChoiceIds = readStringArray(raw, "correctChoiceIds", path, issues, {
      required: true,
      minLength: 1,
    });
    if (!choices || !correctChoiceIds) return null;
    const unique = new Set(correctChoiceIds);
    if (unique.size !== correctChoiceIds.length) {
      issues.push({
        path: `${path}.correctChoiceIds`,
        message: "não deve conter ids repetidos",
      });
      return null;
    }
    const missing = correctChoiceIds.filter(
      (choiceId) => !choices.some((choice) => choice.id === choiceId),
    );
    if (missing.length > 0) {
      issues.push({
        path: `${path}.correctChoiceIds`,
        message: `referencia alternativas inexistentes: ${missing.join(", ")}`,
      });
      return null;
    }
    const question: MultipleChoiceQuestion = {
      id,
      type,
      prompt,
      explanation,
      xp,
      choices,
      correctChoiceIds,
    };
    return question;
  }

  const acceptedAnswers = readStringArray(raw, "acceptedAnswers", path, issues, {
    required: true,
    minLength: 1,
  });
  const placeholder = readOptionalString(raw, "placeholder", path, issues);
  if (!acceptedAnswers) return null;

  const question: TextQuestion = {
    id,
    type: "text",
    prompt,
    explanation,
    xp,
    acceptedAnswers,
    placeholder,
  };
  return question;
}

function parseChoices(
  raw: unknown,
  path: string,
  issues: ValidationIssue[],
): Choice[] | null {
  if (!Array.isArray(raw) || raw.length < 2) {
    issues.push({ path, message: "deve ser uma lista com ao menos 2 alternativas" });
    return null;
  }

  const choices: Choice[] = [];
  const ids = new Set<string>();
  raw.forEach((choiceRaw, index) => {
    const choicePath = `${path}[${index}]`;
    if (!isRecord(choiceRaw)) {
      issues.push({ path: choicePath, message: "deve ser um objeto" });
      return;
    }
    const id = readString(choiceRaw, "id", choicePath, issues);
    const label = readString(choiceRaw, "label", choicePath, issues);
    if (!id || !label) return;
    if (ids.has(id)) {
      issues.push({ path: `${choicePath}.id`, message: `alternativa duplicada "${id}"` });
      return;
    }
    ids.add(id);
    choices.push({ id, label });
  });

  if (choices.length !== raw.length) return null;
  return choices;
}

function parseNpc(raw: unknown, path: string, issues: ValidationIssue[]): NpcDialog | undefined {
  if (!isRecord(raw)) {
    issues.push({ path, message: "deve ser um objeto" });
    return undefined;
  }
  const speaker = readString(raw, "speaker", path, issues);
  const lines = readStringArray(raw, "lines", path, issues, { required: true, minLength: 1 });
  if (!speaker || !lines) return undefined;
  return { speaker, lines };
}

function parseReward(raw: unknown, path: string, issues: ValidationIssue[]): NodeReward | undefined {
  if (!isRecord(raw)) {
    issues.push({ path, message: "deve ser um objeto" });
    return undefined;
  }
  const itemId = readOptionalString(raw, "itemId", path, issues);
  const label = readOptionalString(raw, "label", path, issues);
  if (!itemId && !label) {
    issues.push({ path, message: "deve informar itemId e/ou label" });
    return undefined;
  }
  return { itemId, label };
}

function validateUnlockGraph(
  nodes: readonly MapNode[],
  path: string,
  issues: ValidationIssue[],
): void {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
    for (const requiredId of node.unlock.requires ?? []) {
      if (requiredId === node.id) {
        issues.push({
          path: `${path}.nodes`,
          message: `o nó "${node.id}" não pode depender de si mesmo`,
        });
        continue;
      }
      if (!byId.has(requiredId)) {
        issues.push({
          path: `${path}.nodes`,
          message: `o nó "${node.id}" depende de "${requiredId}", que não existe`,
        });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string): void => {
    if (visiting.has(nodeId)) {
      issues.push({
        path: `${path}.nodes`,
        message: `ciclo de desbloqueio detectado envolvendo "${nodeId}"`,
      });
      return;
    }
    if (visited.has(nodeId)) return;

    visiting.add(nodeId);
    const node = byId.get(nodeId);
    for (const requiredId of node?.unlock.requires ?? []) {
      if (byId.has(requiredId)) {
        visit(requiredId);
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  for (const node of nodes) {
    visit(node.id);
  }
}

function isRecord(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Dict,
  key: string,
  path: string,
  issues: ValidationIssue[],
): string | undefined {
  const value = record[key];
  if (value === undefined) {
    issues.push({ path: `${path}.${key}`, message: "campo obrigatório ausente" });
    return undefined;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: `${path}.${key}`, message: "deve ser um texto não vazio" });
    return undefined;
  }
  return value;
}

function readOptionalString(
  record: Dict,
  key: string,
  path: string,
  issues: ValidationIssue[],
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: `${path}.${key}`, message: "deve ser um texto não vazio" });
    return undefined;
  }
  return value;
}

function readNumber(
  record: Dict,
  key: string,
  path: string,
  issues: ValidationIssue[],
  options: { required?: boolean; min?: number; max?: number } = {},
): number | undefined {
  const value = record[key];
  if (value === undefined) {
    if (options.required) {
      issues.push({ path: `${path}.${key}`, message: "campo obrigatório ausente" });
    }
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push({ path: `${path}.${key}`, message: "deve ser um número finito" });
    return undefined;
  }
  if (options.min !== undefined && value < options.min) {
    issues.push({ path: `${path}.${key}`, message: `deve ser >= ${options.min}` });
    return undefined;
  }
  if (options.max !== undefined && value > options.max) {
    issues.push({ path: `${path}.${key}`, message: `deve ser <= ${options.max}` });
    return undefined;
  }
  return value;
}

function readStringArray(
  record: Dict,
  key: string,
  path: string,
  issues: ValidationIssue[],
  options: { required?: boolean; minLength?: number } = {},
): string[] | undefined {
  const value = record[key];
  if (value === undefined) {
    if (options.required) {
      issues.push({ path: `${path}.${key}`, message: "campo obrigatório ausente" });
    }
    return undefined;
  }
  if (!Array.isArray(value)) {
    issues.push({ path: `${path}.${key}`, message: "deve ser uma lista de textos" });
    return undefined;
  }
  const minLength = options.minLength ?? 1;
  if (value.length < minLength) {
    issues.push({
      path: `${path}.${key}`,
      message: `deve ter ao menos ${minLength} item(ns)`,
    });
    return undefined;
  }
  const invalidIndex = value.findIndex(
    (item) => typeof item !== "string" || item.trim().length === 0,
  );
  if (invalidIndex >= 0) {
    issues.push({
      path: `${path}.${key}[${invalidIndex}]`,
      message: "deve ser um texto não vazio",
    });
    return undefined;
  }
  return value as string[];
}
