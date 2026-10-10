import { GameState, GameStatus } from '../core/types/state';
import { PlayerId } from '../core/types/player';
import { Keyword } from '../core/types/card';
import { getOpponentId } from '../core/engine/turnSystem';
import { hasCardKeyword } from '../core/engine/keywordSystem';
import { EvaluationWeights, ActionGeneratorOptions } from './types';

/**
 * Pesos padrão equilibrados para a heurística da IA Alpha.
 */
export const DEFAULT_EVALUATION_WEIGHTS: EvaluationWeights = {
  winLossWeight: 100000,
  representativeMoraleWeight: 50,
  boardInfluenceWeight: 10,
  boardMoraleWeight: 8,
  boardCountWeight: 20,
  handCardWeight: 15,
  popularityWeight: 10,
  highlightWeight: 30,
  provocationBonus: 15,
  guardBonus: 10,
  infiltrationBonus: 15,
  impulseBonus: 10,
  protectionBonus: 10,
  persistenceBonus: 15,
  silencePenalty: -15,
};

/**
 * Função de avaliação heurística determinística de GameState sob a perspectiva de playerId.
 * Conforme docs/agents/SCB_AI_Engineer.md e Seção 4 da Diretiva da Fase 8.
 *
 * Retorna uma pontuação numérica (quanto maior, mais vantajoso para o jogador).
 */
export function evaluateGameState(
  state: GameState,
  playerId: PlayerId,
  customWeights?: Partial<EvaluationWeights>,
  options?: ActionGeneratorOptions
): number {
  const weights: EvaluationWeights = {
    ...DEFAULT_EVALUATION_WEIGHTS,
    ...customWeights,
  };

  // 1. Condições terminais de vitória e derrota
  if (state.status === GameStatus.FINISHED) {
    if (state.winnerId === playerId) {
      return weights.winLossWeight;
    }
    if (state.winnerId !== null && state.winnerId !== playerId) {
      return -weights.winLossWeight;
    }
    return 0;
  }

  const player = state.players[playerId];
  const opponentId = getOpponentId(state, playerId);
  const opponent = state.players[opponentId];

  if (!player || !opponent) {
    return 0;
  }

  let score = 0;

  // 2. Moral dos Representantes
  const playerMorale = player.representative?.currentMorale ?? 0;
  const opponentMorale = opponent.representative?.currentMorale ?? 0;
  score += (playerMorale - opponentMorale) * weights.representativeMoraleWeight;

  // 3. Controle e atributos de mesa (Board)
  // Lado do jogador
  let playerInfluence = 0;
  let playerMoraleTotal = 0;
  for (const s of player.board) {
    playerInfluence += s.currentInfluence ?? 0;
    playerMoraleTotal += s.currentMorale ?? 0;

    if (hasCardKeyword(s, Keyword.PROVOCACAO, options?.cardRegistry)) {
      score += weights.provocationBonus;
    }
    if (hasCardKeyword(s, Keyword.GUARDA, options?.cardRegistry)) {
      score += weights.guardBonus;
    }
    if (hasCardKeyword(s, Keyword.INFILTRACAO, options?.cardRegistry)) {
      score += weights.infiltrationBonus;
    }
    if (hasCardKeyword(s, Keyword.IMPULSO, options?.cardRegistry)) {
      score += weights.impulseBonus;
    }
    if (hasCardKeyword(s, Keyword.PROTECAO, options?.cardRegistry)) {
      score += weights.protectionBonus;
    }
    if (hasCardKeyword(s, Keyword.PERSISTENCIA, options?.cardRegistry)) {
      score += weights.persistenceBonus;
    }
    if (hasCardKeyword(s, Keyword.SILENCIO, options?.cardRegistry)) {
      score += weights.silencePenalty;
    }
  }

  // Lado do oponente
  let opponentInfluence = 0;
  let opponentMoraleTotal = 0;
  for (const s of opponent.board) {
    opponentInfluence += s.currentInfluence ?? 0;
    opponentMoraleTotal += s.currentMorale ?? 0;

    if (hasCardKeyword(s, Keyword.PROVOCACAO, options?.cardRegistry)) {
      score -= weights.provocationBonus;
    }
    if (hasCardKeyword(s, Keyword.GUARDA, options?.cardRegistry)) {
      score -= weights.guardBonus;
    }
    if (hasCardKeyword(s, Keyword.INFILTRACAO, options?.cardRegistry)) {
      score -= weights.infiltrationBonus;
    }
    if (hasCardKeyword(s, Keyword.IMPULSO, options?.cardRegistry)) {
      score -= weights.impulseBonus;
    }
    if (hasCardKeyword(s, Keyword.PROTECAO, options?.cardRegistry)) {
      score -= weights.protectionBonus;
    }
    if (hasCardKeyword(s, Keyword.PERSISTENCIA, options?.cardRegistry)) {
      score -= weights.persistenceBonus;
    }
    if (hasCardKeyword(s, Keyword.SILENCIO, options?.cardRegistry)) {
      score -= weights.silencePenalty;
    }
  }

  score += (playerInfluence - opponentInfluence) * weights.boardInfluenceWeight;
  score += (playerMoraleTotal - opponentMoraleTotal) * weights.boardMoraleWeight;
  score += (player.board.length - opponent.board.length) * weights.boardCountWeight;

  // 4. Vantagem de cartas na mão (Card Advantage)
  score += (player.hand.length - opponent.hand.length) * weights.handCardWeight;

  // 5. Popularidade e Destaque
  const playerPop = player.representative?.popularity ?? 0;
  const oppPop = opponent.representative?.popularity ?? 0;
  score += (playerPop - oppPop) * weights.popularityWeight;

  if (player.representative?.highlightAvailable) {
    score += weights.highlightWeight;
  }
  if (opponent.representative?.highlightAvailable) {
    score -= weights.highlightWeight;
  }

  // 6. Risco iminente de Deckout
  if (player.deck.length === 0) {
    score -= 1000;
  }
  if (opponent.deck.length === 0) {
    score += 1000;
  }

  return score;
}
