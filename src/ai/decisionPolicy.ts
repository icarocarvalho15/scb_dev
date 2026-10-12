import { GameAction, ActionType } from '../core/types/action';
import { GameState } from '../core/types/state';
import { PlayerId } from '../core/types/player';
import { applyAction } from '../core/engine/gameEngine';
import { getOpponentId } from '../core/engine/turnSystem';
import { isTargetRepresentative } from '../core/engine/combatSystem';
import { evaluateGameState } from './evaluator';
import { DecisionPolicyOptions, ScoredAction } from './types';

/**
 * Avalia e seleciona a melhor ação legal utilizando simulação determinística pura
 * via applyAction e heurística de estado.
 *
 * Conforme docs/agents/SCB_AI_Engineer.md e Seção 4 da Diretiva da Fase 8.
 */
export function scoreLegalActions(
  state: GameState,
  legalActions: GameAction[],
  playerId: PlayerId,
  options?: DecisionPolicyOptions
): ScoredAction[] {
  if (legalActions.length === 0) {
    return [];
  }

  const opponentId = getOpponentId(state, playerId);
  const opponent = state.players[opponentId];
  const scoredActions: ScoredAction[] = [];

  for (const action of legalActions) {
    const simResult = applyAction(state, action, {
      cardRegistry: options?.cardRegistry,
    });

    if (!simResult.success) {
      continue;
    }

    let score = evaluateGameState(
      simResult.state,
      playerId,
      options?.weights,
      { cardRegistry: options?.cardRegistry }
    );

    // Ajustes táticos e preferências de iniciativa por tipo de ação
    switch (action.type) {
      case ActionType.ATTACK: {
        score += 5; // Recompensa iniciativa ofensiva

        if (opponent && (!action.targetId || isTargetRepresentative(action.targetId, opponent))) {
          score += 15; // Pressão direta ao Representante
        } else {
          // Bônus se removeu um Estudante inimigo do campo
          const enemyBeforeCount = opponent?.board.length ?? 0;
          const enemyAfterCount = simResult.state.players[opponentId]?.board.length ?? 0;
          if (enemyAfterCount < enemyBeforeCount) {
            score += 25; // Troca favorável / remoção de ameaça
          }
        }
        break;
      }

      case ActionType.BLOCK: {
        score += 12; // Bloqueio defensivo
        break;
      }

      case ActionType.PLAY_CARD: {
        score += 8; // Desenvolvimento de mesa
        break;
      }

      case ActionType.START_DEBATE: {
        score += 6; // Iniciativa em debates
        break;
      }

      case ActionType.RESPOND_DEBATE: {
        if (!action.pass) {
          score += 6;
        }
        break;
      }

      case ActionType.ADVANCE_PHASE:
      case ActionType.PASS_DEBATE: {
        // Ações de encerramento/passagem não recebem bônus artificial,
        // sendo escolhidas quando não há jogadas mais vantajosas.
        break;
      }
    }

    scoredActions.push({ action, score });
  }

  return scoredActions;
}

/**
 * Seleciona a melhor ação dentre as legais, resolvendo empates de forma determinística
 * através do PRNG com seed.
 */
export function chooseBestAction(
  state: GameState,
  legalActions: GameAction[],
  playerId: PlayerId,
  options?: DecisionPolicyOptions
): GameAction | null {
  if (legalActions.length === 0) {
    return null;
  }
  if (legalActions.length === 1) {
    return legalActions[0];
  }

  const scoredActions = scoreLegalActions(state, legalActions, playerId, options);
  if (scoredActions.length === 0) {
    return legalActions[0];
  }

  // Encontra a maior pontuação
  let maxScore = -Infinity;
  for (const item of scoredActions) {
    if (item.score > maxScore) {
      maxScore = item.score;
    }
  }

  // Agrupa ações empatadas na pontuação máxima
  const EPSILON = 0.0001;
  const bestActions = scoredActions
    .filter((item) => Math.abs(item.score - maxScore) < EPSILON)
    .map((item) => item.action);

  if (bestActions.length === 1) {
    return bestActions[0];
  }

  // Desempate determinístico via PRNG se fornecido
  if (options?.rng) {
    const index = Math.floor(options.rng() * bestActions.length);
    return bestActions[index];
  }

  return bestActions[0];
}
