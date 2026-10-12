import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  GamePhase,
  GameStatus,
  ActionType,
  CardZone,
  CardDefinition,
  CardInstance,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_PROVOCADOR,
  ALPHA_STUDENT_ATLETA_IMPULSO,
  ALPHA_ENV_SALA_GREMIO,
  ALPHA_DEBATE_CONTRAPONTO,
  createCardInstance,
} from '../../src/core';
import { generateCandidateActions } from '../../src/ai/actionGenerator';

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

describe('AI System — ActionGenerator (src/ai/actionGenerator.ts)', () => {
  describe('1. Validações de Estado Global', () => {
    it('deve retornar lista vazia se a partida estiver encerrada (FINISHED)', () => {
      const state = createInitialGameState();
      state.status = GameStatus.FINISHED;
      state.winnerId = 'player1';

      const actions = generateCandidateActions(state, 'player1');
      expect(actions).toEqual([]);
    });

    it('deve retornar lista vazia se o playerId não existir no estado', () => {
      const state = createInitialGameState();
      const actions = generateCandidateActions(state, 'non_existent_player');
      expect(actions).toEqual([]);
    });
  });

  describe('2. Geração na START Phase', () => {
    it('deve gerar ADVANCE_PHASE para o jogador ativo', () => {
      const state = createInitialGameState();
      expect(state.phase).toBe(GamePhase.START);
      expect(state.activePlayerId).toBe('player1');

      const actions = generateCandidateActions(state, 'player1');
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe(ActionType.ADVANCE_PHASE);
      expect(actions[0].playerId).toBe('player1');
    });

    it('não deve gerar ações para o jogador inativo na START Phase', () => {
      const state = createInitialGameState();
      const actions = generateCandidateActions(state, 'player2');
      expect(actions).toEqual([]);
    });
  });

  describe('3. Geração na MAIN Phase', () => {
    it('deve gerar PLAY_CARD para estudantes e ambientes na mão, mais ADVANCE_PHASE', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;

      const p1 = state.players['player1'];
      p1.hand = [
        createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 1, CardZone.HAND),
        createCardInstance(ALPHA_ENV_SALA_GREMIO, 'player1', 2, CardZone.HAND),
      ];

      const actions = generateCandidateActions(state, 'player1');
      const playCardActions = actions.filter((a) => a.type === ActionType.PLAY_CARD);
      const advanceActions = actions.filter((a) => a.type === ActionType.ADVANCE_PHASE);

      expect(playCardActions).toHaveLength(2);
      expect(advanceActions).toHaveLength(1);
    });

    it('deve gerar ações de substituição quando o campo possuir 6 Estudantes', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;

      const p1 = state.players['player1'];
      p1.board = [
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1),
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 2),
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 3),
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 4),
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 5),
        createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 6),
      ];

      p1.hand = [
        createCardInstance(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 10, CardZone.HAND),
      ];

      const actions = generateCandidateActions(state, 'player1');
      const playCardActions = actions.filter((a) => a.type === ActionType.PLAY_CARD);

      // Deve gerar 1 ação de substituição para cada um dos 6 estudantes no board
      expect(playCardActions).toHaveLength(6);
      for (const a of playCardActions) {
        if ('replaceCardInstanceId' in a) {
          expect(a.replaceCardInstanceId).toBeDefined();
          expect(p1.board.some((s) => s.instanceId === a.replaceCardInstanceId)).toBe(true);
        }
      }
    });
  });

  describe('4. Geração na DEBATE Phase', () => {
    it('quando o debate estiver inativo, deve gerar START_DEBATE para cartas de debate e PASS_DEBATE', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.DEBATE;
      state.debate.active = false;

      const p1 = state.players['player1'];
      p1.hand = [
        createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 1, CardZone.HAND),
      ];

      const actions = generateCandidateActions(state, 'player1');
      const startDebateActions = actions.filter((a) => a.type === ActionType.START_DEBATE);
      const passDebateActions = actions.filter((a) => a.type === ActionType.PASS_DEBATE);

      expect(startDebateActions.length).toBeGreaterThan(0);
      expect(passDebateActions.length).toBeGreaterThan(0);
    });

    it('quando o debate estiver ativo, deve gerar RESPOND_DEBATE para o jogador com prioridade', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.DEBATE;
      state.debate = {
        active: true,
        initiatorPlayerId: 'player1',
        currentStep: 1, // Passo 1 (Ação Inicial) -> Próximo a responder é player2 (Réplica)
        actions: [],
      };

      const p2 = state.players['player2'];
      p2.hand = [
        createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player2', 1, CardZone.HAND),
      ];

      // player2 tem prioridade
      const p2Actions = generateCandidateActions(state, 'player2');
      const respondActions = p2Actions.filter((a) => a.type === ActionType.RESPOND_DEBATE);
      expect(respondActions.length).toBeGreaterThan(0);

      // player1 NÃO tem prioridade no passo 1
      const p1Actions = generateCandidateActions(state, 'player1');
      expect(p1Actions).toEqual([]);
    });
  });

  describe('5. Geração na COMBAT Phase', () => {
    it('para o jogador atacante, deve gerar ATTACK para estudantes disponíveis contra oponente', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;

      const p1 = state.players['player1'];
      const p2 = state.players['player2'];

      const attacker = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      p1.board = [attacker];

      const enemyStudent = createCustomStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 2);
      p2.board = [enemyStudent];

      const actions = generateCandidateActions(state, 'player1');
      const attackActions = actions.filter((a) => a.type === ActionType.ATTACK);
      const advanceActions = actions.filter(
        (a) => a.type === ActionType.ADVANCE_PHASE || a.type === ActionType.RESOLVE_COMBAT
      );

      // Conforme Seção 29: O ataque é focado automaticamente no Representante (ou Provocador)
      expect(attackActions.length).toBe(1);
      expect(advanceActions.length).toBeGreaterThan(0);
    });

    it('para o jogador defensor, deve gerar BLOCK para ataques declarados sem bloqueador', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.activePlayerId = 'player1';

      const p2 = state.players['player2'];
      const blocker = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      p2.board = [blocker];

      state.combat = {
        active: true,
        attacks: [
          {
            attackerInstanceId: 'player1_attacker_1',
            targetId: 'player2',
          },
        ],
      };

      const actions = generateCandidateActions(state, 'player2');
      const blockActions = actions.filter((a) => a.type === ActionType.BLOCK);

      expect(blockActions).toHaveLength(1);
      if (blockActions[0].type === ActionType.BLOCK) {
        expect(blockActions[0].blockerInstanceId).toBe(blocker.instanceId);
        expect(blockActions[0].attackerInstanceId).toBe('player1_attacker_1');
      }
    });
  });

  describe('6. Geração na END Phase', () => {
    it('deve gerar ADVANCE_PHASE para o jogador ativo', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.END;
      state.activePlayerId = 'player1';

      const actions = generateCandidateActions(state, 'player1');
      expect(actions.some((a) => a.type === ActionType.ADVANCE_PHASE)).toBe(true);
    });

    it('deve gerar DISCARD_CARDS se a mão possuir mais de 8 cartas', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.END;
      state.activePlayerId = 'player1';

      const p1 = state.players['player1'];
      p1.hand = Array.from({ length: 10 }, (_, i) =>
        createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', i + 1, CardZone.HAND)
      );

      const actions = generateCandidateActions(state, 'player1');
      const discardActions = actions.filter((a) => a.type === ActionType.DISCARD_CARDS);
      expect(discardActions).toHaveLength(1);
    });
  });
});
