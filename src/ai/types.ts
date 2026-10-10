import { GameAction } from '../core/types/action';
import { GameState } from '../core/types/state';
import { PlayerId } from '../core/types/player';
import { CardDefinition } from '../core/types/card';

/**
 * Pesos da função de avaliação heurística de estado da IA.
 * Conforme docs/agents/SCB_AI_Engineer.md e diretiva da Fase 8.
 */
export interface EvaluationWeights {
  winLossWeight: number; // default: 100000
  representativeMoraleWeight: number; // default: 50
  boardInfluenceWeight: number; // default: 10
  boardMoraleWeight: number; // default: 8
  boardCountWeight: number; // default: 20
  handCardWeight: number; // default: 15
  popularityWeight: number; // default: 10
  highlightWeight: number; // default: 30
  provocationBonus: number; // default: 15
  guardBonus: number; // default: 10
  infiltrationBonus: number; // default: 15
  impulseBonus: number; // default: 10
  protectionBonus: number; // default: 10
  persistenceBonus: number; // default: 15
  silencePenalty: number; // default: -15
}

/**
 * Opções de geração de ações candidatas
 */
export interface ActionGeneratorOptions {
  cardRegistry?: Record<string, CardDefinition>;
}

/**
 * Opções de filtragem legal de ações
 */
export interface LegalFilterOptions {
  cardRegistry?: Record<string, CardDefinition>;
}

/**
 * Opções da política de decisão da IA
 */
export interface DecisionPolicyOptions {
  weights?: Partial<EvaluationWeights>;
  cardRegistry?: Record<string, CardDefinition>;
  rng?: () => number;
}

/**
 * Configuração de uma instância de AIPlayer
 */
export interface AIPlayerConfig {
  playerId: PlayerId;
  weights?: Partial<EvaluationWeights>;
  cardRegistry?: Record<string, CardDefinition>;
  rngSeed?: number;
  maxActionsPerPhase?: number;
}

/**
 * Ação avaliada com respectiva pontuação heurística
 */
export interface ScoredAction {
  action: GameAction;
  score: number;
}

/**
 * Opções para simulação automatizada de partidas entre IAs
 */
export interface MatchSimulationOptions {
  matchId?: string;
  rngSeed?: number;
  maxTurns?: number; // default: 100
  player1Weights?: Partial<EvaluationWeights>;
  player2Weights?: Partial<EvaluationWeights>;
  cardRegistry?: Record<string, CardDefinition>;
  initialState?: GameState;
}

/**
 * Resultado da simulação de partida
 */
export interface MatchSimulationResult {
  finished: boolean;
  winnerId: PlayerId | null;
  totalTurns: number;
  totalActions: number;
  finalState: GameState;
  history: GameAction[];
  error?: string;
}
