import { useEffect, useState } from "react";
import type { AnswerFeedback, Question, UserAnswer } from "../../core/entities/index";
import { HeartRow } from "../pixel/HeartRow";
import { PixelButton } from "../pixel/PixelButton";
import { PixelPanel } from "../pixel/PixelPanel";
import { ProgressBar } from "../pixel/ProgressBar";
import { PedagogicalFeedbackModal } from "./PedagogicalFeedbackModal";

interface LessonScreenProps {
  readonly nodeTitle: string;
  readonly question: Question;
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly lives: number;
  readonly maxLives: number;
  readonly feedback: AnswerFeedback | null;
  readonly onAnswer: (answer: UserAnswer) => void;
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
  feedback,
  onAnswer,
  onNext,
  onExit,
  onRestartLesson,
}: LessonScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    setSelected([]);
    setText("");
  }, [question.id]);

  const locked = feedback !== null;
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

      <PixelPanel className="question-card">
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
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`choice-button${isSelected ? " choice-button--selected" : ""}`}
                  aria-pressed={isSelected}
                  disabled={locked}
                  onClick={() => toggleChoice(choice.id)}
                >
                  <span className="choice-button__marker" aria-hidden="true">
                    {isSelected ? "■" : "□"}
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
          <div className="feedback__head">
            <strong>Acertou!</strong>
            <span>+{feedback.earnedXp} XP</span>
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

      {feedback && !feedback.correct ? (
        <PedagogicalFeedbackModal
          feedback={feedback}
          onContinue={onNext}
          onRestart={onRestartLesson}
        />
      ) : null}
    </div>
  );
}
