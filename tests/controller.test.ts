import { describe, expect, it } from "vitest";
import { GameController } from "../src/app/GameController";
import type { ContentCatalog } from "../src/core/entities/content";
import { GameEngine } from "../src/core/services/GameEngine";
import { TutorialSession } from "../src/core/services/TutorialSession";
import {
  buildCatalog,
  FixedClock,
  InMemoryProgressStore,
  SequenceRandom,
  StaticRepository,
} from "./support/fixtures";

function createController(catalog: ContentCatalog = buildCatalog()): GameController {
  const engine = new GameEngine({
    repository: new StaticRepository(catalog),
    progressStore: new InMemoryProgressStore(),
    clock: new FixedClock(1_000),
    random: new SequenceRandom(),
    config: { maxLives: 3 },
  });
  const tutorial = new TutorialSession(
    {
      loadCompleted: async () => true,
      saveCompleted: async () => {},
    },
    1,
  );
  return new GameController(engine, tutorial);
}

function completeFirstLesson(controller: GameController): void {
  controller.startNode("n1");
  controller.answer({ choiceIds: ["a"] });
  controller.advance();
  controller.answer({ text: "amar" });
  controller.advance();
}

describe("GameController", () => {
  it("oferece a próxima fase e inicia a lição seguinte", async () => {
    const controller = createController();
    await controller.init();

    completeFirstLesson(controller);

    expect(controller.getSnapshot().outcome?.passed).toBe(true);
    expect(controller.getSnapshot().nextNode?.id).toBe("n2");

    controller.startNextPhase();

    const snapshot = controller.getSnapshot();
    expect(snapshot.screen).toBe("lesson");
    expect(snapshot.outcome).toBeNull();
    expect(snapshot.session?.nodeId).toBe("n2");
    expect(snapshot.currentQuestion?.id).toBe("q3");
  });

  it("não oferece a próxima fase quando o nó seguinte está bloqueado", async () => {
    const catalog = buildCatalog();
    const lockedCatalog: ContentCatalog = {
      courses: catalog.courses.map((course) => ({
        ...course,
        nodes: course.nodes.map((node) =>
          node.id === "n2"
            ? { ...node, unlock: { requires: ["n1"], minXp: 9_999 } }
            : node,
        ),
      })),
    };
    const controller = createController(lockedCatalog);
    await controller.init();

    completeFirstLesson(controller);

    expect(controller.getSnapshot().outcome?.passed).toBe(true);
    expect(controller.getSnapshot().nextNode).toBeNull();

    controller.startNextPhase();

    expect(controller.getSnapshot().screen).toBe("map");
  });

  it("volta ao mapa ao concluir a última fase", async () => {
    const controller = createController();
    await controller.init();

    completeFirstLesson(controller);
    controller.startNextPhase();
    controller.answer({ choiceIds: ["a"] });
    controller.advance();

    expect(controller.getSnapshot().outcome?.passed).toBe(true);
    expect(controller.getSnapshot().nextNode).toBeNull();

    controller.startNextPhase();

    expect(controller.getSnapshot().screen).toBe("map");
    expect(controller.getSnapshot().outcome).toBeNull();
  });
});
