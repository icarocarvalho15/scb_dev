import { GameState, GameStatus, DebateActionEntry, DebateStepName } from '../types/state';
import { GamePhase } from '../types/phase';
import { PlayerId } from '../types/player';
import { CardInstance, CardType, CardZone, CardDefinition } from '../types/card';
import {
  StartDebateAction,
  RespondDebateAction,
  PassDebateAction,
  ResolveDebateAction,
} from '../types/action';
import { ActionErrorCode, ActionResult, ActionError } from '../types/error';
import { EffectDefinition, EffectTargetScope, EffectType, EffectDuration } from '../types/effect';
import { GameEvent } from '../types/event';
import { cloneGameState, getOpponentId, drawCard } from './turnSystem';
import { findCardDefinition } from '../../cards/alphaCards';
import { isProtected } from './keywordSystem';
import {
  createDebateStartedEvent,
  createDebateActionPlayedEvent,
  createDebateActionResolvedEvent,
  createDebateActionFizzledEvent,
  createDebateResolvedEvent,
  createCardPlayedEvent,
  createEffectAppliedEvent,
  createStudentDefeatedEvent,
  createPopularityGainedEvent,
  createCardDrawnEvent,
  dispatchEvents,
} from './eventSystem';

/**
 * Teto normativo Alpha de ações na cadeia de Debate (Ação Inicial -> Réplica -> Tréplica -> Contrarréplica)
 * Conforme docs/rules/SCB_Rules.md Seção 24 e docs/agents/SCB_Debate_Engineer.md
 */
export const MAX_DEBATE_CHAIN_ACTIONS = 4;

/**
 * Mapeia o número do passo (1 a 4) para o nome canônico do nível de debate.
 */
export function getDebateStepName(step: number): DebateStepName {
  switch (step) {
    case 1:
      return 'INITIAL';
    case 2:
      return 'REPLICA';
    case 3:
      return 'TREPLICA';
    case 4:
      return 'CONTRARREPLICA';
    default:
      return 'INITIAL';
  }
}

/**
 * Determina qual jogador tem a iniciativa/prioridade para responder no debate atual.
 * - Passo 0 (início): Jogador ativo
 * - Passo 1 (após Ação Inicial): Oponente (Réplica)
 * - Passo 2 (após Réplica): Jogador ativo (Tréplica)
 * - Passo 3 (após Tréplica): Oponente (Contrarréplica)
 * - Passo 4 (cadeia cheia): Ninguém (cadeia atinge o teto)
 */
export function getNextDebatePlayerId(state: GameState): PlayerId | null {
  if (!state.debate.active) {
    return state.activePlayerId;
  }
  if (state.debate.currentStep >= MAX_DEBATE_CHAIN_ACTIONS) {
    return null;
  }

  const initiatorId = state.debate.initiatorPlayerId ?? state.activePlayerId;
  const opponentId = getOpponentId(state, initiatorId);

  // Passo 1 -> próximo é oponente (passo 2 - Réplica)
  if (state.debate.currentStep === 1) {
    return opponentId;
  }
  // Passo 2 -> próximo é iniciador (passo 3 - Tréplica)
  if (state.debate.currentStep === 2) {
    return initiatorId;
  }
  // Passo 3 -> próximo é oponente (passo 4 - Contrarréplica)
  if (state.debate.currentStep === 3) {
    return opponentId;
  }

  return null;
}

/**
 * Verifica se a cadeia de debate atingiu a capacidade máxima de ações (Teto Alpha = 4).
 */
export function isDebateChainFull(state: GameState): boolean {
  return (
    state.debate.actions.length >= MAX_DEBATE_CHAIN_ACTIONS ||
    state.debate.currentStep >= MAX_DEBATE_CHAIN_ACTIONS
  );
}

// ============================================================================
// VALIDAÇÃO E EXECUÇÃO: START_DEBATE (AÇÃO INICIAL)
// ============================================================================

