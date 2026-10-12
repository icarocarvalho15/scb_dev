import { GamePhase } from './phase';
import { PlayerId, PlayerState } from './player';
import { GameAction } from './action';

/**
 * Status global da partida
 */
export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export type DebateStepName = 'INITIAL' | 'REPLICA' | 'TREPLICA' | 'CONTRARREPLICA';

/**
 * Entrada de ação no Debate
 * O debate Alpha possui 4 etapas no máximo: Ação Inicial -> Réplica -> Tréplica -> Contrarréplica
 * Resolução LIFO conforme docs/rules/SCB_Rules.md seção 24-25
 */
export interface DebateActionEntry {
  id?: string;
  step: number; // 1: Ação Inicial, 2: Réplica, 3: Tréplica, 4: Contrarréplica
  stepName?: DebateStepName;
  playerId: PlayerId;
  cardInstanceId?: string;
  cardDefinitionId?: string;
  targetId?: string;
  targetIds?: string[];
  parameters?: Record<string, unknown>;
  passed?: boolean;
}

/**
 * Estado da cadeia de Debate
 * Conforme docs/rules/SCB_Architecture.md seção 24
 */
export interface DebateState {
  active: boolean;
  initiatorPlayerId: PlayerId | null;
  currentStep: number; // 0 (sem debate) até 4 (contrarréplica)
  actions: DebateActionEntry[];
  consecutivePasses?: number;
}

/**
 * Declaração individual de ataque na Combat Phase
 * Conforme docs/rules/SCB_Rules.md seções 27-31
 */
export interface AttackDeclaration {
  attackerInstanceId: string;
  targetId: string; // Pode ser um Estudante adversário ou o Representante adversário
  blockerInstanceId?: string; // Estudante defensor atribuído para bloquear/interceptar
}

/**
 * Estado da fase de combate (COMBAT)
 * Conforme docs/rules/SCB_Architecture.md seção 23 e 51
 */
export interface CombatState {
  active: boolean;
  attacks: AttackDeclaration[];
  attackersDeclared?: boolean;
  defenderPassed?: boolean;
}

/**
 * Estado completo e canônico da partida de School Card Battle (SCB)
 * Esta é a ÚNICA fonte de verdade da partida.
 * Conforme docs/rules/SCB_Architecture.md seção 5
 */
export interface GameState {
  matchId: string;
  turn: number;
  activePlayerId: PlayerId;
  phase: GamePhase;
  status: GameStatus;

  // Jogadores indexados por PlayerId
  players: Record<PlayerId, PlayerState>;

  // Sub-estados da engine
  debate: DebateState;
  combat: CombatState;
  stack: GameAction[];

  // Resolução de vitória / encerramento
  winnerId: PlayerId | null;

  // Semente determinística para operações pseudo-aleatórias
  rngSeed: number;

  // Histórico de ações executadas
  history: GameAction[];
}
