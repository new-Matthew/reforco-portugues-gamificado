import type { Question, QuestionType, UserAnswer } from "../entities/content";
import { UnsupportedQuestionTypeError } from "../errors";

export interface EvaluationResult {
  readonly correct: boolean;
  readonly expectedAnswers: readonly string[];
}

export interface AnswerEvaluator {
  evaluate(question: Question, answer: UserAnswer): EvaluationResult;
}

export function normalizeFreeText(value: string): string {
  return value.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}

const singleChoiceEvaluator: AnswerEvaluator = {
  evaluate(question, answer) {
    if (question.type !== "single-choice") {
      throw new UnsupportedQuestionTypeError(question.type);
    }
    const picked = answer.choiceIds ?? [];
    const correct = picked.length === 1 && picked[0] === question.correctChoiceId;
    const expected = question.choices.find((choice) => choice.id === question.correctChoiceId);
    return { correct, expectedAnswers: expected ? [expected.label] : [] };
  },
};

const multipleChoiceEvaluator: AnswerEvaluator = {
  evaluate(question, answer) {
    if (question.type !== "multiple-choice") {
      throw new UnsupportedQuestionTypeError(question.type);
    }
    const picked = new Set(answer.choiceIds ?? []);
    const expected = new Set(question.correctChoiceIds);
    const correct =
      picked.size === expected.size && [...expected].every((id) => picked.has(id));
    const labels = question.choices
      .filter((choice) => expected.has(choice.id))
      .map((choice) => choice.label);
    return { correct, expectedAnswers: labels };
  },
};

const textEvaluator: AnswerEvaluator = {
  evaluate(question, answer) {
    if (question.type !== "text") {
      throw new UnsupportedQuestionTypeError(question.type);
    }
    const normalized = normalizeFreeText(answer.text ?? "");
    const correct =
      normalized.length > 0 &&
      question.acceptedAnswers.some((accepted) => normalizeFreeText(accepted) === normalized);
    return { correct, expectedAnswers: question.acceptedAnswers };
  },
};

export class AnswerEvaluatorRegistry {
  private readonly evaluators = new Map<QuestionType, AnswerEvaluator>();

  register(type: QuestionType, evaluator: AnswerEvaluator): this {
    this.evaluators.set(type, evaluator);
    return this;
  }

  evaluate(question: Question, answer: UserAnswer): EvaluationResult {
    const evaluator = this.evaluators.get(question.type);
    if (!evaluator) {
      throw new UnsupportedQuestionTypeError(question.type);
    }
    return evaluator.evaluate(question, answer);
  }
}

export function createDefaultEvaluatorRegistry(): AnswerEvaluatorRegistry {
  return new AnswerEvaluatorRegistry()
    .register("single-choice", singleChoiceEvaluator)
    .register("multiple-choice", multipleChoiceEvaluator)
    .register("text", textEvaluator);
}
