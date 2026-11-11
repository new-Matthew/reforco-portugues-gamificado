interface ProgressBarProps {
  readonly value: number;
  readonly max: number;
  readonly label?: string;
  readonly tone?: "xp" | "lesson";
}

export function ProgressBar({ value, max, label, tone = "xp" }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <div className={`pixel-bar pixel-bar--${tone}`}>
      {label ? <span className="pixel-bar__label">{label}</span> : null}
      <div
        className="pixel-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div className="pixel-bar__fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
