import { GameState, GameStatus } from '../types/state';
import { GamePhase } from '../types/phase';
import { CardInstance, CardType, Keyword, CardDefinition } from '../types/card';
import { CardZone } from '../types/zone';
import { PlayCardAction } from '../types/action';
import { ActionErrorCode, ActionResult, ActionError } from '../types/error';
import { cloneGameState } from './turnSystem';
import { findCardDefinition } from '../../cards/alphaCards';
import {
  createCardPlayedEvent,
  createStudentEnteredEvent,
  dispatchEvents,
} from './eventSystem';
import { GameEvent } from '../types/event';

/**
 * Detalhes estruturados retornados por uma validação bem-sucedida de PLAY_CARD
 */
export interface PlayCardValidationDetails {
  cardDefinition: CardDefinition;
  cardInstance: CardInstance;
  replaceTargetStudent?: CardInstance;
}

/**
 * Resultado da validação pura de PLAY_CARD
 */
export type PlayCardValidationResult =
  | { valid: true; details: PlayCardValidationDetails }
  | { valid: false; error: ActionError };

/**
 * Validação pura e determinística para jogar uma carta da mão.
 * Conforme docs/rules/SCB_Rules.md Seções 12 a 15, docs/rules/SCB_Architecture.md Seção 14
 * e diretiva de delegação da Fase 3:
 *
 * 1. Ação permitida apenas na fase GamePhase.MAIN pelo jogador ativo.
 * 2. Partida não pode estar terminada (GAME_OVER).
 * 3. A carta deve estar na zona CardZone.HAND do jogador ativo (CARD_NOT_IN_HAND).
 * 4. A definição da carta deve ser encontrada no catálogo data-driven.
 * 5. A carta deve ser de um tipo posicionável no campo (STUDENT ou ENVIRONMENT).
 * 6. O jogador deve possuir energia >= cardDefinition.cost (NOT_ENOUGH_ENERGY).
 * 7. Se a carta for STUDENT e o campo possuir 6 Estudantes:
 *    - Requer replaceCardInstanceId apontando para um Estudante válido no board do jogador (BOARD_FULL ou CARD_NOT_IN_BOARD).
 */
export function validatePlayCard(
  state: GameState,
  action: PlayCardAction,
  cardRegistry?: Record<string, CardDefinition>
): PlayCardValidationResult {
  // 1. Validação de partida ativa
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.GAME_OVER,
        message: 'A partida já foi encerrada.',
      },
    };
  }

  // 2. Validação de jogador ativo
  if (action.playerId !== state.activePlayerId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: 'Apenas o jogador ativo pode jogar cartas durante a sua Main Phase.',
      },
    };
  }

  // 3. Validação de fase (apenas MAIN)
  if (state.phase !== GamePhase.MAIN) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: `Cartas só podem ser jogadas durante a Main Phase. Fase atual: ${state.phase}.`,
      },
    };
  }

  // 4. Validação de existência do jogador
  const player = state.players[action.playerId];
  if (!player) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: `Jogador com ID ${action.playerId} não encontrado no estado.`,
      },
    };
  }

  // 5. Validação de presença da carta na mão
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

  // 6. Busca da definição estática da carta
  const cardDefinition = findCardDefinition(cardInstance.definitionId, cardRegistry);
  if (!cardDefinition) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: `Definição da carta para ${cardInstance.definitionId} não foi encontrada no catálogo.`,
      },
    };
  }

  // 7. Validação de tipos permitidos nesta fase (STUDENT ou ENVIRONMENT)
  if (
    cardDefinition.type !== CardType.STUDENT &&
    cardDefinition.type !== CardType.ENVIRONMENT
  ) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: `O tipo de carta ${cardDefinition.type} não pode ser jogado no campo na Main Phase.`,
      },
    };
  }

  // 8. Validação estrita de custo de Energia
  if (player.energy < cardDefinition.cost) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.NOT_ENOUGH_ENERGY,
        message: `Energia insuficiente para jogar ${cardDefinition.name}. Custo: ${cardDefinition.cost}, Energia atual: ${player.energy}.`,
      },
    };
  }

  // 9. Validação do limite de 6 Estudantes e regra de Substituição
  let replaceTargetStudent: CardInstance | undefined;

  if (cardDefinition.type === CardType.STUDENT) {
    const isBoardFull = player.board.length >= 6;

    if (isBoardFull) {
      if (!action.replaceCardInstanceId) {
        return {
          valid: false,
          error: {
            code: ActionErrorCode.BOARD_FULL,
            message:
              'O campo já possui o limite máximo de 6 Estudantes. É necessário indicar um Estudante para substituição.',
          },
        };
      }

      const target = player.board.find((s) => s.instanceId === action.replaceCardInstanceId);
      if (!target) {
        return {
          valid: false,
          error: {
            code: ActionErrorCode.CARD_NOT_IN_BOARD,
            message: `O Estudante indicado para substituição (${action.replaceCardInstanceId}) não está no campo do jogador.`,
          },
        };
      }

      replaceTargetStudent = target;
    } else if (action.replaceCardInstanceId) {
      // Se replaceCardInstanceId foi fornecido mesmo com campo não cheio, deve ser válido
      const target = player.board.find((s) => s.instanceId === action.replaceCardInstanceId);
      if (!target) {
        return {
          valid: false,
          error: {
            code: ActionErrorCode.CARD_NOT_IN_BOARD,
            message: `O Estudante indicado para substituição (${action.replaceCardInstanceId}) não está no campo do jogador.`,
          },
        };
      }
      replaceTargetStudent = target;
    }
  }

  return {
    valid: true,
    details: {
      cardDefinition,
      cardInstance,
      replaceTargetStudent,
    },
  };
}

