import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  GamePhase,
  GameStatus,
  CardZone,
  ActionType,
  ActionErrorCode,
  ActionResult,
  GameState,
  advancePhase,
  advanceFullTurn,
  advanceMultipleTurns,
  applyAction,
  drawCard,
  isDiplomacyActive,
  canAttackRepresentative,
  validateDiplomacyAttackTarget,
} from '../../src/core';

function unwrapState(result: ActionResult<GameState>): GameState {
  expect(result.success).toBe(true);
  if (!result.success) {
    throw new Error(`Ação falhou: ${JSON.stringify(result.error)}`);
  }
  return result.state;
}

describe('Core Engine — Turn System & Resource Progression (Fase 2)', () => {
  describe('1. Ciclo de Fases e Alternância de Turnos', () => {
    it('deve avançar pelo ciclo canônico START -> MAIN -> DEBATE -> COMBAT -> END -> START', () => {
      let state = createInitialGameState();
      expect(state.phase).toBe(GamePhase.START);
      expect(state.turn).toBe(1);
      expect(state.activePlayerId).toBe('player1');

      // START -> MAIN (executa Start Phase)
      let res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;
      expect(state.phase).toBe(GamePhase.MAIN);
      expect(state.activePlayerId).toBe('player1');
      expect(state.turn).toBe(1);

      // MAIN -> DEBATE
      res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;
      expect(state.phase).toBe(GamePhase.DEBATE);

      // DEBATE -> COMBAT
      res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;
      expect(state.phase).toBe(GamePhase.COMBAT);

      // COMBAT -> END
      res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;
      expect(state.phase).toBe(GamePhase.END);

      // END -> START (Passa turno para player2)
      res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;
      expect(state.phase).toBe(GamePhase.START);
      expect(state.turn).toBe(2);
      expect(state.activePlayerId).toBe('player2');
    });

    it('deve rejeitar avanço de fase solicitado por jogador inativo', () => {
      const state = createInitialGameState();
      expect(state.activePlayerId).toBe('player1');

      // player2 tenta avançar no turno de player1
      const res = advancePhase(state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player2',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });

    it('deve aceitar END_PHASE como comando de avanço de fase', () => {
      const state = createInitialGameState();
      const res = applyAction(state, {
        type: ActionType.END_PHASE,
        playerId: 'player1',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.state.phase).toBe(GamePhase.MAIN);
        expect(res.state.history).toHaveLength(1);
        expect(res.state.history[0].type).toBe(ActionType.END_PHASE);
      }
    });
  });

  describe('2. Start Phase: Escalação de Energia e Restauração', () => {
    it('deve manter Energia 1/1 no primeiro turno de cada jogador', () => {
      let state = createInitialGameState();

      // Start phase de Player 1 (turno 1)
      const p1Res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(p1Res.success).toBe(true);
      if (!p1Res.success) return;
      state = p1Res.state;

      expect(state.players['player1'].maxEnergy).toBe(1);
      expect(state.players['player1'].energy).toBe(1);

      // Avança até o turno de Player 2
      const turnEndRes = advanceFullTurn(state);
      expect(turnEndRes.success).toBe(true);
      if (!turnEndRes.success) return;
      state = turnEndRes.state;

      expect(state.activePlayerId).toBe('player2');
      expect(state.turn).toBe(2);

      // Start phase de Player 2 (seu turno 1)
      const p2Res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player2' });
      expect(p2Res.success).toBe(true);
      if (!p2Res.success) return;
      state = p2Res.state;

      expect(state.players['player2'].maxEnergy).toBe(1);
      expect(state.players['player2'].energy).toBe(1);
    });

    it('deve escalar a Max Energia rigorosamente de 1 até o teto de 10 a cada rodada de cada jogador', () => {
      let state = createInitialGameState();

      // Vamos monitorar a escala de energia ao longo de 22 turnos (11 turnos para cada jogador)
      const p1Energies: number[] = [];
      const p2Energies: number[] = [];

      for (let t = 1; t <= 22; t++) {
        const activeId = state.activePlayerId;

        // Avança de START para MAIN para resolver Start Phase
        const startRes = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: activeId });
        expect(startRes.success).toBe(true);
        if (!startRes.success) return;
        state = startRes.state;

        const energy = state.players[activeId].maxEnergy;
        if (activeId === 'player1') {
          p1Energies.push(energy);
        } else {
          p2Energies.push(energy);
        }

        // Avança o restante do turno até o próximo START
        while (state.phase !== GamePhase.START && state.status !== GameStatus.FINISHED) {
          const res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: activeId });
          if (!res.success) break;
          state = res.state;
        }
      }

      // Esperado para Player 1 em seus 11 turnos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10]
      expect(p1Energies).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10]);

      // Esperado para Player 2 em seus 11 turnos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10]
      expect(p2Energies).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10]);
    });

    it('deve restaurar a energia gasta no turno anterior até o novo limite máximo', () => {
      let state = createInitialGameState();

      // Player 1, Turno 1 -> Gasta energia para 0
      state = unwrapState(advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' }));
      state.players['player1'].energy = 0;

      // Completa turno 1 de P1 e turno 1 de P2
      state = unwrapState(advanceFullTurn(state)); // P2 turno 1 START
      state = unwrapState(advanceFullTurn(state)); // P1 turno 2 START

      expect(state.activePlayerId).toBe('player1');
      expect(state.players['player1'].energy).toBe(0); // Antes da Start Phase

      // Executa Start Phase do turno 2 de P1
      const res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;

      expect(state.players['player1'].maxEnergy).toBe(2);
      expect(state.players['player1'].energy).toBe(2); // Restaurado integralmente
    });
  });

  describe('3. Compra Obrigatória de Cartas e Deckout', () => {
    it('deve transferir carta do topo do DECK para a HAND com zona correta na Start Phase', () => {
      let state = createInitialGameState();
      const p1 = state.players['player1'];

      expect(p1.hand).toHaveLength(4);
      expect(p1.deck).toHaveLength(36);
      const topDeckCardId = p1.deck[0].instanceId;

      // Executa Start Phase
      const res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;

      const updatedP1 = state.players['player1'];
      expect(updatedP1.hand).toHaveLength(5);
      expect(updatedP1.deck).toHaveLength(35);

      // Carta comprada é a que estava no topo
      const drawnCard = updatedP1.hand[updatedP1.hand.length - 1];
      expect(drawnCard.instanceId).toBe(topDeckCardId);
      expect(drawnCard.zone).toBe(CardZone.HAND);
    });

    it('deve declarar derrota imediata por Deckout e definir o vencedor quando o deck estiver vazio', () => {
      let state = createInitialGameState();
      // Esvazia o deck do jogador 1
      state.players['player1'].deck = [];

      expect(state.status).toBe(GameStatus.IN_PROGRESS);
      expect(state.winnerId).toBeNull();

      // Tentativa de Start Phase com deck vazio
      const res = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;

      expect(state.status).toBe(GameStatus.FINISHED);
      expect(state.winnerId).toBe('player2'); // Oponente declarado vencedor

      // Nenhuma ação posterior deve ser permitida
      const nextRes = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(nextRes.success).toBe(false);
      if (!nextRes.success) {
        expect(nextRes.error.code).toBe(ActionErrorCode.GAME_OVER);
      }
    });

    it('função isolada drawCard deve reportar deckout e vencedor corretamente', () => {
      let state = createInitialGameState();
      state.players['player2'].deck = [];

      const result = drawCard(state, 'player2');
      expect(result.deckout).toBe(true);
      expect(result.cardDrawn).toBeNull();
      expect(result.state.status).toBe(GameStatus.FINISHED);
      expect(result.state.winnerId).toBe('player1');
    });
  });

  describe('4. Regra de Diplomacia de Abertura', () => {
    it('deve manter Diplomacia ativa no turno 1 de cada jogador e expirar no turno 2', () => {
      let state = createInitialGameState();

      // Turno 1 (Player 1)
      expect(isDiplomacyActive(state, 'player1')).toBe(true);
      expect(canAttackRepresentative(state, 'player1')).toBe(false);
      expect(state.players['player1'].diplomacyActive).toBe(true);

      // Validação de alvo rejeita Representante
      const validationP1 = validateDiplomacyAttackTarget(state, 'player1', 'player2');
      expect(validationP1.valid).toBe(false);
      expect(validationP1.code).toBe(ActionErrorCode.DIPLOMACY_RESTRICTION);

      // Avança Turno 1 de Player 1 até o fim
      state = unwrapState(advanceFullTurn(state));

      // Agora é o Turno 2 da partida (Turno 1 de Player 2)
      expect(state.activePlayerId).toBe('player2');
      expect(state.turn).toBe(2);

      // Player 1 já terminou seu 1º turno -> Diplomacia expirou para P1
      expect(isDiplomacyActive(state, 'player1')).toBe(false);
      expect(canAttackRepresentative(state, 'player1')).toBe(true);

      // Player 2 está no seu 1º turno -> Diplomacia ativa para P2
      expect(isDiplomacyActive(state, 'player2')).toBe(true);
      expect(canAttackRepresentative(state, 'player2')).toBe(false);

      // Avança Turno 1 de Player 2 até o fim
      state = unwrapState(advanceFullTurn(state));

      // Agora é o Turno 3 da partida (Turno 2 de Player 1)
      expect(state.activePlayerId).toBe('player1');
      expect(state.turn).toBe(3);

      // Ambos os jogadores já completaram o 1º turno -> Diplomacia inativa para ambos
      expect(isDiplomacyActive(state, 'player1')).toBe(false);
      expect(isDiplomacyActive(state, 'player2')).toBe(false);
      expect(canAttackRepresentative(state, 'player1')).toBe(true);
      expect(canAttackRepresentative(state, 'player2')).toBe(true);

      const validationLate = validateDiplomacyAttackTarget(state, 'player1', 'player2');
      expect(validationLate.valid).toBe(true);
    });
  });

  describe('5. End Phase e Limite de Mão (8 cartas)', () => {
    it('deve permitir passagem de turno se a mão possuir 8 ou menos cartas', () => {
      let state = createInitialGameState();
      // P1 tem 4 cartas na mão
      expect(state.players['player1'].hand.length).toBeLessThanOrEqual(8);

      const res = advanceFullTurn(state);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.state.activePlayerId).toBe('player2');
      }
    });

    it('deve cortar cartas excedentes para 8 cartas na End Phase pela regra de corte (autoCutExcess)', () => {
      let state = createInitialGameState();

      // Avança para MAIN (resolve Start Phase e compra a 5ª carta)
      state = unwrapState(advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' })); // MAIN
      expect(state.phase).toBe(GamePhase.MAIN);
      expect(state.players['player1'].hand).toHaveLength(5);

      // Simula compra de mais cartas na mão durante a Main Phase para totalizar 10 cartas (2 excedentes)
      const p1 = state.players['player1'];
      while (p1.hand.length < 10 && p1.deck.length > 0) {
        const c = p1.deck.shift()!;
        c.zone = CardZone.HAND;
        p1.hand.push(c);
      }
      expect(p1.hand).toHaveLength(10);
      expect(p1.discard).toHaveLength(0);

      // Avança pelas fases até END
      state = unwrapState(advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' })); // DEBATE
      state = unwrapState(advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' })); // COMBAT
      state = unwrapState(advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' })); // END

      expect(state.phase).toBe(GamePhase.END);
      expect(state.players['player1'].hand).toHaveLength(10);

      // Avança de END para START com regra de corte padrão
      const endRes = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
      expect(endRes.success).toBe(true);
      if (!endRes.success) return;
      state = endRes.state;

      // Mão do Player 1 foi cortada para exatamente 8 e as 2 excedentes foram para o descarte
      expect(state.players['player1'].hand).toHaveLength(8);
      expect(state.players['player1'].discard).toHaveLength(2);
      expect(state.players['player1'].discard[0].zone).toBe(CardZone.DISCARD);
    });

    it('deve permitir descarte explícito de cartas antes de encerrar o turno', () => {
      let state = createInitialGameState();
      const p1 = state.players['player1'];

      // Adiciona 5 cartas à mão para totalizar 9
      for (let i = 0; i < 5; i++) {
        const c = p1.deck.shift()!;
        c.zone = CardZone.HAND;
        p1.hand.push(c);
      }
      expect(p1.hand).toHaveLength(9);

      const cardToDiscard = p1.hand[0].instanceId;

      // Executa ação explícita DISCARD_CARDS
      const discardRes = applyAction(state, {
        type: ActionType.DISCARD_CARDS,
        playerId: 'player1',
        cardInstanceIds: [cardToDiscard],
      });

      expect(discardRes.success).toBe(true);
      if (!discardRes.success) return;
      state = discardRes.state;

      expect(state.players['player1'].hand).toHaveLength(8);
      expect(state.players['player1'].discard).toHaveLength(1);
      expect(state.players['player1'].discard[0].instanceId).toBe(cardToDiscard);
    });

    it('deve retornar erro HAND_LIMIT_EXCEEDED se autoCutExcess for desabilitado e a mão tiver > 8 cartas', () => {
      let state = createInitialGameState();
      const p1 = state.players['player1'];
      for (let i = 0; i < 5; i++) {
        p1.hand.push(p1.deck.shift()!);
      }
      expect(p1.hand).toHaveLength(9);

      // Posiciona na fase END
      state.phase = GamePhase.END;

      const res = advancePhase(
        state,
        { type: ActionType.ADVANCE_PHASE, playerId: 'player1' },
        { autoCutExcess: false }
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.HAND_LIMIT_EXCEEDED);
      }
    });
  });

  describe('6. Determinismo, Imutabilidade e Avanço de 10+ Turnos', () => {
    it('deve avançar 10+ turnos sucessivos de forma autônoma e determinística', () => {
      const state = createInitialGameState();

      const res = advanceMultipleTurns(state, 12);
      expect(res.success).toBe(true);
      if (!res.success) return;

      const finalState = res.state;
      expect(finalState.turn).toBe(13); // Avançou 12 turnos a partir do turno 1
      expect(finalState.status).toBe(GameStatus.IN_PROGRESS);

      // Ambos os jogadores já devem estar no teto ou perto do teto de energia
      expect(finalState.players['player1'].maxEnergy).toBe(6);
      expect(finalState.players['player2'].maxEnergy).toBe(6);
    });

    it('deve garantir imutabilidade estrita do GameState original', () => {
      const originalState = createInitialGameState();
      const originalPhase = originalState.phase;
      const originalTurn = originalState.turn;
      const originalHandLen = originalState.players['player1'].hand.length;

      const res = advancePhase(originalState, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });

      expect(res.success).toBe(true);
      // originalState não sofre mutação in-place
      expect(originalState.phase).toBe(originalPhase);
      expect(originalState.turn).toBe(originalTurn);
      expect(originalState.players['player1'].hand).toHaveLength(originalHandLen);
    });
  });
});
