import { TUTORIAL_STEPS } from "../content/tutorialSteps";
import { JsonContentRepository } from "../content/repository/JsonContentRepository";
import { GameEngine } from "../core/services/GameEngine";
import { TutorialSession } from "../core/services/TutorialSession";
import { viteContentSource } from "../infrastructure/content/viteContentSource";
import { LocalStorageProgressStore } from "../infrastructure/persistence/LocalStorageProgressStore";
import { LocalStorageTutorialStore } from "../infrastructure/persistence/LocalStorageTutorialStore";
import { MathRandomProvider, SystemClock } from "../infrastructure/system/SystemClock";
import { GameController } from "./GameController";

let controller: GameController | null = null;

export function getGameController(): GameController {
  if (!controller) {
    const engine = new GameEngine({
      repository: new JsonContentRepository(viteContentSource),
      progressStore: new LocalStorageProgressStore(),
      clock: new SystemClock(),
      random: new MathRandomProvider(),
    });
    const tutorial = new TutorialSession(
      new LocalStorageTutorialStore(),
      TUTORIAL_STEPS.length,
    );
    controller = new GameController(engine, tutorial);
  }
  return controller;
}
