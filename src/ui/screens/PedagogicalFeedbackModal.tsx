import type { AnswerFeedback } from "../../core/entities/index";
import { Modal } from "../pixel/Modal";
import { PixelButton } from "../pixel/PixelButton";
import { PixelSprite } from "../pixel/PixelSprite";
import { npcSprite } from "../pixel/sprites";

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
        <div className="pedagogical__portrait">
          <PixelSprite sprite={npcSprite} size={64} title="Mestre Verbo" />
        </div>
        <span className="eyebrow">Feedback de aprendizagem</span>
        <h2 id="pedagogical-title">Quase lá! Vamos revisar.</h2>
        {feedback.expectedAnswers.length > 0 ? (
          <p className="pedagogical__answer">
            Resposta correta: <b>{feedback.expectedAnswers.join(" · ")}</b>
          </p>
        ) : null}
        <p className="pedagogical__explanation">
          {feedback.explanation ??
            "Releia a lição com calma e tente novamente para fixar o conteúdo."}
        </p>
        <p className="pedagogical__lives">
          {failed
            ? "Suas vidas acabaram nesta tentativa."
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
