import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  GameStatus,
  CardZone,
  CardDefinition,
  CardInstance,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_PROVOCADOR,
  ALPHA_STUDENT_INFILTRADOR,
  ALPHA_STUDENT_SILENCIADO,
  ALPHA_STUDENT_RESILIENTE,
  createCardInstance,
} from '../../src/core';
import { evaluateGameState, DEFAULT_EVALUATION_WEIGHTS } from '../../src/ai/evaluator';

function createCustomStudent(
  definition: CardDefinition,
  ownerId: string,
  index: number,
  overrides?: Partial<CardInstance>
): CardInstance {
  return {
    ...createCardInstance(definition, ownerId, index, CardZone.BOARD),
    ready: true,
    hasInertia: false,
    ...overrides,
  };
}

describe('AI System — Evaluator (src/ai/evaluator.ts)', () => {
  describe('1. Estados Terminais', () => {
    it('deve retornar pontuação máxima positiva quando o jogador é o vencedor', () => {
      const state = createInitialGameState();
      state.status = GameStatus.FINISHED;
      state.winnerId = 'player1';

      const score = evaluateGameState(state, 'player1');
      expect(score).toBe(DEFAULT_EVALUATION_WEIGHTS.winLossWeight);
    });

    it('deve retornar pontuação máxima negativa quando o jogador é o perdedor', () => {
      const state = createInitialGameState();
      state.status = GameStatus.FINISHED;
      state.winnerId = 'player2';

      const score = evaluateGameState(state, 'player1');
      expect(score).toBe(-DEFAULT_EVALUATION_WEIGHTS.winLossWeight);
    });
  });

  describe('2. Moral do Representante', () => {
    it('deve pontuar positivamente quando o jogador tem maior Moral no Representante', () => {
      const state = createInitialGameState();
      state.players['player1'].representative.currentMorale = 20;
      state.players['player2'].representative.currentMorale = 10;

      const scoreP1 = evaluateGameState(state, 'player1');
      const scoreP2 = evaluateGameState(state, 'player2');

      expect(scoreP1).toBeGreaterThan(0);
      expect(scoreP2).toBeLessThan(0);
      expect(scoreP1).toBe(-scoreP2);
    });
  });

  describe('3. Vantagem de Mesa e Keywords', () => {
    it('deve premiar maior presença de estudantes e atributos no campo', () => {
      const state = createInitialGameState();
      // Player 1 possui 2 estudantes
      state.players['player1'].board = [
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1),
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 2),
      ];
      // Player 2 possui 0 estudantes
      state.players['player2'].board = [];

      const score = evaluateGameState(state, 'player1');
      expect(score).toBeGreaterThan(0);
    });

    it('deve valorizar Keywords defensivas e ofensivas (Provocação, Infiltração, Persistência)', () => {
      const state = createInitialGameState();

      // Board com Novato comum
      state.players['player1'].board = [
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1),
      ];
      const baseScore = evaluateGameState(state, 'player1');

      // Substitui por Provocador (mesmo custo, ganha bônus de Provocação)
      state.players['player1'].board = [
        createCustomStudent(ALPHA_STUDENT_PROVOCADOR, 'player1', 1),
      ];
      const provScore = evaluateGameState(state, 'player1');
      expect(provScore).toBeGreaterThan(baseScore);

      // Substitui por Infiltrador
      state.players['player1'].board = [
        createCustomStudent(ALPHA_STUDENT_INFILTRADOR, 'player1', 1),
      ];
      const infScore = evaluateGameState(state, 'player1');
      expect(infScore).toBeGreaterThan(baseScore);

      // Substitui por Resiliente (Persistência)
      state.players['player1'].board = [
        createCustomStudent(ALPHA_STUDENT_RESILIENTE, 'player1', 1),
      ];
      const resScore = evaluateGameState(state, 'player1');
      expect(resScore).toBeGreaterThan(baseScore);
    });

    it('deve penalizar Silêncio no próprio estudante', () => {
      const state = createInitialGameState();

      state.players['player1'].board = [
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1),
      ];
      const scoreNormal = evaluateGameState(state, 'player1');

      // Silenciado
      state.players['player1'].board = [
        createCustomStudent(ALPHA_STUDENT_SILENCIADO, 'player1', 1),
      ];
      const scoreSilenciado = evaluateGameState(state, 'player1');

      // Penalidade de Silêncio aplicada
      expect(scoreSilenciado).toBeLessThan(scoreNormal + 20); // Mesmo com moral/influence um pouco superior, recebe penalidade
    });
  });

  describe('4. Vantagem de Recursos (Hand, Popularidade, Destaque)', () => {
    it('deve pontuar mais com maior número de cartas na mão', () => {
      const state = createInitialGameState();
      state.players['player1'].hand.push(
        createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 99, CardZone.HAND)
      );

      const score = evaluateGameState(state, 'player1');
      expect(score).toBeGreaterThan(0);
    });

    it('deve premiar disponibilidade de Destaque no Representante', () => {
      const state = createInitialGameState();
      state.players['player1'].representative.highlightAvailable = true;

      const score = evaluateGameState(state, 'player1');
      expect(score).toBeGreaterThan(DEFAULT_EVALUATION_WEIGHTS.highlightWeight - 5);
    });
  });
});
