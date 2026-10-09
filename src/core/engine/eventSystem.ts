import { GameState } from '../types/state';
import { GamePhase } from '../types/phase';
import { PlayerId } from '../types/player';
import { CardInstance, CardType, CardZone, CardDefinition } from '../types/card';
import {
  GameEventType,
  GameEvent,
  CardPlayedEvent,
  StudentEnteredEvent,
  StudentAttackedEvent,
  StudentBlockedEvent,
  DamageDealtEvent,
  StudentDefeatedEvent,
  TurnStartedEvent,
  TurnEndedEvent,
  PhaseChangedEvent,
  PopularityGainedEvent,
  CardDrawnEvent,
  EffectAppliedEvent,
  DebateStartedEvent,
  DebateActionPlayedEvent,
  DebateActionResolvedEvent,
  DebateActionFizzledEvent,
  DebateResolvedEvent,
} from '../types/event';
import {
  EffectDefinition,
  EffectDuration,
  EffectTargetScope,
  EffectType,
  TriggerCondition,
  TriggerDefinition,
} from '../types/effect';
import { cloneGameState, getOpponentId, drawCard } from './turnSystem';
import { findCardDefinition } from '../../cards/alphaCards';
import {
  isSilenced,
  isProtected,
  evaluateContinuousKeywords,
} from './keywordSystem';

// Contador sequencial determinístico por sessão para IDs únicos de evento
let globalEventSequence = 0;

/**
 * Reseta o contador global de eventos (útil para testes determinísticos)
 */
export function resetEventSequence(): void {
  globalEventSequence = 0;
}

/**
 * Cria um identificador único e determinístico para um novo evento.
 */
export function generateEventId(turn: number, phase: GamePhase, type: GameEventType): string {
  globalEventSequence += 1;
  return `evt_${turn}_${phase}_${type}_${globalEventSequence}`;
}

// ============================================================================
// FÁBRICA DE EVENTOS CANÔNICOS
// ============================================================================

export function createCardPlayedEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    cardInstanceId: string;
    definitionId: string;
    cardType: CardType;
    cost: number;
    replacedCardInstanceId?: string;
  }
): CardPlayedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.CARD_PLAYED),
    type: GameEventType.CARD_PLAYED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createStudentEnteredEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    cardInstanceId: string;
    definitionId: string;
    hasInertia: boolean;
    ready: boolean;
  }
): StudentEnteredEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.STUDENT_ENTERED),
    type: GameEventType.STUDENT_ENTERED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createStudentAttackedEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    attackerInstanceId: string;
    targetId: string;
  }
): StudentAttackedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.STUDENT_ATTACKED),
    type: GameEventType.STUDENT_ATTACKED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createStudentBlockedEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    blockerInstanceId: string;
    attackerInstanceId: string;
  }
): StudentBlockedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.STUDENT_BLOCKED),
    type: GameEventType.STUDENT_BLOCKED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createDamageDealtEvent(
  state: GameState,
  params: {
    sourceId?: string;
    targetId: string;
    targetType: 'STUDENT' | 'REPRESENTATIVE';
    targetPlayerId: PlayerId;
    amount: number;
    isCombatDamage: boolean;
  }
): DamageDealtEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.DAMAGE_DEALT),
    type: GameEventType.DAMAGE_DEALT,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createStudentDefeatedEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    cardInstanceId: string;
    definitionId: string;
    reason?: 'COMBAT_DAMAGE' | 'SUBSTITUTION' | 'EFFECT';
  }
): StudentDefeatedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.STUDENT_DEFEATED),
    type: GameEventType.STUDENT_DEFEATED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createTurnStartedEvent(
  state: GameState,
  params: {
    turn: number;
    activePlayerId: PlayerId;
  }
): TurnStartedEvent {
  return {
    id: generateEventId(params.turn, state.phase, GameEventType.TURN_STARTED),
    type: GameEventType.TURN_STARTED,
    phase: state.phase,
    ...params,
  };
}

export function createTurnEndedEvent(
  state: GameState,
  params: {
    turn: number;
    activePlayerId: PlayerId;
  }
): TurnEndedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.TURN_ENDED),
    type: GameEventType.TURN_ENDED,
    phase: state.phase,
    ...params,
  };
}

