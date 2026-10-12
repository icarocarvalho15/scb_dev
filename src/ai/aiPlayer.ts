import { GameAction, ActionType } from '../core/types/action';
import { GameState, GameStatus } from '../core/types/state';
import { GamePhase } from '../core/types/phase';
import { PlayerId } from '../core/types/player';
import { CardDefinition, Keyword } from '../core/types/card';
import { applyAction } from '../core/engine/gameEngine';
import { getOpponentId } from '../core/engine/turnSystem';
import { getNextDebatePlayerId } from '../core/engine/debateSystem';
import { hasCardKeyword } from '../core/engine/keywordSystem';
import { createInitialGameState } from '../core/state/createInitialGameState';
import { generateCandidateActions } from './actionGenerator';
import { filterLegalActions } from './legalActionFilter';
import { chooseBestAction } from './decisionPolicy';
import { evaluateGameState } from './evaluator';
import {
  AIPlayerConfig,
  MatchSimulationOptions,
  MatchSimulationResult,
} from './types';

/**
 * Cria gerador pseudo-aleatório determinístico baseado em semente (PRNG 32-bit).
 * Garante reprodutibilidade estrita em testes automatizados.
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seleciona a melhor ação legal para um jogador de IA em um determinado estado.
 * Respeita estritamente o fluxo da engine:
 * Observar Estado -> Gerar Candidatos -> Filtrar Legais -> Avaliar -> Selecionar.
 */
export function chooseAction(
  state: GameState,
  playerId: PlayerId,
  config?: Partial<AIPlayerConfig>
): GameAction | null {
  if (state.status === GameStatus.FINISHED) {
    return null;
  }

  const cardRegistry = config?.cardRegistry;
  const weights = config?.weights;
  const rng = config?.rngSeed !== undefined ? createRng(config.rngSeed) : undefined;

  // 1. Gera ações candidatas para a fase e jogador
  const candidates = generateCandidateActions(state, playerId, { cardRegistry });
  if (candidates.length === 0) {
    return null;
  }

  // 2. Filtra com rigor as ações legais via engine.validateAction
  const legalActions = filterLegalActions(state, candidates, { cardRegistry });
  if (legalActions.length === 0) {
    return null;
  }

  // Se o jogador estiver defendendo na Combat Phase (bloqueando):
  // Verifica se bloquear é vantajoso em relação a não bloquear (manter o estado atual)
  if (state.phase === GamePhase.COMBAT && state.activePlayerId !== playerId) {
    const currentScore = evaluateGameState(state, playerId, weights, { cardRegistry });
    const bestBlock = chooseBestAction(state, legalActions, playerId, {
      weights,
      cardRegistry,
      rng,
    });

    if (bestBlock) {
      const sim = applyAction(state, bestBlock, { cardRegistry });
      if (sim.success) {
        const blockScore = evaluateGameState(sim.state, playerId, weights, { cardRegistry });
        // Se bloquear for pior do que não bloquear (ex: suicídio desnecessário), escolhe não bloquear
        if (blockScore < currentScore) {
          return null;
        }
      }
    }
    return bestBlock;
  }

  // 3. Avalia e escolhe a melhor ação conforme heurística e desempate
  return chooseBestAction(state, legalActions, playerId, {
    weights,
    cardRegistry,
    rng,
  });
}

/**
 * Identifica qual jogador tem a vez/prioridade de agir no estado corrente.
 */
export function getExpectedActor(state: GameState): PlayerId | null {
  if (state.status === GameStatus.FINISHED) {
    return null;
  }

  switch (state.phase) {
    case GamePhase.START:
    case GamePhase.MAIN:
    case GamePhase.END:
      return state.activePlayerId;

    case GamePhase.DEBATE: {
      if (!state.debate.active) {
        return state.activePlayerId;
      }
      return getNextDebatePlayerId(state) ?? state.activePlayerId;
    }

    case GamePhase.COMBAT: {
      const activePlayer = state.players[state.activePlayerId];
      const defenderId = getOpponentId(state, state.activePlayerId);
      const attacks = state.combat?.attacks ?? [];

      // 1. Se não há ataques declarados, a prioridade é do atacante (declarar ataques ou pular combate)
      if (attacks.length === 0) {
        return state.activePlayerId;
      }

      // 2. Verifica se há pelo menos um ataque bloqueável (que NÃO possui Infiltração)
      const hasBlockableAttack = attacks.some((a) => {
        const attacker = activePlayer?.board.find((s) => s.instanceId === a.attackerInstanceId);
        return attacker ? !hasCardKeyword(attacker, Keyword.INFILTRACAO) : true;
      });

      // 3. Se o atacante já encerrou a declaração de ataques (attackersDeclared === true)
      if (state.combat?.attackersDeclared) {
        // Se há ataque bloqueável e o defensor ainda não passou/concluiu a defesa:
        if (hasBlockableAttack && !state.combat?.defenderPassed) {
          return defenderId;
        }
        return state.activePlayerId;
      }

      // 4. Se o atacante ainda não encerrou explicitamente, verifica se ainda possui atacantes prontos aptos
      const hasReadyAttacker = activePlayer?.board.some(
        (s) =>
          s.ready &&
          !s.hasInertia &&
          !attacks.some((a) => a.attackerInstanceId === s.instanceId)
      );

      if (hasReadyAttacker) {
        return state.activePlayerId;
      }

      // 5. Atacante não tem mais atacantes prontos:
      // Se há ataque sem Infiltração e o defensor não concluiu a defesa, prioridade é do defensor
      if (hasBlockableAttack && !state.combat?.defenderPassed) {
        return defenderId;
      }

      return state.activePlayerId;
    }
  }
}

