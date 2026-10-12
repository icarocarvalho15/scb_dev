import { GameState, GameStatus } from '../types/state';
import { GamePhase } from '../types/phase';
import { ActionType, GameAction } from '../types/action';
import { ActionErrorCode, ActionResult } from '../types/error';
import { CardDefinition } from '../types/card';
import { advancePhase, cloneGameState, discardCards, getOpponentId } from './turnSystem';
import { playCard, validatePlayCard } from './cardPlaySystem';
import { declareAttack, declareBlock, resolveCombat, validateAttack, validateBlock } from './combatSystem';
import {
  startDebate,
  validateStartDebate,
  respondDebate,
  validateRespondDebate,
  passDebate,
  validatePassDebate,
  resolveDebate,
  validateResolveDebate,
} from './debateSystem';
import { activateHighlight, validateActivateHighlight } from './representativeSystem';
import { executeMulligan, validateMulligan } from './mulliganSystem';
import { GameEvent } from '../types/event';

export interface ApplyActionOptions {
  cardRegistry?: Record<string, CardDefinition>;
}

/**
 * Função central da Game Engine para recepção e resolução pura de ações de jogo.
 * Conforme docs/rules/SCB_Architecture.md seção 15 e docs/agents/SKILL.md regra 11:
 * UI -> Action -> Validation -> Game Engine -> New GameState.
 */
export function applyAction(
  state: GameState,
  action: GameAction,
  options?: ApplyActionOptions
): ActionResult<GameState> {
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
    case ActionType.PLAY_CARD: {
      const result = playCard(state, action, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.ATTACK: {
      const result = declareAttack(state, action, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.BLOCK: {
      const result = declareBlock(state, action, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.RESOLVE_COMBAT: {
      const result = resolveCombat(state, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.ADVANCE_PHASE:
    case ActionType.END_PHASE: {
      const result = advancePhase(state, action, { cardRegistry: options?.cardRegistry });
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
      return { success: true, state: nextState, events: [] };
    }

    case ActionType.START_DEBATE: {
      const result = startDebate(state, action, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.RESPOND_DEBATE: {
      const result = respondDebate(state, action, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.PASS_DEBATE: {
      const result = passDebate(state, action, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.RESOLVE_DEBATE: {
      const result = resolveDebate(state, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.ACTIVATE_HIGHLIGHT: {
      const result = activateHighlight(state, action, options?.cardRegistry);
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.MULLIGAN: {
      const result = executeMulligan(state, action, { cardRegistry: options?.cardRegistry });
      if (result.success) {
        result.state.history.push(action);
      }
      return result;
    }

    case ActionType.ACTIVATE_ABILITY: {
      const val = validateAction(state, action, options);
      if (!val.valid) {
        return { success: false, error: val.error! };
      }
      return {
        success: false,
        error: {
          code: ActionErrorCode.UNKNOWN_ERROR,
          message: `Ação do tipo ${action.type} ainda não implementada na engine.`,
        },
      };
    }

    default: {
      return {
        success: false,
        error: {
          code: ActionErrorCode.UNKNOWN_ERROR,
          message: `Ação do tipo ${(action as any).type} ainda não implementada na engine.`,
        },
      };
    }
  }
}

import { isProtected } from './keywordSystem';

/**
 * Validação declarativa de ações antes de serem aplicadas.
 * Conforme docs/agents/SCB_Game_Core_Engineer.md:
 * validateAction(state, action) -> { valid: boolean, error?: ActionError }
 */
export function validateAction(
  state: GameState,
  action: GameAction,
  options?: ApplyActionOptions
): { valid: boolean; error?: import('../types/error').ActionError } {
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.GAME_OVER,
        message: 'A partida já foi encerrada.',
      },
    };
  }

  switch (action.type) {
    case ActionType.PLAY_CARD: {
      const val = validatePlayCard(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.ATTACK: {
      const val = validateAttack(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.BLOCK: {
      const val = validateBlock(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.START_DEBATE: {
      const val = validateStartDebate(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.RESPOND_DEBATE: {
      const val = validateRespondDebate(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.PASS_DEBATE: {
      const val = validatePassDebate(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.RESOLVE_DEBATE: {
      const val = validateResolveDebate(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.ACTIVATE_ABILITY: {
      // Proteção: não pode ser alvo de habilidades e/ou Debates
      if ('targetId' in action && action.targetId) {
        for (const player of Object.values(state.players)) {
          const targetStudent = player.board.find((s) => s.instanceId === action.targetId);
          if (targetStudent && isProtected(targetStudent, options?.cardRegistry)) {
            return {
              valid: false,
              error: {
                code: ActionErrorCode.PROTECTION_RESTRICTION,
                message: 'O Estudante alvo possui Proteção e não pode ser alvo de habilidades e/ou Debates.',
              },
            };
          }
        }
      }
      return { valid: true };
    }

    case ActionType.ACTIVATE_HIGHLIGHT: {
      const val = validateActivateHighlight(state, action, options?.cardRegistry);
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.MULLIGAN: {
      const val = validateMulligan(state, action, { cardRegistry: options?.cardRegistry });
      return val.valid ? { valid: true } : { valid: false, error: val.error };
    }

    case ActionType.ADVANCE_PHASE:
    case ActionType.END_PHASE: {
      if (action.playerId) {
        if (
          state.phase === GamePhase.COMBAT &&
          (state.combat?.attacks?.length ?? 0) > 0 &&
          state.combat?.attackersDeclared
        ) {
          const defenderId = getOpponentId(state, state.activePlayerId);
          if (action.playerId !== defenderId) {
            return {
              valid: false,
              error: {
                code: ActionErrorCode.INVALID_PLAYER,
                message: 'Apenas o defensor pode concluir a declaração de bloqueios.',
              },
            };
          }
        } else {
          if (action.playerId !== state.activePlayerId) {
            return {
              valid: false,
              error: {
                code: ActionErrorCode.INVALID_PLAYER,
                message: 'Apenas o jogador ativo pode avançar a fase.',
              },
            };
          }
        }
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

/**
 * Resolução declarativa que retorna os eventos gerados por uma ação.
 * Conforme docs/agents/SCB_Game_Core_Engineer.md:
 * resolveAction(state, action) -> GameEvent[]
 */
export function resolveAction(
  state: GameState,
  action: GameAction,
  options?: ApplyActionOptions
): GameEvent[] {
  const result = applyAction(state, action, options);
  if (result.success && result.events) {
    return result.events;
  }
  return [];
}