export function createPhaseChangedEvent(
  state: GameState,
  params: {
    fromPhase: GamePhase;
    toPhase: GamePhase;
    activePlayerId: PlayerId;
  }
): PhaseChangedEvent {
  return {
    id: generateEventId(state.turn, params.toPhase, GameEventType.PHASE_CHANGED),
    type: GameEventType.PHASE_CHANGED,
    turn: state.turn,
    phase: params.toPhase,
    ...params,
  };
}

export function createPopularityGainedEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    amount: number;
    newPopularity: number;
    highlightUnlocked: boolean;
  }
): PopularityGainedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.POPULARITY_GAINED),
    type: GameEventType.POPULARITY_GAINED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createCardDrawnEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    cardInstanceId: string;
  }
): CardDrawnEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.CARD_DRAWN),
    type: GameEventType.CARD_DRAWN,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createEffectAppliedEvent(
  state: GameState,
  params: {
    effectType: string;
    sourceId?: string;
    targetId?: string;
    details?: Record<string, unknown>;
  }
): EffectAppliedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.EFFECT_APPLIED),
    type: GameEventType.EFFECT_APPLIED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createDebateStartedEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
    cardInstanceId: string;
    definitionId: string;
    targetId?: string;
  }
): DebateStartedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.DEBATE_STARTED),
    type: GameEventType.DEBATE_STARTED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createDebateActionPlayedEvent(
  state: GameState,
  params: {
    step: number;
    stepName?: string;
    playerId: PlayerId;
    cardInstanceId?: string;
    definitionId?: string;
    targetId?: string;
  }
): DebateActionPlayedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.DEBATE_ACTION_PLAYED),
    type: GameEventType.DEBATE_ACTION_PLAYED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createDebateActionResolvedEvent(
  state: GameState,
  params: {
    step: number;
    playerId: PlayerId;
    cardInstanceId?: string;
    targetId?: string;
  }
): DebateActionResolvedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.DEBATE_ACTION_RESOLVED),
    type: GameEventType.DEBATE_ACTION_RESOLVED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createDebateActionFizzledEvent(
  state: GameState,
  params: {
    step: number;
    playerId: PlayerId;
    cardInstanceId?: string;
    targetId?: string;
    reason: string;
  }
): DebateActionFizzledEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.DEBATE_ACTION_FIZZLED),
    type: GameEventType.DEBATE_ACTION_FIZZLED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

export function createDebateResolvedEvent(
  state: GameState,
  params: {
    playerId: PlayerId;
  }
): DebateResolvedEvent {
  return {
    id: generateEventId(state.turn, state.phase, GameEventType.DEBATE_RESOLVED),
    type: GameEventType.DEBATE_RESOLVED,
    turn: state.turn,
    phase: state.phase,
    ...params,
  };
}

// ============================================================================
// ESTRUTURAS DE GATILHOS E CONTEXTO DE EXECUÇÃO
// ============================================================================

export interface ActiveTriggerEntry {
  trigger: TriggerDefinition;
  sourceInstanceId: string;
  sourcePlayerId: PlayerId;
  sourceDefinition: CardDefinition;
}

export type EventListenerCallback = (
  state: GameState,
  event: GameEvent
) => { state: GameState; secondaryEvents?: GameEvent[] } | void;

export interface EventListenerRegistration {
  id: string;
  eventType: GameEventType;
  callback: EventListenerCallback;
}

export interface DispatchEventsOptions {
  cardRegistry?: Record<string, CardDefinition>;
  maxIterations?: number;
  listeners?: EventListenerRegistration[];
}

export interface DispatchEventsResult {
  state: GameState;
  emittedEvents: GameEvent[];
}

// ============================================================================
// COLETA E AVALIAÇÃO DE GATILHOS (DATA-DRIVEN)
// ============================================================================

/**
 * Coleta todos os gatilhos ativos na partida a partir das definições de:
 * 1. Representantes de ambos os jogadores
 * 2. Estudantes presentes no campo (BOARD) de ambos os jogadores
 * 3. Ambientes ativos de ambos os jogadores
 * 4. Estudantes recém-derrotados (se o evento for STUDENT_DEFEATED)
 */
