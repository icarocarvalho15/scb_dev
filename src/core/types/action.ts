import { PlayerId } from './player';

/**
 * Identificadores de tipos de ações de jogo
 * Conforme docs/rules/SCB_Architecture.md seção 13
 */
export enum ActionType {
  PLAY_CARD = 'PLAY_CARD',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  RESOLVE_COMBAT = 'RESOLVE_COMBAT',
  ACTIVATE_ABILITY = 'ACTIVATE_ABILITY',
  START_DEBATE = 'START_DEBATE',
  RESPOND_DEBATE = 'RESPOND_DEBATE',
  PASS_DEBATE = 'PASS_DEBATE',
  RESOLVE_DEBATE = 'RESOLVE_DEBATE',
  ACTIVATE_HIGHLIGHT = 'ACTIVATE_HIGHLIGHT',
  MULLIGAN = 'MULLIGAN',
  ADVANCE_PHASE = 'ADVANCE_PHASE',
  END_PHASE = 'END_PHASE',
  DISCARD_CARDS = 'DISCARD_CARDS',
  SURRENDER = 'SURRENDER',
}

export interface PlayCardAction {
  type: ActionType.PLAY_CARD;
  playerId: PlayerId;
  cardInstanceId: string;
  targetId?: string;
  replaceCardInstanceId?: string; // Para a regra de Substituição quando o campo possui 6 Estudantes
}

export interface AttackAction {
  type: ActionType.ATTACK;
  playerId: PlayerId;
  attackerInstanceId: string;
  targetId?: string; // Opcional: determinado automaticamente pela Engine (Representante ou Provocador)
}

export interface BlockAction {
  type: ActionType.BLOCK;
  playerId: PlayerId;
  blockerInstanceId: string;
  attackerInstanceId: string;
}

export interface ActivateAbilityAction {
  type: ActionType.ACTIVATE_ABILITY;
  playerId: PlayerId;
  sourceInstanceId: string;
  abilityId: string;
  targetId?: string;
}

export interface StartDebateAction {
  type: ActionType.START_DEBATE;
  playerId: PlayerId;
  cardInstanceId: string;
  targetId?: string;
  targetIds?: string[];
  parameters?: Record<string, unknown>;
}

export interface RespondDebateAction {
  type: ActionType.RESPOND_DEBATE;
  playerId: PlayerId;
  cardInstanceId?: string;
  pass?: boolean;
  targetId?: string;
  targetIds?: string[];
  parameters?: Record<string, unknown>;
}

export interface PassDebateAction {
  type: ActionType.PASS_DEBATE;
  playerId: PlayerId;
}

export interface ResolveDebateAction {
  type: ActionType.RESOLVE_DEBATE;
  playerId: PlayerId;
}

export interface ActivateHighlightAction {
  type: ActionType.ACTIVATE_HIGHLIGHT;
  playerId: PlayerId;
  targetId?: string;
}

export interface MulliganAction {
  type: ActionType.MULLIGAN;
  playerId: PlayerId;
  cardInstanceIdsToReplace: string[];
}

export interface AdvancePhaseAction {
  type: ActionType.ADVANCE_PHASE;
  playerId: PlayerId;
  cardInstanceIdsToDiscard?: string[]; // Para descarte na End Phase se necessário
}

export interface EndPhaseAction {
  type: ActionType.END_PHASE;
  playerId: PlayerId;
  cardInstanceIdsToDiscard?: string[]; // Para descarte na End Phase se necessário
}

export interface ResolveCombatAction {
  type: ActionType.RESOLVE_COMBAT;
  playerId: PlayerId;
}

export interface DiscardCardsAction {
  type: ActionType.DISCARD_CARDS;
  playerId: PlayerId;
  cardInstanceIds: string[];
}

export interface SurrenderAction {
  type: ActionType.SURRENDER;
  playerId: PlayerId;
}

/**
 * União discriminada de todas as ações legais de jogo
 */
export type GameAction =
  | PlayCardAction
  | AttackAction
  | BlockAction
  | ResolveCombatAction
  | ActivateAbilityAction
  | StartDebateAction
  | RespondDebateAction
  | PassDebateAction
  | ResolveDebateAction
  | ActivateHighlightAction
  | MulliganAction
  | AdvancePhaseAction
  | EndPhaseAction
  | DiscardCardsAction
  | SurrenderAction;