/**
 * Função utilitária rápida para verificar se uma carta pode ser jogada
 */
export function canPlayCard(
  state: GameState,
  action: PlayCardAction,
  cardRegistry?: Record<string, CardDefinition>
): boolean {
  return validatePlayCard(state, action, cardRegistry).valid;
}

/**
 * Resolução pura e determinística da ação PLAY_CARD.
 * Conforme docs/rules/SCB_Rules.md Seções 13 a 18 e docs/rules/SCB_Architecture.md Seção 15:
 *
 * 1. Valida a ação através de validatePlayCard.
 * 2. Clona o GameState (Imutabilidade Estrita).
 * 3. Deduz o custo de Energia do jogador ativo.
 * 4. Remove a carta de HAND.
 * 5. Se for STUDENT:
 *    - Se houver substituição, remove o Estudante antigo de BOARD para DISCARD (zone = DISCARD).
 *    - Atualiza a nova carta: zone = BOARD, currentInfluence, currentMorale, maxMorale.
 *    - Atribui Inércia / Impulso: hasInertia = true e ready = false (ou hasInertia = false e ready = true se possuir Keyword.IMPULSO).
 *    - Adiciona ao board mantendo teto <= 6.
 * 6. Se for ENVIRONMENT:
 *    - Se já houver Ambiente ativo, move-o para DISCARD (zone = DISCARD).
 *    - Posiciona o novo Ambiente em player.environment com zone = ENVIRONMENT.
 * 7. Retorna { success: true, state: nextState }.
 */
export function playCard(
  state: GameState,
  action: PlayCardAction,
  cardRegistry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const validation = validatePlayCard(state, action, cardRegistry);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const { cardDefinition, replaceTargetStudent } = validation.details;
  const nextState = cloneGameState(state);
  const player = nextState.players[action.playerId];

  // 1. Deduz custo de Energia
  player.energy -= cardDefinition.cost;

  // 2. Remove carta da Mão
  const handIndex = player.hand.findIndex((c) => c.instanceId === action.cardInstanceId);
  const [playedCard] = player.hand.splice(handIndex, 1);

  // 3. Resolução específica por tipo de carta
  if (cardDefinition.type === CardType.STUDENT) {
    // Regra de Substituição
    if (replaceTargetStudent) {
      const boardIndex = player.board.findIndex(
        (s) => s.instanceId === replaceTargetStudent.instanceId
      );
      if (boardIndex !== -1) {
        const [oldStudent] = player.board.splice(boardIndex, 1);
        oldStudent.zone = CardZone.DISCARD;
        player.discard.push(oldStudent);
      }
    }

    // Configura atributos e estado de prontidão / Inércia
    const hasImpulse = cardDefinition.keywords?.includes(Keyword.IMPULSO) ?? false;
    playedCard.zone = CardZone.BOARD;
    playedCard.hasInertia = !hasImpulse;
    playedCard.ready = hasImpulse;

    if (playedCard.currentInfluence === undefined && cardDefinition.influence !== undefined) {
      playedCard.currentInfluence = cardDefinition.influence;
    }
    if (playedCard.currentMorale === undefined && cardDefinition.morale !== undefined) {
      playedCard.currentMorale = cardDefinition.morale;
      playedCard.maxMorale = cardDefinition.maxMorale ?? cardDefinition.morale;
    }

    player.board.push(playedCard);
  } else if (cardDefinition.type === CardType.ENVIRONMENT) {
    // Limite de 1 Ambiente ativo por jogador (SCB_Rules.md Seção 15)
    if (player.environment !== null) {
      const oldEnvironment = player.environment;
      oldEnvironment.zone = CardZone.DISCARD;
      player.discard.push(oldEnvironment);
    }

    playedCard.zone = CardZone.ENVIRONMENT;
    player.environment = playedCard;
  }

  // 4. Emissão e despacho determinístico de eventos no barramento da engine
  const cardPlayedEvent = createCardPlayedEvent(nextState, {
    playerId: action.playerId,
    cardInstanceId: playedCard.instanceId,
    definitionId: cardDefinition.id,
    cardType: cardDefinition.type,
    cost: cardDefinition.cost,
    replacedCardInstanceId: action.replaceCardInstanceId,
  });

  const eventsToDispatch: GameEvent[] = [cardPlayedEvent];

  if (cardDefinition.type === CardType.STUDENT) {
    const studentEnteredEvent = createStudentEnteredEvent(nextState, {
      playerId: action.playerId,
      cardInstanceId: playedCard.instanceId,
      definitionId: cardDefinition.id,
      hasInertia: playedCard.hasInertia,
      ready: playedCard.ready,
    });
    eventsToDispatch.push(studentEnteredEvent);
  }

  const dispatchResult = dispatchEvents(nextState, eventsToDispatch, {
    cardRegistry,
  });

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}