export function collectActiveTriggers(
  state: GameState,
  triggeringEvent?: GameEvent,
  cardRegistry?: Record<string, CardDefinition>
): ActiveTriggerEntry[] {
  const triggers: ActiveTriggerEntry[] = [];

  for (const player of Object.values(state.players)) {
    // 1. Gatilhos do Representante
    const repDef = findCardDefinition(player.representative.definitionId, cardRegistry);
    if (repDef?.triggers) {
      for (const trigger of repDef.triggers) {
        triggers.push({
          trigger,
          sourceInstanceId: player.representative.definitionId,
          sourcePlayerId: player.id,
          sourceDefinition: repDef,
        });
      }
    }

    // 2. Gatilhos de Estudantes no campo (Silêncio anula habilidades ativas e passivas)
    for (const student of player.board) {
      if (isSilenced(student, cardRegistry)) {
        continue;
      }
      const studentDef = findCardDefinition(student.definitionId, cardRegistry);
      if (studentDef?.triggers) {
        for (const trigger of studentDef.triggers) {
          triggers.push({
            trigger,
            sourceInstanceId: student.instanceId,
            sourcePlayerId: player.id,
            sourceDefinition: studentDef,
          });
        }
      }
    }

    // 3. Gatilhos de Ambiente ativo
    if (player.environment) {
      const envDef = findCardDefinition(player.environment.definitionId, cardRegistry);
      if (envDef?.triggers) {
        for (const trigger of envDef.triggers) {
          triggers.push({
            trigger,
            sourceInstanceId: player.environment.instanceId,
            sourcePlayerId: player.id,
            sourceDefinition: envDef,
          });
        }
      }
    }
  }

  // 4. Se o evento for STUDENT_DEFEATED, inclui gatilhos de Persistência/Derrota da própria carta derrotada (salvo se silenciada)
  if (triggeringEvent?.type === GameEventType.STUDENT_DEFEATED) {
    const player = state.players[triggeringEvent.playerId];
    const defeatedCard = player?.discard.find(
      (c) => c.instanceId === triggeringEvent.cardInstanceId
    );
    const wasSilenced = defeatedCard ? isSilenced(defeatedCard, cardRegistry) : false;

    if (!wasSilenced) {
      const defeatedCardDef = findCardDefinition(triggeringEvent.definitionId, cardRegistry);
      if (defeatedCardDef?.triggers) {
        for (const trigger of defeatedCardDef.triggers) {
          if (
            trigger.event === GameEventType.STUDENT_DEFEATED &&
            (trigger.condition === TriggerCondition.ON_DEFEATED || trigger.targetScope === 'SELF')
          ) {
            triggers.push({
              trigger,
              sourceInstanceId: triggeringEvent.cardInstanceId,
              sourcePlayerId: triggeringEvent.playerId,
              sourceDefinition: defeatedCardDef,
            });
          }
        }
      }
    }
  }

  return triggers;
}

/**
 * Avalia se um evento específico satisfaz as condições do gatilho
 */