export interface StartDebateValidationResult {
  valid: boolean;
  error?: ActionError;
  cardDefinition?: CardDefinition;
  cardInstance?: CardInstance;
}

/**
 * Validação pura de START_DEBATE.
 * Regras:
 * 1. Partida ativa.
 * 2. Fase DEBATE obrigatória.
 * 3. Apenas o jogador ativo pode iniciar a Debate Phase.
 * 4. Não pode haver debate já ativo.
 * 5. A carta deve estar na mão do jogador ativo.
 * 6. A carta deve ser do tipo DEBATE.
 * 7. Jogador deve possuir Energia suficiente.
 * 8. Se houver alvo estudante no board, não pode possuir Keyword.PROTECAO.
 */
export function validateStartDebate(
  state: GameState,
  action: StartDebateAction,
  cardRegistry?: Record<string, CardDefinition>
): StartDebateValidationResult {
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: { code: ActionErrorCode.GAME_OVER, message: 'A partida já foi encerrada.' },
    };
  }

  if (state.phase !== GamePhase.DEBATE) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: `Debates só podem ser iniciados durante a Debate Phase. Fase atual: ${state.phase}.`,
      },
    };
  }

  if (action.playerId !== state.activePlayerId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: 'Apenas o jogador ativo possui a iniciativa para iniciar a Debate Phase.',
      },
    };
  }

  if (state.debate.active) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.DEBATE_ALREADY_ACTIVE,
        message: 'Já existe uma cadeia de Debate ativa em andamento.',
      },
    };
  }

  const player = state.players[action.playerId];
  if (!player) {
    return {
      valid: false,
      error: { code: ActionErrorCode.INVALID_PLAYER, message: 'Jogador não encontrado no estado.' },
    };
  }

  const cardInstance = player.hand.find((c) => c.instanceId === action.cardInstanceId);
  if (!cardInstance || cardInstance.zone !== CardZone.HAND) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.CARD_NOT_IN_HAND,
        message: `A carta com ID ${action.cardInstanceId} não está na mão do jogador.`,
      },
    };
  }

  const cardDef = findCardDefinition(cardInstance.definitionId, cardRegistry);
  if (!cardDef) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: `Definição da carta ${cardInstance.definitionId} não encontrada.`,
      },
    };
  }

  if (cardDef.type !== CardType.DEBATE) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.NOT_DEBATE_CARD,
        message: `Apenas cartas do tipo DEBATE podem ser jogadas no Debate. Tipo atual: ${cardDef.type}.`,
      },
    };
  }

  if (player.energy < cardDef.cost) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.NOT_ENOUGH_ENERGY,
        message: `Energia insuficiente para jogar ${cardDef.name}. Custo: ${cardDef.cost}, Energia atual: ${player.energy}.`,
      },
    };
  }

  // Validação de Proteção no alvo declarado
  if (action.targetId) {
    for (const p of Object.values(state.players)) {
      const targetStudent = p.board.find((s) => s.instanceId === action.targetId);
      if (targetStudent && isProtected(targetStudent, cardRegistry)) {
        return {
          valid: false,
          error: {
            code: ActionErrorCode.PROTECTION_RESTRICTION,
            message: 'O Estudante alvo possui Proteção e não pode ser alvo de cartas ou habilidades de debate.',
          },
        };
      }
    }
  }

  return { valid: true, cardDefinition: cardDef, cardInstance };
}

/**
 * Inicia uma nova cadeia de debate de forma pura e determinística.
 */
