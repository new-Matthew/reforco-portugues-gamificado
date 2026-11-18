import type { AnswerFeedback, Question } from "../../core/entities/index";

export type ChoiceFeedbackState = "correct" | "wrong" | "selected" | null;

export function correctChoiceIds(question: Question): ReadonlySet<string> {
  switch (question.type) {
    case "single-choice":
      return new Set([question.correctChoiceId]);
    case "multiple-choice":
      return new Set(question.correctChoiceIds);
    default:
      return new Set();
  }
}

export function choiceFeedbackState(
  question: Question,
  choiceId: string,
  selectedChoiceIds: readonly string[],
  feedback: AnswerFeedback | null,
): ChoiceFeedbackState {
  const selected = selectedChoiceIds.includes(choiceId);
  if (!feedback) return selected ? "selected" : null;

  const correct = correctChoiceIds(question).has(choiceId);
  if (feedback.correct) return correct ? "correct" : null;
  if (selected && !correct) return "wrong";
  return correct ? "correct" : null;
}

export function xpGainLabel(feedback: AnswerFeedback | null): string | null {
  if (!feedback?.correct || feedback.earnedXp <= 0) return null;
  return `+${feedback.earnedXp} XP`;
}