export function evaluateTriggerCondition(
  entry: ActiveTriggerEntry,
  event: GameEvent,
  _state?: GameState,
  _cardRegistry?: Record<string, CardDefinition>
): boolean {
  const { trigger, sourceInstanceId, sourcePlayerId } = entry;

  // 1. Tipo de evento deve ser idêntico
  if (trigger.event !== event.type) {
    return false;
  }

  // 2. Avaliação de Escopo (targetScope / condition)
  switch (event.type) {
    case GameEventType.STUDENT_ATTACKED: {
      const isAlly = event.playerId === sourcePlayerId;
      const isSelf = event.attackerInstanceId === sourceInstanceId;

      if (trigger.condition === TriggerCondition.ON_ALLY_ATTACK) {
        return isAlly;
      }
      if (trigger.condition === TriggerCondition.ON_ATTACK) {
        return isSelf;
      }
      if (trigger.targetScope === 'ALLY') {
        return isAlly;
      }
      if (trigger.targetScope === 'SELF') {
        return isSelf;
      }
      if (trigger.targetScope === 'ENEMY') {
        return !isAlly;
      }
      return true;
    }

    case GameEventType.STUDENT_ENTERED: {
      const isAlly = event.playerId === sourcePlayerId;
      const isSelf = event.cardInstanceId === sourceInstanceId;

      if (trigger.condition === TriggerCondition.ON_ENTER || trigger.targetScope === 'SELF') {
        return isSelf;
      }
      if (trigger.targetScope === 'ALLY') {
        return isAlly;
      }
      if (trigger.targetScope === 'ENEMY') {
        return !isAlly;
      }
      return true;
    }

    case GameEventType.CARD_PLAYED: {
      const isAlly = event.playerId === sourcePlayerId;
      const isSelf = event.cardInstanceId === sourceInstanceId;

      if (trigger.condition === TriggerCondition.ON_PLAY || trigger.targetScope === 'SELF') {
        return isSelf;
      }
      if (trigger.targetScope === 'ALLY') {
        return isAlly;
      }
      if (trigger.targetScope === 'ENEMY') {
        return !isAlly;
      }
      return true;
    }

    case GameEventType.STUDENT_DEFEATED: {
      const isAlly = event.playerId === sourcePlayerId;
      const isSelf = event.cardInstanceId === sourceInstanceId;

      if (trigger.condition === TriggerCondition.ON_DEFEATED || trigger.targetScope === 'SELF') {
        return isSelf;
      }
      if (trigger.condition === TriggerCondition.ON_ALLY_DEFEATED || trigger.targetScope === 'ALLY') {
        return isAlly && !isSelf;
      }
      if (trigger.condition === TriggerCondition.ON_ENEMY_DEFEATED || trigger.targetScope === 'ENEMY') {
        return !isAlly;
      }
      return true;
    }

    case GameEventType.DAMAGE_DEALT: {
      const isTargetAlly = event.targetPlayerId === sourcePlayerId;
      const isTargetSelf = event.targetId === sourceInstanceId;
      const isSourceSelf = event.sourceId === sourceInstanceId;

      if (trigger.targetScope === 'SELF') {
        return isTargetSelf || isSourceSelf;
      }
      if (trigger.targetScope === 'ALLY') {
        return isTargetAlly;
      }
      if (trigger.targetScope === 'ENEMY') {
        return !isTargetAlly;
      }
      return true;
    }

    case GameEventType.TURN_STARTED: {
      const isActivePlayer = event.activePlayerId === sourcePlayerId;
      if (trigger.targetScope === 'ALLY') {
        return isActivePlayer;
      }
      if (trigger.targetScope === 'ENEMY') {
        return !isActivePlayer;
      }
      return true;
    }

    case GameEventType.PHASE_CHANGED: {
      const isActivePlayer = event.activePlayerId === sourcePlayerId;
      if (trigger.targetScope === 'ALLY') {
        return isActivePlayer;
      }
      if (trigger.targetScope === 'ENEMY') {
        return !isActivePlayer;
      }
      return true;
    }

    case GameEventType.DEBATE_RESOLVED: {
      return true;
    }

    default:
      return true;
  }
}

// ============================================================================
// RESOLUÇÃO DE EFEITOS (DATA-DRIVEN EFFECT PROCESSOR)
// ============================================================================

export interface ApplyEffectParams {
  state: GameState;
  effect: EffectDefinition;
  sourcePlayerId: PlayerId;
  sourceInstanceId: string;
  triggeringEvent: GameEvent;
  cardRegistry?: Record<string, CardDefinition>;
}

export interface ApplyEffectResult {
  state: GameState;
  emittedEvents: GameEvent[];
}

/**
 * Aplica um efeito individual de forma pura e imutável ao GameState,
 * emitindo quaisquer novos eventos resultantes da modificação.
 */
