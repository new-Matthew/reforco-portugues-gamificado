import { useEffect } from "react";
import type { AnswerFeedback } from "../../core/entities/index";
import { playSoundEffect } from "../sound/soundManager";
import { fireCorrectConfetti, preloadConfetti } from "./confetti";

export function useQuizFeedback(feedback: AnswerFeedback | null): void {
  useEffect(() => {
    preloadConfetti();
  }, []);

  useEffect(() => {
    if (!feedback) return;

    playSoundEffect(feedback.correct ? "correct" : "wrong");
    if (feedback.correct) void fireCorrectConfetti();
  }, [feedback?.questionId, feedback?.correct]);
}
