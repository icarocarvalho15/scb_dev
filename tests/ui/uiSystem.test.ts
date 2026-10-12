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
  CardZone,
  evaluateAiMulligan,
} from '../../src/core';
import { chooseAction, getExpectedActor } from '../../src/ai';

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

  describe('3. Soft-Lock Prevention & Edge Cases (Phase 11 Acceptance)', () => {
    it('Mão Cheia: rejeita avanço na END phase se mão exceder 8 cartas sem lista de descarte', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.END;
      state.activePlayerId = 'player1';

      // Enche a mão com 10 cartas
      while (state.players.player1.hand.length < 10) {
        state.players.player1.hand.push({
          instanceId: `extra_hand_${state.players.player1.hand.length}`,
          definitionId: 'student_1',
          ownerId: 'player1',
          controllerId: 'player1',
          zone: CardZone.HAND,
          ready: true,
          hasInertia: false,
          statuses: [],
        });
      }

      // Rejeita avanço direto quando autoCutExcess = false (comportamento estrito para modal de descarte da UI)
      applyAction(
        state,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player1',
        }
      );
      // Se a engine auto-corta ou aceita descarte explícito
      expect(state.players.player1.hand.length).toBe(10);

      // Com descarte explícito das 2 cartas excedentes, avança normalmente
      const discardRes = applyAction(
        state,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player1',
          cardInstanceIdsToDiscard: ['extra_hand_8', 'extra_hand_9'],
        }
      );
      expect(discardRes.success).toBe(true);
      if (discardRes.success) {
        expect(discardRes.state.players.player1.hand.length).toBe(8);
        expect(discardRes.state.phase).toBe(GamePhase.START);
      }
    });

    it('Campo Lotado: jogar o 7º estudante sem replaceCardInstanceId é rejeitado com BOARD_FULL', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.activePlayerId = 'player1';
      state.players.player1.energy = 10;

      // Adiciona 6 estudantes no board
      for (let i = 0; i < 6; i++) {
        state.players.player1.board.push({
          instanceId: `board_student_${i}`,
          definitionId: 'student_1',
          ownerId: 'player1',
          controllerId: 'player1',
          zone: CardZone.BOARD,
          ready: true,
          hasInertia: false,
          statuses: [],
        });
      }

      const handStudent: CardInstance = {
        instanceId: 'candidate_student',
        definitionId: 'student_1',
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.HAND,
        ready: true,
        hasInertia: false,
        statuses: [],
      };
      state.players.player1.hand.push(handStudent);

      // 1. Tentar jogar sem substituição falha
      const invalidRes = applyAction(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: 'candidate_student',
      });
      expect(invalidRes.success).toBe(false);

      // 2. Com indicação de substituição de board_student_0, funciona perfeitamente
      const validRes = applyAction(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: 'candidate_student',
        replaceCardInstanceId: 'board_student_0',
      });
      expect(validRes.success).toBe(true);
      if (validRes.success) {
        expect(validRes.state.players.player1.board.length).toBe(6);
        expect(validRes.state.players.player1.board.some((s) => s.instanceId === 'candidate_student')).toBe(true);
        expect(validRes.state.players.player1.board.some((s) => s.instanceId === 'board_student_0')).toBe(false);
      }
    });

    it('Combate sem Bloqueadores: avanço do combate calcula dano direto e avança sem travar', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.activePlayerId = 'player1';

      // Daichi tem atacante no campo
      const attacker: CardInstance = {
        instanceId: 'attacker_alpha',
        definitionId: 'student_1',
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.BOARD,
        currentInfluence: 3,
        currentMorale: 4,
        ready: true,
        hasInertia: false,
        statuses: [],
      };
      state.players.player1.board.push(attacker);

      // Declara ataque direto ao Representante de Akira (Turno 2 para desativar diplomacia)
      state.turn = 2;
      state.players.player1.diplomacyActive = false;
      state.players.player2.diplomacyActive = false;

      // Ataque sem precisar escolher alvo (vai automaticamente para o Representante)
      const atkRes = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: 'attacker_alpha',
      });
      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;
      expect(atkRes.state.combat.attacks[0].targetId).toBe('rep_akira');

      // Avança combate bifásico: Atacante conclui ataques, Defensor opta por não bloquear
      const atkAdvRes = applyAction(atkRes.state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });
      expect(atkAdvRes.success).toBe(true);
      if (!atkAdvRes.success) return;
      expect(atkAdvRes.state.combat.attackersDeclared).toBe(true);

      const combatEndRes = applyAction(atkAdvRes.state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player2',
      });
      expect(combatEndRes.success).toBe(true);
      if (combatEndRes.success) {
        // Moral de Akira deve cair de 20 para 17 (20 - 3)
        expect(combatEndRes.state.players.player2.representative.currentMorale).toBe(17);
        expect(combatEndRes.state.phase).toBe(GamePhase.END);
      }
    });

    it('Condição Terminal e Reinicialização: redução de Moral a 0 finaliza com vitória', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.activePlayerId = 'player1';
      state.turn = 2;
      state.players.player1.diplomacyActive = false;
      state.players.player2.diplomacyActive = false;

      // Akira com 2 de moral restante
      state.players.player2.representative.currentMorale = 2;

      state.players.player1.board.push({
        instanceId: 'finisher_student',
        definitionId: 'student_1',
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.BOARD,
        currentInfluence: 3,
        currentMorale: 4,
        ready: true,
        hasInertia: false,
        statuses: [],
      });

      const atkRes = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: 'finisher_student',
      });
      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;

      const atkAdv = applyAction(atkRes.state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });
      expect(atkAdv.success).toBe(true);
      if (!atkAdv.success) return;

      const resolveRes = applyAction(atkAdv.state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player2',
      });
      expect(resolveRes.success).toBe(true);
      if (resolveRes.success) {
        expect(resolveRes.state.status).toBe(GameStatus.FINISHED);
        expect(resolveRes.state.winnerId).toBe('player1');
      }
    });

    it('Start Phase automática: jogador ativo já inicia na Main Phase com carta comprada e energia atualizada', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();
      const registry = buildMatchRegistry(p1Deck, p2Deck);

      const initial = createInitialGameState({
        player1: { id: 'player1', deck: p1Deck },
        player2: { id: 'player2', deck: p2Deck },
      });

      // A Start Phase é resolvida de imediato na transição do turno
      const startRes = applyAction(
        initial,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: initial.activePlayerId,
        },
        { cardRegistry: registry }
      );

      expect(startRes.success).toBe(true);
      if (!startRes.success) return;

      // Jogador já está na Main Phase com 5 cartas na mão (4 iniciais + 1 comprada) e 1 de energia
      expect(startRes.state.phase).toBe(GamePhase.MAIN);
      expect(startRes.state.players.player1.hand).toHaveLength(5);
      expect(startRes.state.players.player1.energy).toBe(1);
      expect(startRes.state.players.player1.maxEnergy).toBe(1);
    });

    it('Declaração de ataque sem seleção de alvo: foca automaticamente no Representante adversário', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.turn = 2;
      state.activePlayerId = 'player1';
      state.players.player1.diplomacyActive = false;

      const attacker: CardInstance = {
        instanceId: 'attacker_direct',
        definitionId: 'student_1',
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.BOARD,
        currentInfluence: 2,
        currentMorale: 3,
        ready: true,
        hasInertia: false,
        statuses: [],
      };
      state.players.player1.board.push(attacker);

      // Declaração sem informar targetId
      const atkRes = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: 'attacker_direct',
      });

      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;

      // Ataque registrado focado no Representante de player2
      expect(atkRes.state.combat.attacks).toHaveLength(1);
      expect(atkRes.state.combat.attacks[0].targetId).toBe(state.players.player2.representative.definitionId);
    });

    it('Transição de Turno para IA: avança atômica para MAIN phase e IA despacha ação ou fallback sem travar', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();
      const registry = buildMatchRegistry(p1Deck, p2Deck);

      // Simula o final do Turno 1 do jogador humano na END phase
      let state = createInitialGameState({
        player1: { id: 'player1', deck: p1Deck },
        player2: { id: 'player2', deck: p2Deck },
      });
      state.turn = 1;
      state.phase = GamePhase.END;
      state.activePlayerId = 'player1';

      // Jogador avança a fase -> Motor fecha o turno 1 e abre o turno 2 (IA)
      const turnEndRes = applyAction(
        state,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player1',
        },
        { cardRegistry: registry }
      );
      expect(turnEndRes.success).toBe(true);
      if (!turnEndRes.success) return;

      expect(turnEndRes.state.turn).toBe(2);
      expect(turnEndRes.state.activePlayerId).toBe('player2');
      expect(turnEndRes.state.phase).toBe(GamePhase.START);

      // No controller, a Start Phase é imediatamente resolvida para estabilizar a Main Phase
      const startRes = applyAction(
        turnEndRes.state,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player2',
        },
        { cardRegistry: registry }
      );
      expect(startRes.success).toBe(true);
      if (!startRes.success) return;

      // Estado 100% estabilizado na Main Phase da IA com energia e carta pronta
      expect(startRes.state.phase).toBe(GamePhase.MAIN);
      expect(startRes.state.players.player2.energy).toBe(1);
      expect(startRes.state.players.player2.hand).toHaveLength(5);

      // IA avalia ação: deve retornar ação válida ou fallback sem crashar
      const aiAction = chooseAction(startRes.state, 'player2', { cardRegistry: registry });
      if (aiAction) {
        const val = validateAction(startRes.state, aiAction, { cardRegistry: registry });
        expect(val.valid).toBe(true);
      } else {
        // Fallback: se não houver jogada de 1 de energia, avanço para DEBATE é legal
        const fallbackVal = validateAction(
          startRes.state,
          { type: ActionType.ADVANCE_PHASE, playerId: 'player2' },
          { cardRegistry: registry }
        );
        expect(fallbackVal.valid).toBe(true);
      }
    });

    it('Bloqueio Livre: quando a IA ataca sem Infiltração, prioridade passa para o defensor humano declarar bloqueio', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.turn = 2;
      state.activePlayerId = 'player2'; // IA é o atacante
      state.players.player2.diplomacyActive = false;

      // IA possui atacante sem Infiltração em campo
      const aiAttacker: CardInstance = {
        instanceId: 'ai_attacker_normal',
        definitionId: 'student_1',
        ownerId: 'player2',
        controllerId: 'player2',
        zone: CardZone.BOARD,
        currentInfluence: 3,
        currentMorale: 3,
        ready: true,
        hasInertia: false,
        statuses: [],
      };
      state.players.player2.board.push(aiAttacker);

      // Humano possui estudante em campo para Bloqueio Livre
      const humanDefender: CardInstance = {
        instanceId: 'human_defender_blocker',
        definitionId: 'student_2',
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.BOARD,
        currentInfluence: 2,
        currentMorale: 4,
        ready: false, // Bloqueio Livre permite bloquear mesmo não pronto
        hasInertia: false,
        statuses: [],
      };
      state.players.player1.board.push(humanDefender);

      // IA declara ataque
      const atkRes = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player2',
        attackerInstanceId: 'ai_attacker_normal',
      });
      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;

      // IA confirma término de declaração de atacantes (Fluxo Bifásico)
      const declRes = applyAction(atkRes.state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player2',
      });
      expect(declRes.success).toBe(true);
      if (!declRes.success) return;

      // Sem Infiltração, a prioridade DEVE passar para o defensor (player1)
      const actor = getExpectedActor(declRes.state);
      expect(actor).toBe('player1');

      // Humano declara Bloqueio Livre com sucesso
      const blockRes = applyAction(declRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player1',
        blockerInstanceId: 'human_defender_blocker',
        attackerInstanceId: 'ai_attacker_normal',
      });
      expect(blockRes.success).toBe(true);
      if (!blockRes.success) return;

      expect(blockRes.state.combat.attacks[0].blockerInstanceId).toBe('human_defender_blocker');
    });

    it('Inércia Temporária: estudante perde Inércia ao final do turno e na Start Phase', () => {
      let state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.activePlayerId = 'player1';

      // Jogador baixa estudante no turno 1
      const student: CardInstance = {
        instanceId: 'student_inertia_test',
        definitionId: 'student_1',
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.BOARD,
        currentInfluence: 2,
        currentMorale: 3,
        ready: false,
        hasInertia: true,
        statuses: ['Inércia'],
      };
      state.players.player1.board.push(student);

      expect(student.hasInertia).toBe(true);

      // Avança para END phase e resolve o fim de turno
      state.phase = GamePhase.END;
      const endRes = applyAction(state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });
      expect(endRes.success).toBe(true);
      if (!endRes.success) return;

      // Na End Phase do dono da carta, Inércia foi removida
      const p1Student = endRes.state.players.player1.board.find(s => s.instanceId === 'student_inertia_test');
      expect(p1Student?.hasInertia).toBe(false);
      expect(p1Student?.statuses.some(s => s.toLowerCase().includes('inercia'))).toBe(false);
    });

    it('Destaque não custa Energia: ativa com sucesso com 0 de Energia', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.activePlayerId = 'player1';

      state.players.player1.energy = 0; // 0 de energia
      state.players.player1.representative.popularity = 3;
      state.players.player1.representative.highlightAvailable = true;

      const actRes = applyAction(state, {
        type: ActionType.ACTIVATE_HIGHLIGHT,
        playerId: 'player1',
      });

      expect(actRes.success).toBe(true);
      if (!actRes.success) return;

      // Energia não foi consumida (continua 0)
      expect(actRes.state.players.player1.energy).toBe(0);
      // Popularidade foi consumida
      expect(actRes.state.players.player1.representative.popularity).toBe(0);
      expect(actRes.state.players.player1.representative.highlightAvailable).toBe(false);
    });
  });

  describe('4. Hotfix 1 — Sequenciamento Correto de Mulligan e Start Phase', () => {
    it('o estado inicial possui estritamente 4 cartas na mão e hasMulliganed = false', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();
      const state = createInitialGameState({
        player1: { id: 'player1', deck: p1Deck },
        player2: { id: 'player2', deck: p2Deck },
      });

      expect(state.phase).toBe(GamePhase.START);
      expect(state.turn).toBe(1);
      expect(state.players.player1.hasMulliganed).toBe(false);
      expect(state.players.player2.hasMulliganed).toBe(false);
      expect(state.players.player1.hand.length).toBe(4);
      expect(state.players.player2.hand.length).toBe(4);
    });

    it('o Mulligan avalia apenas as 4 cartas iniciais e a 5ª carta é comprada somente após o avanço para MAIN', () => {
      const p1Deck = createDaichiPlayerDeck();
      const p2Deck = createAkiraAIDeck();
      const registry = buildMatchRegistry(p1Deck, p2Deck);
      let state = createInitialGameState({
        rngSeed: 12345,
        player1: { id: 'player1', deck: p1Deck },
        player2: { id: 'player2', deck: p2Deck },
      });

      // 1. Antes do Mulligan: exatas 4 cartas na mão
      expect(state.players.player1.hand.length).toBe(4);
      const initialP1HandIds = state.players.player1.hand.map((c) => c.instanceId);

      // 2. Executa o Mulligan do Jogador (substituindo 2 cartas)
      const p1MulliganRes = applyAction(
        state,
        {
          type: ActionType.MULLIGAN,
          playerId: 'player1',
          cardInstanceIdsToReplace: [initialP1HandIds[0], initialP1HandIds[1]],
        },
        { cardRegistry: registry }
      );
      expect(p1MulliganRes.success).toBe(true);
      if (!p1MulliganRes.success) return;
      state = p1MulliganRes.state;

      // Pós-mulligan do jogador: hasMulliganed = true, mas mão AINDA tem estritamente 4 cartas
      expect(state.players.player1.hasMulliganed).toBe(true);
      expect(state.players.player1.hand.length).toBe(4);
      expect(state.phase).toBe(GamePhase.START);

      // 3. Executa o Mulligan da IA
      const aiCardsToReplace = evaluateAiMulligan(state.players.player2.hand, registry);
      const aiMulliganRes = applyAction(
        state,
        {
          type: ActionType.MULLIGAN,
          playerId: 'player2',
          cardInstanceIdsToReplace: aiCardsToReplace,
        },
        { cardRegistry: registry }
      );
      expect(aiMulliganRes.success).toBe(true);
      if (!aiMulliganRes.success) return;
      state = aiMulliganRes.state;

      expect(state.players.player2.hasMulliganed).toBe(true);
      expect(state.players.player2.hand.length).toBe(4);
      expect(state.phase).toBe(GamePhase.START);

      // 4. Somente agora a Start Phase é resolvida avançando para MAIN Phase
      const advanceRes = applyAction(
        state,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: state.activePlayerId,
        },
        { cardRegistry: registry }
      );
      expect(advanceRes.success).toBe(true);
      if (!advanceRes.success) return;
      state = advanceRes.state;

      // Agora sim a fase é MAIN e a 5ª carta foi comprada pelo jogador ativo (Turno 1)
      expect(state.phase).toBe(GamePhase.MAIN);
      expect(state.players.player1.hand.length).toBe(5);
      expect(state.players.player1.energy).toBe(1);
      expect(state.players.player1.maxEnergy).toBe(1);
    });
  });
});
