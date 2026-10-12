import { GameState, GameStatus } from '../types/state';
import { GamePhase } from '../types/phase';
import { PlayerId } from '../types/player';
import { CardInstance } from '../types/card';
import { CardZone } from '../types/zone';
import { ActionErrorCode, ActionResult } from '../types/error';
import { AdvancePhaseAction, EndPhaseAction } from '../types/action';
import { resolveCombat } from './combatSystem';
import {
  createPhaseChangedEvent,
  createTurnStartedEvent,
  createTurnEndedEvent,
  dispatchEvents,
} from './eventSystem';
import {
  updateLearningTurnStatus,
  evaluateContinuousKeywords,
} from './keywordSystem';

/**
 * Clona profundamente o GameState de forma determinística e pura, garantindo
 * que o estado anterior nunca seja mutado in-place (Princípio de Imutabilidade).
 */
export function cloneGameState(state: GameState): GameState {
  if (typeof structuredClone === 'function') {
    return structuredClone(state);
  }
  return JSON.parse(JSON.stringify(state)) as GameState;
}

/**
 * Obtém o PlayerId do oponente em uma partida de 2 jogadores.
 */
export function getOpponentId(state: GameState, playerId: PlayerId): PlayerId {
  const opponentId = Object.keys(state.players).find((id) => id !== playerId);
  return opponentId ?? '';
}

/**
 * Retorna a próxima fase canônica conforme docs/rules/SCB_Architecture.md seção 12:
 * START -> MAIN -> DEBATE -> COMBAT -> END -> START
 */
export function getNextPhase(phase: GamePhase): GamePhase {
  switch (phase) {
    case GamePhase.START:
      return GamePhase.MAIN;
    case GamePhase.MAIN:
      return GamePhase.DEBATE;
    case GamePhase.DEBATE:
      return GamePhase.COMBAT;
    case GamePhase.COMBAT:
      return GamePhase.END;
    case GamePhase.END:
      return GamePhase.START;
  }
}

export interface DrawCardResult {
  state: GameState;
  cardDrawn: CardInstance | null;
  deckout: boolean;
}

/**
 * Executa a compra de 1 carta de forma pura.
 * Conforme docs/rules/SCB_Rules.md seção 9 e 56:
 * Transfere a carta do topo do DECK para a HAND com zone = CardZone.HAND.
 * Se o Deck estiver vazio no momento da compra, o jogador perde imediatamente (derrota por Deckout).
 */
export function drawCard(state: GameState, playerId: PlayerId): DrawCardResult {
  const nextState = cloneGameState(state);
  const player = nextState.players[playerId];

  if (!player) {
    return { state: nextState, cardDrawn: null, deckout: false };
  }

  // Condição de derrota imediata por Deckout
  if (player.deck.length === 0) {
    const opponentId = getOpponentId(nextState, playerId);
    nextState.status = GameStatus.FINISHED;
    nextState.winnerId = opponentId;
    return { state: nextState, cardDrawn: null, deckout: true };
  }

  // Remove do topo do deck (índice 0)
  const drawnCard = player.deck.shift()!;
  drawnCard.zone = CardZone.HAND;
  player.hand.push(drawnCard);

  return { state: nextState, cardDrawn: drawnCard, deckout: false };
}

/**
 * Processa a lógica de início de turno (Start Phase) para o jogador ativo.
 * Conforme docs/rules/SCB_Rules.md seção 8 e 11:
 * 1. Aumentar o limite máximo de Energia em +1 (teto de 10) a cada rodada/turno do jogador (inicia em 1 no turno 1).
 * 2. Restaurar a Energia atual até o novo limite máximo.
 * 3. Comprar obrigatoriamente 1 carta do deck.
 * 4. Condição de derrota por Deckout se o deck estiver vazio.
 * 5. Liberar Inércia de Estudantes já presentes no campo e prepará-los (ready = true).
 */