export function applyEffect(params: ApplyEffectParams): ApplyEffectResult {
  const { effect, sourcePlayerId, sourceInstanceId, triggeringEvent, cardRegistry: _cardRegistry } = params;
  const nextState = cloneGameState(params.state);
  const emittedEvents: GameEvent[] = [];

  switch (effect.type) {
    // ------------------------------------------------------------------------
    // GANHO DE POPULARIDADE DO REPRESENTANTE
    // ------------------------------------------------------------------------
    case EffectType.GAIN_POPULARITY: {
      const targetPlayerId =
        effect.target === EffectTargetScope.OPPONENT_REPRESENTATIVE
          ? getOpponentId(nextState, sourcePlayerId)
          : sourcePlayerId;

      const player = nextState.players[targetPlayerId];
      if (player?.representative) {
        const amount = effect.amount ?? 1;
        player.representative.popularity += amount;

        let highlightUnlocked = false;
        if (
          player.representative.popularity >= player.representative.popularityRequirement &&
          !player.representative.highlightAvailable
        ) {
          player.representative.highlightAvailable = true;
          highlightUnlocked = true;
        }

        emittedEvents.push(
          createPopularityGainedEvent(nextState, {
            playerId: targetPlayerId,
            amount,
            newPopularity: player.representative.popularity,
            highlightUnlocked,
          })
        );
      }
      break;
    }

    // ------------------------------------------------------------------------
    // MODIFICAÇÃO DE ATRIBUTOS (INFLUENCE / MORALE)
    // ------------------------------------------------------------------------
    case EffectType.MODIFY_STAT: {
      const stat = effect.stat ?? 'influence';
      const amount = effect.amount ?? 0;

      // Determina alvos com base no targetScope
      const targetStudents: CardInstance[] = [];
      const activePlayer = nextState.players[sourcePlayerId];
      const opponentId = getOpponentId(nextState, sourcePlayerId);
      const opponent = nextState.players[opponentId];

      if (effect.target === EffectTargetScope.SELF) {
        const selfStudent = activePlayer?.board.find((s) => s.instanceId === sourceInstanceId);
        if (selfStudent) targetStudents.push(selfStudent);
      } else if (effect.target === EffectTargetScope.ALL_ALLIED_STUDENTS) {
        if (activePlayer) targetStudents.push(...activePlayer.board);
      } else if (effect.target === EffectTargetScope.ALL_ENEMY_STUDENTS) {
        if (opponent) targetStudents.push(...opponent.board);
      } else if (effect.target === EffectTargetScope.ALL_STUDENTS) {
        if (activePlayer) targetStudents.push(...activePlayer.board);
        if (opponent) targetStudents.push(...opponent.board);
      } else if (effect.targetIds && effect.targetIds.length > 0) {
        for (const tid of effect.targetIds) {
          const st =
            activePlayer?.board.find((s) => s.instanceId === tid) ??
            opponent?.board.find((s) => s.instanceId === tid);
          // Proteção impede ser alvo de habilidades e/ou Debates direcionados
          if (st && !isProtected(st, _cardRegistry)) {
            targetStudents.push(st);
          }
        }
      }

      for (const target of targetStudents) {
        if (stat === 'influence') {
          target.currentInfluence = Math.max(0, (target.currentInfluence ?? 0) + amount);
        } else if (stat === 'morale') {
          target.currentMorale = (target.currentMorale ?? 0) + amount;
          // Se moral for aumentada além do maxMorale e for cura permanente
          if ((target.currentMorale ?? 0) > (target.maxMorale ?? 0)) {
            target.maxMorale = target.currentMorale;
          }
        }

        if (effect.duration === EffectDuration.UNTIL_END_OF_TURN) {
          target.statuses.push(`TEMP_STAT_${stat.toUpperCase()}_${amount}`);
        }

        emittedEvents.push(
          createEffectAppliedEvent(nextState, {
            effectType: EffectType.MODIFY_STAT,
            sourceId: sourceInstanceId,
            targetId: target.instanceId,
            details: { stat, amount, duration: effect.duration },
          })
        );
      }
      break;
    }

    // ------------------------------------------------------------------------
    // COMPRA DE CARTA
    // ------------------------------------------------------------------------
    case EffectType.DRAW_CARD: {
      const targetPlayerId =
        effect.target === EffectTargetScope.OPPONENT_REPRESENTATIVE
          ? getOpponentId(nextState, sourcePlayerId)
          : sourcePlayerId;

      const count = effect.amount ?? 1;
      for (let i = 0; i < count; i++) {
        const drawRes = drawCard(nextState, targetPlayerId);
        Object.assign(nextState, drawRes.state);
        if (drawRes.cardDrawn) {
          emittedEvents.push(
            createCardDrawnEvent(nextState, {
              playerId: targetPlayerId,
              cardInstanceId: drawRes.cardDrawn.instanceId,
            })
          );
        }
      }
      break;
    }

    // ------------------------------------------------------------------------
    // GANHO / RESTAURAÇÃO DE ENERGIA
    // ------------------------------------------------------------------------
    case EffectType.GAIN_ENERGY: {
      const targetPlayerId = sourcePlayerId;
      const player = nextState.players[targetPlayerId];
      if (player) {
        const amount = effect.amount ?? 1;
        player.energy = Math.min(player.maxEnergy, player.energy + amount);
        emittedEvents.push(
          createEffectAppliedEvent(nextState, {
            effectType: EffectType.GAIN_ENERGY,
            sourceId: sourceInstanceId,
            targetId: targetPlayerId,
            details: { amount },
          })
        );
      }
      break;
    }

    // ------------------------------------------------------------------------
    // RESSURREIÇÃO / PERSISTÊNCIA (Keyword PERSISTÊNCIA)
    // ------------------------------------------------------------------------
    case EffectType.REVIVE_STUDENT: {
      // Aplicável quando uma carta com Persistência é derrotada pela primeira vez
      if (triggeringEvent.type === GameEventType.STUDENT_DEFEATED) {
        const player = nextState.players[triggeringEvent.playerId];
        if (player && player.board.length < 6) {
          const discardIndex = player.discard.findIndex(
            (c) => c.instanceId === triggeringEvent.cardInstanceId
          );
          if (discardIndex !== -1) {
            const [revivedCard] = player.discard.splice(discardIndex, 1);
            // Verifica se já usou persistência anteriormente
            if (!revivedCard.statuses.includes('PERSISTENCIA_USED')) {
              revivedCard.zone = CardZone.BOARD;
              revivedCard.currentMorale = effect.amount ?? 1;
              revivedCard.ready = false;
              revivedCard.hasInertia = false;
              revivedCard.statuses.push('PERSISTENCIA_USED');
              player.board.push(revivedCard);

              emittedEvents.push(
                createStudentEnteredEvent(nextState, {
                  playerId: player.id,
                  cardInstanceId: revivedCard.instanceId,
                  definitionId: revivedCard.definitionId,
                  hasInertia: false,
                  ready: false,
                })
              );

              emittedEvents.push(
                createEffectAppliedEvent(nextState, {
                  effectType: EffectType.REVIVE_STUDENT,
                  sourceId: sourceInstanceId,
                  targetId: revivedCard.instanceId,
                  details: { morale: revivedCard.currentMorale },
                })
              );
            } else {
              // Se já utilizou persistência, permanece no descarte
              player.discard.splice(discardIndex, 0, revivedCard);
            }
          }
        }
      }
      break;
    }

    // ------------------------------------------------------------------------
    // CONCESSÃO OU REMOÇÃO DE STATUS / KEYWORD
    // ------------------------------------------------------------------------
    case EffectType.GRANT_KEYWORD:
    case EffectType.APPLY_STATUS: {
      const statusToAdd = effect.status ?? (effect.keyword ? `KEYWORD_${effect.keyword}` : '');
      if (statusToAdd) {
        const player = nextState.players[sourcePlayerId];
        const target = player?.board.find((s) => s.instanceId === sourceInstanceId);
        if (target && !target.statuses.includes(statusToAdd)) {
          target.statuses.push(statusToAdd);
          emittedEvents.push(
            createEffectAppliedEvent(nextState, {
              effectType: effect.type,
              sourceId: sourceInstanceId,
              targetId: target.instanceId,
              details: { status: statusToAdd },
            })
          );
        }
      }
      break;
    }

    default:
      break;
  }

  return { state: nextState, emittedEvents };
}

