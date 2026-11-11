import type { ReactNode } from "react";

interface ModalProps {
  readonly children: ReactNode;
  readonly onClose?: () => void;
  readonly labelledBy?: string;
}

export function Modal({ children, onClose, labelledBy }: ModalProps) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="pixel-panel modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
