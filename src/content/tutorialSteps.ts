import { GUIDE_NAME } from "./guide";

export interface TutorialStep {
  readonly id: string;
  readonly message: string;
  readonly targetId?: string;
  readonly buttonLabel: string;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "welcome",
    message:
      `Oxe, explorador! Eu sou a ${GUIDE_NAME} e vou te acompanhar nos primeiros passos. Bora desenrolar o português juntos, visse?`,
    buttonLabel: "Entendi",
  },
  {
    id: "status-bar",
    message:
      "Na barra superior tu acompanha teu Nível e a barra de XP, além das Moedas, das Vidas e da Ofensiva. Acertando, tu ganha XP e moedas; se errar, perde uma vida. Calma, macho, que dá pra recuperar.",
    targetId: "tutorial-target-stats",
    buttonLabel: "Próximo",
  },
  {
    id: "map-modules",
    message:
      "Aqui ficam os módulos da trilha. Conclui uma lição para liberar a próxima parada e abrir baús de recompensa pelo caminho. Não fica avexado: olha as estrelas e segue no teu ritmo.",
    targetId: "tutorial-target-modules",
    buttonLabel: "Próximo",
  },
  {
    id: "shop",
    message:
      "Com as moedas que tu conquistou, abre a Loja de Customização para comprar chapéus e avatares. Depois é só equipar e mostrar teu estilo no mapa. Só a massa!",
    targetId: "tutorial-target-shop",
    buttonLabel: "Entendi",
  },
];