export function resolveStartPhase(state: GameState): GameState {
  if (state.status === GameStatus.FINISHED) {
    return state;
  }

  const nextState = cloneGameState(state);
  const activePlayer = nextState.players[nextState.activePlayerId];

  if (!activePlayer) {
    return nextState;
  }

  // 1 & 2. Progressão e restauração de Energia
  if (activePlayer.turnCount <= 1) {
    // Turno 1 do jogador: Máximo = 1, Atual = 1
    activePlayer.maxEnergy = 1;
    activePlayer.energy = 1;
  } else {
    // Turnos subsequentes: aumenta Max Energy em +1 até o teto de 10
    activePlayer.maxEnergy = Math.min(10, activePlayer.maxEnergy + 1);
    activePlayer.energy = activePlayer.maxEnergy;
  }

  // 3. Preparação dos Estudantes em campo (remoção estrita de Inércia de turnos anteriores)
  for (const student of activePlayer.board) {
    student.ready = true;
    student.hasInertia = false;
    student.statuses = student.statuses.filter(
      (s) => !s.toLowerCase().includes('inercia') && !s.toLowerCase().includes('inércia')
    );
  }

  // 4. Compra obrigatória de 1 carta
  const drawResult = drawCard(nextState, activePlayer.id);

  // 5. Avaliação de efeitos contínuos de início de turno (incluindo Aprendizagem)
  return evaluateContinuousKeywords(drawResult.state);
}

export interface ResolveEndPhaseOptions {
  cardInstanceIdsToDiscard?: string[];
  autoCutExcess?: boolean; // Padrão: true (regra de corte)
  cardRegistry?: Record<string, import('../types/card').CardDefinition>;
}

/**
 * Descarta cartas da mão de um jogador, transferindo-as para a zona DISCARD.
 */
export function discardCards(
  state: GameState,
  playerId: PlayerId,
  cardInstanceIds: string[]
): ActionResult<GameState> {
  const nextState = cloneGameState(state);
  const player = nextState.players[playerId];

  if (!player) {
    return {
      success: false,
      error: { code: ActionErrorCode.INVALID_PLAYER, message: 'Jogador não encontrado.' },
    };
  }

  // Validação: todas as cartas devem estar na mão do jogador
  for (const cardId of cardInstanceIds) {
    const cardIndex = player.hand.findIndex((c) => c.instanceId === cardId);
    if (cardIndex === -1) {
      return {
        success: false,
        error: {
          code: ActionErrorCode.CARD_NOT_IN_HAND,
          message: `Carta ${cardId} não está na mão do jogador.`,
        },
      };
    }
  }

  // Executa descarte
  for (const cardId of cardInstanceIds) {
    const cardIndex = player.hand.findIndex((c) => c.instanceId === cardId);
    if (cardIndex !== -1) {
      const [discardedCard] = player.hand.splice(cardIndex, 1);
      discardedCard.zone = CardZone.DISCARD;
      player.discard.push(discardedCard);
    }
  }

  return { success: true, state: nextState };
}

/**
 * Processa a End Phase (fim de turno) e realiza a transição para o próximo turno.
 * Conforme docs/rules/SCB_Rules.md seção 42, 43 e 44:
 * 1. Limpeza de efeitos temporários de fim de turno.
 * 2. Validação do limite de mão (máximo 8 cartas) e corte de excedentes.
 * 3. Expiração da Diplomacia se o primeiro turno do jogador terminou.
 * 4. Passagem de controle para o próximo jogador (START phase, turn counter + 1).
 */