export function startDebate(
  state: GameState,
  action: StartDebateAction,
  cardRegistry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const val = validateStartDebate(state, action, cardRegistry);
  if (!val.valid) {
    return { success: false, error: val.error! };
  }

  const cardDef = val.cardDefinition!;
  const nextState = cloneGameState(state);
  const player = nextState.players[action.playerId];

  // 1. Pagamento de energia
  player.energy -= cardDef.cost;

  // 2. Transfere a carta da mão para a zona de Debate
  const cardIndex = player.hand.findIndex((c) => c.instanceId === action.cardInstanceId);
  const [cardInst] = player.hand.splice(cardIndex, 1);
  cardInst.zone = CardZone.DEBATE;

  // 3. Monta a entrada na pilha de debate
  const entry: DebateActionEntry = {
    id: `debate_action_1_${action.cardInstanceId}`,
    step: 1,
    stepName: 'INITIAL',
    playerId: action.playerId,
    cardInstanceId: action.cardInstanceId,
    cardDefinitionId: cardDef.id,
    targetId: action.targetId,
    targetIds: action.targetIds,
    parameters: action.parameters,
    passed: false,
  };

  // Armazena a instância da carta em trânsito no debate
  (entry as unknown as { cardInstance: CardInstance }).cardInstance = cardInst;

  // 4. Atualiza o DebateState
  nextState.debate = {
    active: true,
    initiatorPlayerId: action.playerId,
    currentStep: 1,
    actions: [entry],
    consecutivePasses: 0,
  };

  // 5. Emissão de eventos canônicos
  const debateStartedEvent = createDebateStartedEvent(nextState, {
    playerId: action.playerId,
    cardInstanceId: action.cardInstanceId,
    definitionId: cardDef.id,
    targetId: action.targetId,
  });

  const debateActionPlayedEvent = createDebateActionPlayedEvent(nextState, {
    step: 1,
    stepName: 'INITIAL',
    playerId: action.playerId,
    cardInstanceId: action.cardInstanceId,
    definitionId: cardDef.id,
    targetId: action.targetId,
  });

  const cardPlayedEvent = createCardPlayedEvent(nextState, {
    playerId: action.playerId,
    cardInstanceId: action.cardInstanceId,
    definitionId: cardDef.id,
    cardType: CardType.DEBATE,
    cost: cardDef.cost,
  });

  const dispatchResult = dispatchEvents(
    nextState,
    [debateStartedEvent, debateActionPlayedEvent, cardPlayedEvent],
    { cardRegistry }
  );

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}

// ============================================================================
// VALIDAÇÃO E EXECUÇÃO: RESPOND_DEBATE (RÉPLICA / TRÉPLICA / CONTRARRÉPLICA)
// ============================================================================

export interface RespondDebateValidationResult {
  valid: boolean;
  error?: ActionError;
  cardDefinition?: CardDefinition;
  cardInstance?: CardInstance;
  isPass?: boolean;
}

/**
 * Validação pura de RESPOND_DEBATE.
 */
