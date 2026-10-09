import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState, createCardInstance } from '../../src/core/state/createInitialGameState';
import { GameState } from '../../src/core/types/state';
import { GamePhase } from '../../src/core/types/phase';
import { CardZone } from '../../src/core/types/zone';
import { ActionType, StartDebateAction, RespondDebateAction, PassDebateAction, ResolveDebateAction } from '../../src/core/types/action';
import { ActionErrorCode } from '../../src/core/types/error';
import { GameEventType } from '../../src/core/types/event';
import {
  startDebate,
  validateStartDebate,
  respondDebate,
  validateRespondDebate,
  passDebate,
  validatePassDebate,
  resolveDebate,
  validateResolveDebate,
  getNextDebatePlayerId,
  isDebateChainFull,
  getDebateStepName,
  MAX_DEBATE_CHAIN_ACTIONS,
} from '../../src/core/engine/debateSystem';
import { applyAction } from '../../src/core/engine/gameEngine';
import {
  ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL,
  ALPHA_DEBATE_CONTRAPONTO,
  ALPHA_DEBATE_DISCURSO_MOTIVACIONAL,
  ALPHA_DEBATE_ESCUDO_VERBAL,
  ALPHA_DEBATE_PEDIDO_DE_ORDEM,
  ALPHA_DEBATE_PROVOCACOES_RETORICAS,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_PROTEGIDO,
} from '../../src/cards/alphaCards';

