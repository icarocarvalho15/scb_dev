import { GameAction, ActionType } from '../core/types/action';
import { GameState, GameStatus } from '../core/types/state';
import { GamePhase } from '../core/types/phase';
import { validateAction } from '../core/engine/gameEngine';
import { LegalFilterOptions } from './types';

/**
 * Serializa uma ação para identificador único determinístico para deduplicação.
 */
function serializeAction(action: GameAction): string {
  return JSON.stringify(action);
}

/**
 * Validação rigorosa e desacoplada de uma ação de jogo, usando validateAction da engine
 * e garantindo conformidade com os requisitos de transição e despacho de applyAction.
 */
export function isActionLegal(
  state: GameState,
  action: GameAction,
  options?: LegalFilterOptions
): boolean {
  if (state.status === GameStatus.FINISHED) {
    return false;
  }

  // 1. Validação padrão da Game Engine
  const engineValidation = validateAction(state, action, {
    cardRegistry: options?.cardRegistry,
  });

  if (!engineValidation.valid) {
    return false;
  }

  // 2. Validações adicionais para tipos que não passam por validadores específicos na engine
  switch (action.type) {
    case ActionType.ADVANCE_PHASE:
    case ActionType.END_PHASE: {
      // Já rigorosamente validado em validateAction (respeitando o fluxo bifásico da fase de combate)
      return true;
    }

    case ActionType.RESOLVE_COMBAT: {
      if (state.phase !== GamePhase.COMBAT) {
        return false;
      }
      if (action.playerId !== state.activePlayerId) {
        return false;
      }
      return true;
    }

    case ActionType.DISCARD_CARDS: {
      if (state.phase !== GamePhase.END) {
        return false;
      }
      if (action.playerId !== state.activePlayerId) {
        return false;
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Filtro estrito de ações legais.
 * Conforme docs/agents/SCB_AI_Engineer.md e Princípio Engine First:
 * Elimina qualquer ação candidata que resultaria em falha no applyAction().
 */
export function filterLegalActions(
  state: GameState,
  actions: GameAction[],
  options?: LegalFilterOptions
): GameAction[] {
  if (state.status === GameStatus.FINISHED || actions.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const legalActions: GameAction[] = [];

  for (const action of actions) {
    const key = serializeAction(action);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    if (isActionLegal(state, action, options)) {
      legalActions.push(action);
    }
  }

  return legalActions;
}
