import type { ReactNode } from "react";

interface PixelPanelProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function PixelPanel({ children, className }: PixelPanelProps) {
  return (
    <section className={["pixel-panel", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}
