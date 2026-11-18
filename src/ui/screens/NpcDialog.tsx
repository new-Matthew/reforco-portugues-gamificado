import { GUIDE_LESSON_INTRO, GUIDE_NAME, GUIDE_ROLE } from "../../content/guide";
import { Modal } from "../pixel/Modal";
import { PixelButton } from "../pixel/PixelButton";
import { TeacherAvatar } from "../pixel/TeacherAvatar";

interface NpcDialogProps {
  readonly speaker: string;
  readonly lines: readonly string[];
  readonly onStart: () => void;
  readonly onClose: () => void;
}

export function NpcDialog({ lines, onStart, onClose }: NpcDialogProps) {
  return (
    <Modal onClose={onClose} labelledBy="npc-dialog-title">
      <div className="npc-dialog">
        <div className="npc-dialog__portrait">
          <TeacherAvatar size={72} title={GUIDE_NAME} />
        </div>
        <div className="npc-dialog__bubble">
          <span className="eyebrow npc-dialog__role">{GUIDE_ROLE}</span>
          <h2 id="npc-dialog-title" className="npc-dialog__name">
            {GUIDE_NAME}
          </h2>
          <p className="npc-dialog__greeting">{GUIDE_LESSON_INTRO}</p>
          {lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <PixelButton variant="ghost" onClick={onClose}>
          Agora não
        </PixelButton>
        <PixelButton onClick={onStart}>Bora começar!</PixelButton>
      </div>
    </Modal>
  );
}