// ============================================================================
// BARRAMENTO DE EVENTOS E CICLO DE RESOLUÇÃO (EVENT BUS & DISPATCHER)
// ============================================================================

/**
 * Processador central e determinístico de eventos e gatilhos reativos.
 * Conforme docs/agents/SKILL.md regra 15:
 * Action -> Resolution -> Event -> Trigger -> Effect -> New Event -> New GameState.
 *
 * Garante segurança contra loops infinitos através de maxIterations (padrão: 50).
 */
export function dispatchEvents(
  initialState: GameState,
  eventsToProcess: GameEvent[],
  options: DispatchEventsOptions = {}
): DispatchEventsResult {
  let currentState = cloneGameState(initialState);
  const eventQueue: GameEvent[] = [...eventsToProcess];
  const allEmittedEvents: GameEvent[] = [...eventsToProcess];
  const maxIterations = options.maxIterations ?? 50;
  let iterations = 0;

  while (eventQueue.length > 0 && iterations < maxIterations) {
    iterations += 1;
    const currentEvent = eventQueue.shift()!;

    // 1. Notifica listeners procedurais registrados
    if (options.listeners) {
      for (const listener of options.listeners) {
        if (listener.eventType === currentEvent.type) {
          const listenerResult = listener.callback(currentState, currentEvent);
          if (listenerResult) {
            currentState = listenerResult.state;
            if (listenerResult.secondaryEvents && listenerResult.secondaryEvents.length > 0) {
              eventQueue.push(...listenerResult.secondaryEvents);
              allEmittedEvents.push(...listenerResult.secondaryEvents);
            }
          }
        }
      }
    }

    // 2. Coleta gatilhos ativos na partida orientados a dados
    const activeTriggers = collectActiveTriggers(
      currentState,
      currentEvent,
      options.cardRegistry
    );

    // 3. Avalia e dispara efeitos para cada gatilho compatível
    for (const entry of activeTriggers) {
      if (evaluateTriggerCondition(entry, currentEvent, currentState, options.cardRegistry)) {
        for (const effect of entry.trigger.effects) {
          const effectRes = applyEffect({
            state: currentState,
            effect,
            sourcePlayerId: entry.sourcePlayerId,
            sourceInstanceId: entry.sourceInstanceId,
            triggeringEvent: currentEvent,
            cardRegistry: options.cardRegistry,
          });

          currentState = effectRes.state;

          if (effectRes.emittedEvents.length > 0) {
            eventQueue.push(...effectRes.emittedEvents);
            allEmittedEvents.push(...effectRes.emittedEvents);
          }
        }
      }
    }
  }

  // 4. Reavalia modificadores contínuos no estado resultante
  currentState = evaluateContinuousEffects(currentState, options.cardRegistry);

  return {
    state: currentState,
    emittedEvents: allEmittedEvents,
  };
}

