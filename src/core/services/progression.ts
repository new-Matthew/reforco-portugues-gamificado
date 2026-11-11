import type { MapNode, NodeCompletion, PlayerProgress, PlayerStreak } from "../entities/index";
import type { StarThresholds } from "../config";

export function computeLevel(xp: number, xpPerLevel: number): number {
  if (xpPerLevel <= 0) return 1;
  return Math.floor(Math.max(0, xp) / xpPerLevel) + 1;
}

export function computeStars(ratio: number, thresholds: StarThresholds): number {
  if (ratio >= thresholds.three) return 3;
  if (ratio >= thresholds.two) return 2;
  if (ratio >= thresholds.one) return 1;
  return 0;
}

export function isNodeCompleted(
  node: MapNode,
  completedNodes: PlayerProgress["completedNodes"],
): boolean {
  return completedNodes[node.id] !== undefined;
}

export function meetsUnlockRequirements(
  node: MapNode,
  completedNodes: PlayerProgress["completedNodes"],
  xp: number,
): boolean {
  const requires = node.unlock.requires ?? [];
  const hasRequiredNodes = requires.every((requiredId) => completedNodes[requiredId] !== undefined);
  return hasRequiredNodes && xp >= (node.unlock.minXp ?? 0);
}

export function isNodeUnlocked(
  node: MapNode,
  completedNodes: PlayerProgress["completedNodes"],
  xp: number,
): boolean {
  return isNodeCompleted(node, completedNodes) || meetsUnlockRequirements(node, completedNodes, xp);
}

export function getUnlockedNodeIds(
  nodes: readonly MapNode[],
  completedNodes: PlayerProgress["completedNodes"],
  xp: number,
): string[] {
  return nodes
    .filter((node) => isNodeUnlocked(node, completedNodes, xp))
    .map((node) => node.id);
}

export function bestCompletion(
  previous: NodeCompletion | undefined,
  stars: number,
  ratio: number,
  now: number,
): NodeCompletion {
  return {
    stars: Math.max(previous?.stars ?? 0, stars),
    bestRatio: Math.max(previous?.bestRatio ?? 0, ratio),
    completedAt: previous?.completedAt ?? now,
    lastPlayedAt: now,
  };
}

export function studyDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previousStudyDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 1);
  return studyDayKey(date.getTime());
}

export function nextStreak(streak: PlayerStreak, timestamp: number): PlayerStreak {
  const today = studyDayKey(timestamp);
  if (!today || streak.lastStudyDay === today) return streak;

  const current =
    streak.lastStudyDay === previousStudyDayKey(timestamp)
      ? streak.current + 1
      : 1;

  return {
    current,
    best: Math.max(streak.best, current),
    lastStudyDay: today,
  };
}
