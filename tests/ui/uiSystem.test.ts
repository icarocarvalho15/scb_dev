import { describe, it, expect } from 'vitest';
import {
  createDaichiPlayerDeck,
  createAkiraAIDeck,
  buildMatchRegistry,
} from '../../src/cards/deckBuilder';
import {
  createInitialGameState,
  applyAction,
  validateAction,
  ActionType,
  GamePhase,
  GameStatus,
  CardInstance,
} from '../../src/core';
import { chooseAction } from '../../src/ai';

describe('UI System — Match Setup & Engine-First Integration', () => {
  describe('1. Deck Building & Registry', () => {
    it('deve gerar decks canônicos de 40 cartas para o jogador e para a IA', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();

      expect(p1Deck.length).toBe(40);
      expect(p2Deck.length).toBe(40);

      // Todas as cartas devem ter ID único no deck
      const p1Ids = new Set(p1Deck.map((c) => c.id));
      const p2Ids = new Set(p2Deck.map((c) => c.id));
      expect(p1Ids.size).toBe(40);
      expect(p2Ids.size).toBe(40);
    });

    it('buildMatchRegistry deve registrar todas as cartas de ambos os decks e representantes', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();
      const registry = buildMatchRegistry(p1Deck, p2Deck);

      expect(registry['rep_daichi']).toBeDefined();
      expect(registry['rep_akira']).toBeDefined();

      p1Deck.forEach((card) => {
        expect(registry[card.id]).toBeDefined();
      });
      p2Deck.forEach((card) => {
        expect(registry[card.id]).toBeDefined();
      });
    });
  });

  describe('2. Engine-First UI Interactions & Validations', () => {
    it('a UI valida legalidade antes de tentar jogar uma carta', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();
      const registry = buildMatchRegistry(p1Deck, p2Deck);

      const state = createInitialGameState({
        player1: { id: 'player1', deck: p1Deck },
        player2: { id: 'player2', deck: p2Deck },
      });

      // Na Start Phase, a validação de jogar carta deve retornar false conforme regras
      const firstHandCard = state.players.player1.hand[0];
      expect(firstHandCard).toBeDefined();

      const validation = validateAction(
        state,
        {
          type: ActionType.PLAY_CARD,
          playerId: 'player1',
          cardInstanceId: firstHandCard.instanceId,
        },
        { cardRegistry: registry }
      );

      // Na Start Phase não pode jogar cartas (apenas na Main Phase)
      expect(validation.valid).toBe(false);

      // Avança para a MAIN Phase
      const advRes = applyAction(
        state,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player1',
        },
        { cardRegistry: registry }
      );
      expect(advRes.success).toBe(true);
      if (!advRes.success) return;

      expect(advRes.state.phase).toBe(GamePhase.MAIN);

      // Agora na Main Phase, se houver energia suficiente, validação deve permitir
      const mainCard = advRes.state.players.player1.hand.find((c: CardInstance) => {
        const def = registry[c.definitionId];
        return def && def.cost <= advRes.state.players.player1.energy;
      });

      if (mainCard) {
        const playVal = validateAction(
          advRes.state,
          {
            type: ActionType.PLAY_CARD,
            playerId: 'player1',
            cardInstanceId: mainCard.instanceId,
          },
          { cardRegistry: registry }
        );
        expect(playVal.valid).toBe(true);

        const playRes = applyAction(
          advRes.state,
          {
            type: ActionType.PLAY_CARD,
            playerId: 'player1',
            cardInstanceId: mainCard.instanceId,
          },
          { cardRegistry: registry }
        );
        expect(playRes.success).toBe(true);
      }
    });

    it('a UI reage ao avanço de todas as 5 fases canônicas até a IA agir', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();
      const registry = buildMatchRegistry(p1Deck, p2Deck);

      let state = createInitialGameState({
        rngSeed: 42,
        player1: { id: 'player1', deck: p1Deck },
        player2: { id: 'player2', deck: p2Deck },
      });

      expect(state.phase).toBe(GamePhase.START);

      // START -> MAIN
      let res = applyAction(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' }, { cardRegistry: registry });
      expect(res.success).toBe(true);
      if (res.success) state = res.state;
      expect(state.phase).toBe(GamePhase.MAIN);

      // MAIN -> DEBATE
      res = applyAction(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' }, { cardRegistry: registry });
      expect(res.success).toBe(true);
      if (res.success) state = res.state;
      expect(state.phase).toBe(GamePhase.DEBATE);

      // DEBATE -> COMBAT
      res = applyAction(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' }, { cardRegistry: registry });
      expect(res.success).toBe(true);
      if (res.success) state = res.state;
      expect(state.phase).toBe(GamePhase.COMBAT);

      // COMBAT -> END
      res = applyAction(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' }, { cardRegistry: registry });
      expect(res.success).toBe(true);
      if (res.success) state = res.state;
      expect(state.phase).toBe(GamePhase.END);

      // END -> Turno 2 (Vez do Oponente - player2)
      res = applyAction(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' }, { cardRegistry: registry });
      expect(res.success).toBe(true);
      if (res.success) state = res.state;
      expect(state.turn).toBe(2);
      expect(state.activePlayerId).toBe('player2');

      // IA escolhe ação legal no seu turno
      const aiAction = chooseAction(state, 'player2', { cardRegistry: registry });
      expect(aiAction).not.toBeNull();
      if (aiAction) {
        const aiRes = applyAction(state, aiAction, { cardRegistry: registry });
        expect(aiRes.success).toBe(true);
      }
    });

    it('regra de rendição encerra imediatamente a partida e define vencedor', () => {
      const state = createInitialGameState();
      const res = applyAction(state, { type: ActionType.SURRENDER, playerId: 'player1' });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.state.status).toBe(GameStatus.FINISHED);
        expect(res.state.winnerId).toBe('player2');
      }
    });
  });
});