export function validateRespondDebate(
  state: GameState,
  action: RespondDebateAction,
  cardRegistry?: Record<string, CardDefinition>
): RespondDebateValidationResult {
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: { code: ActionErrorCode.GAME_OVER, message: 'A partida já foi encerrada.' },
    };
  }

  if (state.phase !== GamePhase.DEBATE) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: `Respostas de debate só são válidas na Debate Phase. Fase atual: ${state.phase}.`,
      },
    };
  }

  if (!state.debate.active) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.DEBATE_NOT_ACTIVE,
        message: 'Não há debate ativo em andamento para responder.',
      },
    };
  }

  // Teto Alpha: se já houver 4 ações ou passo 4, rejeita com DEBATE_CHAIN_FULL
  if (isDebateChainFull(state)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.DEBATE_CHAIN_FULL,
        message:
          'O debate já atingiu o limite máximo de 4 ações (Contrarréplica). Nenhuma outra resposta é permitida.',
      },
    };
  }

  const expectedPlayerId = getNextDebatePlayerId(state);
  if (action.playerId !== expectedPlayerId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: `Não é o momento deste jogador (${action.playerId}) responder. Jogador esperado: ${expectedPlayerId}.`,
      },
    };
  }

  // Se for ação de passar como resposta
  if (action.pass) {
    return { valid: true, isPass: true };
  }

  // Se for jogar carta
  if (!action.cardInstanceId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: 'cardInstanceId é obrigatório quando a resposta não é um passe.',
      },
    };
  }

  const player = state.players[action.playerId];
  if (!player) {
    return {
      valid: false,
      error: { code: ActionErrorCode.INVALID_PLAYER, message: 'Jogador não encontrado no estado.' },
    };
  }

  const cardInstance = player.hand.find((c) => c.instanceId === action.cardInstanceId);
  if (!cardInstance || cardInstance.zone !== CardZone.HAND) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.CARD_NOT_IN_HAND,
        message: `A carta com ID ${action.cardInstanceId} não está na mão do jogador.`,
      },
    };
  }

  const cardDef = findCardDefinition(cardInstance.definitionId, cardRegistry);
  if (!cardDef) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: `Definição da carta ${cardInstance.definitionId} não encontrada.`,
      },
    };
  }

  if (cardDef.type !== CardType.DEBATE) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.NOT_DEBATE_CARD,
        message: `Apenas cartas do tipo DEBATE podem ser jogadas como resposta no debate.`,
      },
    };
  }

  if (player.energy < cardDef.cost) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.NOT_ENOUGH_ENERGY,
        message: `Energia insuficiente para responder com ${cardDef.name}. Custo: ${cardDef.cost}, Energia atual: ${player.energy}.`,
      },
    };
  }

  // Validação de Proteção no alvo declarado
  if (action.targetId) {
    for (const p of Object.values(state.players)) {
      const targetStudent = p.board.find((s) => s.instanceId === action.targetId);
      if (targetStudent && isProtected(targetStudent, cardRegistry)) {
        return {
          valid: false,
          error: {
            code: ActionErrorCode.PROTECTION_RESTRICTION,
            message: 'O Estudante alvo possui Proteção e não pode ser alvo de cartas ou habilidades de debate.',
          },
        };
      }
    }
  }

  return { valid: true, cardDefinition: cardDef, cardInstance, isPass: false };
}

/**
 * Aplica uma resposta (Réplica, Tréplica ou Contrarréplica) na cadeia de debate.
 * Se action.pass === true, fecha a cadeia e resolve a pilha imediatamente.
 */
export function respondDebate(
  state: GameState,
  action: RespondDebateAction,
  cardRegistry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const val = validateRespondDebate(state, action, cardRegistry);
  if (!val.valid) {
    return { success: false, error: val.error! };
  }

  // Se o jogador optou por passar na resposta: fecha a pilha e resolve
  if (val.isPass) {
    return resolveDebate(state, cardRegistry);
  }

  const cardDef = val.cardDefinition!;
  const nextState = cloneGameState(state);
  const player = nextState.players[action.playerId];

  // 1. Pagamento de Energia
  player.energy -= cardDef.cost;

  // 2. Move carta da mão para zona de debate
  const cardIndex = player.hand.findIndex((c) => c.instanceId === action.cardInstanceId);
  const [cardInst] = player.hand.splice(cardIndex, 1);
  cardInst.zone = CardZone.DEBATE;

  // 3. Incrementa o passo (2: Réplica, 3: Tréplica, 4: Contrarréplica)
  const nextStep = nextState.debate.currentStep + 1;
  const stepName = getDebateStepName(nextStep);

  const entry: DebateActionEntry = {
    id: `debate_action_${nextStep}_${action.cardInstanceId}`,
    step: nextStep,
    stepName,
    playerId: action.playerId,
    cardInstanceId: action.cardInstanceId,
    cardDefinitionId: cardDef.id,
    targetId: action.targetId,
    targetIds: action.targetIds,
    parameters: action.parameters,
    passed: false,
  };

  (entry as unknown as { cardInstance: CardInstance }).cardInstance = cardInst;

  nextState.debate.actions.push(entry);
  nextState.debate.currentStep = nextStep;
  nextState.debate.consecutivePasses = 0;

  // 4. Emissão de eventos
  const debateActionPlayedEvent = createDebateActionPlayedEvent(nextState, {
    step: nextStep,
    stepName,
    playerId: action.playerId,
    cardInstanceId: action.cardInstanceId,
    definitionId: cardDef.id,
    targetId: action.targetId,
  });

  const cardPlayedEvent = createCardPlayedEvent(nextState, {
    playerId: action.playerId,
    cardInstanceId: action.cardInstanceId!,
    definitionId: cardDef.id,
    cardType: CardType.DEBATE,
    cost: cardDef.cost,
  });

  const dispatchResult = dispatchEvents(nextState, [debateActionPlayedEvent, cardPlayedEvent], {
    cardRegistry,
  });

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}

