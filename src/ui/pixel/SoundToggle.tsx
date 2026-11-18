import {
  playSoundEffect,
  setSoundMuted,
  useSoundMuted,
} from "../sound/soundManager";

interface SoundToggleProps {
  readonly compact?: boolean;
  readonly className?: string;
}

function SpeakerIcon({ muted }: { readonly muted: boolean }) {
  return (
    <svg
      className="sound-toggle__icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
      {muted ? (
        <path
          d="M11 5l4 6M15 5l-4 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ) : (
        <>
          <path
            d="M11 5c1 1 1 5 0 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M13 3c2 2 2 8 0 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </>
      )}
    </svg>
  );
}

export function SoundToggle({
  compact = false,
  className,
}: SoundToggleProps) {
  const muted = useSoundMuted();
  const label = muted ? "Ativar som" : "Desativar som";

  const handleToggle = (): void => {
    if (muted) {
      setSoundMuted(false);
      playSoundEffect("click");
      return;
    }

    playSoundEffect("click");
    setSoundMuted(true);
  };

  return (
    <button
      type="button"
      className={[
        "sound-toggle",
        compact ? "sound-toggle--compact" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={!muted}
      aria-label={label}
      title={label}
      onClick={handleToggle}
    >
      <SpeakerIcon muted={muted} />
      {compact ? null : <span className="sound-toggle__label">Som</span>}
    </button>
  );
}