// ============================================================================
// EFEITOS CONTÍNUOS / ESTÁTICOS (AURA & KEYWORDS CONTÍNUAS)
// ============================================================================

/**
 * Avalia efeitos contínuos estáticos e auras de Keywords (Reconhecimento, Liderança, Colaboração, Aprendizagem, Silêncio).
 * Delega para o Keyword Engine unificado e puro.
 */
export function evaluateContinuousEffects(
  state: GameState,
  cardRegistry?: Record<string, CardDefinition>
): GameState {
  return evaluateContinuousKeywords(state, cardRegistry);
}

// ============================================================================
// CLASSE EVENTBUS (INTERFACE CONVENIENTE E RETROCOMPATÍVEL)
// ============================================================================

export class EventBus {
  private listeners: EventListenerRegistration[] = [];
  private cardRegistry?: Record<string, CardDefinition>;

  constructor(cardRegistry?: Record<string, CardDefinition>) {
    this.cardRegistry = cardRegistry;
  }

  public subscribe(eventType: GameEventType, callback: EventListenerCallback): string {
    const id = `listener_${this.listeners.length + 1}`;
    this.listeners.push({ id, eventType, callback });
    return id;
  }

  public unsubscribe(listenerId: string): void {
    this.listeners = this.listeners.filter((l) => l.id !== listenerId);
  }

  public dispatch(state: GameState, event: GameEvent): DispatchEventsResult {
    return dispatchEvents(state, [event], {
      cardRegistry: this.cardRegistry,
      listeners: this.listeners,
    });
  }

  public dispatchAll(state: GameState, events: GameEvent[]): DispatchEventsResult {
    return dispatchEvents(state, events, {
      cardRegistry: this.cardRegistry,
      listeners: this.listeners,
    });
  }
}
