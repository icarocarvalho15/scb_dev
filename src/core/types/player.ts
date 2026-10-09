import { CardInstance } from './card';

export type PlayerId = string;

/**
 * Estado do Representante do jogador durante a partida
 * Representantes possuem Moral, Popularidade e Destaque; NÃO possuem Influência nem atacam/bloqueiam.
 * Conforme docs/rules/SCB_Architecture.md seção 9 e docs/rules/SCB_Rules.md
 */
export interface RepresentativeState {
  definitionId: string;
  name: string;
  ownerId: PlayerId;
  currentMorale: number;
  maxMorale: number;
  popularity: number;
  popularityRequirement: number;
  highlightAvailable: boolean;
  highlightCost: number;
}

/**
 * Estado completo de um jogador na partida
 * Conforme docs/rules/SCB_Architecture.md seção 6 e docs/rules/SCB_Rules.md seção 4
 */
export interface PlayerState {
  id: PlayerId;
  name: string;
  isAI: boolean;

  representative: RepresentativeState;

  // Zonas de cartas do jogador
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  detention: CardInstance[];
  board: CardInstance[]; // Estudantes em campo (máximo 6)
  environment: CardInstance | null; // Ambiente ativo (máximo 1)

  // Recursos
  energy: number;
  maxEnergy: number;

  // Flags de controle de regras da partida
  hasMulliganed: boolean;
  diplomacyActive: boolean; // Ativo durante o primeiro turno do jogador
}
