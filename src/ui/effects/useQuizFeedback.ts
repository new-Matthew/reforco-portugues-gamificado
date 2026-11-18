import { useEffect } from "react";
import type { AnswerFeedback } from "../../core/entities/index";
import { fireCorrectConfetti, preloadConfetti } from "./confetti";

export function useQuizFeedback(feedback: AnswerFeedback | null): void {
  useEffect(() => {
    preloadConfetti();
  }, []);

  useEffect(() => {
    if (!feedback?.correct) return;
    void fireCorrectConfetti();
  }, [feedback?.questionId, feedback?.correct]);
}