describe('FASE 7 — Debate System (Sistema e Cadeia de Debates)', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialGameState({
      matchId: 'test_debate_match',
      rngSeed: 42,
    });
    // Posiciona o jogo na DEBATE phase
    state.phase = GamePhase.DEBATE;
    // Fornece energia para ambos os jogadores
    state.players['player1'].energy = 10;
    state.players['player1'].maxEnergy = 10;
    state.players['player2'].energy = 10;
    state.players['player2'].maxEnergy = 10;
  });

  // ==========================================================================
  // 1. INÍCIO DO DEBATE (START_DEBATE / AÇÃO INICIAL)
  // ==========================================================================
  describe('1. Início do Debate (START_DEBATE)', () => {
    it('deve iniciar uma cadeia de debate com sucesso pelo jogador ativo', () => {
      // Adiciona carta de debate na mão de player1
      const debateCard = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 99, CardZone.HAND);
      state.players['player1'].hand.push(debateCard);

      const action: StartDebateAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
      };

      const result = applyAction(state, action);
      expect(result.success).toBe(true);

      if (result.success) {
        const nextState = result.state;
        expect(nextState.debate.active).toBe(true);
        expect(nextState.debate.initiatorPlayerId).toBe('player1');
        expect(nextState.debate.currentStep).toBe(1);
        expect(nextState.debate.actions).toHaveLength(1);

        const firstAction = nextState.debate.actions[0];
        expect(firstAction.step).toBe(1);
        expect(firstAction.stepName).toBe('INITIAL');
        expect(firstAction.playerId).toBe('player1');
        expect(firstAction.cardInstanceId).toBe(debateCard.instanceId);

        // Energia descontada
        expect(nextState.players['player1'].energy).toBe(10 - ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL.cost);

        // Carta removida da mão
        expect(nextState.players['player1'].hand.find((c) => c.instanceId === debateCard.instanceId)).toBeUndefined();

        // Próximo jogador esperado deve ser o oponente (player2)
        expect(getNextDebatePlayerId(nextState)).toBe('player2');

        // Eventos emitidos
        expect(result.events?.some((e) => e.type === GameEventType.DEBATE_STARTED)).toBe(true);
        expect(result.events?.some((e) => e.type === GameEventType.DEBATE_ACTION_PLAYED)).toBe(true);
        expect(result.events?.some((e) => e.type === GameEventType.CARD_PLAYED)).toBe(true);
      }
    });

    it('deve rejeitar se o oponente tentar iniciar a Debate Phase (apenas jogador ativo)', () => {
      const debateCard = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 98, CardZone.HAND);
      state.players['player2'].hand.push(debateCard);

      const action: StartDebateAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player2',
        cardInstanceId: debateCard.instanceId,
      };

      const val = validateStartDebate(state, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.INVALID_PLAYER);

      const result = applyAction(state, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });

    it('deve rejeitar se chamado fora da Debate Phase (ex: na MAIN Phase)', () => {
      state.phase = GamePhase.MAIN;
      const debateCard = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 97, CardZone.HAND);
      state.players['player1'].hand.push(debateCard);

      const action: StartDebateAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
      };

      const result = applyAction(state, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_PHASE);
      }
    });

    it('deve rejeitar se o jogador não tiver energia suficiente', () => {
      state.players['player1'].energy = 0;
      const debateCard = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 96, CardZone.HAND);
      state.players['player1'].hand.push(debateCard);

      const action: StartDebateAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
      };

      const result = applyAction(state, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.NOT_ENOUGH_ENERGY);
      }
    });

    it('deve rejeitar se tentar jogar uma carta que não seja do tipo DEBATE', () => {
      const studentCard = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 95, CardZone.HAND);
      state.players['player1'].hand.push(studentCard);

      const action: StartDebateAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: studentCard.instanceId,
      };

      const result = applyAction(state, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.NOT_DEBATE_CARD);
      }
    });

    it('deve rejeitar START_DEBATE se já houver um debate ativo', () => {
      const card1 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 94, CardZone.HAND);
      const card2 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 93, CardZone.HAND);
      state.players['player1'].hand.push(card1, card2);

      const res1 = startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card1.instanceId,
      });
      expect(res1.success).toBe(true);

      const res2 = startDebate((res1 as any).state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card2.instanceId,
      });
      expect(res2.success).toBe(false);
      if (!res2.success) {
        expect(res2.error.code).toBe(ActionErrorCode.DEBATE_ALREADY_ACTIVE);
      }
    });
  });

  // ==========================================================================
  // 2. RÉPLICA (RESPOND_DEBATE / PASSO 2)
  // ==========================================================================
  describe('2. Réplica (RESPOND_DEBATE — Passo 2)', () => {
    let card1: any;
    let card2: any;
    let stateStep1: GameState;

    beforeEach(() => {
      card1 = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      card2 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 2, CardZone.HAND);
      state.players['player1'].hand.push(card1);
      state.players['player2'].hand.push(card2);

      const r = startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card1.instanceId,
      });
      stateStep1 = (r as any).state;
    });

    it('deve permitir que o oponente responda com a Réplica', () => {
      const action: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: card2.instanceId,
      };

      const result = applyAction(stateStep1, action);
      expect(result.success).toBe(true);

      if (result.success) {
        const nextState = result.state;
        expect(nextState.debate.currentStep).toBe(2);
        expect(nextState.debate.actions).toHaveLength(2);

        const replicaAction = nextState.debate.actions[1];
        expect(replicaAction.step).toBe(2);
        expect(replicaAction.stepName).toBe('REPLICA');
        expect(replicaAction.playerId).toBe('player2');
        expect(replicaAction.cardInstanceId).toBe(card2.instanceId);

        // Próximo a responder deve ser player1 (Tréplica)
        expect(getNextDebatePlayerId(nextState)).toBe('player1');
      }
    });

    it('deve rejeitar se o jogador ativo tentar responder à sua própria Ação Inicial (furando a vez)', () => {
      const extraCard = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 3, CardZone.HAND);
      stateStep1.players['player1'].hand.push(extraCard);

      const action: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player1',
        cardInstanceId: extraCard.instanceId,
      };

      const result = applyAction(stateStep1, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });
  });

  // ==========================================================================
  // 3. TRÉPLICA (RESPOND_DEBATE / PASSO 3)
  // ==========================================================================
  describe('3. Tréplica (RESPOND_DEBATE — Passo 3)', () => {
    let card1: any, card2: any, card3: any;
    let stateStep2: GameState;

    beforeEach(() => {
      card1 = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      card2 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 2, CardZone.HAND);
      card3 = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player1', 3, CardZone.HAND);
      state.players['player1'].hand.push(card1, card3);
      state.players['player2'].hand.push(card2);

      const r1 = startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card1.instanceId,
      });
      const r2 = respondDebate((r1 as any).state, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: card2.instanceId,
      });
      stateStep2 = (r2 as any).state;
    });

    it('deve permitir que o jogador ativo responda com a Tréplica', () => {
      const action: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player1',
        cardInstanceId: card3.instanceId,
      };

      const result = applyAction(stateStep2, action);
      expect(result.success).toBe(true);

      if (result.success) {
        const nextState = result.state;
        expect(nextState.debate.currentStep).toBe(3);
        expect(nextState.debate.actions).toHaveLength(3);

        const treplicaAction = nextState.debate.actions[2];
        expect(treplicaAction.step).toBe(3);
        expect(treplicaAction.stepName).toBe('TREPLICA');
        expect(treplicaAction.playerId).toBe('player1');

        // Próximo a responder deve ser player2 (Contrarréplica)
        expect(getNextDebatePlayerId(nextState)).toBe('player2');
      }
    });

    it('deve rejeitar se o oponente tentar responder na vez da Tréplica', () => {
      const extraCard = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 4, CardZone.HAND);
      stateStep2.players['player2'].hand.push(extraCard);

      const action: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: extraCard.instanceId,
      };

      const result = applyAction(stateStep2, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });
  });

  // ==========================================================================
  // 4. CONTRARRÉPLICA (RESPOND_DEBATE / PASSO 4)
  // ==========================================================================
  describe('4. Contrarréplica (RESPOND_DEBATE — Passo 4)', () => {
    let card1: any, card2: any, card3: any, card4: any;
    let stateStep3: GameState;

    beforeEach(() => {
      card1 = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      card2 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 2, CardZone.HAND);
      card3 = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player1', 3, CardZone.HAND);
      card4 = createCardInstance(ALPHA_DEBATE_ESCUDO_VERBAL, 'player2', 4, CardZone.HAND);
      state.players['player1'].hand.push(card1, card3);
      state.players['player2'].hand.push(card2, card4);

      let s = (startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card1.instanceId,
      }) as any).state;

      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: card2.instanceId,
      }) as any).state;

      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player1',
        cardInstanceId: card3.instanceId,
      }) as any).state;

      stateStep3 = s;
    });

    it('deve permitir que o oponente responda com a Contrarréplica (atingindo o teto de 4 ações)', () => {
      const action: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: card4.instanceId,
      };

      const result = applyAction(stateStep3, action);
      expect(result.success).toBe(true);

      if (result.success) {
        const nextState = result.state;
        expect(nextState.debate.currentStep).toBe(4);
        expect(nextState.debate.actions).toHaveLength(4);

        const contrarreplica = nextState.debate.actions[3];
        expect(contrarreplica.step).toBe(4);
        expect(contrarreplica.stepName).toBe('CONTRARREPLICA');
        expect(contrarreplica.playerId).toBe('player2');

        // Cadeia está cheia
        expect(isDebateChainFull(nextState)).toBe(true);
        expect(getNextDebatePlayerId(nextState)).toBeNull();
      }
    });
  });

  // ==========================================================================
  // 5. REJEIÇÃO DA 5ª AÇÃO (LIMITE ALPHA DE 4 AÇÕES ATINGIDO)
  // ==========================================================================
  describe('5. Rejeição da 5ª Ação (Teto Alpha de 4 ações)', () => {
    let stateStep4: GameState;

    beforeEach(() => {
      const card1 = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      const card2 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 2, CardZone.HAND);
      const card3 = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player1', 3, CardZone.HAND);
      const card4 = createCardInstance(ALPHA_DEBATE_ESCUDO_VERBAL, 'player2', 4, CardZone.HAND);
      state.players['player1'].hand.push(card1, card3);
      state.players['player2'].hand.push(card2, card4);

      let s = (startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card1.instanceId,
      }) as any).state;
      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: card2.instanceId,
      }) as any).state;
      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player1',
        cardInstanceId: card3.instanceId,
      }) as any).state;
      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: card4.instanceId,
      }) as any).state;

      stateStep4 = s;
    });

    it('deve rejeitar categoricamente qualquer tentativa de 5ª ação com DEBATE_CHAIN_FULL', () => {
      const card5 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 5, CardZone.HAND);
      stateStep4.players['player1'].hand.push(card5);

      const action: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player1',
        cardInstanceId: card5.instanceId,
      };

      const val = validateRespondDebate(stateStep4, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.DEBATE_CHAIN_FULL);

      const result = applyAction(stateStep4, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.DEBATE_CHAIN_FULL);
        expect(result.error.message).toContain('limite máximo de 4 ações');
      }

      // O estado da cadeia permanece com exatamente 4 ações
      expect(stateStep4.debate.actions).toHaveLength(4);
      expect(stateStep4.debate.currentStep).toBe(4);
    });
  });

  // ==========================================================================
  // 6. AÇÃO DE PASSAR (PASS_DEBATE / PASS) E PASSE CONSECUTIVO
  // ==========================================================================
  describe('6. Ação de Passar (PASS_DEBATE / Pass) e Fechamento da Pilha', () => {
    it('se o oponente passar na Réplica (passo 2), a pilha fecha e resolve a Ação Inicial', () => {
      // Cria Estudante alvo em player2
      const targetStudent = createCardInstance(ALPHA_STUDENT_NOVATO, 'player2', 50, CardZone.BOARD);
      targetStudent.currentMorale = 2;
      state.players['player2'].board.push(targetStudent);

      // player1 joga Argumento Irrefutável (-2 moral no Estudante alvo, compra 1 carta)
      const debateCard = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand.push(debateCard);

      const r1 = startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
        targetId: targetStudent.instanceId,
      });
      const s1 = (r1 as any).state;

      // player2 passa com PASS_DEBATE
      const passAction: PassDebateAction = {
        type: ActionType.PASS_DEBATE,
        playerId: 'player2',
      };

      const result = applyAction(s1, passAction);
      expect(result.success).toBe(true);

      if (result.success) {
        const resolvedState = result.state;
        // O debate foi finalizado
        expect(resolvedState.debate.active).toBe(false);
        expect(resolvedState.debate.actions).toHaveLength(0);

        // O efeito da Ação Inicial resolveu: targetStudent perdeu 2 de moral (derrotado)
        expect(resolvedState.players['player2'].board.find((s) => s.instanceId === targetStudent.instanceId)).toBeUndefined();
        expect(resolvedState.players['player2'].discard.some((s) => s.instanceId === targetStudent.instanceId)).toBe(true);

        // player1 comprou 1 carta (efeito secundário independente)
        expect(resolvedState.players['player1'].hand.length).toBeGreaterThan(0);
      }
    });

    it('se o oponente passar usando RESPOND_DEBATE com pass: true, a pilha fecha e resolve', () => {
      const debateCard = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand.push(debateCard);
      state.players['player1'].energy = 5;

      const r1 = startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
      });

      const passAction: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        pass: true,
      };

      const result = applyAction((r1 as any).state, passAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.debate.active).toBe(false);
        // Pedido de ordem concedeu 1 energia
        expect(result.state.players['player1'].energy).toBe(5 - ALPHA_DEBATE_PEDIDO_DE_ORDEM.cost + 1);
      }
    });

    it('se o jogador ativo passar sem iniciar debate (passe inicial), avança para COMBAT phase', () => {
      const action: PassDebateAction = {
        type: ActionType.PASS_DEBATE,
        playerId: 'player1',
      };

      const result = applyAction(state, action);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.debate.active).toBe(false);
        expect(result.state.phase).toBe(GamePhase.COMBAT);
      }
    });

    it('se o oponente tentar passar quando não há debate ativo, retorna erro INVALID_PLAYER', () => {
      const action: PassDebateAction = {
        type: ActionType.PASS_DEBATE,
        playerId: 'player2',
      };

      const result = applyAction(state, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });
  });

  // ==========================================================================
  // 7. RESOLUÇÃO EM PILHA REVERSA LIFO (LAST IN, FIRST OUT)
  // ==========================================================================
  describe('7. Resolução em Pilha LIFO (Last In, First Out)', () => {
    it('deve resolver uma cadeia completa de 4 níveis na ordem estrita Contrarréplica -> Tréplica -> Réplica -> Ação Inicial', () => {
      // Prepara um estudante de teste em player2
      const enemyStudent = createCardInstance(ALPHA_STUDENT_NOVATO, 'player2', 10, CardZone.BOARD);
      enemyStudent.currentMorale = 4;
      enemyStudent.maxMorale = 4;
      state.players['player2'].board.push(enemyStudent);

      // Prepara as 4 cartas:
      // 1. Initial (player1): Argumento Irrefutável -> -2 moral em enemyStudent
      // 2. Replica (player2): Discurso Motivacional -> +2 moral em enemyStudent (+1 popularidade)
      // 3. Treplica (player1): Contraponto Afiado -> -1 moral em enemyStudent
      // 4. Contrarreplica (player2): Pedido de Ordem -> +1 energia, compra 1 carta
      const c1 = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      const c2 = createCardInstance(ALPHA_DEBATE_DISCURSO_MOTIVACIONAL, 'player2', 2, CardZone.HAND);
      const c3 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 3, CardZone.HAND);
      const c4 = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player2', 4, CardZone.HAND);

      state.players['player1'].hand.push(c1, c3);
      state.players['player2'].hand.push(c2, c4);

      // Monta a pilha de 4 ações
      let s = (startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: c1.instanceId,
        targetId: enemyStudent.instanceId,
      }) as any).state;

      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: c2.instanceId,
        targetId: enemyStudent.instanceId,
      }) as any).state;

      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player1',
        cardInstanceId: c3.instanceId,
        targetId: enemyStudent.instanceId,
      }) as any).state;

      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: c4.instanceId,
      }) as any).state;

      expect(s.debate.actions).toHaveLength(4);

      // Resolve a pilha com RESOLVE_DEBATE
      const resolveAction: ResolveDebateAction = {
        type: ActionType.RESOLVE_DEBATE,
        playerId: 'player1',
      };

      const result = applyAction(s, resolveAction);
      expect(result.success).toBe(true);

      if (result.success) {
        const resolved = result.state;
        expect(resolved.debate.active).toBe(false);
        expect(resolved.debate.actions).toHaveLength(0);

        // LIFO Ordem:
        // Inicial moral = 4
        // 4. Contrarréplica (c4): Pedido de Ordem (+1 energia, compra carta para player2)
        // 3. Tréplica (c3): -1 moral -> moral = 3
        // 2. Réplica (c2): +2 moral -> moral = 5 (maxMorale sobe para 5)
        // 1. Ação Inicial (c1): -2 moral -> moral = 3
        // Resultado final: enemyStudent sobrevive com moral = 3
        const finalStudent = resolved.players['player2'].board.find((st) => st.instanceId === enemyStudent.instanceId);
        expect(finalStudent).toBeDefined();
        expect(finalStudent?.currentMorale).toBe(3);

        // Cartas jogadas foram todas para a zona de descarte de seus donos
        expect(resolved.players['player1'].discard.some((c) => c.instanceId === c1.instanceId)).toBe(true);
        expect(resolved.players['player2'].discard.some((c) => c.instanceId === c2.instanceId)).toBe(true);
        expect(resolved.players['player1'].discard.some((c) => c.instanceId === c3.instanceId)).toBe(true);
        expect(resolved.players['player2'].discard.some((c) => c.instanceId === c4.instanceId)).toBe(true);

        // Evento DEBATE_RESOLVED emitido
        expect(result.events?.some((e) => e.type === GameEventType.DEBATE_RESOLVED)).toBe(true);
      }
    });

    it('deve disparar o gatilho reativo de Popularidade de Akira quando o debate resolve', () => {
      // player2 possui Akira como Representante padrão (gatilho ON_DEBATE_RESOLVED)
      expect(state.players['player2'].representative.definitionId).toBe('rep_akira');
      const initialPopularity = state.players['player2'].representative.popularity;

      const card = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand.push(card);

      const r1 = startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card.instanceId,
      });

      const res = resolveDebate((r1 as any).state);
      expect(res.success).toBe(true);
      if (res.success) {
        // Akira ganhou 1 de Popularidade reativamente pelo barramento de eventos!
        expect(res.state.players['player2'].representative.popularity).toBe(initialPopularity + 1);
      }
    });
  });

  // ==========================================================================
  // 8. INVALIDAÇÃO PARCIAL DE ALVO (TARGET INVALIDATION)
  // ==========================================================================
  describe('8. Invalidação Parcial de Alvo (Target Invalidation)', () => {
    it('se o alvo for derrotado antes da resolução, o efeito dependente falha (fizzle), mas o independente resolve', () => {
      // Estudante alvo com 1 de moral
      const enemyStudent = createCardInstance(ALPHA_STUDENT_NOVATO, 'player2', 20, CardZone.BOARD);
      enemyStudent.currentMorale = 1;
      state.players['player2'].board.push(enemyStudent);

      // player1 joga Argumento Irrefutável (Efeito 1: -2 moral no alvo; Efeito 2: compra 1 carta)
      const c1 = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand.push(c1);

      // player2 responde na Réplica com Contraponto Afiado (-1 moral no próprio estudante, sacrificando-o)
      const c2 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 2, CardZone.HAND);
      state.players['player2'].hand.push(c2);

      const initialHandSizeP1 = state.players['player1'].hand.length - 1; // excluindo c1

      let s = (startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: c1.instanceId,
        targetId: enemyStudent.instanceId,
      }) as any).state;

      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: c2.instanceId,
        targetId: enemyStudent.instanceId,
      }) as any).state;

      // Resolução LIFO:
      // Réplica (c2) resolve PRIMEIRO: -1 moral em enemyStudent -> moral = 0 -> derrotado e movido para o Descarte!
      // Ação Inicial (c1) resolve SEGUNDO: enemyStudent não está mais em campo (alvo inválido).
      // Efeito 1 (-2 moral) FIZZLES!
      // Efeito 2 (compre 1 carta) RESOLVE NORMALMENTE!
      const result = resolveDebate(s);
      expect(result.success).toBe(true);

      if (result.success) {
        const resolved = result.state;
        // Alvo foi derrotado
        expect(resolved.players['player2'].board.find((st) => st.instanceId === enemyStudent.instanceId)).toBeUndefined();
        expect(resolved.players['player2'].discard.some((st) => st.instanceId === enemyStudent.instanceId)).toBe(true);

        // Efeito independente de c1 funcionou: player1 comprou 1 carta
        expect(resolved.players['player1'].hand.length).toBe(initialHandSizeP1 + 1);

        // Evento de fizzle foi emitido
        expect(result.events?.some((e) => e.type === GameEventType.DEBATE_ACTION_FIZZLED)).toBe(true);
      }
    });

    it('se o alvo ganhar Proteção antes da resolução, o efeito de dano falha mas o efeito de compra resolve', () => {
      // Estudante alvo com 3 de moral (sem proteção inicialmente)
      const enemyStudent = createCardInstance(ALPHA_STUDENT_NOVATO, 'player2', 30, CardZone.BOARD);
      enemyStudent.currentMorale = 3;
      state.players['player2'].board.push(enemyStudent);

      // player1 declara Ação Inicial com Argumento Irrefutável (-2 moral, compra 1 carta)
      const c1 = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand.push(c1);

      // player2 responde com Escudo Verbal concedendo Proteção ao estudante alvo
      const c2 = createCardInstance(ALPHA_DEBATE_ESCUDO_VERBAL, 'player2', 2, CardZone.HAND);
      state.players['player2'].hand.push(c2);

      const initialHandP1 = state.players['player1'].hand.length - 1;

      let s = (startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: c1.instanceId,
        targetId: enemyStudent.instanceId,
      }) as any).state;

      s = (respondDebate(s, {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: c2.instanceId,
        targetId: enemyStudent.instanceId,
      }) as any).state;

      // Resolução LIFO:
      // 1. Escudo Verbal concede Proteção a enemyStudent.
      // 2. Argumento Irrefutável tenta resolver: o alvo agora possui Proteção!
      // -> Efeito dependente falha (enemyStudent NÃO perde 2 de moral e permanece com 3).
      // -> Efeito independente resolve (player1 compra 1 carta normalmente).
      const result = resolveDebate(s);
      expect(result.success).toBe(true);

      if (result.success) {
        const resolved = result.state;
        const targetAfter = resolved.players['player2'].board.find((st) => st.instanceId === enemyStudent.instanceId);
        expect(targetAfter).toBeDefined();
        // Moral preservada em 3 (não tomou -2)
        expect(targetAfter?.currentMorale).toBe(3);
        // Proteção ativa
        expect(targetAfter?.statuses).toContain('KEYWORD_Proteção');

        // player1 comprou a carta
        expect(resolved.players['player1'].hand.length).toBe(initialHandP1 + 1);

        // Evento de fizzle emitido
        const fizzleEvt = result.events?.find((e) => e.type === GameEventType.DEBATE_ACTION_FIZZLED);
        expect(fizzleEvt).toBeDefined();
        expect((fizzleEvt as any).reason).toBe('TARGET_PROTECTED');
      }
    });
  });

  // ==========================================================================
  // 9. RESPEITO A CARTAS COM PROTEÇÃO (TARGETING VALIDATION)
  // ==========================================================================
  describe('9. Respeito a Cartas com Proteção', () => {
    it('alvos com Keyword.PROTECAO não podem ser alvejados na declaração de START_DEBATE', () => {
      // Estudante nativo com Proteção
      const protectedStudent = createCardInstance(ALPHA_STUDENT_PROTEGIDO, 'player2', 40, CardZone.BOARD);
      state.players['player2'].board.push(protectedStudent);

      const debateCard = createCardInstance(ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand.push(debateCard);

      const action: StartDebateAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
        targetId: protectedStudent.instanceId,
      };

      const val = validateStartDebate(state, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.PROTECTION_RESTRICTION);

      const result = applyAction(state, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.PROTECTION_RESTRICTION);
      }
    });

    it('alvos com Keyword.PROTECAO não podem ser alvejados na declaração de RESPOND_DEBATE', () => {
      // Estudante nativo com Proteção em player1
      const protectedStudent = createCardInstance(ALPHA_STUDENT_PROTEGIDO, 'player1', 41, CardZone.BOARD);
      state.players['player1'].board.push(protectedStudent);

      const c1 = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player1', 1, CardZone.HAND);
      const c2 = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 2, CardZone.HAND);
      state.players['player1'].hand.push(c1);
      state.players['player2'].hand.push(c2);

      const s1 = (startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: c1.instanceId,
      }) as any).state;

      const action: RespondDebateAction = {
        type: ActionType.RESPOND_DEBATE,
        playerId: 'player2',
        cardInstanceId: c2.instanceId,
        targetId: protectedStudent.instanceId,
      };

      const val = validateRespondDebate(s1, action);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.PROTECTION_RESTRICTION);

      const result = applyAction(s1, action);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.PROTECTION_RESTRICTION);
      }
    });
  });

  // ==========================================================================
  // 10. IMUTABILIDADE E DETERMINISMO
  // ==========================================================================
  describe('10. Imutabilidade e Determinismo', () => {
    it('todas as funções do sistema de debate preservam o estado original intacto', () => {
      const debateCard = createCardInstance(ALPHA_DEBATE_PEDIDO_DE_ORDEM, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand.push(debateCard);
      const originalHandLen = state.players['player1'].hand.length;
      const originalEnergy = state.players['player1'].energy;

      const action: StartDebateAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
      };

      const res = startDebate(state, action);
      expect(res.success).toBe(true);

      // state original NÃO foi modificado
      expect(state.debate.active).toBe(false);
      expect(state.players['player1'].hand.length).toBe(originalHandLen);
      expect(state.players['player1'].energy).toBe(originalEnergy);
    });

    it('utilitários auxiliares retornam valores determinísticos corretos', () => {
      expect(getDebateStepName(1)).toBe('INITIAL');
      expect(getDebateStepName(2)).toBe('REPLICA');
      expect(getDebateStepName(3)).toBe('TREPLICA');
      expect(getDebateStepName(4)).toBe('CONTRARREPLICA');
      expect(MAX_DEBATE_CHAIN_ACTIONS).toBe(4);
    });

    it('deve validar passDebate e validateResolveDebate corretamente', () => {
      const passAction: PassDebateAction = { type: ActionType.PASS_DEBATE, playerId: 'player1' };
      const valPass = validatePassDebate(state, passAction);
      expect(valPass.valid).toBe(true);

      const passRes = passDebate(state, passAction);
      expect(passRes.success).toBe(true);

      const valResolve = validateResolveDebate(state);
      expect(valResolve.valid).toBe(true);
    });

    it('deve aplicar Provocações Retóricas reduzindo a Influência temporariamente', () => {
      const student = createCardInstance(ALPHA_STUDENT_NOVATO, 'player2', 77, CardZone.BOARD);
      student.currentInfluence = 3;
      state.players['player2'].board.push(student);

      const card = createCardInstance(ALPHA_DEBATE_PROVOCACOES_RETORICAS, 'player1', 78, CardZone.HAND);
      state.players['player1'].hand.push(card);

      const r1 = startDebate(state, {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: card.instanceId,
        targetId: student.instanceId,
      });

      const res = resolveDebate((r1 as any).state);
      expect(res.success).toBe(true);
      if (res.success) {
        const target = res.state.players['player2'].board.find((s) => s.instanceId === student.instanceId);
        expect(target?.currentInfluence).toBe(1);
        expect(target?.statuses.some((s) => s.startsWith('TEMP_INFLUENCE_'))).toBe(true);
      }
    });
  });
});
