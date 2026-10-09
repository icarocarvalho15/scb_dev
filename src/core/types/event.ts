import { PlayerId } from './player';
import { GamePhase } from './phase';
import { CardType } from './card';

/**
 * Identificadores dos tipos de eventos do jogo
 * Conforme docs/rules/SCB_Architecture.md Seção 19 e diretiva da Fase 5:
 * CARD_PLAYED, STUDENT_ATTACKED, DAMAGE_DEALT, STUDENT_DEFEATED, TURN_STARTED, PHASE_CHANGED, etc.
 */
export enum GameEventType {
  CARD_PLAYED = 'CARD_PLAYED',
  STUDENT_ENTERED = 'STUDENT_ENTERED',
  STUDENT_ATTACKED = 'STUDENT_ATTACKED',
  STUDENT_BLOCKED = 'STUDENT_BLOCKED',
  DAMAGE_DEALT = 'DAMAGE_DEALT',
  STUDENT_DEFEATED = 'STUDENT_DEFEATED',
  TURN_STARTED = 'TURN_STARTED',
  TURN_ENDED = 'TURN_ENDED',
  PHASE_CHANGED = 'PHASE_CHANGED',
  POPULARITY_GAINED = 'POPULARITY_GAINED',
  HIGHLIGHT_ACTIVATED = 'HIGHLIGHT_ACTIVATED',
  CARD_DRAWN = 'CARD_DRAWN',
  CARD_DISCARDED = 'CARD_DISCARDED',
  EFFECT_APPLIED = 'EFFECT_APPLIED',
  DEBATE_STARTED = 'DEBATE_STARTED',
  DEBATE_ACTION_PLAYED = 'DEBATE_ACTION_PLAYED',
  DEBATE_ACTION_RESOLVED = 'DEBATE_ACTION_RESOLVED',
  DEBATE_ACTION_FIZZLED = 'DEBATE_ACTION_FIZZLED',
  DEBATE_RESOLVED = 'DEBATE_RESOLVED',
  CUSTOM = 'CUSTOM',
}

/**
 * Estrutura base de qualquer evento do jogo
 */
export interface BaseGameEvent {
  id: string;
  type: GameEventType;
  turn: number;
  phase: GamePhase;
  timestamp?: number;
}

export interface CardPlayedEvent extends BaseGameEvent {
  type: GameEventType.CARD_PLAYED;
  playerId: PlayerId;
  cardInstanceId: string;
  definitionId: string;
  cardType: CardType;
  cost: number;
  replacedCardInstanceId?: string;
}

export interface StudentEnteredEvent extends BaseGameEvent {
  type: GameEventType.STUDENT_ENTERED;
  playerId: PlayerId;
  cardInstanceId: string;
  definitionId: string;
  hasInertia: boolean;
  ready: boolean;
}

export interface StudentAttackedEvent extends BaseGameEvent {
  type: GameEventType.STUDENT_ATTACKED;
  playerId: PlayerId;
  attackerInstanceId: string;
  targetId: string;
}

export interface StudentBlockedEvent extends BaseGameEvent {
  type: GameEventType.STUDENT_BLOCKED;
  playerId: PlayerId;
  blockerInstanceId: string;
  attackerInstanceId: string;
}

export interface DamageDealtEvent extends BaseGameEvent {
  type: GameEventType.DAMAGE_DEALT;
  sourceId?: string;
  targetId: string;
  targetType: 'STUDENT' | 'REPRESENTATIVE';
  targetPlayerId: PlayerId;
  amount: number;
  isCombatDamage: boolean;
}

export interface StudentDefeatedEvent extends BaseGameEvent {
  type: GameEventType.STUDENT_DEFEATED;
  playerId: PlayerId;
  cardInstanceId: string;
  definitionId: string;
  reason?: 'COMBAT_DAMAGE' | 'SUBSTITUTION' | 'EFFECT';
}

export interface TurnStartedEvent extends BaseGameEvent {
  type: GameEventType.TURN_STARTED;
  turn: number;
  activePlayerId: PlayerId;
}

export interface TurnEndedEvent extends BaseGameEvent {
  type: GameEventType.TURN_ENDED;
  turn: number;
  activePlayerId: PlayerId;
}

export interface PhaseChangedEvent extends BaseGameEvent {
  type: GameEventType.PHASE_CHANGED;
  fromPhase: GamePhase;
  toPhase: GamePhase;
  activePlayerId: PlayerId;
}

export interface PopularityGainedEvent extends BaseGameEvent {
  type: GameEventType.POPULARITY_GAINED;
  playerId: PlayerId;
  amount: number;
  newPopularity: number;
  highlightUnlocked: boolean;
}

export interface CardDrawnEvent extends BaseGameEvent {
  type: GameEventType.CARD_DRAWN;
  playerId: PlayerId;
  cardInstanceId: string;
}

export interface CardDiscardedEvent extends BaseGameEvent {
  type: GameEventType.CARD_DISCARDED;
  playerId: PlayerId;
  cardInstanceId: string;
}

export interface EffectAppliedEvent extends BaseGameEvent {
  type: GameEventType.EFFECT_APPLIED;
  effectType: string;
  sourceId?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

export interface DebateStartedEvent extends BaseGameEvent {
  type: GameEventType.DEBATE_STARTED;
  playerId: PlayerId;
  cardInstanceId: string;
  definitionId: string;
  targetId?: string;
}

export interface DebateActionPlayedEvent extends BaseGameEvent {
  type: GameEventType.DEBATE_ACTION_PLAYED;
  step: number;
  stepName?: string;
  playerId: PlayerId;
  cardInstanceId?: string;
  definitionId?: string;
  targetId?: string;
}

export interface DebateActionResolvedEvent extends BaseGameEvent {
  type: GameEventType.DEBATE_ACTION_RESOLVED;
  step: number;
  playerId: PlayerId;
  cardInstanceId?: string;
  targetId?: string;
}

export interface DebateActionFizzledEvent extends BaseGameEvent {
  type: GameEventType.DEBATE_ACTION_FIZZLED;
  step: number;
  playerId: PlayerId;
  cardInstanceId?: string;
  targetId?: string;
  reason: string;
}

export interface DebateResolvedEvent extends BaseGameEvent {
  type: GameEventType.DEBATE_RESOLVED;
  playerId: PlayerId;
}

export interface CustomGameEvent extends BaseGameEvent {
  type: GameEventType.CUSTOM;
  payload: Record<string, unknown>;
}

/**
 * União discriminada de todos os eventos canônicos de jogo
 */
export type GameEvent =
  | CardPlayedEvent
  | StudentEnteredEvent
  | StudentAttackedEvent
  | StudentBlockedEvent
  | DamageDealtEvent
  | StudentDefeatedEvent
  | TurnStartedEvent
  | TurnEndedEvent
  | PhaseChangedEvent
  | PopularityGainedEvent
  | CardDrawnEvent
  | CardDiscardedEvent
  | EffectAppliedEvent
  | DebateStartedEvent
  | DebateActionPlayedEvent
  | DebateActionResolvedEvent
  | DebateActionFizzledEvent
  | DebateResolvedEvent
  | CustomGameEvent;
