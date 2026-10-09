import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  GamePhase,
  GameStatus,
  CardZone,
  ActionType,
  ActionErrorCode,
  GameState,
  applyAction,
  advancePhase,
  createCardInstance,
} from '../../src/core';
import {
  validatePlayCard,
  playCard,
  canPlayCard,
} from '../../src/core/engine/cardPlaySystem';
import {
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_ATLETA_IMPULSO,
  ALPHA_STUDENT_MONITOR,
  ALPHA_STUDENT_REBELDE,
  ALPHA_STUDENT_CAPITAO_IMPULSO,
  ALPHA_STUDENT_ELITE,
  ALPHA_ENV_SALA_GREMIO,
  ALPHA_ENV_QUADRA,
} from '../../src/cards/alphaCards';
import { CardType } from '../../src/core/types/card';
import { ActionResult } from '../../src/core/types/error';

function unwrapState(result: ActionResult<GameState>): GameState {
  expect(result.success).toBe(true);
  if (!result.success) {
    throw new Error(`Ação falhou: ${JSON.stringify(result.error)}`);
  }
  return result.state;
}

describe('Core Engine — Card Play System & Field Rules (Fase 3)', () => {
  /**
   * Helper para preparar estado na Main Phase com Energia configurável
   */
  function setupMainPhaseState(options: { energy?: number; p1BoardCount?: number } = {}): GameState {
    let state = createInitialGameState({ initialHandSize: 4, autoDrawInitialHand: true });
    // START -> MAIN
    const adv = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
    expect(adv.success).toBe(true);
    if (!adv.success) throw new Error('Falha ao avançar para MAIN');
    state = adv.state;

    // Configura energia se solicitada
    if (options.energy !== undefined) {
      state.players.player1.energy = options.energy;
      state.players.player1.maxEnergy = Math.max(state.players.player1.maxEnergy, options.energy);
    }

    // Preenche board com estudantes se solicitado
    if (options.p1BoardCount !== undefined && options.p1BoardCount > 0) {
      for (let i = 0; i < options.p1BoardCount; i++) {
        const studentInstance = createCardInstance(
          ALPHA_STUDENT_NOVATO,
          'player1',
          100 + i,
          CardZone.BOARD
        );
        studentInstance.ready = true;
        studentInstance.hasInertia = false;
        state.players.player1.board.push(studentInstance);
      }
    }

    return state;
  }

  describe('1. Validações da Ação PLAY_CARD (validatePlayCard)', () => {
    it('deve permitir jogar carta válida na MAIN phase pelo jogador ativo com energia suficiente', () => {
      const state = setupMainPhaseState({ energy: 2 });
      const firstHandCard = state.players.player1.hand[0];

      const validation = validatePlayCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: firstHandCard.instanceId,
      });

      expect(validation.valid).toBe(true);
      if (validation.valid) {
        expect(validation.details.cardInstance.instanceId).toBe(firstHandCard.instanceId);
        expect(validation.details.cardDefinition).toBeDefined();
      }
    });

    it('deve rejeitar se a fase não for MAIN (INVALID_PHASE)', () => {
      const state = createInitialGameState();
      expect(state.phase).toBe(GamePhase.START);

      const firstHandCard = state.players.player1.hand[0];
      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: firstHandCard.instanceId,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.INVALID_PHASE);
      }
    });

    it('deve rejeitar se um jogador inativo tentar jogar cartas (INVALID_PLAYER)', () => {
      const state = setupMainPhaseState({ energy: 2 });
      expect(state.activePlayerId).toBe('player1');

      const p2HandCard = state.players.player2.hand[0];
      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player2',
        cardInstanceId: p2HandCard.instanceId,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });

    it('deve rejeitar se a carta não estiver na mão do jogador (CARD_NOT_IN_HAND)', () => {
      const state = setupMainPhaseState({ energy: 5 });

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: 'inexistent_card_id',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.CARD_NOT_IN_HAND);
      }
    });

    it('deve rejeitar se o jogador não possuir energia suficiente (NOT_ENOUGH_ENERGY)', () => {
      const state = setupMainPhaseState({ energy: 1 });
      // Coloca uma carta de alto custo na mão de player1
      const expensiveCard = createCardInstance(
        ALPHA_STUDENT_ELITE, // Custo 8
        'player1',
        999,
        CardZone.HAND
      );
      state.players.player1.hand.push(expensiveCard);

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: expensiveCard.instanceId,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.NOT_ENOUGH_ENERGY);
      }
    });

    it('deve rejeitar se a partida já estiver finalizada (GAME_OVER)', () => {
      const state = setupMainPhaseState();
      state.status = GameStatus.FINISHED;
      state.winnerId = 'player2';

      const firstHandCard = state.players.player1.hand[0];
      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: firstHandCard.instanceId,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.GAME_OVER);
      }
    });

    it('deve rejeitar tipo de carta não posicionável em campo como REPRESENTATIVE', () => {
      const state = setupMainPhaseState({ energy: 5 });
      const repCard = createCardInstance(
        {
          id: 'rep_dummy',
          name: 'Rep Dummy',
          type: CardType.REPRESENTATIVE,
          cost: 0,
          traits: [],
          keywords: [],
        },
        'player1',
        888,
        CardZone.HAND
      );
      state.players.player1.hand.push(repCard);

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: repCard.instanceId,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.UNKNOWN_ERROR);
      }
    });
  });

  describe('2. Resolução de Jogar Estudante e Inércia / Impulso', () => {
    it('deve deduzir energia e mover estudante para BOARD com hasInertia = true (sem Impulso)', () => {
      const state = setupMainPhaseState({ energy: 3 });
      const studentCard = createCardInstance(
        ALPHA_STUDENT_NOVATO, // Custo 1, sem Impulso
        'player1',
        201,
        CardZone.HAND
      );
      state.players.player1.hand.push(studentCard);

      const initialHandLen = state.players.player1.hand.length;
      const initialEnergy = state.players.player1.energy;

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: studentCard.instanceId,
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      const newState = res.state;
      const player1 = newState.players.player1;

      // Energia deduzida
      expect(player1.energy).toBe(initialEnergy - ALPHA_STUDENT_NOVATO.cost);

      // Removida da mão
      expect(player1.hand.length).toBe(initialHandLen - 1);
      expect(player1.hand.find((c) => c.instanceId === studentCard.instanceId)).toBeUndefined();

      // Inserida no Board
      const boardStudent = player1.board.find((c) => c.instanceId === studentCard.instanceId);
      expect(boardStudent).toBeDefined();
      expect(boardStudent?.zone).toBe(CardZone.BOARD);

      // Inércia atribuída e não preparado
      expect(boardStudent?.hasInertia).toBe(true);
      expect(boardStudent?.ready).toBe(false);
      expect(boardStudent?.currentInfluence).toBe(ALPHA_STUDENT_NOVATO.influence);
      expect(boardStudent?.currentMorale).toBe(ALPHA_STUDENT_NOVATO.morale);
    });

    it('deve atribuir hasInertia = false e ready = true para estudante com Impulso', () => {
      const state = setupMainPhaseState({ energy: 4 });
      const impulseCard = createCardInstance(
        ALPHA_STUDENT_ATLETA_IMPULSO, // Custo 2, com Impulso
        'player1',
        202,
        CardZone.HAND
      );
      state.players.player1.hand.push(impulseCard);

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: impulseCard.instanceId,
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      const player1 = res.state.players.player1;
      const boardStudent = player1.board.find((c) => c.instanceId === impulseCard.instanceId);

      expect(boardStudent).toBeDefined();
      expect(boardStudent?.zone).toBe(CardZone.BOARD);
      // Impulso supera a inércia imediatamente
      expect(boardStudent?.hasInertia).toBe(false);
      expect(boardStudent?.ready).toBe(true);
      expect(player1.energy).toBe(4 - ALPHA_STUDENT_ATLETA_IMPULSO.cost);
    });

    it('deve suportar helper canPlayCard de forma booleana sem mutações', () => {
      const state = setupMainPhaseState({ energy: 1 });
      const affordableCard = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 301, CardZone.HAND);
      const expensiveCard = createCardInstance(ALPHA_STUDENT_ELITE, 'player1', 302, CardZone.HAND);
      state.players.player1.hand.push(affordableCard, expensiveCard);

      expect(
        canPlayCard(state, {
          type: ActionType.PLAY_CARD,
          playerId: 'player1',
          cardInstanceId: affordableCard.instanceId,
        })
      ).toBe(true);

      expect(
        canPlayCard(state, {
          type: ActionType.PLAY_CARD,
          playerId: 'player1',
          cardInstanceId: expensiveCard.instanceId,
        })
      ).toBe(false);
    });
  });

  describe('3. Limite de 6 Estudantes e Regra de Substituição', () => {
    it('deve permitir colocar até 6 Estudantes sem exigir substituição', () => {
      let state = setupMainPhaseState({ energy: 10, p1BoardCount: 5 });
      expect(state.players.player1.board.length).toBe(5);

      const newStudent = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 401, CardZone.HAND);
      state.players.player1.hand.push(newStudent);

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: newStudent.instanceId,
      });

      expect(res.success).toBe(true);
      if (!res.success) return;
      expect(res.state.players.player1.board.length).toBe(6);
    });

    it('deve rejeitar com BOARD_FULL ao tentar jogar o 7º estudante sem substituição', () => {
      const state = setupMainPhaseState({ energy: 10, p1BoardCount: 6 });
      expect(state.players.player1.board.length).toBe(6);

      const seventhStudent = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 402, CardZone.HAND);
      state.players.player1.hand.push(seventhStudent);

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: seventhStudent.instanceId,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.BOARD_FULL);
      }
    });

    it('deve rejeitar com CARD_NOT_IN_BOARD se o estudante indicado para substituição não existir no campo', () => {
      const state = setupMainPhaseState({ energy: 10, p1BoardCount: 6 });

      const newStudent = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 403, CardZone.HAND);
      state.players.player1.hand.push(newStudent);

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: newStudent.instanceId,
        replaceCardInstanceId: 'non_existent_board_student',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.CARD_NOT_IN_BOARD);
      }
    });

    it('deve executar a Substituição com sucesso: remove estudante antigo para DISCARD e adiciona o novo mantendo teto de 6', () => {
      const state = setupMainPhaseState({ energy: 10, p1BoardCount: 6 });
      const targetOldStudent = state.players.player1.board[2];
      const targetOldId = targetOldStudent.instanceId;

      const newStudent = createCardInstance(
        ALPHA_STUDENT_CAPITAO_IMPULSO,
        'player1',
        404,
        CardZone.HAND
      );
      state.players.player1.hand.push(newStudent);

      const initialDiscardLen = state.players.player1.discard.length;

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: newStudent.instanceId,
        replaceCardInstanceId: targetOldId,
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      const player1 = res.state.players.player1;

      // Mantém exatamente 6 estudantes
      expect(player1.board.length).toBe(6);

      // O estudante antigo não está mais no board
      expect(player1.board.find((s) => s.instanceId === targetOldId)).toBeUndefined();

      // O estudante antigo está no descarte com zone = DISCARD
      expect(player1.discard.length).toBe(initialDiscardLen + 1);
      const discardedCard = player1.discard.find((c) => c.instanceId === targetOldId);
      expect(discardedCard).toBeDefined();
      expect(discardedCard?.zone).toBe(CardZone.DISCARD);

      // O novo estudante está no board com seus atributos
      const placedStudent = player1.board.find((s) => s.instanceId === newStudent.instanceId);
      expect(placedStudent).toBeDefined();
      expect(placedStudent?.zone).toBe(CardZone.BOARD);
      expect(placedStudent?.hasInertia).toBe(false); // Capitão tem Impulso
      expect(placedStudent?.ready).toBe(true);
    });
  });

  describe('4. Resolução de Ambientes (CardType.ENVIRONMENT)', () => {
    it('deve jogar um Ambiente em player.environment com zone = ENVIRONMENT e deduzir energia', () => {
      const state = setupMainPhaseState({ energy: 3 });
      expect(state.players.player1.environment).toBeNull();

      const envCard = createCardInstance(ALPHA_ENV_SALA_GREMIO, 'player1', 501, CardZone.HAND);
      state.players.player1.hand.push(envCard);

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: envCard.instanceId,
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      const player1 = res.state.players.player1;
      expect(player1.energy).toBe(3 - ALPHA_ENV_SALA_GREMIO.cost);
      expect(player1.environment).toBeDefined();
      expect(player1.environment?.instanceId).toBe(envCard.instanceId);
      expect(player1.environment?.zone).toBe(CardZone.ENVIRONMENT);
      expect(player1.hand.find((c) => c.instanceId === envCard.instanceId)).toBeUndefined();
    });

    it('deve substituir Ambiente anterior, movendo o antigo para DISCARD', () => {
      const state = setupMainPhaseState({ energy: 5 });

      // Coloca primeiro ambiente
      const env1 = createCardInstance(ALPHA_ENV_SALA_GREMIO, 'player1', 502, CardZone.HAND);
      state.players.player1.hand.push(env1);

      const res1 = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: env1.instanceId,
      });
      expect(res1.success).toBe(true);
      if (!res1.success) return;

      // Coloca segundo ambiente na mão
      let state2 = res1.state;
      state2.players.player1.energy = 5; // recarrega energia para o teste
      const env2 = createCardInstance(ALPHA_ENV_QUADRA, 'player1', 503, CardZone.HAND);
      state2.players.player1.hand.push(env2);

      const initialDiscardLen = state2.players.player1.discard.length;

      const res2 = playCard(state2, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: env2.instanceId,
      });

      expect(res2.success).toBe(true);
      if (!res2.success) return;

      const player1 = res2.state.players.player1;

      // Novo ambiente está ativo
      expect(player1.environment?.instanceId).toBe(env2.instanceId);
      expect(player1.environment?.zone).toBe(CardZone.ENVIRONMENT);

      // Antigo ambiente foi movido para o descarte com zone = DISCARD
      expect(player1.discard.length).toBe(initialDiscardLen + 1);
      const discardedEnv = player1.discard.find((c) => c.instanceId === env1.instanceId);
      expect(discardedEnv).toBeDefined();
      expect(discardedEnv?.zone).toBe(CardZone.DISCARD);
    });
  });

  describe('5. Integração com gameEngine.ts (applyAction)', () => {
    it('deve despachar PLAY_CARD através de applyAction e registrá-la no history', () => {
      const state = setupMainPhaseState({ energy: 4 });
      const studentCard = createCardInstance(ALPHA_STUDENT_REBELDE, 'player1', 601, CardZone.HAND);
      state.players.player1.hand.push(studentCard);

      const initialHistoryLen = state.history.length;

      const res = applyAction(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: studentCard.instanceId,
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.state.history.length).toBe(initialHistoryLen + 1);
      const lastAction = res.state.history[res.state.history.length - 1];
      expect(lastAction.type).toBe(ActionType.PLAY_CARD);
      expect(res.state.players.player1.board.some((s) => s.instanceId === studentCard.instanceId)).toBe(true);
    });

    it('deve retornar erro estruturado através de applyAction em caso de falha de validação', () => {
      const state = setupMainPhaseState({ energy: 0 }); // Sem energia
      const studentCard = createCardInstance(ALPHA_STUDENT_MONITOR, 'player1', 602, CardZone.HAND);
      state.players.player1.hand.push(studentCard);

      const res = applyAction(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: studentCard.instanceId,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe(ActionErrorCode.NOT_ENOUGH_ENERGY);
      }
    });
  });

  describe('6. Imutabilidade Estrita do GameState', () => {
    it('não deve mutar o estado original durante playCard', () => {
      const state = setupMainPhaseState({ energy: 3 });
      const studentCard = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 701, CardZone.HAND);
      state.players.player1.hand.push(studentCard);

      const originalEnergy = state.players.player1.energy;
      const originalHandLen = state.players.player1.hand.length;
      const originalBoardLen = state.players.player1.board.length;

      const res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: studentCard.instanceId,
      });

      expect(res.success).toBe(true);
      // Estado original intocado
      expect(state.players.player1.energy).toBe(originalEnergy);
      expect(state.players.player1.hand.length).toBe(originalHandLen);
      expect(state.players.player1.board.length).toBe(originalBoardLen);
      expect(state.players.player1.hand.some((c) => c.instanceId === studentCard.instanceId)).toBe(true);
    });
  });

  describe('7. Ciclo de Turno e Remoção de Inércia no Turno Seguinte', () => {
    it('deve remover a Inércia na Start Phase do turno seguinte daquele jogador', () => {
      let state = setupMainPhaseState({ energy: 2 });
      const studentCard = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 801, CardZone.HAND);
      state.players.player1.hand.push(studentCard);

      // Joga no Turno 1 (Player 1)
      let res = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: studentCard.instanceId,
      });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;

      // No turno em que entra: Inércia ativa
      const playedInT1 = state.players.player1.board.find((s) => s.instanceId === studentCard.instanceId)!;
      expect(playedInT1.hasInertia).toBe(true);
      expect(playedInT1.ready).toBe(false);

      // Avança fases até passar para player2: MAIN -> DEBATE -> COMBAT -> END -> START (Turno 2, player2)
      state = unwrapState(advancePhase(state)); // MAIN -> DEBATE
      state = unwrapState(advancePhase(state)); // DEBATE -> COMBAT
      state = unwrapState(advancePhase(state)); // COMBAT -> END
      state = unwrapState(advancePhase(state)); // END -> START (player2 turno 2)
      expect(state.activePlayerId).toBe('player2');

      // Avança o turno de player2: START -> MAIN -> DEBATE -> COMBAT -> END -> START (Turno 3, player1)
      state = unwrapState(advancePhase(state)); // START -> MAIN
      state = unwrapState(advancePhase(state)); // MAIN -> DEBATE
      state = unwrapState(advancePhase(state)); // DEBATE -> COMBAT
      state = unwrapState(advancePhase(state)); // COMBAT -> END
      state = unwrapState(advancePhase(state)); // END -> START (player1 turno 3)
      expect(state.activePlayerId).toBe('player1');

      // START -> MAIN de player1: executa resolveStartPhase que prepara os estudantes
      state = unwrapState(advancePhase(state));
      expect(state.phase).toBe(GamePhase.MAIN);

      const refreshedStudent = state.players.player1.board.find((s) => s.instanceId === studentCard.instanceId)!;
      expect(refreshedStudent.hasInertia).toBe(false);
      expect(refreshedStudent.ready).toBe(true);
    });
  });
});
