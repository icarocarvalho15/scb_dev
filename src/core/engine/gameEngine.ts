import { GameState, GameStatus } from '../types/state';
import { ActionType, GameAction } from '../types/action';
import { ActionErrorCode, ActionResult } from '../types/error';
import { advancePhase, cloneGameState, discardCards, getOpponentId } from './turnSystem';

/**
 * Função central da Game Engine para recepção e resolução pura de ações de jogo.
 * Conforme docs/rules/SCB_Architecture.md seção 15 e docs/agents/SKILL.md regra 11:
 * UI -> Action -> Validation -> Game Engine -> New GameState.
 */
export function applyAction(state: GameState, action: GameAction): ActionResult<GameState> {
  // 1. Validação global: partida não pode estar finalizada
  if (state.status === GameStatus.FINISHED) {
    return {
      success: false,
      error: {
        code: ActionErrorCode.GAME_OVER,
        message: 'A partida já foi encerrada.',
      },
    };
  }

  // 2. Despacho por tipo de ação
  switch (action.type) {
    case ActionType.ADVANCE_PHASE:
    case ActionType.END_PHASE: {
      const result = advancePhase(state, action);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.DISCARD_CARDS: {
      if (action.playerId !== state.activePlayerId) {
        return {
          success: false,
          error: {
            code: ActionErrorCode.INVALID_PLAYER,
            message: 'Apenas o jogador ativo pode descartar cartas nesta fase.',
          },
        };
      }
      const result = discardCards(state, action.playerId, action.cardInstanceIds);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.SURRENDER: {
      const nextState = cloneGameState(state);
      const opponentId = getOpponentId(nextState, action.playerId);
      nextState.status = GameStatus.FINISHED;
      nextState.winnerId = opponentId;
      nextState.history.push(action);
      return { success: true, state: nextState };
    }

    default: {
      return {
        success: false,
        error: {
          code: ActionErrorCode.UNKNOWN_ERROR,
          message: `Ação do tipo ${action.type} ainda não implementada na engine.`,
        },
      };
    }
  }
}