// ============================================================================
// VALIDAÇÃO E EXECUÇÃO: PASS_DEBATE (PASSAR PRIORIDADE NO DEBATE)
// ============================================================================

export function validatePassDebate(
  state: GameState,
  action: PassDebateAction,
  _cardRegistry?: Record<string, CardDefinition>
): { valid: boolean; error?: ActionError } {
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: { code: ActionErrorCode.GAME_OVER, message: 'A partida já foi encerrada.' },
    };
  }

  if (state.phase !== GamePhase.DEBATE) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: 'Ação de passar debate só é permitida na Debate Phase.',
      },
    };
  }

  // Se não há debate ativo: apenas o jogador ativo pode passar a prioridade inicial
  if (!state.debate.active) {
    if (action.playerId !== state.activePlayerId) {
      return {
        valid: false,
        error: {
          code: ActionErrorCode.INVALID_PLAYER,
          message: 'Apenas o jogador ativo possui a prioridade inicial da Debate Phase.',
        },
      };
    }
    return { valid: true };
  }

  // Se há debate ativo: apenas o jogador com prioridade pode passar
  const expectedPlayerId = getNextDebatePlayerId(state);
  if (expectedPlayerId && action.playerId !== expectedPlayerId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: `Apenas o jogador com prioridade (${expectedPlayerId}) pode passar no debate agora.`,
      },
    };
  }

  return { valid: true };
}

/**
 * Executa a ação de passar no Debate (PASS_DEBATE).
 * - Se o debate estiver ativo e houver ações acumuladas: fecha a cadeia e resolve a pilha LIFO.
 * - Se o debate não foi iniciado (passe consecutivo / passar a fase): encerra a Debate Phase e avança para COMBAT.
 */
export function passDebate(
  state: GameState,
  action: PassDebateAction,
  cardRegistry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const val = validatePassDebate(state, action, cardRegistry);
  if (!val.valid) {
    return { success: false, error: val.error! };
  }

  // Caso 1: Debate ativo com ações pendentes -> resolve a pilha LIFO
  if (state.debate.active && state.debate.actions.length > 0) {
    return resolveDebate(state, cardRegistry);
  }

  // Caso 2: Debate inativo (jogador ativo passa sem iniciar debate) -> avança para COMBAT
  const nextState = cloneGameState(state);
  nextState.debate = {
    active: false,
    initiatorPlayerId: null,
    currentStep: 0,
    actions: [],
    consecutivePasses: (state.debate.consecutivePasses ?? 0) + 1,
  };
  nextState.phase = GamePhase.COMBAT;

  return { success: true, state: nextState, events: [] };
}

// ============================================================================
// VALIDAÇÃO E RESOLUÇÃO EM PILHA LIFO (LAST IN, FIRST OUT)
// ============================================================================

export function validateResolveDebate(
  state: GameState,
  _action?: ResolveDebateAction,
  _cardRegistry?: Record<string, CardDefinition>
): { valid: boolean; error?: ActionError } {
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: { code: ActionErrorCode.GAME_OVER, message: 'A partida já foi encerrada.' },
    };
  }

  if (state.phase !== GamePhase.DEBATE) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: 'Resolução de debate só pode ocorrer na Debate Phase.',
      },
    };
  }

  return { valid: true };
}

