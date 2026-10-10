import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  GamePhase,
  ActionType,
  CardZone,
  CardDefinition,
  CardInstance,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_REBELDE,
  ALPHA_STUDENT_ATLETA_IMPULSO,
  createCardInstance,
  GameAction,
} from '../../src/core';
import { chooseBestAction } from '../../src/ai/decisionPolicy';
import { createRng } from '../../src/ai/aiPlayer';

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

describe('AI System — DecisionPolicy (src/ai/decisionPolicy.ts)', () => {
  describe('1. Decisões Táticas de Combate', () => {
    it('deve priorizar ataque letal direto ao Representante adversário (vitória imediata)', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.turn = 2; // Fora do T1 (Diplomacia inativa)
      state.players['player1'].diplomacyActive = false;

      // Oponente com apenas 1 de Moral
      state.players['player2'].representative.currentMorale = 1;

      // Player 1 possui um atacante pronto com 2 de Influence
      const attacker = createCustomStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 1);
      state.players['player1'].board = [attacker];

      // Oponente possui um estudante em campo
      const enemyStudent = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);
      state.players['player2'].board = [enemyStudent];

      const legalActions: GameAction[] = [
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: attacker.instanceId,
          targetId: enemyStudent.instanceId,
        },
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: attacker.instanceId,
          targetId: 'player2', // Letal no Representante!
        },
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player1',
        },
      ];

      const bestAction = chooseBestAction(state, legalActions, 'player1');
      expect(bestAction).toBeDefined();
      expect(bestAction?.type).toBe(ActionType.ATTACK);
      if (bestAction && bestAction.type === ActionType.ATTACK) {
        expect(bestAction.targetId).toBe('player2'); // Escolheu a vitória imediata!
      }
    });

    it('deve priorizar ataque com troca favorável (destruir inimigo) em vez de passar', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.turn = 2;
      state.players['player1'].diplomacyActive = false;

      // Rebelde: 3 Influence, 3 Moral
      const attacker = createCustomStudent(ALPHA_STUDENT_REBELDE, 'player1', 1);
      state.players['player1'].board = [attacker];

      // Novato inimigo: 1 Influence, 2 Moral (vai morrer, nosso Rebelde sobrevive)
      const enemy = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);
      state.players['player2'].board = [enemy];

      const legalActions: GameAction[] = [
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: attacker.instanceId,
          targetId: enemy.instanceId,
        },
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player1',
        },
      ];

      const bestAction = chooseBestAction(state, legalActions, 'player1');
      expect(bestAction?.type).toBe(ActionType.ATTACK);
    });

    it('deve escolher bloquear quando o oponente ataca o Representante', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.activePlayerId = 'player1';

      // Atacante de player 1 focado no Representante de player 2
      const attacker = createCustomStudent(ALPHA_STUDENT_REBELDE, 'player1', 1);
      state.players['player1'].board = [attacker];

      state.combat = {
        active: true,
        attacks: [
          {
            attackerInstanceId: attacker.instanceId,
            targetId: 'player2',
          },
        ],
      };

      // Player 2 tem um Novato disponível para bloquear
      const blocker = createCustomStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);
      state.players['player2'].board = [blocker];

      const blockAction: GameAction = {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: blocker.instanceId,
      };

      const bestAction = chooseBestAction(state, [blockAction], 'player2');
      expect(bestAction).toEqual(blockAction);
    });
  });

  describe('2. Decisões de Desenvolvimento (MAIN Phase)', () => {
    it('deve preferir jogar carta da mão a passar a fase sem gastar energia útil', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.players['player1'].energy = 2;
      state.players['player1'].board = [];

      const novato = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 1, CardZone.HAND);
      state.players['player1'].hand = [novato];

      const legalActions: GameAction[] = [
        {
          type: ActionType.PLAY_CARD,
          playerId: 'player1',
          cardInstanceId: novato.instanceId,
        },
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player1',
        },
      ];

      const bestAction = chooseBestAction(state, legalActions, 'player1');
      expect(bestAction?.type).toBe(ActionType.PLAY_CARD);
    });
  });

  describe('3. Determinismo e Semente PRNG', () => {
    it('deve desempater com consistência determinística quando configurado com rng', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;

      // Duas ações com pontuações idênticas
      const c1 = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 1, CardZone.HAND);
      const c2 = createCardInstance(ALPHA_STUDENT_NOVATO, 'player1', 2, CardZone.HAND);
      state.players['player1'].hand = [c1, c2];
      state.players['player1'].energy = 5;

      const actions: GameAction[] = [
        { type: ActionType.PLAY_CARD, playerId: 'player1', cardInstanceId: c1.instanceId },
        { type: ActionType.PLAY_CARD, playerId: 'player1', cardInstanceId: c2.instanceId },
      ];

      const rng1 = createRng(42);
      const rng2 = createRng(42);

      const choice1 = chooseBestAction(state, actions, 'player1', { rng: rng1 });
      const choice2 = chooseBestAction(state, actions, 'player1', { rng: rng2 });

      expect(choice1).toEqual(choice2);
    });
  });
});
