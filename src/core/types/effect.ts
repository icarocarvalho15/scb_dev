import { Keyword } from './card';
import { PlayerId } from './player';
import { GameEventType } from './event';

/**
 * Tipos de efeitos executáveis pelo motor de regras
 * Conforme docs/rules/SCB_Architecture.md Seção 18
 */
export enum EffectType {
  GAIN_POPULARITY = 'GAIN_POPULARITY',
  MODIFY_STAT = 'MODIFY_STAT',
  DRAW_CARD = 'DRAW_CARD',
  GAIN_ENERGY = 'GAIN_ENERGY',
  GRANT_KEYWORD = 'GRANT_KEYWORD',
  REMOVE_KEYWORD = 'REMOVE_KEYWORD',
  APPLY_STATUS = 'APPLY_STATUS',
  REVIVE_STUDENT = 'REVIVE_STUDENT',
  DEAL_DAMAGE = 'DEAL_DAMAGE',
  HEAL_MORALE = 'HEAL_MORALE',
}

/**
 * Duração de efeitos temporários ou contínuos
 * Conforme docs/rules/SCB_Architecture.md Seção 21
 */
export enum EffectDuration {
  PERMANENT = 'PERMANENT',
  UNTIL_END_OF_TURN = 'UNTIL_END_OF_TURN',
  UNTIL_START_OF_TURN = 'UNTIL_START_OF_TURN',
  WHILE_CONDITION_MET = 'WHILE_CONDITION_MET',
}

/**
 * Escopo de alvos de efeitos
 */
export enum EffectTargetScope {
  SELF = 'SELF',
  OWNER_REPRESENTATIVE = 'OWNER_REPRESENTATIVE',
  OPPONENT_REPRESENTATIVE = 'OPPONENT_REPRESENTATIVE',
  ALL_ALLIED_STUDENTS = 'ALL_ALLIED_STUDENTS',
  ALL_ENEMY_STUDENTS = 'ALL_ENEMY_STUDENTS',
  ALL_STUDENTS = 'ALL_STUDENTS',
  TARGET_STUDENT = 'TARGET_STUDENT',
  EVENT_SOURCE = 'EVENT_SOURCE',
  EVENT_TARGET = 'EVENT_TARGET',
}

/**
 * Condição normativa de disparo de gatilhos reativos
 */
export enum TriggerCondition {
  ON_PLAY = 'ON_PLAY',
  ON_ENTER = 'ON_ENTER',
  ON_ALLY_ATTACK = 'ON_ALLY_ATTACK',
  ON_ATTACK = 'ON_ATTACK',
  ON_DEFEATED = 'ON_DEFEATED',
  ON_ALLY_DEFEATED = 'ON_ALLY_DEFEATED',
  ON_ENEMY_DEFEATED = 'ON_ENEMY_DEFEATED',
  ON_DAMAGE_DEALT = 'ON_DAMAGE_DEALT',
  ON_TURN_START = 'ON_TURN_START',
  ON_TURN_END = 'ON_TURN_END',
  ON_PHASE_CHANGE = 'ON_PHASE_CHANGE',
  ON_DEBATE_RESOLVED = 'ON_DEBATE_RESOLVED',
}

/**
 * Definição estática de um efeito a ser resolvido
 */
export interface EffectDefinition {
  type: EffectType;
  target?: EffectTargetScope;
  targetIds?: string[];
  amount?: number;
  stat?: 'influence' | 'morale';
  duration?: EffectDuration;
  keyword?: Keyword;
  status?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Gatilho reativo orientado a dados (Trigger)
 * Define quando um efeito deve ser disparado em resposta a um evento do jogo.
 */
export interface TriggerDefinition {
  id: string;
  event: GameEventType;
  condition?: TriggerCondition;
  targetScope?: 'SELF' | 'ALLY' | 'ENEMY' | 'ANY';
  filterTrait?: string;
  filterKeyword?: Keyword;
  filterTargetType?: 'STUDENT' | 'REPRESENTATIVE';
  effects: EffectDefinition[];
  maxPerTurn?: number;
  timesTriggeredThisTurn?: number;
  description?: string;
}

/**
 * Modificador contínuo ativo no estado (ex: Reconhecimento, Liderança)
 */
export interface ContinuousModifier {
  id: string;
  sourceInstanceId: string;
  sourcePlayerId: PlayerId;
  targetScope: EffectTargetScope;
  stat: 'influence' | 'morale';
  amount: number;
  conditionDescription?: string;
}