/**
 * Avalia se o alvo de um efeito ainda é válido no momento da resolução.
 * Conforme docs/rules/SCB_Rules.md e docs/agents/SCB_Debate_Engineer.md (TARGET INVALIDATION):
 * Se o alvo se tornar inválido (removido do campo ou protegido):
 * - o efeito que depende daquele alvo falha (fizzle);
 * - outros efeitos independentes continuam normalmente.
 */
export function isEffectTargetValid(
  state: GameState,
  targetId: string | undefined,
  effect: EffectDefinition,
  cardRegistry?: Record<string, CardDefinition>
): { valid: boolean; reason?: 'TARGET_NOT_FOUND' | 'TARGET_PROTECTED' | 'TARGET_DEAD' } {
  const targetScope = effect.target;

  // Efeitos independentes (sem dependência direta de um alvo único) nunca falham por alvo
  const isTargetDependent =
    targetScope === EffectTargetScope.TARGET_STUDENT ||
    (Boolean(targetId) &&
      targetScope !== EffectTargetScope.ALL_ALLIED_STUDENTS &&
      targetScope !== EffectTargetScope.ALL_ENEMY_STUDENTS &&
      targetScope !== EffectTargetScope.ALL_STUDENTS &&
      targetScope !== EffectTargetScope.OWNER_REPRESENTATIVE &&
      targetScope !== EffectTargetScope.OPPONENT_REPRESENTATIVE &&
      targetScope !== EffectTargetScope.SELF);

  if (!isTargetDependent || !targetId) {
    return { valid: true };
  }

  // 1. Procura entre estudantes em campo
  for (const player of Object.values(state.players)) {
    const student = player.board.find((s) => s.instanceId === targetId);
    if (student) {
      if ((student.currentMorale ?? 0) <= 0) {
        return { valid: false, reason: 'TARGET_DEAD' };
      }
      if (isProtected(student, cardRegistry)) {
        return { valid: false, reason: 'TARGET_PROTECTED' };
      }
      return { valid: true };
    }
  }

  // 2. Procura entre Representantes
  for (const player of Object.values(state.players)) {
    if (
      player.id === targetId ||
      player.representative?.definitionId === targetId ||
      player.representative?.ownerId === targetId ||
      player.representative?.name === targetId
    ) {
      if (player.representative.currentMorale <= 0) {
        return { valid: false, reason: 'TARGET_DEAD' };
      }
      return { valid: true };
    }
  }

  // Alvo não encontrado em nenhuma zona de jogo válida
  return { valid: false, reason: 'TARGET_NOT_FOUND' };
}

/**
 * Aplica um efeito individual de uma carta de debate no estado,
 * respeitando a regra de Invalidação Parcial de Alvos.
 */
