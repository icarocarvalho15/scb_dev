import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  GameState,
  GameStatus,
  CardDefinition,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_ATLETA_IMPULSO,
  ALPHA_STUDENT_PROVOCADOR,
  ALPHA_STUDENT_GUARDA,
  ALPHA_STUDENT_INFILTRADOR,
  ALPHA_STUDENT_REBELDE,
  ALPHA_STUDENT_RESILIENTE,
  ALPHA_DEBATE_CONTRAPONTO,
  ALPHA_DEBATE_DISCURSO_MOTIVACIONAL,
  DEFAULT_REPRESENTATIVE_DAICHI,
  DEFAULT_REPRESENTATIVE_AKIRA,
} from '../../src/core';
import { AIPlayer, simulateMatch, stepGame } from '../../src/ai';

/**
 * Constrói deck rico com cartas variadas do catálogo Alpha
 */
function createDiverseDeck(): CardDefinition[] {
  const deckCards: CardDefinition[] = [];
  const cardPool = [
    ALPHA_STUDENT_NOVATO,
    ALPHA_STUDENT_ATLETA_IMPULSO,
    ALPHA_STUDENT_PROVOCADOR,
    ALPHA_STUDENT_GUARDA,
    ALPHA_STUDENT_INFILTRADOR,
    ALPHA_STUDENT_REBELDE,
    ALPHA_STUDENT_RESILIENTE,
    ALPHA_DEBATE_CONTRAPONTO,
    ALPHA_DEBATE_DISCURSO_MOTIVACIONAL,
  ];

  for (let i = 0; i < 40; i++) {
    const template = cardPool[i % cardPool.length];
    deckCards.push({
      ...template,
      id: `${template.id}_${i + 1}`,
    });
  }
  return deckCards;
}

function createSimulationGameState(seed: number): GameState {
  return createInitialGameState({
    rngSeed: seed,
    player1: {
      id: 'player1',
      name: 'Daichi AI',
      representative: DEFAULT_REPRESENTATIVE_DAICHI,
      deck: createDiverseDeck(),
    },
    player2: {
      id: 'player2',
      name: 'Akira AI',
      representative: DEFAULT_REPRESENTATIVE_AKIRA,
      deck: createDiverseDeck(),
    },
  });
}

describe('AI System — Full Match Simulation (src/ai/aiPlayer.ts)', () => {
  describe('1. Simulação Completa de Partida IA vs IA', () => {
    it('deve simular e concluir uma partida inteira do início ao fim sem erros', () => {
      const result = simulateMatch({
        initialState: createSimulationGameState(12345),
        rngSeed: 12345,
        maxTurns: 100,
      });

      expect(result.error).toBeUndefined();
      expect(result.finished).toBe(true);
      expect(result.winnerId).not.toBeNull();
      expect(result.totalTurns).toBeGreaterThan(1);
      expect(result.totalActions).toBeGreaterThan(10);
      expect(result.finalState.status).toBe(GameStatus.FINISHED);
    }, 20000);

    it('a IA nunca emite uma ação ilegal que resulte em falha no applyAction', () => {
      const result = simulateMatch({
        initialState: createSimulationGameState(99999),
        rngSeed: 99999,
        maxTurns: 100,
      });

      expect(result.error).toBeUndefined();
      expect(result.finished).toBe(true);
      // O histórico de ações contém apenas ações que foram aplicadas com sucesso
      expect(result.history.length).toBe(result.totalActions);
    }, 20000);
  });

  describe('2. Determinismo e Reprodutibilidade', () => {
    it('executar duas simulações com a mesma semente PRNG deve produzir resultados 100% idênticos', () => {
      const sim1 = simulateMatch({
        initialState: createSimulationGameState(4242),
        rngSeed: 4242,
        maxTurns: 100,
      });
      const sim2 = simulateMatch({
        initialState: createSimulationGameState(4242),
        rngSeed: 4242,
        maxTurns: 100,
      });

      expect(sim1.finished).toBe(true);
      expect(sim2.finished).toBe(true);
      expect(sim1.winnerId).toBe(sim2.winnerId);
      expect(sim1.totalTurns).toBe(sim2.totalTurns);
      expect(sim1.totalActions).toBe(sim2.totalActions);
      expect(sim1.history).toEqual(sim2.history);
    }, 30000);

    it('executar com sementes diferentes deve produzir partidas distintas', () => {
      const simA = simulateMatch({
        initialState: createSimulationGameState(101),
        rngSeed: 101,
        maxTurns: 100,
      });
      const simB = simulateMatch({
        initialState: createSimulationGameState(202),
        rngSeed: 202,
        maxTurns: 100,
      });

      expect(simA.finished).toBe(true);
      expect(simB.finished).toBe(true);
      expect(simA.history).not.toEqual(simB.history);
    }, 30000);
  });

  describe('3. Simulação com Decks Alpha Variados (Keywords & Debates)', () => {
    it('deve concluir partidas utilizando catálogo rico de cartas sem travar', () => {
      const customInitialState = createSimulationGameState(7777);

      const result = simulateMatch({
        initialState: customInitialState,
        rngSeed: 7777,
        maxTurns: 100,
      });

      expect(result.error).toBeUndefined();
      expect(result.finished).toBe(true);
      expect(result.winnerId).toBeDefined();
    }, 20000);
  });

  describe('4. Teste de Estresse (Partidas Consecutivas Sem Crash)', () => {
    it('deve simular dezenas de turnos e partidas consecutivas com sementes distintas com 100% de taxa de conclusão', () => {
      const matchCount = 10;
      let completedMatches = 0;
      let totalTurnsSimulated = 0;

      for (let i = 1; i <= matchCount; i++) {
        const seed = i * 333 + 7;
        const initialState = createInitialGameState({
          rngSeed: seed,
          player1: {
            id: 'player1',
            representative: DEFAULT_REPRESENTATIVE_DAICHI,
            deck: createDiverseDeck(),
          },
          player2: {
            id: 'player2',
            representative: DEFAULT_REPRESENTATIVE_AKIRA,
            deck: createDiverseDeck(),
          },
        });
        const res = simulateMatch({ initialState, rngSeed: seed, maxTurns: 100 });

        expect(res.error).toBeUndefined();
        expect(res.finished).toBe(true);
        expect(res.winnerId).not.toBeNull();
        completedMatches++;
        totalTurnsSimulated += res.totalTurns;
      }

      expect(completedMatches).toBe(matchCount);
      expect(totalTurnsSimulated).toBeGreaterThan(50);
    }, 60000);
  });

  describe('5. Controle Passo a Passo (stepGame & AIPlayer)', () => {
    it('stepGame deve avançar a partida um passo por vez até a conclusão', () => {
      let state = createSimulationGameState(888);
      let steps = 0;
      const maxSteps = 1000;

      while (state.status !== GameStatus.FINISHED && steps < maxSteps) {
        const result = stepGame(state, { rngSeed: 888 + steps });
        expect(result.success).toBe(true);
        state = result.state;
        steps++;
      }

      expect(state.status).toBe(GameStatus.FINISHED);
      expect(state.winnerId).not.toBeNull();
    }, 20000);

    it('AIPlayer.takeTurn deve conduzir turnos inteiros', () => {
      let state = createInitialGameState({ rngSeed: 555 });
      const p1 = new AIPlayer({ playerId: 'player1', rngSeed: 555 });

      // Player 1 joga seu turno
      const res = p1.takeTurn(state);
      expect(res.actionsTaken.length).toBeGreaterThan(0);
      expect(res.state.activePlayerId).toBe('player2'); // Controle passou para player2
    });
  });
});
