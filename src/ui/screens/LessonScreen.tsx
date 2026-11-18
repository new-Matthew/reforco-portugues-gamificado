import { useEffect, useState } from "react";
import {
  GUIDE_HINT_SIGNATURE,
  GUIDE_HINT_TITLE,
  GUIDE_NAME,
} from "../../content/guide";
import type { AnswerFeedback, Question, UserAnswer } from "../../core/entities/index";
import { prefersReducedMotion } from "../effects/confetti";
import { FloatingXp } from "../effects/FloatingXp";
import { choiceFeedbackState, xpGainLabel } from "../effects/quizFeedback";
import { useQuizFeedback } from "../effects/useQuizFeedback";
import { HeartRow } from "../pixel/HeartRow";
import { Modal } from "../pixel/Modal";
import { PixelButton } from "../pixel/PixelButton";
import { PixelPanel } from "../pixel/PixelPanel";
import { ProgressBar } from "../pixel/ProgressBar";
import { TeacherAvatar } from "../pixel/TeacherAvatar";
import { PedagogicalFeedbackModal } from "./PedagogicalFeedbackModal";

interface LessonScreenProps {
  readonly nodeTitle: string;
  readonly question: Question;
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly lives: number;
  readonly maxLives: number;
  readonly hintXpPenalty: number;
  readonly feedback: AnswerFeedback | null;
  readonly onAnswer: (answer: UserAnswer) => void;
  readonly onUseHint: () => void;
  readonly onNext: () => void;
  readonly onExit: () => void;
  readonly onRestartLesson: () => void;
}

export function LessonScreen({
  nodeTitle,
  question,
  questionNumber,
  totalQuestions,
  lives,
  maxLives,
  hintXpPenalty,
  feedback,
  onAnswer,
  onUseHint,
  onNext,
  onExit,
  onRestartLesson,
}: LessonScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [wrongFeedbackReady, setWrongFeedbackReady] = useState(false);

  useQuizFeedback(feedback);

  useEffect(() => {
    setSelected([]);
    setText("");
    setHintOpen(false);
  }, [question.id]);

  useEffect(() => {
    setWrongFeedbackReady(false);
    if (!feedback || feedback.correct) return;

    if (prefersReducedMotion()) {
      setWrongFeedbackReady(true);
      return;
    }

    const timer = window.setTimeout(() => setWrongFeedbackReady(true), 260);
    return () => window.clearTimeout(timer);
  }, [feedback?.questionId, feedback?.correct]);

  const locked = feedback !== null;
  const xpGain = xpGainLabel(feedback);
  const questionCardClass = [
    "question-card",
    feedback?.correct ? "question-card--correct" : "",
    feedback && !feedback.correct ? "question-card--wrong" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const canSubmit =
    !locked && (question.type === "text" ? text.trim().length > 0 : selected.length > 0);

  const toggleChoice = (choiceId: string): void => {
    if (locked) return;
    if (question.type === "single-choice") {
      setSelected([choiceId]);
      return;
    }
    setSelected((current) =>
      current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId],
    );
  };

  const handleSubmit = (): void => {
    if (!canSubmit) return;
    const answer: UserAnswer =
      question.type === "text" ? { text } : { choiceIds: selected };
    onAnswer(answer);
  };

  const handleHint = (): void => {
    if (!question.dicaCearense) return;
    onUseHint();
    setHintOpen(true);
  };

  return (
    <div className="screen lesson-screen">
      <header className="lesson-bar">
        <button type="button" className="link-button" onClick={onExit}>
          ← Sair
        </button>
        <div className="lesson-bar__title">{nodeTitle}</div>
        <HeartRow lives={lives} max={maxLives} />
      </header>

      <ProgressBar
        value={questionNumber}
        max={totalQuestions}
        tone="lesson"
        label={`Pergunta ${questionNumber} de ${totalQuestions}`}
      />

      {question.dicaCearense && !feedback ? (
        <div className="hint-bar">
          <PixelButton
            variant="secondary"
            className="hint-button"
            aria-label={`Pedir dica para ${GUIDE_NAME}`}
            onClick={handleHint}
          >
            <span>Pedir dica</span>
          </PixelButton>
        </div>
      ) : null}

      <PixelPanel className={questionCardClass}>
        <span className="eyebrow">
          {question.type === "multiple-choice"
            ? "Escolha uma ou mais respostas"
            : question.type === "text"
              ? "Resposta escrita"
              : "Escolha uma resposta"}
        </span>
        <h1>{question.prompt}</h1>

        {question.type === "text" ? (
          <input
            className="pixel-input"
            value={text}
            placeholder={question.placeholder ?? "Digite sua resposta"}
            disabled={locked}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSubmit();
            }}
          />
        ) : (
          <div className="choice-list">
            {question.choices.map((choice) => {
              const isSelected = selected.includes(choice.id);
              const state = choiceFeedbackState(
                question,
                choice.id,
                selected,
                feedback,
              );
              const marker =
                state === "correct"
                  ? "✓"
                  : state === "wrong"
                    ? "✕"
                    : isSelected
                      ? "■"
                      : "□";
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={[
                    "choice-button",
                    state === "selected" ? "choice-button--selected" : "",
                    state === "correct" ? "choice-button--correct" : "",
                    state === "wrong" ? "choice-button--wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={isSelected}
                  disabled={locked}
                  onClick={() => toggleChoice(choice.id)}
                >
                  <span className="choice-button__marker" aria-hidden="true">
                    {marker}
                  </span>
                  {choice.label}
                </button>
              );
            })}
          </div>
        )}
      </PixelPanel>

      {feedback?.correct ? (
        <PixelPanel className="feedback feedback--correct">
          <FloatingXp key={feedback.questionId} amount={feedback.earnedXp} />
          <div
            className="feedback__head"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>Acertou, visse!</strong>
            <span>{xpGain ?? `+${feedback.earnedXp} XP`}</span>
          </div>
          {feedback.explanation ? <p>{feedback.explanation}</p> : null}
          <PixelButton fullWidth onClick={onNext}>
            Continuar
          </PixelButton>
        </PixelPanel>
      ) : null}

      {!feedback ? (
        <PixelButton fullWidth disabled={!canSubmit} onClick={handleSubmit}>
          Responder
        </PixelButton>
      ) : null}

      {feedback && !feedback.correct && wrongFeedbackReady ? (
        <PedagogicalFeedbackModal
          feedback={feedback}
          onContinue={onNext}
          onRestart={onRestartLesson}
        />
      ) : null}

      {hintOpen && question.dicaCearense ? (
        <Modal labelledBy="hint-title" onClose={() => setHintOpen(false)}>
          <div className="hint-dialog">
            <div className="hint-dialog__portrait">
              <TeacherAvatar
                className="hint-dialog__guide"
                size={76}
                title={GUIDE_NAME}
              />
            </div>
            <div className="hint-dialog__bubble">
              <span className="eyebrow">{GUIDE_HINT_SIGNATURE}</span>
              <h2 id="hint-title">{GUIDE_HINT_TITLE}</h2>
              <p>{question.dicaCearense}</p>
              <p className="hint-dialog__penalty">
                Usar a dica reduz {hintXpPenalty} XP da recompensa final, uma vez
                por questão. Visse?
              </p>
              <PixelButton fullWidth onClick={() => setHintOpen(false)}>
                Visse? Bora tentar!
              </PixelButton>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