export function applyDebateEffect(
  state: GameState,
  effect: EffectDefinition,
  entry: DebateActionEntry,
  cardRegistry?: Record<string, CardDefinition>
): { state: GameState; events: GameEvent[]; fizzled: boolean; reason?: string } {
  const nextState = cloneGameState(state);
  const emittedEvents: GameEvent[] = [];

  // Verificação de validade de alvo
  const targetCheck = isEffectTargetValid(nextState, entry.targetId, effect, cardRegistry);
  if (!targetCheck.valid) {
    emittedEvents.push(
      createDebateActionFizzledEvent(nextState, {
        step: entry.step,
        playerId: entry.playerId,
        cardInstanceId: entry.cardInstanceId,
        targetId: entry.targetId,
        reason: targetCheck.reason!,
      })
    );
    return { state: nextState, events: emittedEvents, fizzled: true, reason: targetCheck.reason };
  }

  // Resolução do efeito com base no seu tipo
  switch (effect.type) {
    case EffectType.MODIFY_STAT: {
      const stat = effect.stat ?? 'morale';
      const amount = effect.amount ?? 0;

      // Localiza alvo
      let targetStudent: CardInstance | undefined;
      let targetPlayerId: PlayerId | undefined;

      for (const p of Object.values(nextState.players)) {
        const found = p.board.find((s) => s.instanceId === entry.targetId);
        if (found) {
          targetStudent = found;
          targetPlayerId = p.id;
          break;
        }
      }

      if (targetStudent && targetPlayerId) {
        if (stat === 'morale') {
          targetStudent.currentMorale = (targetStudent.currentMorale ?? 0) + amount;
          if (targetStudent.maxMorale && (targetStudent.currentMorale > targetStudent.maxMorale)) {
            targetStudent.maxMorale = targetStudent.currentMorale;
          }

          // Se moral for reduzida a <= 0: Estudante derrotado
          if (targetStudent.currentMorale <= 0) {
            targetStudent.zone = CardZone.DISCARD;
            const targetPlayer = nextState.players[targetPlayerId];
            targetPlayer.board = targetPlayer.board.filter(
              (s) => s.instanceId !== targetStudent!.instanceId
            );
            targetPlayer.discard.push(targetStudent);

            emittedEvents.push(
              createStudentDefeatedEvent(nextState, {
                playerId: targetPlayerId,
                cardInstanceId: targetStudent.instanceId,
                definitionId: targetStudent.definitionId,
                reason: 'EFFECT',
              })
            );
          }
        } else if (stat === 'influence') {
          targetStudent.currentInfluence = Math.max(
            0,
            (targetStudent.currentInfluence ?? 0) + amount
          );
          if (effect.duration === EffectDuration.UNTIL_END_OF_TURN) {
            targetStudent.statuses.push(`TEMP_INFLUENCE_${amount}`);
          }
        }

        emittedEvents.push(
          createEffectAppliedEvent(nextState, {
            effectType: EffectType.MODIFY_STAT,
            sourceId: entry.cardInstanceId,
            targetId: targetStudent.instanceId,
            details: { stat, amount, duration: effect.duration },
          })
        );
      }
      break;
    }

    case EffectType.GRANT_KEYWORD:
    case EffectType.APPLY_STATUS: {
      const statusToAdd = effect.status ?? (effect.keyword ? `KEYWORD_${effect.keyword}` : '');
      if (statusToAdd && entry.targetId) {
        for (const p of Object.values(nextState.players)) {
          const student = p.board.find((s) => s.instanceId === entry.targetId);
          if (student && !student.statuses.includes(statusToAdd)) {
            student.statuses.push(statusToAdd);
            emittedEvents.push(
              createEffectAppliedEvent(nextState, {
                effectType: effect.type,
                sourceId: entry.cardInstanceId,
                targetId: student.instanceId,
                details: { status: statusToAdd, keyword: effect.keyword },
              })
            );
            break;
          }
        }
      }
      break;
    }

    case EffectType.DRAW_CARD: {
      const drawTargetPlayerId =
        effect.target === EffectTargetScope.OPPONENT_REPRESENTATIVE
          ? getOpponentId(nextState, entry.playerId)
          : entry.playerId;

      const count = effect.amount ?? 1;
      for (let i = 0; i < count; i++) {
        const drawRes = drawCard(nextState, drawTargetPlayerId);
        Object.assign(nextState, drawRes.state);
        if (drawRes.cardDrawn) {
          emittedEvents.push(
            createCardDrawnEvent(nextState, {
              playerId: drawTargetPlayerId,
              cardInstanceId: drawRes.cardDrawn.instanceId,
            })
          );
        }
      }
      break;
    }

    case EffectType.GAIN_ENERGY: {
      const player = nextState.players[entry.playerId];
      if (player) {
        const amount = effect.amount ?? 1;
        player.energy = Math.min(player.maxEnergy, player.energy + amount);
        emittedEvents.push(
          createEffectAppliedEvent(nextState, {
            effectType: EffectType.GAIN_ENERGY,
            sourceId: entry.cardInstanceId,
            targetId: entry.playerId,
            details: { amount },
          })
        );
      }
      break;
    }

    case EffectType.GAIN_POPULARITY: {
      const player = nextState.players[entry.playerId];
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
            playerId: entry.playerId,
            amount,
            newPopularity: player.representative.popularity,
            highlightUnlocked,
          })
        );
      }
      break;
    }

    default:
      break;
  }

  return { state: nextState, events: emittedEvents, fizzled: false };
}

