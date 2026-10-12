import { GameState, GameStatus } from '../types/state';
import { GamePhase } from '../types/phase';
import { ActivateHighlightAction } from '../types/action';
import { ActionErrorCode, ActionResult, ActionError } from '../types/error';
import { CardDefinition, Keyword } from '../types/card';
import { cloneGameState, getOpponentId } from './turnSystem';
import { dispatchEvents, generateEventId } from './eventSystem';
import { GameEventType, HighlightActivatedEvent } from '../types/event';

/**
 * Validação pura e determinística para a ação de ativar Destaque do Representante.
 * Conforme docs/rules/SCB_Rules.md seções 39, 40 e 41:
 * - Apenas o jogador ativo
 * - Apenas na Main Phase
 * - Popularidade deve ter atingido o requisito do Representante (highlightAvailable === true)
 * - O Destaque NÃO custa Energia (requisito e custo exclusivo: Popularidade).
 */
export function validateActivateHighlight(
  state: GameState,
  action: ActivateHighlightAction,
  _registry?: Record<string, CardDefinition>
): { valid: boolean; error?: ActionError } {
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: { code: ActionErrorCode.GAME_OVER, message: 'A partida já foi encerrada.' },
    };
  }

  if (action.playerId !== state.activePlayerId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: 'Apenas o jogador ativo pode ativar o Destaque do Representante.',
      },
    };
  }

  if (state.phase !== GamePhase.MAIN) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: `O Destaque do Representante só pode ser ativado na Main Phase. Fase atual: ${state.phase}.`,
      },
    };
  }

  const player = state.players[action.playerId];
  if (!player) {
    return {
      valid: false,
      error: { code: ActionErrorCode.INVALID_PLAYER, message: 'Jogador não encontrado.' },
    };
  }

  const rep = player.representative;
  if (!rep.highlightAvailable && rep.popularity < rep.popularityRequirement) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.HIGHLIGHT_NOT_AVAILABLE,
        message: `Destaque indisponível: Popularidade atual (${rep.popularity}) não atingiu o requisito (${rep.popularityRequirement}).`,
      },
    };
  }

  return { valid: true };
}

/**
 * Ativação pura do Destaque do Representante.
 *
 * Processamento normativo:
 * 1. O Destaque NÃO custa Energia (requisito e custo exclusivo: Popularidade).
 * 2. Consome o Destaque (highlightAvailable = false) e zera a Popularidade, permitindo nova acumulação futura.
 * 3. Aplica o efeito do Representante:
 *    - Daichi (rep_daichi): Estudantes aliados recebem +1 Influência e +1 Moral até o fim do turno.
 *    - Akira (rep_akira): Estudantes adversários recebem Silêncio até o fim do próximo turno do oponente.
 * 4. Emite o evento canônico HIGHLIGHT_ACTIVATED no barramento determinístico.
 */
export function activateHighlight(
  state: GameState,
  action: ActivateHighlightAction,
  registry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const validation = validateActivateHighlight(state, action, registry);
  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  const nextState = cloneGameState(state);
  const player = nextState.players[action.playerId];
  const rep = player.representative;

  // 1. Reseta popularidade e disponibilidade (Seção 39: após utilizar, volta a acumular)
  rep.popularity = 0;
  rep.highlightAvailable = false;

  // 3. Aplica o efeito específico do Representante
  const opponentId = getOpponentId(nextState, action.playerId);
  const opponent = nextState.players[opponentId];

  if (rep.definitionId === 'rep_daichi' || rep.name.toLowerCase().includes('daichi')) {
    // Daichi: +1 Influência e +1 Moral para todos os estudantes aliados em campo este turno
    for (const student of player.board) {
      student.currentInfluence = (student.currentInfluence ?? 0) + 1;
      student.currentMorale = (student.currentMorale ?? 0) + 1;
      student.maxMorale = (student.maxMorale ?? 0) + 1;
      student.statuses.push('TEMP_HIGHLIGHT_BUFF');
    }
  } else if (rep.definitionId === 'rep_akira' || rep.name.toLowerCase().includes('akira')) {
    // Akira: Silêncio em todos os estudantes adversários em campo
    for (const student of opponent.board) {
      student.statuses.push('TEMP_SILENCE');
      student.statuses.push(Keyword.SILENCIO);
    }
  }

  // 4. Emissão do evento canônico
  const highlightEvent: HighlightActivatedEvent = {
    id: generateEventId(nextState.turn, nextState.phase, GameEventType.HIGHLIGHT_ACTIVATED),
    type: GameEventType.HIGHLIGHT_ACTIVATED,
    turn: nextState.turn,
    phase: nextState.phase,
    playerId: action.playerId,
    representativeId: rep.definitionId,
  };

  const dispatchResult = dispatchEvents(nextState, [highlightEvent], { cardRegistry: registry });

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}