export function resolveEndPhase(
  state: GameState,
  options: ResolveEndPhaseOptions = {}
): ActionResult<GameState> {
  if (state.status === GameStatus.FINISHED) {
    return {
      success: false,
      error: { code: ActionErrorCode.GAME_OVER, message: 'A partida já foi encerrada.' },
    };
  }

  const nextState = cloneGameState(state);
  const activePlayer = nextState.players[nextState.activePlayerId];

  if (!activePlayer) {
    return {
      success: false,
      error: { code: ActionErrorCode.INVALID_PLAYER, message: 'Jogador ativo inválido.' },
    };
  }

  // 1. Limpeza de efeitos temporários, status expirados e Inércia ao final do turno
  for (const student of activePlayer.board) {
    student.hasInertia = false;
    if (student.statuses.includes('TEMP_HIGHLIGHT_BUFF')) {
      student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
      student.currentMorale = Math.max(1, (student.currentMorale ?? 1) - 1);
      if (student.maxMorale && student.maxMorale > 1) {
        student.maxMorale -= 1;
      }
    }
    student.statuses = student.statuses.filter(
      (s) =>
        !s.startsWith('TEMP_') &&
        s !== 'UNTIL_END_OF_TURN' &&
        !s.toLowerCase().includes('inercia') &&
        !s.toLowerCase().includes('inércia')
    );
  }

  // 1.1 Atualização normativa da regra de Aprendizagem ao final do turno
  Object.assign(
    nextState,
    updateLearningTurnStatus(nextState, activePlayer.id, options.cardRegistry)
  );

  // 2. Descarte explícito informado nas opções
  if (options.cardInstanceIdsToDiscard && options.cardInstanceIdsToDiscard.length > 0) {
    const discardResult = discardCards(
      nextState,
      activePlayer.id,
      options.cardInstanceIdsToDiscard
    );
    if (!discardResult.success) {
      return discardResult;
    }
    // Atualiza nextState com as cartas descartadas
    Object.assign(nextState, discardResult.state);
  }

  // 3. Validação do limite de mão (8 cartas no máximo)
  const currentHandLength = nextState.players[activePlayer.id].hand.length;
  if (currentHandLength > 8) {
    const autoCut = options.autoCutExcess ?? true;
    if (autoCut) {
      // Regra de corte: descarta automaticamente as últimas cartas excedentes
      const excessCount = currentHandLength - 8;
      const playerRef = nextState.players[activePlayer.id];
      const cutCards = playerRef.hand.splice(playerRef.hand.length - excessCount, excessCount);
      for (const card of cutCards) {
        card.zone = CardZone.DISCARD;
        playerRef.discard.push(card);
      }
    } else {
      return {
        success: false,
        error: {
          code: ActionErrorCode.HAND_LIMIT_EXCEEDED,
          message: `Limite de mão excedido (${currentHandLength} cartas). O limite máximo na End Phase é 8.`,
        },
      };
    }
  }

  // 4. Expiração da Diplomacia após o término do primeiro turno do respectivo jogador
  if (activePlayer.diplomacyActive) {
    nextState.players[activePlayer.id].diplomacyActive = false;
  }

  // 5. Alternância do jogador ativo e incremento do turno
  const nextPlayerId = getOpponentId(nextState, activePlayer.id);
  nextState.activePlayerId = nextPlayerId;
  nextState.turn += 1;

  // Incrementa a contagem de turnos do próximo jogador
  const nextPlayer = nextState.players[nextPlayerId];
  if (nextPlayer) {
    nextPlayer.turnCount += 1;
  }

  // Define a nova fase como START
  nextState.phase = GamePhase.START;

  const turnEndedEvent = createTurnEndedEvent(state, {
    turn: state.turn,
    activePlayerId: activePlayer.id,
  });

  const turnStartedEvent = createTurnStartedEvent(nextState, {
    turn: nextState.turn,
    activePlayerId: nextState.activePlayerId,
  });

  const phaseChangedEvent = createPhaseChangedEvent(nextState, {
    fromPhase: GamePhase.END,
    toPhase: GamePhase.START,
    activePlayerId: nextState.activePlayerId,
  });

  const dispatchResult = dispatchEvents(
    nextState,
    [turnEndedEvent, turnStartedEvent, phaseChangedEvent]
  );

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}

export interface AdvancePhaseOptions {
  autoCutExcess?: boolean;
  cardRegistry?: Record<string, import('../types/card').CardDefinition>;
}

/**
 * Avança o estado de jogo para a próxima fase de forma pura e determinística.
 * Ciclo canônico: START -> MAIN -> DEBATE -> COMBAT -> END -> START (próximo turno).
 */
