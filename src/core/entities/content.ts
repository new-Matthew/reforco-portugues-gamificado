export type QuestionType = "single-choice" | "multiple-choice" | "text";

export interface Choice {
  readonly id: string;
  readonly label: string;
}

interface QuestionBase {
  readonly id: string;
  readonly type: QuestionType;
  readonly prompt: string;
  readonly explanation?: string;
  readonly xp?: number;
}

export interface SingleChoiceQuestion extends QuestionBase {
  readonly type: "single-choice";
  readonly choices: readonly Choice[];
  readonly correctChoiceId: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  readonly type: "multiple-choice";
  readonly choices: readonly Choice[];
  readonly correctChoiceIds: readonly string[];
}

export interface TextQuestion extends QuestionBase {
  readonly type: "text";
  readonly acceptedAnswers: readonly string[];
  readonly placeholder?: string;
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | TextQuestion;

export interface UserAnswer {
  readonly choiceIds?: readonly string[];
  readonly text?: string;
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly intro?: string;
  readonly xpReward: number;
  readonly coinReward: number;
  readonly requiredCorrectRatio?: number;
  readonly questions: readonly Question[];
}

export interface UnlockRule {
  readonly requires?: readonly string[];
  readonly minXp?: number;
}

export interface NpcDialog {
  readonly speaker: string;
  readonly lines: readonly string[];
}

export interface NodeReward {
  readonly itemId?: string;
  readonly label?: string;
}

export interface MapNode {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly chapter?: string;
  readonly icon?: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly unlock: UnlockRule;
  readonly lesson: Lesson;
  readonly npc?: NpcDialog;
  readonly reward?: NodeReward;
}

export interface Course {
  readonly id: string;
  readonly subject: string;
  readonly title: string;
  readonly description?: string;
  readonly version: string;
  readonly locale?: string;
  readonly nodes: readonly MapNode[];
}

export interface ContentCatalog {
  readonly courses: readonly Course[];
}

export interface CourseSummary {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly description?: string;
  readonly nodeCount: number;
  readonly completedCount: number;
}