/**
 * Executa um único passo de tomada de decisão e aplicação no jogo.
 */
export function stepGame(
  state: GameState,
  options?: {
    cardRegistry?: Record<string, CardDefinition>;
    rngSeed?: number;
  }
): { state: GameState; action: GameAction | null; success: boolean } {
  if (state.status === GameStatus.FINISHED) {
    return { state, action: null, success: true };
  }

  const actorId = getExpectedActor(state);
  if (!actorId) {
    return { state, action: null, success: false };
  }

  const action = chooseAction(state, actorId, {
    cardRegistry: options?.cardRegistry,
    rngSeed: options?.rngSeed,
  });

  if (!action) {
    // Se o defensor optou por não bloquear, o atacante avança a fase
    if (state.phase === GamePhase.COMBAT && actorId !== state.activePlayerId) {
      const advanceAction: GameAction = {
        type: ActionType.ADVANCE_PHASE,
        playerId: state.activePlayerId,
      };
      const result = applyAction(state, advanceAction, {
        cardRegistry: options?.cardRegistry,
      });
      return {
        state: result.success ? result.state : state,
        action: advanceAction,
        success: result.success,
      };
    }

    // Fallback de segurança: avançar fase se jogador ativo ficou sem ações
    if (actorId === state.activePlayerId) {
      const fallbackAction: GameAction = {
        type: ActionType.ADVANCE_PHASE,
        playerId: actorId,
      };
      const result = applyAction(state, fallbackAction, {
        cardRegistry: options?.cardRegistry,
      });
      return {
        state: result.success ? result.state : state,
        action: fallbackAction,
        success: result.success,
      };
    }

    return { state, action: null, success: false };
  }

  const result = applyAction(state, action, {
    cardRegistry: options?.cardRegistry,
  });

  return {
    state: result.success ? result.state : state,
    action,
    success: result.success,
  };
}

/**
 * Classe controladora de um jogador IA autônomo.
 */
export class AIPlayer {
  readonly playerId: PlayerId;
  readonly weights?: Partial<import('./types').EvaluationWeights>;
  readonly cardRegistry?: Record<string, CardDefinition>;
  private rngSeed: number;

  constructor(config: AIPlayerConfig) {
    this.playerId = config.playerId;
    this.weights = config.weights;
    this.cardRegistry = config.cardRegistry;
    this.rngSeed = config.rngSeed ?? 1337;
  }

  /**
   * Escolhe a melhor ação legal para o estado atual.
   */
  chooseAction(state: GameState): GameAction | null {
    this.rngSeed = (this.rngSeed + 1) >>> 0;
    return chooseAction(state, this.playerId, {
      weights: this.weights,
      cardRegistry: this.cardRegistry,
      rngSeed: this.rngSeed,
    });
  }

  /**
   * Executa ações do turno da IA até que passe o controle ou finalize a partida.
   */
  takeTurn(
    state: GameState,
    maxActions: number = 30
  ): { state: GameState; actionsTaken: GameAction[] } {
    let currentState = state;
    const actionsTaken: GameAction[] = [];

    while (
      currentState.status !== GameStatus.FINISHED &&
      actionsTaken.length < maxActions
    ) {
      const actorId = getExpectedActor(currentState);
      if (actorId !== this.playerId) {
        break;
      }

      const action = this.chooseAction(currentState);
      if (!action) {
        // Se jogador ativo não tem mais ações, avança a fase
        if (currentState.activePlayerId === this.playerId) {
          const advanceAction: GameAction = {
            type: ActionType.ADVANCE_PHASE,
            playerId: this.playerId,
          };
          const res = applyAction(currentState, advanceAction, {
            cardRegistry: this.cardRegistry,
          });
          if (res.success) {
            currentState = res.state;
            actionsTaken.push(advanceAction);
          }
        }
        break;
      }

      const res = applyAction(currentState, action, {
        cardRegistry: this.cardRegistry,
      });
      if (!res.success) {
        break;
      }

      currentState = res.state;
      actionsTaken.push(action);
    }

    return { state: currentState, actionsTaken };
  }
}

