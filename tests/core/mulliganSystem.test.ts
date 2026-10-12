import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  applyAction,
  validateAction,
  ActionType,
  ActionErrorCode,
  GameStatus,
  CardZone,
  CardInstance,
  CardDefinition,
  CardType,
  evaluateAiMulligan,
} from '../../src/core';

describe('Core Engine — Mulligan System (ActionType.MULLIGAN)', () => {
  describe('1. Mulligan com 0 cartas ("Manter Mão" / Skip Mulligan)', () => {
    it('deve manter a mão intacta e marcar hasMulliganed = true ao selecionar 0 cartas', () => {
      const state = createInitialGameState({ rngSeed: 1234 });
      const p1 = state.players.player1;

      expect(p1.hasMulliganed).toBe(false);
      expect(p1.hand.length).toBe(4);
      const initialHandIds = p1.hand.map((c) => c.instanceId);
      const initialDeckLength = p1.deck.length;

      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: [],
      };

      const val = validateAction(state, action);
      expect(val.valid).toBe(true);

      const res = applyAction(state, action);
      expect(res.success).toBe(true);
      if (!res.success) return;

      const nextP1 = res.state.players.player1;
      expect(nextP1.hasMulliganed).toBe(true);
      expect(nextP1.hand.length).toBe(4);
      expect(nextP1.hand.map((c) => c.instanceId)).toEqual(initialHandIds);
      expect(nextP1.deck.length).toBe(initialDeckLength);
      // Imutabilidade estrita
      expect(state.players.player1.hasMulliganed).toBe(false);
    });
  });

  describe('2. Mulligan Parcial (1 a 4 cartas substituídas)', () => {
    it('deve substituir exatamente 1 carta e manter o tamanho da mão em 4', () => {
      const state = createInitialGameState({ rngSeed: 5000 });
      const p1 = state.players.player1;
      const cardToReplace = p1.hand[0];
      const keptCardIds = p1.hand.slice(1).map((c) => c.instanceId);

      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: [cardToReplace.instanceId],
      };

      const res = applyAction(state, action);
      expect(res.success).toBe(true);
      if (!res.success) return;

      const nextP1 = res.state.players.player1;
      expect(nextP1.hasMulliganed).toBe(true);
      expect(nextP1.hand.length).toBe(4);
      // As 3 cartas não selecionadas continuam na mão
      keptCardIds.forEach((id) => {
        expect(nextP1.hand.some((c) => c.instanceId === id)).toBe(true);
      });
      // A carta substituída não está mais na mão e voltou para o deck
      expect(nextP1.hand.some((c) => c.instanceId === cardToReplace.instanceId)).toBe(false);
      const returnedInDeck = nextP1.deck.find((c) => c.instanceId === cardToReplace.instanceId);
      expect(returnedInDeck).toBeDefined();
      expect(returnedInDeck?.zone).toBe(CardZone.DECK);
    });

    it('deve substituir 2 cartas mantendo a mão com exatamente 4 cartas', () => {
      const state = createInitialGameState({ rngSeed: 6000 });
      const p1 = state.players.player1;
      const cardsToReplace = [p1.hand[0].instanceId, p1.hand[1].instanceId];

      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: cardsToReplace,
      };

      const res = applyAction(state, action);
      expect(res.success).toBe(true);
      if (!res.success) return;

      const nextP1 = res.state.players.player1;
      expect(nextP1.hasMulliganed).toBe(true);
      expect(nextP1.hand.length).toBe(4);
      cardsToReplace.forEach((id) => {
        expect(nextP1.hand.some((c) => c.instanceId === id)).toBe(false);
        expect(nextP1.deck.some((c) => c.instanceId === id)).toBe(true);
      });
    });

    it('deve substituir 3 cartas mantendo a mão com exatamente 4 cartas', () => {
      const state = createInitialGameState({ rngSeed: 7000 });
      const p1 = state.players.player1;
      const cardsToReplace = [p1.hand[0].instanceId, p1.hand[1].instanceId, p1.hand[2].instanceId];

      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: cardsToReplace,
      };

      const res = applyAction(state, action);
      expect(res.success).toBe(true);
      if (!res.success) return;

      const nextP1 = res.state.players.player1;
      expect(nextP1.hasMulliganed).toBe(true);
      expect(nextP1.hand.length).toBe(4);
      expect(nextP1.hand.some((c) => c.instanceId === p1.hand[3].instanceId)).toBe(true);
    });

    it('deve substituir todas as 4 cartas (mulligan completo) e manter a mão com exatamente 4 cartas', () => {
      const state = createInitialGameState({ rngSeed: 8000 });
      const p1 = state.players.player1;
      const allFourCards = p1.hand.map((c) => c.instanceId);

      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: allFourCards,
      };

      const res = applyAction(state, action);
      expect(res.success).toBe(true);
      if (!res.success) return;

      const nextP1 = res.state.players.player1;
      expect(nextP1.hasMulliganed).toBe(true);
      expect(nextP1.hand.length).toBe(4);
      // Nenhuma das 4 cartas originais deve estar na mão (todas devolvidas ao deck)
      allFourCards.forEach((id) => {
        expect(nextP1.hand.some((c) => c.instanceId === id)).toBe(false);
        expect(nextP1.deck.some((c) => c.instanceId === id)).toBe(true);
      });
    });

    it('permite que ambos os jogadores (Humano e IA) realizem seu próprio Mulligan no Turno 1', () => {
      const state = createInitialGameState({ rngSeed: 9999 });

      // Player 1 realiza mulligan
      const p1Action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: [state.players.player1.hand[0].instanceId],
      };
      const res1 = applyAction(state, p1Action);
      expect(res1.success).toBe(true);
      if (!res1.success) return;
      expect(res1.state.players.player1.hasMulliganed).toBe(true);
      expect(res1.state.players.player2.hasMulliganed).toBe(false);

      // Player 2 realiza mulligan
      const p2Action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player2',
        cardInstanceIdsToReplace: [res1.state.players.player2.hand[0].instanceId],
      };
      const res2 = applyAction(res1.state, p2Action);
      expect(res2.success).toBe(true);
      if (!res2.success) return;
      expect(res2.state.players.player1.hasMulliganed).toBe(true);
      expect(res2.state.players.player2.hasMulliganed).toBe(true);
      expect(res2.state.players.player1.hand.length).toBe(4);
      expect(res2.state.players.player2.hand.length).toBe(4);
    });
  });

  describe('3. Rejeição de Tentativa Repetida (hasMulliganed = true -> ALREADY_MULLIGANED)', () => {
    it('deve rejeitar uma segunda tentativa de Mulligan com o código ALREADY_MULLIGANED', () => {
      const state = createInitialGameState({ rngSeed: 1111 });

      // Primeiro Mulligan com sucesso
      const firstAction = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: [],
      };
      const firstRes = applyAction(state, firstAction);
      expect(firstRes.success).toBe(true);
      if (!firstRes.success) return;
      expect(firstRes.state.players.player1.hasMulliganed).toBe(true);

      // Segunda tentativa de Mulligan
      const secondAction = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: [firstRes.state.players.player1.hand[0].instanceId],
      };

      const val = validateAction(firstRes.state, secondAction);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.ALREADY_MULLIGANED);

      const secondRes = applyAction(firstRes.state, secondAction);
      expect(secondRes.success).toBe(false);
      if (secondRes.success) return;
      expect(secondRes.error.code).toBe(ActionErrorCode.ALREADY_MULLIGANED);
    });
  });

  describe('4. Validação de Regras e Casos de Borda', () => {
    it('deve rejeitar tentativa de substituir carta que não pertence à mão', () => {
      const state = createInitialGameState({ rngSeed: 2222 });
      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: ['carta_inexistente_999'],
      };

      const val = validateAction(state, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.CARD_NOT_IN_HAND);

      const res = applyAction(state, action);
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.error.code).toBe(ActionErrorCode.CARD_NOT_IN_HAND);
    });

    it('deve rejeitar tentativa com mais de 4 cartas', () => {
      const state = createInitialGameState({ rngSeed: 3333 });
      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: ['c1', 'c2', 'c3', 'c4', 'c5'],
      };

      const val = validateAction(state, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.HAND_LIMIT_EXCEEDED);
    });

    it('deve rejeitar Mulligan caso a partida já esteja finalizada', () => {
      const state = createInitialGameState({ rngSeed: 4444 });
      state.status = GameStatus.FINISHED;

      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: [],
      };

      const val = validateAction(state, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.GAME_OVER);
    });

    it('deve rejeitar Mulligan se executado em turno avançado (Turno > 2)', () => {
      const state = createInitialGameState({ rngSeed: 5555 });
      state.turn = 3;
      state.players.player1.turnCount = 2;

      const action = {
        type: ActionType.MULLIGAN as const,
        playerId: 'player1',
        cardInstanceIdsToReplace: [],
      };

      const val = validateAction(state, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.INVALID_PHASE);
    });
  });

  describe('5. Determinismo e Embaralhamento via rngSeed', () => {
    it('duas execuções idênticas com a mesma semente PRNG produzem estado 100% idêntico', () => {
      const state1 = createInitialGameState({ rngSeed: 77777 });
      const state2 = createInitialGameState({ rngSeed: 77777 });

      const replaceCards1 = [state1.players.player1.hand[0].instanceId, state1.players.player1.hand[1].instanceId];
      const replaceCards2 = [state2.players.player1.hand[0].instanceId, state2.players.player1.hand[1].instanceId];

      const res1 = applyAction(state1, {
        type: ActionType.MULLIGAN,
        playerId: 'player1',
        cardInstanceIdsToReplace: replaceCards1,
      });

      const res2 = applyAction(state2, {
        type: ActionType.MULLIGAN,
        playerId: 'player1',
        cardInstanceIdsToReplace: replaceCards2,
      });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      if (!res1.success || !res2.success) return;

      const hand1 = res1.state.players.player1.hand.map((c) => c.instanceId);
      const hand2 = res2.state.players.player1.hand.map((c) => c.instanceId);
      expect(hand1).toEqual(hand2);
      expect(res1.state.rngSeed).toEqual(res2.state.rngSeed);
    });

    it('execuções com sementes diferentes produzem embaralhamentos distintos', () => {
      const state1 = createInitialGameState({ rngSeed: 101 });
      const state2 = createInitialGameState({ rngSeed: 202 });

      const res1 = applyAction(state1, {
        type: ActionType.MULLIGAN,
        playerId: 'player1',
        cardInstanceIdsToReplace: state1.players.player1.hand.map((c) => c.instanceId),
      });

      const res2 = applyAction(state2, {
        type: ActionType.MULLIGAN,
        playerId: 'player1',
        cardInstanceIdsToReplace: state2.players.player1.hand.map((c) => c.instanceId),
      });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      if (!res1.success || !res2.success) return;

      const deck1 = res1.state.players.player1.deck.map((c) => c.instanceId);
      const deck2 = res2.state.players.player1.deck.map((c) => c.instanceId);
      expect(deck1).not.toEqual(deck2);
    });
  });

  describe('6. Heurística de Mulligan da IA (evaluateAiMulligan)', () => {
    const mockRegistry: Record<string, CardDefinition> = {
      card_cheap_1: {
        id: 'card_cheap_1',
        name: 'Estudante Barato 1',
        type: CardType.STUDENT,
        cost: 1,
        influence: 1,
        morale: 2,
        traits: ['Estudante'],
        keywords: [],
      },
      card_cheap_2: {
        id: 'card_cheap_2',
        name: 'Estudante Barato 2',
        type: CardType.STUDENT,
        cost: 2,
        influence: 2,
        morale: 2,
        traits: ['Estudante'],
        keywords: [],
      },
      card_mid_3: {
        id: 'card_mid_3',
        name: 'Estudante Médio 3',
        type: CardType.STUDENT,
        cost: 3,
        influence: 2,
        morale: 3,
        traits: ['Estudante'],
        keywords: [],
      },
      card_heavy_4: {
        id: 'card_heavy_4',
        name: 'Estudante Pesado 4',
        type: CardType.STUDENT,
        cost: 4,
        influence: 3,
        morale: 4,
        traits: ['Estudante'],
        keywords: [],
      },
      card_heavy_5: {
        id: 'card_heavy_5',
        name: 'Estudante Pesado 5',
        type: CardType.STUDENT,
        cost: 5,
        influence: 4,
        morale: 5,
        traits: ['Estudante'],
        keywords: [],
      },
      card_debate_situational: {
        id: 'card_debate_situational',
        name: 'Debate Situacional',
        type: CardType.DEBATE,
        cost: 2,
        traits: ['Debate'],
        keywords: [],
      },
    };

    it('mantém a mão (retorna []) caso já possua estudantes jogáveis de custo 1-2 e curva balanceada', () => {
      const hand: CardInstance[] = [
        { instanceId: 'inst_1', definitionId: 'card_cheap_1', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 1, currentMorale: 2, maxMorale: 2, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_2', definitionId: 'card_cheap_2', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 2, currentMorale: 2, maxMorale: 2, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_3', definitionId: 'card_mid_3', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 2, currentMorale: 3, maxMorale: 3, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_4', definitionId: 'card_cheap_1', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 1, currentMorale: 2, maxMorale: 2, ready: false, hasInertia: false, statuses: [] },
      ];

      const toReplace = evaluateAiMulligan(hand, mockRegistry);
      expect(toReplace).toEqual([]);
    });

    it('descarta cartas pesadas (> 3) quando já possui pelo menos um estudante de custo 1-2', () => {
      const hand: CardInstance[] = [
        { instanceId: 'inst_1', definitionId: 'card_cheap_1', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 1, currentMorale: 2, maxMorale: 2, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_2', definitionId: 'card_heavy_4', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 3, currentMorale: 4, maxMorale: 4, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_3', definitionId: 'card_heavy_5', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 4, currentMorale: 5, maxMorale: 5, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_4', definitionId: 'card_mid_3', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 2, currentMorale: 3, maxMorale: 3, ready: false, hasInertia: false, statuses: [] },
      ];

      const toReplace = evaluateAiMulligan(hand, mockRegistry);
      expect(toReplace).toEqual(['inst_2', 'inst_3']);
    });

    it('descarta cartas de custo > 2 e debates caso não possua nenhum estudante barato (1-2) para buscar jogo inicial', () => {
      const hand: CardInstance[] = [
        { instanceId: 'inst_1', definitionId: 'card_mid_3', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 2, currentMorale: 3, maxMorale: 3, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_2', definitionId: 'card_heavy_4', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 3, currentMorale: 4, maxMorale: 4, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_3', definitionId: 'card_heavy_5', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 4, currentMorale: 5, maxMorale: 5, ready: false, hasInertia: false, statuses: [] },
        { instanceId: 'inst_4', definitionId: 'card_debate_situational', ownerId: 'p2', controllerId: 'p2', zone: CardZone.HAND, currentInfluence: 0, currentMorale: 0, maxMorale: 0, ready: false, hasInertia: false, statuses: [] },
      ];

      const toReplace = evaluateAiMulligan(hand, mockRegistry);
      expect(toReplace).toEqual(['inst_1', 'inst_2', 'inst_3', 'inst_4']);
    });
  });
});
