import { GUIDE_NAME, GUIDE_RETRY_FALLBACK, GUIDE_RETRY_TITLE } from "../../content/guide";
import type { AnswerFeedback } from "../../core/entities/index";
import { Modal } from "../pixel/Modal";
import { PixelButton } from "../pixel/PixelButton";
import { TeacherAvatar } from "../pixel/TeacherAvatar";

interface PedagogicalFeedbackModalProps {
  readonly feedback: AnswerFeedback;
  readonly onContinue: () => void;
  readonly onRestart: () => void;
}

export function PedagogicalFeedbackModal({
  feedback,
  onContinue,
  onRestart,
}: PedagogicalFeedbackModalProps) {
  const failed = feedback.sessionStatus === "failed";

  return (
    <Modal labelledBy="pedagogical-title">
      <div className="pedagogical">
        <div className="pedagogical__guide">
          <div className="pedagogical__portrait">
            <TeacherAvatar size={64} title={GUIDE_NAME} />
          </div>
          <strong className="pedagogical__guide-name">{GUIDE_NAME}</strong>
        </div>
        <span className="eyebrow">Feedback de aprendizagem</span>
        <h2 id="pedagogical-title">{GUIDE_RETRY_TITLE}</h2>
        {feedback.expectedAnswers.length > 0 ? (
          <p className="pedagogical__answer">
            Resposta correta: <b>{feedback.expectedAnswers.join(" · ")}</b>
          </p>
        ) : null}
        <p className="pedagogical__explanation">
          {feedback.explanation ?? GUIDE_RETRY_FALLBACK}
        </p>
        <p className="pedagogical__lives">
          {failed
            ? "Oxente, as vidas acabaram nesta tentativa. Bora respirar e revisar?"
            : `Vidas restantes: ${feedback.livesLeft}`}
        </p>
        <div className="modal-actions">
          <PixelButton variant="ghost" onClick={onRestart}>
            Reavaliar lição
          </PixelButton>
          <PixelButton onClick={onContinue}>
            {failed ? "Ver resultado" : "Continuar"}
          </PixelButton>
        </div>
      </div>
    </Modal>
  );
}
