import { useMemo, useState } from "react";
import type {
  CourseSummary,
  MapNode,
  PlayerProgress,
  ShopItem,
  ShopItemCategory,
} from "../../core/entities/index";
import type { LevelInfo } from "../../core/services/GameEngine";
import { HeartRow } from "../pixel/HeartRow";
import { PixelButton } from "../pixel/PixelButton";
import { PixelSprite } from "../pixel/PixelSprite";
import { PlayerAvatar } from "../pixel/PlayerAvatar";
import { ProgressBar } from "../pixel/ProgressBar";
import { TrailPath } from "../pixel/TrailPath";
import {
  chestSprite,
  coinSprite,
  flameSprite,
  heartSprite,
  lockSprite,
  spriteForIcon,
} from "../pixel/sprites";
import { useElementWidth } from "../pixel/useElementWidth";
import { seedForGroup } from "../map/decorations";
import { ForestBackdrop } from "../map/ForestBackdrop";
import { NpcDialog } from "./NpcDialog";
import { ShopModal } from "./ShopModal";

const ROW_HEIGHT = 152;
const NODE_CENTER_Y = 41;
const TOP_PAD = 48;
const BOTTOM_PAD = 40;

interface MapScreenProps {
  readonly courses: readonly CourseSummary[];
  readonly activeCourseId: string | null;
  readonly nodes: readonly MapNode[];
  readonly player: PlayerProgress;
  readonly levelInfo: LevelInfo;
  readonly maxLives: number;
  readonly shopItems: readonly ShopItem[];
  readonly equippedAvatarSpriteId?: string | null;
  readonly equippedHatSpriteId?: string | null;
  readonly unlockedNodeIds: readonly string[];
  readonly onSelectCourse: (courseId: string) => void;
  readonly onOpenNode: (nodeId: string) => void;
  readonly onPurchaseItem: (itemId: string) => void;
  readonly onEquipItem: (itemId: string) => void;
  readonly onUnequipItem: (category: ShopItemCategory) => void;
  readonly onHelp: () => void;
  readonly onReset: () => void;
}

interface ChapterGroup {
  readonly chapter: string | null;
  readonly nodes: MapNode[];
}

function groupByChapter(nodes: readonly MapNode[]): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  for (const node of nodes) {
    const chapter = node.chapter ?? null;
    const last = groups[groups.length - 1];
    if (last && last.chapter === chapter) {
      last.nodes.push(node);
    } else {
      groups.push({ chapter, nodes: [node] });
    }
  }
  return groups;
}

function starsLabel(stars: number): string {
  return `${"★".repeat(stars)}${"☆".repeat(Math.max(0, 3 - stars))}`;
}

function edgeClass(x: number): "left" | "center" | "right" {
  if (x <= 0) return "left";
  if (x >= 2) return "right";
  return "center";
}

function unlockHint(
  node: MapNode,
  nodesById: ReadonlyMap<string, MapNode>,
  xp: number,
): string {
  const parts: string[] = [];
  const requires = node.unlock.requires ?? [];

  if (requires.length > 0) {
    const titles = requires.map((id) => nodesById.get(id)?.title ?? id);
    parts.push(`Conclui: ${titles.join(" + ")}`);
  }

  const minXp = node.unlock.minXp ?? 0;
  if (xp < minXp) {
    parts.push(`Alcança ${minXp} XP`);
  }

  return parts.join(" · ") || "Conclui a lição anterior para desbloquear.";
}

function compactUnlockHint(
  node: MapNode,
  nodesById: ReadonlyMap<string, MapNode>,
): string {
  const requires = node.unlock.requires ?? [];
  const lastRequired = requires[requires.length - 1];
  if (lastRequired) {
    return `Conclui: ${nodesById.get(lastRequired)?.title ?? "lição anterior"}`;
  }
  const minXp = node.unlock.minXp ?? 0;
  if (minXp > 0) return `Alcança ${minXp} XP`;
  return "Requisito pendente";
}

interface TrailGroupProps {
  readonly group: ChapterGroup;
  readonly groupIndex: number;
  readonly player: PlayerProgress;
  readonly unlocked: ReadonlySet<string>;
  readonly nextNodeId: string | null;
  readonly nodesById: ReadonlyMap<string, MapNode>;
  readonly avatarSpriteId?: string | null;
  readonly hatSpriteId?: string | null;
  readonly onOpenNode: (nodeId: string) => void;
}

