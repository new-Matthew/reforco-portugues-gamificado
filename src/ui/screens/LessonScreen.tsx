import { useEffect, useState } from "react";
import guideImage from "../../assets/personagem-tutorial.jpeg";
import type { AnswerFeedback, Question, UserAnswer } from "../../core/entities/index";
import { HeartRow } from "../pixel/HeartRow";
import { Modal } from "../pixel/Modal";
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

  useEffect(() => {
    setSelected([]);
    setText("");
    setHintOpen(false);
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
            aria-label="Pedir dica para Tia Thaís"
            onClick={handleHint}
          >
            <img
              className="hint-button__guide"
              src={guideImage}
              alt=""
              draggable={false}
            />
            <span>Pedir dica</span>
          </PixelButton>
        </div>
      ) : null}

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

      {hintOpen && question.dicaCearense ? (
        <Modal labelledBy="hint-title" onClose={() => setHintOpen(false)}>
          <div className="hint-dialog">
            <div className="hint-dialog__portrait">
              <img
                className="hint-dialog__guide"
                src={guideImage}
                alt="Tia Thaís"
                draggable={false}
              />
            </div>
            <div className="hint-dialog__bubble">
              <span className="eyebrow">Dica da Tia Thaís</span>
              <h2 id="hint-title">Bora desenrolar isso!</h2>
              <p>{question.dicaCearense}</p>
              <p className="hint-dialog__penalty">
                Usar a dica reduz {hintXpPenalty} XP da recompensa final, uma vez
                por questão.
              </p>
              <PixelButton fullWidth onClick={() => setHintOpen(false)}>
                Entendi, bora tentar!
              </PixelButton>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