export function advancePhase(
  state: GameState,
  action?: AdvancePhaseAction | EndPhaseAction,
  options: AdvancePhaseOptions = {}
): ActionResult<GameState> {
  if (state.status === GameStatus.FINISHED) {
    return {
      success: false,
      error: { code: ActionErrorCode.GAME_OVER, message: 'A partida já foi encerrada.' },
    };
  }

  // Validação de jogador autorizado a despachar ADVANCE_PHASE
  if (action?.playerId) {
    if (
      state.phase === GamePhase.COMBAT &&
      (state.combat?.attacks?.length ?? 0) > 0 &&
      state.combat?.attackersDeclared
    ) {
      // Na sub-etapa de Bloqueio Livre, apenas o defensor pode avançar/concluir a defesa
      const defenderId = getOpponentId(state, state.activePlayerId);
      if (action.playerId !== defenderId) {
        return {
          success: false,
          error: {
            code: ActionErrorCode.INVALID_PLAYER,
            message: 'Apenas o defensor pode concluir a declaração de bloqueios.',
          },
        };
      }
    } else {
      // Em todas as outras etapas/fases, apenas o jogador ativo pode avançar
      if (action.playerId !== state.activePlayerId) {
        return {
          success: false,
          error: {
            code: ActionErrorCode.INVALID_PLAYER,
            message: 'Apenas o jogador ativo pode avançar a fase.',
          },
        };
      }
    }
  }

  switch (state.phase) {
    case GamePhase.START: {
      // START -> MAIN: resolve os efeitos normativos da Start Phase
      const resolvedState = resolveStartPhase(state);
      if (resolvedState.status === GameStatus.FINISHED) {
        return { success: true, state: resolvedState };
      }
      resolvedState.phase = GamePhase.MAIN;

      const phaseEvent = createPhaseChangedEvent(resolvedState, {
        fromPhase: GamePhase.START,
        toPhase: GamePhase.MAIN,
        activePlayerId: resolvedState.activePlayerId,
      });

      const dispatchResult = dispatchEvents(resolvedState, [phaseEvent], {
        cardRegistry: options.cardRegistry,
      });

      return {
        success: true,
        state: dispatchResult.state,
        events: dispatchResult.emittedEvents,
      };
    }

    case GamePhase.MAIN: {
      // MAIN -> DEBATE
      const nextState = cloneGameState(state);
      nextState.phase = GamePhase.DEBATE;

      const phaseEvent = createPhaseChangedEvent(nextState, {
        fromPhase: GamePhase.MAIN,
        toPhase: GamePhase.DEBATE,
        activePlayerId: nextState.activePlayerId,
      });

      const dispatchResult = dispatchEvents(nextState, [phaseEvent], {
        cardRegistry: options.cardRegistry,
      });

      return {
        success: true,
        state: dispatchResult.state,
        events: dispatchResult.emittedEvents,
      };
    }

    case GamePhase.DEBATE: {
      // DEBATE -> COMBAT: se a cadeia de debate não foi continuada, encerra o debate
      const nextState = cloneGameState(state);
      nextState.debate = {
        active: false,
        initiatorPlayerId: null,
        currentStep: 0,
        actions: [],
      };
      nextState.phase = GamePhase.COMBAT;

      const phaseEvent = createPhaseChangedEvent(nextState, {
        fromPhase: GamePhase.DEBATE,
        toPhase: GamePhase.COMBAT,
        activePlayerId: nextState.activePlayerId,
      });

      const dispatchResult = dispatchEvents(nextState, [phaseEvent], {
        cardRegistry: options.cardRegistry,
      });

      return {
        success: true,
        state: dispatchResult.state,
        events: dispatchResult.emittedEvents,
      };
    }

    case GamePhase.COMBAT: {
      const attacks = state.combat?.attacks ?? [];

      // Caso 1: Não há ataques declarados (0 ataques).
      // O combate é pulado/encerrado imediatamente avançando direto para END.
      if (attacks.length === 0) {
        const nextState = cloneGameState(state);
        nextState.combat = {
          active: false,
          attacks: [],
        };
        nextState.phase = GamePhase.END;

        const phaseEvent = createPhaseChangedEvent(nextState, {
          fromPhase: GamePhase.COMBAT,
          toPhase: GamePhase.END,
          activePlayerId: nextState.activePlayerId,
        });

        const dispatchResult = dispatchEvents(nextState, [phaseEvent], {
          cardRegistry: options.cardRegistry,
        });

        return {
          success: true,
          state: dispatchResult.state,
          events: dispatchResult.emittedEvents,
        };
      }

      // Caso 2 (Fluxo Bifásico — Etapa 1): O atacante clica em avançar.
      // Sinaliza "Terminei de declarar atacantes" (attackersDeclared = true).
      // Permanece em COMBAT e transfere a prioridade para o defensor realizar Bloqueio Livre.
      if (!action?.playerId || action.playerId === state.activePlayerId) {
        if (!state.combat?.attackersDeclared) {
          const nextState = cloneGameState(state);
          nextState.combat = {
            ...nextState.combat,
            attackersDeclared: true,
          };
          // Permanece na GamePhase.COMBAT para o defensor agir
          return {
            success: true,
            state: nextState,
            events: [],
          };
        }
        return {
          success: false,
          error: {
            code: ActionErrorCode.INVALID_PLAYER,
            message: 'Apenas o defensor pode concluir a declaração de bloqueios.',
          },
        };
      }

      // Caso 3 (Fluxo Bifásico — Etapa 2): O defensor clica em avançar.
      // Sinaliza "Terminei meus bloqueios / Concluir Defesa".
      // Combate é resolvido (danos aplicados) e a fase muda oficialmente para END.
      let nextState = cloneGameState(state);
      const combatResult = resolveCombat(nextState, options.cardRegistry);
      if (!combatResult.success) {
        return combatResult;
      }
      nextState = combatResult.state;

      if (nextState.status === GameStatus.FINISHED) {
        return { success: true, state: nextState };
      }

      nextState.combat = {
        active: false,
        attacks: [],
      };
      nextState.phase = GamePhase.END;

      const phaseEvent = createPhaseChangedEvent(nextState, {
        fromPhase: GamePhase.COMBAT,
        toPhase: GamePhase.END,
        activePlayerId: nextState.activePlayerId,
      });

      const dispatchResult = dispatchEvents(nextState, [phaseEvent], {
        cardRegistry: options.cardRegistry,
      });

      return {
        success: true,
        state: dispatchResult.state,
        events: dispatchResult.emittedEvents,
      };
    }

    case GamePhase.END: {
      // END -> START: resolve a End Phase e passa o turno para o próximo jogador
      return resolveEndPhase(state, {
        cardInstanceIdsToDiscard: action?.cardInstanceIdsToDiscard,
        autoCutExcess: options.autoCutExcess ?? true,
      });
    }
  }
}

