import { useState } from "react";
import { PixelButton } from "../ui/pixel/PixelButton";
import { PixelPanel } from "../ui/pixel/PixelPanel";
import { RoleSwitcher, type AppRole } from "../ui/pixel/RoleSwitcher";
import { LessonScreen } from "../ui/screens/LessonScreen";
import { MapScreen } from "../ui/screens/MapScreen";
import { ResultModal } from "../ui/screens/ResultModal";
import { TeacherDashboard } from "../ui/screens/TeacherDashboard";
import { useGame } from "./useGame";

export function App() {
  const { snapshot, controller } = useGame();
  const [role, setRole] = useState<AppRole>("student");

  if (snapshot.status === "loading") {
    return (
      <main className="app">
        <div className="loading-screen">
          <p className="eyebrow">Carregando trilha…</p>
        </div>
      </main>
    );
  }

  if (snapshot.status === "error") {
    return (
      <main className="app">
        <PixelPanel className="error-panel">
          <h1>Ops!</h1>
          <p>{snapshot.error ?? "Falha ao carregar o conteúdo."}</p>
          <PixelButton onClick={() => window.location.reload()}>Recarregar</PixelButton>
        </PixelPanel>
      </main>
    );
  }

  const session = snapshot.session;
  const currentNode = session
    ? snapshot.nodes.find((node) => node.id === session.nodeId)
    : undefined;

  return (
    <main className="app">
      <RoleSwitcher role={role} onChange={(next) => setRole(next)} />

      {role === "teacher" ? (
        <TeacherDashboard
          courses={snapshot.courses}
          activeCourseId={snapshot.activeCourseId}
          nodes={snapshot.nodes}
          onSelectCourse={(courseId) => controller.selectCourse(courseId)}
          onCreateCourse={(draft) => controller.createCourse(draft)}
          onPublishLesson={(draft) => controller.publishLesson(draft)}
        />
      ) : snapshot.screen === "lesson" && snapshot.currentQuestion && session ? (
        <LessonScreen
          nodeTitle={currentNode?.title ?? "Lição"}
          question={snapshot.currentQuestion}
          questionNumber={session.currentIndex + 1}
          totalQuestions={session.questionIds.length}
          lives={snapshot.player.lives}
          maxLives={snapshot.maxLives}
          feedback={snapshot.feedback}
          onAnswer={(answer) => controller.answer(answer)}
          onNext={() => controller.advance()}
          onExit={() => controller.backToMap()}
          onRestartLesson={() => controller.restartLesson()}
        />
      ) : (
        <MapScreen
          courses={snapshot.courses}
          activeCourseId={snapshot.activeCourseId}
          nodes={snapshot.nodes}
          player={snapshot.player}
          levelInfo={snapshot.levelInfo}
          maxLives={snapshot.maxLives}
          shopItems={snapshot.shopItems}
          equippedAvatarSpriteId={snapshot.equippedAvatar?.spriteId}
          equippedHatSpriteId={snapshot.equippedHat?.spriteId}
          unlockedNodeIds={snapshot.unlockedNodeIds}
          onSelectCourse={(courseId) => controller.selectCourse(courseId)}
          onOpenNode={(nodeId) => controller.startNode(nodeId)}
          onPurchaseItem={(itemId) => controller.purchaseItem(itemId)}
          onEquipItem={(itemId) => controller.equipItem(itemId)}
          onUnequipItem={(category) => controller.unequipItem(category)}
          onReset={() => {
            if (window.confirm("Apagar todo o progresso?")) {
              controller.resetProgress();
            }
          }}
        />
      )}

      {role === "student" && snapshot.outcome ? (
        <ResultModal
          outcome={snapshot.outcome}
          onBackToMap={() => controller.backToMap()}
          onRetry={() => controller.retry()}
        />
      ) : null}

      {snapshot.error ? (
        <div className="error-toast" role="alert">
          <span>{snapshot.error}</span>
          <button type="button" onClick={() => controller.dismissError()}>
            ×
          </button>
        </div>
      ) : null}
    </main>
  );
}
