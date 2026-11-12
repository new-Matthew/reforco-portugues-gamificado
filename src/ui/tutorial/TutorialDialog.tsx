import { useEffect, useState } from "react";
import guideImage from "../../assets/personagem-tutorial.jpeg";
import type { TutorialStep } from "../../content/tutorialSteps";
import { PixelButton } from "../pixel/PixelButton";

const TYPE_INTERVAL_MS = 18;

interface TutorialDialogProps {
  readonly step: TutorialStep;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly onAdvance: () => void;
  readonly onSkip: () => void;
}

export function TutorialDialog({
  step,
  stepIndex,
  totalSteps,
  onAdvance,
  onSkip,
}: TutorialDialogProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const message = step.message;
  const isTyping = visibleChars < message.length;

  useEffect(() => {
    setVisibleChars(0);
  }, [message]);

  useEffect(() => {
    if (!message) return;
    const timer = setInterval(() => {
      setVisibleChars((current) => {
        if (current >= message.length) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, TYPE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [message]);

  useEffect(() => {
    const targetId = step.targetId;
    if (!targetId) return;
    const element = document.getElementById(targetId);
    if (!element) return;

    element.classList.add("tutorial-spotlight");
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    return () => {
      element.classList.remove("tutorial-spotlight");
    };
  }, [step.targetId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  const revealAll = (): void => {
    setVisibleChars(message.length);
  };

  return (
    <div className="tutorial-overlay" role="presentation">
      <div className="tutorial-backdrop" aria-hidden="true" />
      <div
        className="tutorial-dialog"
        role="dialog"
        aria-labelledby="tutorial-dialog-title"
        aria-describedby="tutorial-dialog-text"
      >
        <div className="tutorial-dialog__guide-frame" aria-hidden="true">
          <img
            className="tutorial-dialog__guide"
            src={guideImage}
            alt=""
            draggable={false}
          />
        </div>

        <div className="tutorial-dialog__body">
          <div className="tutorial-dialog__meta">
            <span className="eyebrow" id="tutorial-dialog-title">
              Mestre da Trilha · {stepIndex + 1}/{totalSteps}
            </span>
            <button
              type="button"
              className="tutorial-dialog__skip"
              onClick={onSkip}
            >
              Pular
            </button>
          </div>

          <button
            type="button"
            className="tutorial-dialog__text"
            id="tutorial-dialog-text"
            onClick={revealAll}
            title={isTyping ? "Clique para completar o texto" : undefined}
            tabIndex={isTyping ? 0 : -1}
          >
            {message.slice(0, visibleChars)}
            <span
              className={isTyping ? "tutorial-dialog__caret" : "tutorial-dialog__caret tutorial-dialog__caret--hidden"}
              aria-hidden="true"
            >
              ▍
            </span>
          </button>

          <div className="tutorial-dialog__footer">
            <div className="tutorial-dialog__dots" aria-hidden="true">
              {Array.from({ length: totalSteps }, (_, index) => (
                <span
                  key={index}
                  className={
                    index === stepIndex
                      ? "tutorial-dialog__dot tutorial-dialog__dot--active"
                      : "tutorial-dialog__dot"
                  }
                />
              ))}
            </div>
            <PixelButton onClick={onAdvance}>{step.buttonLabel}</PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
