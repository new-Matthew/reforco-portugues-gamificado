import { JsonContentRepository } from "../content/repository/JsonContentRepository";
import { GameEngine } from "../core/services/GameEngine";
import { viteContentSource } from "../infrastructure/content/viteContentSource";
import { LocalStorageProgressStore } from "../infrastructure/persistence/LocalStorageProgressStore";
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
    controller = new GameController(engine);
  }
  return controller;
}