/**
 * Resolução pura e determinística da pilha de Debate em ordem estrita LIFO (Last In, First Out).
 * Contrarréplica -> Tréplica -> Réplica -> Ação Inicial.
 * Cada etapa altera o GameState antes que a etapa seguinte seja resolvida.
 * Trata invalidação parcial de alvos (efeitos dependentes do alvo falham, independentes continuam).
 */
export function resolveDebate(
  state: GameState,
  cardRegistry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const val = validateResolveDebate(state);
  if (!val.valid) {
    return { success: false, error: val.error! };
  }

  let currentState = cloneGameState(state);
  const emittedEvents: GameEvent[] = [];

  // Se a pilha já estiver vazia, apenas desativa o debate
  if (!currentState.debate.actions || currentState.debate.actions.length === 0) {
    currentState.debate = {
      active: false,
      initiatorPlayerId: null,
      currentStep: 0,
      actions: [],
      consecutivePasses: 0,
    };
    return { success: true, state: currentState, events: [] };
  }

  // 1. Inverte as ações para execução estrita LIFO:
  // [Ação Inicial, Réplica, Tréplica, Contrarréplica] -> Contrarréplica -> Tréplica -> Réplica -> Ação Inicial
  const lifoStack: DebateActionEntry[] = [...currentState.debate.actions].reverse();

  // 2. Itera e resolve cada ação da pilha de cima para baixo
  for (const entry of lifoStack) {
    if (entry.passed) {
      continue;
    }

    const cardDef = findCardDefinition(entry.cardDefinitionId!, cardRegistry);
    if (!cardDef) {
      continue;
    }

    // Resolve os efeitos da carta orientados a dados
    if (cardDef.effects && cardDef.effects.length > 0) {
      for (const rawEffect of cardDef.effects) {
        const effect = rawEffect as EffectDefinition;
        const effectResult = applyDebateEffect(currentState, effect, entry, cardRegistry);
        currentState = effectResult.state;
        emittedEvents.push(...effectResult.events);
      }
    }

    // Transfere a carta jogada da zona DEBATE para a zona DISCARD do proprietário
    const owner = currentState.players[entry.playerId];
    if (owner && entry.cardInstanceId) {
      const inTransitCard = (entry as unknown as { cardInstance?: CardInstance }).cardInstance;
      if (inTransitCard) {
        inTransitCard.zone = CardZone.DISCARD;
        owner.discard.push(inTransitCard);
      } else {
        // Fallback: procura se ainda estiver em alguma lista
        const existingInBoard = owner.hand.find((c) => c.instanceId === entry.cardInstanceId);
        if (existingInBoard) {
          existingInBoard.zone = CardZone.DISCARD;
          owner.discard.push(existingInBoard);
        }
      }
    }

    emittedEvents.push(
      createDebateActionResolvedEvent(currentState, {
        step: entry.step,
        playerId: entry.playerId,
        cardInstanceId: entry.cardInstanceId,
        targetId: entry.targetId,
      })
    );
  }

  // 3. Limpa o DebateState após o esvaziamento da pilha
  currentState.debate = {
    active: false,
    initiatorPlayerId: null,
    currentStep: 0,
    actions: [],
    consecutivePasses: 0,
  };

  // 4. Emite o evento DEBATE_RESOLVED para disparar gatilhos reativos (ex: Popularidade de Akira)
  const debateResolvedEvent = createDebateResolvedEvent(currentState, {
    playerId: currentState.activePlayerId,
  });
  emittedEvents.push(debateResolvedEvent);

  // 5. Despacha todos os eventos gerados pelo barramento reativo
  const dispatchResult = dispatchEvents(currentState, emittedEvents, { cardRegistry });

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}