/**
 * Avança todas as fases de um turno de forma determinística e autônoma até o início do próximo turno.
 * Útil para simulações e testes completos de múltiplos turnos.
 */
export function advanceFullTurn(
  state: GameState,
  options: AdvancePhaseOptions = {}
): ActionResult<GameState> {
  let currentState = cloneGameState(state);
  const initialPlayerId = currentState.activePlayerId;

  // Se estiver em START, avança por todas as fases até que o turno termine e o jogador ativo mude
  while (currentState.activePlayerId === initialPlayerId && currentState.status !== GameStatus.FINISHED) {
    const result = advancePhase(currentState, undefined, options);
    if (!result.success) {
      return result;
    }
    currentState = result.state;
  }

  return { success: true, state: currentState };
}

/**
 * Avança múltiplos turnos sucessivos de forma determinística.
 */
export function advanceMultipleTurns(
  state: GameState,
  turnsCount: number,
  options: AdvancePhaseOptions = {}
): ActionResult<GameState> {
  let currentState = cloneGameState(state);

  for (let i = 0; i < turnsCount; i++) {
    if (currentState.status === GameStatus.FINISHED) {
      break;
    }
    const result = advanceFullTurn(currentState, options);
    if (!result.success) {
      return result;
    }
    currentState = result.state;
  }

  return { success: true, state: currentState };
}
