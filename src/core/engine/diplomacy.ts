import { GameState } from '../types/state';
import { PlayerId } from '../types/player';
import { ActionErrorCode } from '../types/error';

/**
 * Verifica se a restrição global de Diplomacia de Abertura está ativa para o jogador.
 * Conforme docs/rules/SCB_Rules.md seção 7 e docs/rules/SCB_Architecture.md seção 17:
 * Diplomacia é uma regra global de abertura ativa estritamente no primeiro turno de cada jogador.
 */
export function isDiplomacyActive(state: GameState, playerId: PlayerId): boolean {
  return state.players[playerId]?.diplomacyActive ?? false;
}

/**
 * Valida se um ataque direto ao Representante adversário é permitido.
 * Se a Diplomacia estiver ativa para o jogador atacante, o ataque direto é proibido,
 * mesmo que o atacante possua Impulso ou Infiltração (docs/rules/SCB_Rules.md seção 7, 18, 36).
 */
export function canAttackRepresentative(state: GameState, attackerPlayerId: PlayerId): boolean {
  return !isDiplomacyActive(state, attackerPlayerId);
}

/**
 * Validação de alvo de ataque com relação à restrição normativa de Diplomacia.
 */
export function validateDiplomacyAttackTarget(
  state: GameState,
  attackerPlayerId: PlayerId,
  targetId: string
): { valid: boolean; code?: ActionErrorCode; message?: string } {
  // Identifica o oponente
  const opponentId = Object.keys(state.players).find((id) => id !== attackerPlayerId);
  const opponent = opponentId ? state.players[opponentId] : null;

  const isTargetRepresentative =
    targetId === opponentId ||
    (opponent &&
      (targetId === opponent.representative.definitionId ||
        targetId === opponent.representative.ownerId ||
        targetId === opponent.representative.name));

  if (isTargetRepresentative && isDiplomacyActive(state, attackerPlayerId)) {
    return {
      valid: false,
      code: ActionErrorCode.DIPLOMACY_RESTRICTION,
      message:
        'Diplomacia ativa: Estudantes não podem atacar diretamente o Representante adversário no primeiro turno.',
    };
  }

  return { valid: true };
}
