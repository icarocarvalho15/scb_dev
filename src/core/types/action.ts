import { PlayerId } from './player';

/**
 * Identificadores de tipos de ações de jogo
 * Conforme docs/rules/SCB_Architecture.md seção 13
 */
export enum ActionType {
  PLAY_CARD = 'PLAY_CARD',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  ACTIVATE_ABILITY = 'ACTIVATE_ABILITY',
  START_DEBATE = 'START_DEBATE',
  RESPOND_DEBATE = 'RESPOND_DEBATE',
  ACTIVATE_HIGHLIGHT = 'ACTIVATE_HIGHLIGHT',
  MULLIGAN = 'MULLIGAN',
  END_PHASE = 'END_PHASE',
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
  targetId: string; // Pode ser um Estudante adversário ou o Representante adversário
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
}

export interface RespondDebateAction {
  type: ActionType.RESPOND_DEBATE;
  playerId: PlayerId;
  cardInstanceId?: string;
  pass?: boolean;
  targetId?: string;
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

export interface EndPhaseAction {
  type: ActionType.END_PHASE;
  playerId: PlayerId;
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
  | ActivateAbilityAction
  | StartDebateAction
  | RespondDebateAction
  | ActivateHighlightAction
  | MulliganAction
  | EndPhaseAction
  | SurrenderAction;
