import { useEffect, useState } from "react";
import type { LessonOutcome } from "../../core/entities/index";
import { Modal } from "../pixel/Modal";
import { PixelButton } from "../pixel/PixelButton";
import { PixelSprite } from "../pixel/PixelSprite";
import { chestOpenSprite, chestSprite, npcSprite } from "../pixel/sprites";

interface ResultModalProps {
  readonly outcome: LessonOutcome;
  readonly nextPhaseTitle: string | null;
  readonly onNextPhase: () => void;
  readonly onBackToMap: () => void;
  readonly onRetry: () => void;
}

export function ResultModal({
  outcome,
  nextPhaseTitle,
  onNextPhase,
  onBackToMap,
  onRetry,
}: ResultModalProps) {
  const [chestOpened, setChestOpened] = useState(false);
  const stars = `${"★".repeat(outcome.stars)}${"☆".repeat(Math.max(0, 3 - outcome.stars))}`;
  const accuracy =
    outcome.totalQuestions > 0
      ? Math.round((outcome.correctCount / outcome.totalQuestions) * 100)
      : 0;
  const leveledUp = outcome.leveledUp ?? false;
  const streakCurrent = outcome.streakCurrent ?? 0;
  const hasNextPhase = outcome.passed && nextPhaseTitle !== null;

  useEffect(() => {
    if (!outcome.passed) return;
    const timer = window.setTimeout(() => setChestOpened(true), 420);
    return () => window.clearTimeout(timer);
  }, [outcome.passed]);

  return (
    <Modal labelledBy="result-title">
      <div className="result">
        <div
          className={`result__sprite${outcome.passed ? " result__sprite--chest" : ""}`}
        >
          <PixelSprite
            sprite={
              outcome.passed
                ? chestOpened
                  ? chestOpenSprite
                  : chestSprite
                : npcSprite
            }
            size={80}
            title={outcome.passed ? "Baú de recompensa" : "Mestre Verbo"}
          />
          {outcome.passed ? (
            <span className="result__sparkles" aria-hidden="true">
              ✦ ✧ ✦
            </span>
          ) : null}
        </div>
        <h2 id="result-title">
          {outcome.passed
            ? leveledUp
              ? "Subiu de nível!"
              : "Lição concluída!"
            : "Tente novamente"}
        </h2>
        <p className="result__subtitle">{outcome.nodeTitle}</p>
        <div className="result__stars" aria-label={`${outcome.stars} de 3 estrelas`}>
          {stars}
        </div>
        {leveledUp ? (
          <p className="result__level">
            Nível {outcome.levelBefore ?? 1} → {outcome.levelAfter ?? 1}
          </p>
        ) : null}
        <ul className="result__stats">
          <li>
            {outcome.correctCount}/{outcome.totalQuestions} corretas
          </li>
          <li>{accuracy}% de precisão</li>
          <li>+{outcome.xpEarned} XP</li>
          <li>+{outcome.coinsEarned} moedas</li>
        </ul>
        {outcome.hintsUsed > 0 ? (
          <p className="result__note">
            {outcome.hintsUsed} {outcome.hintsUsed === 1 ? "dica usada" : "dicas usadas"}
            {outcome.hintPenaltyXp > 0 ? ` · -${outcome.hintPenaltyXp} XP` : ""}
          </p>
        ) : null}
        {streakCurrent > 0 ? (
          <p className="result__streak">
            🔥 Ofensiva: {streakCurrent} {streakCurrent === 1 ? "dia" : "dias"}
            {outcome.streakIncreased ? " · ofensiva atualizada!" : ""}
          </p>
        ) : null}
        {outcome.itemLabel ? (
          <p className="result__item">Item conquistado: {outcome.itemLabel}</p>
        ) : null}
        {outcome.passed && !outcome.isFirstCompletion ? (
          <p className="result__note">Revisão concluída: recompensas reduzidas.</p>
        ) : null}
        {hasNextPhase ? (
          <p className="result__note">A seguir: {nextPhaseTitle}</p>
        ) : null}
        <div className="modal-actions">
          <PixelButton
            variant={outcome.passed && !hasNextPhase ? "primary" : "ghost"}
            onClick={onBackToMap}
          >
            Voltar ao mapa
          </PixelButton>
          {outcome.passed ? (
            hasNextPhase ? (
              <PixelButton onClick={onNextPhase}>Próxima fase</PixelButton>
            ) : null
          ) : (
            <PixelButton onClick={onRetry}>Tentar de novo</PixelButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
