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
  ALPHA_STUDENT_PROTEGIDO,
  ALPHA_STUDENT_ELITE,
  ALPHA_DEBATE_CONTRAPONTO,
  createCardInstance,
  GameAction,
} from '../../src/core';
import { filterLegalActions, isActionLegal } from '../../src/ai/legalActionFilter';

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

describe('AI System — LegalActionFilter (src/ai/legalActionFilter.ts)', () => {
  describe('1. Filtragem Global e Deduplicação', () => {
    it('deve rejeitar qualquer ação se a partida estiver terminada (FINISHED)', () => {
      const state = createInitialGameState();
      state.status = GameStatus.FINISHED;

      const actions: GameAction[] = [
        { type: ActionType.ADVANCE_PHASE, playerId: 'player1' },
      ];

      expect(isActionLegal(state, actions[0])).toBe(false);
      expect(filterLegalActions(state, actions)).toEqual([]);
    });

    it('deve deduplicar ações candidatas idênticas', () => {
      const state = createInitialGameState();
      expect(state.phase).toBe(GamePhase.START);

      const actions: GameAction[] = [
        { type: ActionType.ADVANCE_PHASE, playerId: 'player1' },
        { type: ActionType.ADVANCE_PHASE, playerId: 'player1' },
      ];

      const legal = filterLegalActions(state, actions);
      expect(legal).toHaveLength(1);
    });
  });

  describe('2. Validação de Custos e Zonas (MAIN Phase)', () => {
    it('deve filtrar cartas cujo custo de Energia exceda a energia atual do jogador', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.players['player1'].energy = 1;

      // Estudante Elite custa 8 Energia
      const elite = createCardInstance(ALPHA_STUDENT_ELITE, 'player1', 1, CardZone.HAND);
      // Novato custa 1 Energia
      const novato = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 2, CardZone.HAND);
      state.players['player1'].hand = [elite, novato];

      const actions: GameAction[] = [
        { type: ActionType.PLAY_CARD, playerId: 'player1', cardInstanceId: elite.instanceId },
        { type: ActionType.PLAY_CARD, playerId: 'player1', cardInstanceId: novato.instanceId },
      ];

      const legal = filterLegalActions(state, actions);
      expect(legal).toHaveLength(1);
      expect(legal[0]).toEqual(actions[1]); // Apenas o Novato é legal
    });

    it('deve rejeitar avanço de fase solicitado por jogador inativo na MAIN phase', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.activePlayerId = 'player1';

      const action: GameAction = {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player2',
      };

      expect(isActionLegal(state, action)).toBe(false);
      expect(filterLegalActions(state, [action])).toEqual([]);
    });

    it('deve aceitar ADVANCE_PHASE do defensor em COMBAT quando attackersDeclared = true', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.activePlayerId = 'player1';
      state.combat = {
        active: true,
        attackersDeclared: true,
        attacks: [
          {
            attackerInstanceId: 'atk_1',
            targetId: 'player2',
          },
        ],
      };

      const defenderAdvance: GameAction = {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player2',
      };
      const attackerAdvance: GameAction = {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      };

      expect(isActionLegal(state, defenderAdvance)).toBe(true);
      expect(filterLegalActions(state, [defenderAdvance])).toEqual([defenderAdvance]);

      // O atacante NÃO pode avançar novamente enquanto aguarda o defensor
      expect(isActionLegal(state, attackerAdvance)).toBe(false);
      expect(filterLegalActions(state, [attackerAdvance])).toEqual([]);
    });
  });

  describe('3. Regras de Combate (COMBAT Phase)', () => {
    it('deve rejeitar ataque direto ao Representante no Turno 1 devido à Diplomacia', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.turn = 1;
      state.players['player1'].diplomacyActive = true;

      const attacker = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board = [attacker];

      const action: GameAction = {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      };

      expect(isActionLegal(state, action)).toBe(false);
      expect(filterLegalActions(state, [action])).toEqual([]);
    });

    it('deve rejeitar ataque que ignora Provocação adversária quando atacante não tem Infiltração', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.players['player1'].diplomacyActive = false; // Fora do T1

      const attacker = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board = [attacker];

      const provocador = createCustomStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 2);
      const outroEstudante = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player2', 3);
      state.players['player2'].board = [provocador, outroEstudante];

      // Ataque ao Representante: Ilegal porque tem Provocador
      const attackRep: GameAction = {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      };
      // Ataque a outro estudante: Ilegal porque tem Provocador
      const attackOutro: GameAction = {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: outroEstudante.instanceId,
      };
      // Ataque ao Provocador: Legal
      const attackProvocador: GameAction = {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: provocador.instanceId,
      };

      const legal = filterLegalActions(state, [attackRep, attackOutro, attackProvocador]);
      expect(legal).toHaveLength(1);
      expect(legal[0]).toEqual(attackProvocador);
    });

    it('deve rejeitar ataque de Estudante com Inércia (hasInertia = true)', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.players['player1'].diplomacyActive = false;

      const attacker = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player1', 1, {
        hasInertia: true,
      });
      state.players['player1'].board = [attacker];

      const action: GameAction = {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      };

      expect(isActionLegal(state, action)).toBe(false);
      expect(filterLegalActions(state, [action])).toEqual([]);
    });

    it('deve rejeitar BLOQUEIO declarado pelo jogador atacante', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.activePlayerId = 'player1';

      const action: GameAction = {
        type: ActionType.BLOCK,
        playerId: 'player1', // Atacante tenta bloquear
        attackerInstanceId: 'some_attacker',
        blockerInstanceId: 'some_blocker',
      };

      expect(isActionLegal(state, action)).toBe(false);
    });
  });

  describe('4. Regras de Debate e Proteção (DEBATE Phase)', () => {
    it('deve rejeitar ação de Debate direcionada a Estudante com Proteção', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.DEBATE;
      state.players['player1'].energy = 5;

      const debateCard = createCardInstance(ALPHA_DEBATE_CONTRAPONTO, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand = [debateCard];

      const protegido = createCustomStudent(ALPHA_STUDENT_PROTEGIDO, 'player2', 2);
      state.players['player2'].board = [protegido];

      const action: GameAction = {
        type: ActionType.START_DEBATE,
        playerId: 'player1',
        cardInstanceId: debateCard.instanceId,
        targetId: protegido.instanceId,
      };

      expect(isActionLegal(state, action)).toBe(false);
      expect(filterLegalActions(state, [action])).toEqual([]);
    });
  });
});
