interface FloatingXpProps {
  readonly amount: number;
}

export function FloatingXp({ amount }: FloatingXpProps) {
  if (amount <= 0) return null;

  return (
    <span className="quiz-xp-pop" aria-hidden="true">
      +{amount} XP
    </span>
  );
}
