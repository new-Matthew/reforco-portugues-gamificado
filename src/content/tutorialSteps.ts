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
      "Olá, explorador! Eu sou o Mestre da Trilha e vou te acompanhar nos primeiros passos. Vamos aprender juntos como evoluir no seu reforço de Português?",
    buttonLabel: "Entendi",
  },
  {
    id: "status-bar",
    message:
      "Na barra superior você acompanha seu Nível e a barra de XP, além das Moedas, das Vidas e da Ofensiva. Responda certo para ganhar XP e moedas; se errar, perde uma vida.",
    targetId: "tutorial-target-stats",
    buttonLabel: "Próximo",
  },
  {
    id: "map-modules",
    message:
      "Aqui ficam os módulos da trilha. Conclua uma lição para liberar a próxima parada e abrir baús de recompensa pelo caminho. Fique de olho nas estrelas!",
    targetId: "tutorial-target-modules",
    buttonLabel: "Próximo",
  },
  {
    id: "shop",
    message:
      "Com as moedas que você conquistou, abra a Loja de Customização para comprar chapéus e avatares. Depois é só equipar e mostrar seu estilo no mapa!",
    targetId: "tutorial-target-shop",
    buttonLabel: "Entendi",
  },
];
