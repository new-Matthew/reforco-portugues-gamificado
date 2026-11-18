import { describe, expect, it } from "vitest";
import type {
  AnswerFeedback,
  MultipleChoiceQuestion,
  SingleChoiceQuestion,
  TextQuestion,
} from "../src/core/entities/index";
import {
  choiceFeedbackState,
  correctChoiceIds,
  xpGainLabel,
} from "../src/ui/effects/quizFeedback";

const single: SingleChoiceQuestion = {
  id: "q1",
  type: "single-choice",
  prompt: "Qual é o sujeito?",
  choices: [
    { id: "a", label: "A menina" },
    { id: "b", label: "correu" },
  ],
  correctChoiceId: "a",
};

const multiple: MultipleChoiceQuestion = {
  id: "q2",
  type: "multiple-choice",
  prompt: "Quais são verbos?",
  choices: [
    { id: "a", label: "correr" },
    { id: "b", label: "bonito" },
    { id: "c", label: "pular" },
  ],
  correctChoiceIds: ["a", "c"],
};

const text: TextQuestion = {
  id: "q3",
  type: "text",
  prompt: "Escreva um verbo",
  acceptedAnswers: ["amar"],
};

function feedback(overrides: Partial<AnswerFeedback> = {}): AnswerFeedback {
  return {
    questionId: "q1",
    correct: true,
    expectedAnswers: ["A menina"],
    earnedXp: 15,
    livesLeft: 3,
    sessionStatus: "active",
    ...overrides,
  };
}

describe("quizFeedback", () => {
  it("extrai os IDs corretos de cada tipo de questão", () => {
    expect([...correctChoiceIds(single)]).toEqual(["a"]);
    expect([...correctChoiceIds(multiple)]).toEqual(["a", "c"]);
    expect([...correctChoiceIds(text)]).toEqual([]);
  });

  it("marca a seleção antes do feedback", () => {
    expect(choiceFeedbackState(single, "a", ["a"], null)).toBe("selected");
    expect(choiceFeedbackState(single, "b", ["a"], null)).toBeNull();
  });

  it("revela o acerto e preserva a alternativa correta não selecionada", () => {
    expect(choiceFeedbackState(single, "a", ["a"], feedback())).toBe("correct");
    expect(choiceFeedbackState(single, "b", ["b"], feedback())).toBeNull();
  });

  it("marca erro na escolha errada e acerto na correta", () => {
    const wrong = feedback({ correct: false, earnedXp: 0, expectedAnswers: ["A menina"] });
    expect(choiceFeedbackState(single, "b", ["b"], wrong)).toBe("wrong");
    expect(choiceFeedbackState(single, "a", ["b"], wrong)).toBe("correct");
  });

  it("lida com múltiplas respostas corretas", () => {
    const wrong = feedback({ questionId: "q2", correct: false, earnedXp: 0 });
    expect(choiceFeedbackState(multiple, "a", ["a", "b"], wrong)).toBe("correct");
    expect(choiceFeedbackState(multiple, "b", ["a", "b"], wrong)).toBe("wrong");
    expect(choiceFeedbackState(multiple, "c", ["a", "b"], wrong)).toBe("correct");
  });

  it("gera rótulo de XP apenas em acertos com ganho", () => {
    expect(xpGainLabel(feedback())).toBe("+15 XP");
    expect(xpGainLabel(feedback({ earnedXp: 0 }))).toBeNull();
    expect(xpGainLabel(feedback({ correct: false }))).toBeNull();
    expect(xpGainLabel(null)).toBeNull();
  });
});
