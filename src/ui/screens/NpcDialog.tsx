import { Modal } from "../pixel/Modal";
import { PixelButton } from "../pixel/PixelButton";
import { PixelSprite } from "../pixel/PixelSprite";
import { npcSprite } from "../pixel/sprites";

interface NpcDialogProps {
  readonly speaker: string;
  readonly lines: readonly string[];
  readonly onStart: () => void;
  readonly onClose: () => void;
}

export function NpcDialog({ speaker, lines, onStart, onClose }: NpcDialogProps) {
  return (
    <Modal onClose={onClose} labelledBy="npc-dialog-title">
      <div className="npc-dialog">
        <div className="npc-dialog__portrait">
          <PixelSprite sprite={npcSprite} size={72} title={speaker} />
        </div>
        <div className="npc-dialog__bubble">
          <h2 id="npc-dialog-title">{speaker}</h2>
          {lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <PixelButton variant="ghost" onClick={onClose}>
          Agora não
        </PixelButton>
        <PixelButton onClick={onStart}>Começar lição</PixelButton>
      </div>
    </Modal>
  );
}
