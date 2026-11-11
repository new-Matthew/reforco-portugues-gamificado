export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ContentValidationError extends GameError {
  constructor(readonly issues: readonly { path: string; message: string }[]) {
    super(
      `Conteúdo inválido (${issues.length} problema(s)): ${issues
        .map((issue) => `${issue.path} ${issue.message}`)
        .join("; ")}`,
    );
  }
}

export class CourseNotFoundError extends GameError {
  constructor(courseId: string) {
    super(`Curso "${courseId}" não encontrado.`);
  }
}

export class NodeNotFoundError extends GameError {
  constructor(courseId: string, nodeId: string) {
    super(`Nó "${nodeId}" não encontrado no curso "${courseId}".`);
  }
}

export class LessonLockedError extends GameError {
  constructor(nodeTitle: string) {
    super(`A lição "${nodeTitle}" ainda está bloqueada.`);
  }
}

export class LessonAlreadyActiveError extends GameError {
  constructor() {
    super("Já existe uma lição em andamento.");
  }
}

export class NoActiveSessionError extends GameError {
  constructor() {
    super("Nenhuma lição está em andamento.");
  }
}

export class QuestionNotAnsweredError extends GameError {
  constructor() {
    super("Responda a pergunta atual antes de avançar.");
  }
}

export class QuestionAlreadyAnsweredError extends GameError {
  constructor() {
    super("Esta pergunta já foi respondida.");
  }
}

export class UnsupportedQuestionTypeError extends GameError {
  constructor(type: string) {
    super(`Nenhum avaliador registrado para o tipo de pergunta "${type}".`);
  }
}

export class ShopItemNotFoundError extends GameError {
  constructor(itemId: string) {
    super(`O item "${itemId}" não existe na loja.`);
  }
}

export class ShopItemAlreadyOwnedError extends GameError {
  constructor(itemName: string) {
    super(`Você já possui "${itemName}".`);
  }
}

export class ShopItemNotOwnedError extends GameError {
  constructor(itemName: string) {
    super(`Compre "${itemName}" antes de equipá-lo.`);
  }
}

export class InsufficientCoinsError extends GameError {
  constructor(readonly required: number, readonly available: number) {
    super(
      `Moedas insuficientes: faltam ${Math.max(0, required - available)} moeda(s).`,
    );
  }
}
