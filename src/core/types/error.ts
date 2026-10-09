/**
 * Códigos de erro estruturados para ações e validações do motor de regras
 * Conforme docs/rules/SCB_Architecture.md seção 35 e docs/agents/SKILL.md regra 27
 */
export enum ActionErrorCode {
  INVALID_PLAYER = 'INVALID_PLAYER',
  INVALID_PHASE = 'INVALID_PHASE',
  NOT_ENOUGH_ENERGY = 'NOT_ENOUGH_ENERGY',
  CARD_NOT_IN_HAND = 'CARD_NOT_IN_HAND',
  CARD_NOT_IN_BOARD = 'CARD_NOT_IN_BOARD',
  BOARD_FULL = 'BOARD_FULL',
  INVALID_TARGET = 'INVALID_TARGET',
  INVALID_ATTACK = 'INVALID_ATTACK',
  INVALID_BLOCK = 'INVALID_BLOCK',
  DIPLOMACY_RESTRICTION = 'DIPLOMACY_RESTRICTION',
  INERTIA_RESTRICTION = 'INERTIA_RESTRICTION',
  DEBATE_CHAIN_FULL = 'DEBATE_CHAIN_FULL',
  HIGHLIGHT_NOT_AVAILABLE = 'HIGHLIGHT_NOT_AVAILABLE',
  MULLIGAN_ALREADY_USED = 'MULLIGAN_ALREADY_USED',
  GAME_OVER = 'GAME_OVER',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Erro de validação de ação
 */
export interface ActionError {
  code: ActionErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Resultado da execução de uma ação pela engine
 */
export type ActionResult<T = unknown> =
  | { success: true; state: T }
  | { success: false; error: ActionError };