/**
 * Simula uma partida completa de IA vs IA de forma puramente determinística.
 * Conforme docs/agents/SCB_AI_Engineer.md:
 * "A IA deve conseguir jogar partidas completas automaticamente sem produzir GameState inválido."
 */
export function simulateMatch(
  options: MatchSimulationOptions = {}
): MatchSimulationResult {
  const seed = options.rngSeed ?? 1337;
  const maxTurns = options.maxTurns ?? 100;
  const maxActions = 2500; // Limite de segurança contra loops

  let state =
    options.initialState ??
    createInitialGameState({
      matchId: options.matchId ?? `sim_${seed}`,
      rngSeed: seed,
      shuffleDeck: true,
      autoDrawInitialHand: true,
    });

  const p1 = new AIPlayer({
    playerId: 'player1',
    weights: options.player1Weights,
    cardRegistry: options.cardRegistry,
    rngSeed: seed,
  });

  const p2 = new AIPlayer({
    playerId: 'player2',
    weights: options.player2Weights,
    cardRegistry: options.cardRegistry,
    rngSeed: seed + 777,
  });

  const players: Record<PlayerId, AIPlayer> = {
    player1: p1,
    player2: p2,
  };

  const history: GameAction[] = [];
  let actionCount = 0;
  let consecutivePasses = 0;

  while (
    state.status !== GameStatus.FINISHED &&
    state.turn <= maxTurns &&
    actionCount < maxActions
  ) {
    const actorId = getExpectedActor(state);
    if (!actorId) {
      break;
    }

    const ai = players[actorId] ?? (actorId === 'player1' ? p1 : p2);
    const action = ai.chooseAction(state);

    if (!action) {
      // Se defensor optou por não bloquear em combate, atacante avança a fase
      if (state.phase === GamePhase.COMBAT && actorId !== state.activePlayerId) {
        const adv: GameAction = {
          type: ActionType.ADVANCE_PHASE,
          playerId: state.activePlayerId,
        };
        const res = applyAction(state, adv, { cardRegistry: options.cardRegistry });
        if (!res.success) {
          return {
            finished: false,
            winnerId: null,
            totalTurns: state.turn,
            totalActions: actionCount,
            finalState: state,
            history,
            error: `Erro ao avançar fase em combate: ${res.error?.message}`,
          };
        }
        state = res.state;
        history.push(adv);
        actionCount++;
        consecutivePasses = 0;
        continue;
      }

      // Se jogador ativo não tem ação, avança a fase
      if (actorId === state.activePlayerId) {
        const adv: GameAction = {
          type: ActionType.ADVANCE_PHASE,
          playerId: actorId,
        };
        const res = applyAction(state, adv, { cardRegistry: options.cardRegistry });
        if (!res.success) {
          return {
            finished: false,
            winnerId: null,
            totalTurns: state.turn,
            totalActions: actionCount,
            finalState: state,
            history,
            error: `Erro ao avançar fase: ${res.error?.message}`,
          };
        }
        state = res.state;
        history.push(adv);
        actionCount++;
        consecutivePasses++;
        if (consecutivePasses > 10) {
          // Mais de 10 avanços consecutivos sem nenhuma outra ação
          // Partida travada em impasse
          break;
        }
        continue;
      }

      break;
    }

    consecutivePasses = action.type === ActionType.ADVANCE_PHASE ? consecutivePasses + 1 : 0;

    const res = applyAction(state, action, { cardRegistry: options.cardRegistry });
    if (!res.success) {
      return {
        finished: false,
        winnerId: null,
        totalTurns: state.turn,
        totalActions: actionCount,
        finalState: state,
        history,
        error: `Ação gerada pela IA falhou no applyAction: ${res.error?.message} (${JSON.stringify(action)})`,
      };
    }

    state = res.state;
    history.push(action);
    actionCount++;
  }

  return {
    finished: state.status === GameStatus.FINISHED,
    winnerId: state.winnerId,
    totalTurns: state.turn,
    totalActions: actionCount,
    finalState: state,
    history,
  };
}