function TrailGroup({
  group,
  groupIndex,
  player,
  unlocked,
  nextNodeId,
  nodesById,
  avatarSpriteId,
  hatSpriteId,
  onOpenNode,
}: TrailGroupProps) {
  const [canvasRef, width] = useElementWidth<HTMLDivElement>();
  const { baseY, height, points } = useMemo(() => {
    const firstRow = Math.min(...group.nodes.map((node) => node.position.y));
    const lastRow = Math.max(...group.nodes.map((node) => node.position.y - firstRow));
    const canvasHeight =
      TOP_PAD + (lastRow + 1) * ROW_HEIGHT + BOTTOM_PAD;
    const columnWidth = (width || 320) / 3;

    return {
      baseY: firstRow,
      height: canvasHeight,
      points: group.nodes.map((node) => ({
        x: (node.position.x + 0.5) * columnWidth,
        y:
          TOP_PAD +
          (node.position.y - firstRow) * ROW_HEIGHT +
          NODE_CENTER_Y,
      })),
    };
  }, [group.nodes, width]);
  const seed = useMemo(
    () => seedForGroup(`${groupIndex}:${group.chapter ?? "grupo"}`),
    [groupIndex, group.chapter],
  );

  return (
    <div className="trail-canvas" ref={canvasRef} style={{ height }}>
      {width > 0 ? (
        <>
          <ForestBackdrop
            width={width}
            height={height}
            points={points}
            seed={seed}
            withLake={groupIndex === 0}
          />
          <TrailPath points={points} width={width} height={height} />
        </>
      ) : null}

      {group.nodes.map((node, index) => {
        const completion = player.completedNodes[node.id];
        const isUnlocked = unlocked.has(node.id);
        const state = completion ? "completed" : isUnlocked ? "available" : "locked";
        const isCurrent = node.id === nextNodeId;
        const point = points[index];
        const hint = unlockHint(node, nodesById, player.xp);
        const shortHint = compactUnlockHint(node, nodesById);

        return (
          <div
            key={node.id}
            className={[
              "trail-node-wrap",
              `trail-node-wrap--${edgeClass(node.position.x)}`,
              isCurrent ? "trail-node-wrap--current" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              left: point?.x ?? 0,
              top: TOP_PAD + (node.position.y - baseY) * ROW_HEIGHT,
            }}
          >
            {isCurrent ? (
              <span className="trail-node__marker" aria-hidden="true">
                ▼
              </span>
            ) : null}

            <button
              type="button"
              className={`trail-node trail-node--${state}${isCurrent ? " trail-node--current" : ""}`}
              aria-disabled={!isUnlocked}
              aria-current={isCurrent ? "step" : undefined}
              aria-describedby={!isUnlocked ? `unlock-${node.id}` : undefined}
              aria-label={`${node.title} (${
                state === "locked"
                  ? "bloqueado"
                  : state === "completed"
                    ? "concluído"
                    : "disponível"
              })`}
              onClick={() => {
                if (isUnlocked) onOpenNode(node.id);
              }}
            >
              <span className="trail-node__sprite">
                <PixelSprite sprite={spriteForIcon(node.icon)} size={42} />
              </span>
              {!isUnlocked ? (
                <span className="trail-node__lock">
                  <PixelSprite sprite={lockSprite} size={20} />
                </span>
              ) : null}
            </button>

            {isCurrent ? (
              <span className="trail-node__player" aria-hidden="true">
                <PlayerAvatar
                  avatarSpriteId={avatarSpriteId}
                  hatSpriteId={hatSpriteId}
                  size={26}
                  title="Seu avatar no mapa"
                />
              </span>
            ) : null}

            {!isUnlocked ? (
              <span
                className="trail-node__tooltip"
                id={`unlock-${node.id}`}
                role="tooltip"
              >
                {hint}
              </span>
            ) : null}

            <div className="trail-node__meta">
              <span className="trail-node__title">{node.title}</span>
              {completion ? (
                <span className="trail-node__stars">{starsLabel(completion.stars)}</span>
              ) : (
                <span className="trail-node__hint">
                  {isUnlocked
                    ? isCurrent
                      ? "Próxima parada"
                      : node.subtitle ?? "Disponível"
                    : shortHint}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MapScreen({
  courses,
  activeCourseId,
  nodes,
  player,
  levelInfo,
  maxLives,
  shopItems,
  equippedAvatarSpriteId,
  equippedHatSpriteId,
  unlockedNodeIds,
  onSelectCourse,
  onOpenNode,
  onPurchaseItem,
  onEquipItem,
  onUnequipItem,
  onHelp,
  onReset,
}: MapScreenProps) {
  const [dialogNode, setDialogNode] = useState<MapNode | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const unlocked = useMemo(() => new Set(unlockedNodeIds), [unlockedNodeIds]);
  const groups = useMemo(() => groupByChapter(nodes), [nodes]);
  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const nextNodeId = useMemo(() => {
    const next = nodes.find(
      (node) => unlocked.has(node.id) && player.completedNodes[node.id] === undefined,
    );
    return next?.id ?? null;
  }, [nodes, player.completedNodes, unlocked]);

  const handleOpen = (node: MapNode): void => {
    if (node.npc) {
      setDialogNode(node);
      return;
    }
    onOpenNode(node.id);
  };

  return (
    <div className="screen map-screen">
      <header className="topbar">
        <div className="profile">
          <div className="avatar-frame">
            <PlayerAvatar
              avatarSpriteId={equippedAvatarSpriteId}
              hatSpriteId={equippedHatSpriteId}
              size={44}
              title="Avatar do explorador"
            />
          </div>
          <div className="profile__text">
            <span className="eyebrow">Explorador</span>
            <strong>Nível {levelInfo.level}</strong>
          </div>
        </div>
        <div className="stats" id="tutorial-target-stats">
          <span className="stat stat--coin">
            <PixelSprite sprite={coinSprite} size={16} />
            {player.coins}
          </span>
          <span
            className="stat stat--streak"
            title={`Melhor ofensiva: ${player.streak.best} dia(s)`}
          >
            <PixelSprite sprite={flameSprite} size={16} />
            {player.streak.current}
            <span className="stat__unit">
              {player.streak.current === 1 ? "dia" : "dias"}
            </span>
          </span>
          <HeartRow lives={player.lives} max={maxLives} />
          <button
            type="button"
            className="shop-trigger"
            id="tutorial-target-shop"
            onClick={() => setShopOpen(true)}
          >
            <PixelSprite sprite={chestSprite} size={14} />
            Loja
          </button>
          <button
            type="button"
            className="help-trigger"
            onClick={onHelp}
            aria-label="Reabrir tutorial"
            title="Reabrir tutorial"
          >
            ?
          </button>
        </div>
      </header>

      <ProgressBar
        value={levelInfo.xpIntoLevel}
        max={levelInfo.xpForNextLevel}
        label={`${levelInfo.xpIntoLevel} / ${levelInfo.xpForNextLevel} XP até o próximo nível`}
      />

      <nav
        className="course-tabs"
        id="tutorial-target-modules"
        aria-label="Cursos disponíveis"
      >
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            className="course-tab"
            aria-pressed={course.id === activeCourseId}
            onClick={() => onSelectCourse(course.id)}
          >
            {course.title}
            <span>
              {course.completedCount}/{course.nodeCount}
            </span>
          </button>
        ))}
      </nav>

      {groups.length === 0 ? (
        <div className="empty-state empty-state--map">
          <PixelSprite sprite={chestSprite} size={56} />
          <h2>Nenhuma trilha disponível no momento.</h2>
          <p>Aguarde o professor cadastrar conteúdos.</p>
        </div>
      ) : (
        groups.map((group, groupIndex) => (
          <section className="trail-group" key={group.chapter ?? `group-${groupIndex}`}>
            {group.chapter ? <h2 className="trail-chapter">{group.chapter}</h2> : null}
            <TrailGroup
              group={group}
              groupIndex={groupIndex}
              player={player}
              unlocked={unlocked}
              nextNodeId={nextNodeId}
              nodesById={nodesById}
              avatarSpriteId={equippedAvatarSpriteId}
              hatSpriteId={equippedHatSpriteId}
              onOpenNode={(nodeId) => {
                const node = nodesById.get(nodeId);
                if (node) handleOpen(node);
              }}
            />
          </section>
        ))
      )}

      <footer className="map-footer">
        <div className="inventory" aria-label="Itens conquistados">
          <span className="eyebrow">Itens</span>
          {Object.entries(player.inventory).filter(([, amount]) => amount > 0).length ===
          0 ? (
            <span className="inventory__empty">Nenhum item ainda</span>
          ) : (
            Object.entries(player.inventory)
              .filter(([, amount]) => amount > 0)
              .map(([itemId, amount]) => (
                <span key={itemId} className="inventory__item" title={itemId}>
                  <PixelSprite sprite={heartSprite} size={12} /> {itemId} ×{amount}
                </span>
              ))
          )}
        </div>
        <PixelButton variant="ghost" onClick={onReset}>
          Reiniciar progresso
        </PixelButton>
      </footer>

      {dialogNode?.npc ? (
        <NpcDialog
          speaker={dialogNode.npc.speaker}
          lines={dialogNode.npc.lines}
          onClose={() => setDialogNode(null)}
          onStart={() => {
            const nodeId = dialogNode.id;
            setDialogNode(null);
            onOpenNode(nodeId);
          }}
        />
      ) : null}

      {shopOpen ? (
        <ShopModal
          items={shopItems}
          coins={player.coins}
          ownedItemIds={player.ownedItemIds}
          equippedItemIds={player.equippedItemIds}
          onClose={() => setShopOpen(false)}
          onPurchase={onPurchaseItem}
          onEquip={onEquipItem}
          onUnequip={onUnequipItem}
        />
      ) : null}
    </div>
  );
}
