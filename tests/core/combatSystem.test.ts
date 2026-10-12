import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  GamePhase,
  GameStatus,
  CardZone,
  ActionType,
  ActionErrorCode,
  Keyword,
  CardInstance,
  CardDefinition,
  GameState,
  applyAction,
  validateAttack,
  declareAttack,
  validateBlock,
  declareBlock,
  resolveCombat,
  executeDirectCombat,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_ATLETA_IMPULSO,
  ALPHA_STUDENT_REBELDE,
  ALPHA_STUDENT_PROVOCADOR,
  ALPHA_STUDENT_GUARDA,
  ALPHA_STUDENT_INFILTRADOR,
  ALPHA_STUDENT_INFILTRADOR_IMPULSO,
} from '../../src/core';

/**
 * Cria uma CardInstance auxiliar pronta para combate no campo
 */
function createTestStudent(
  definition: CardDefinition,
  ownerId: string,
  instanceIndex: number,
  overrides?: Partial<CardInstance>
): CardInstance {
  return {
    instanceId: `${ownerId}_${definition.id}_${instanceIndex}`,
    definitionId: definition.id,
    ownerId,
    controllerId: ownerId,
    zone: CardZone.BOARD,
    currentInfluence: definition.influence ?? 1,
    currentMorale: definition.morale ?? 2,
    maxMorale: definition.maxMorale ?? definition.morale ?? 2,
    ready: true,
    hasInertia: false,
    statuses: [],
    ...overrides,
  };
}

/**
 * Monta um estado com GamePhase.COMBAT para facilitar os testes
 */
function createCombatReadyState(): GameState {
  const state = createInitialGameState();
  state.phase = GamePhase.COMBAT;
  return state;
}

describe('Core Engine — Combat System (combatSystem.ts & gameEngine.ts)', () => {
  describe('1. Validações Básicas de Declaração de Ataque', () => {
    it('deve rejeitar ataque se a partida já estiver finalizada (GAME_OVER)', () => {
      const state = createCombatReadyState();
      state.status = GameStatus.FINISHED;
      const student = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(student);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: student.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.GAME_OVER);
      }
    });

    it('deve rejeitar ataque fora da Combat Phase (INVALID_PHASE)', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      const student = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(student);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: student.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_PHASE);
      }
    });

    it('deve rejeitar ataque declarado pelo jogador inativo (INVALID_PLAYER)', () => {
      const state = createCombatReadyState();
      const student = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      state.players['player2'].board.push(student);

      // player2 tenta atacar durante o turno de player1
      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player2',
        attackerInstanceId: student.instanceId,
        targetId: 'player1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });

    it('deve rejeitar ataque se o atacante não estiver no campo do jogador ativo (CARD_NOT_IN_BOARD)', () => {
      const state = createCombatReadyState();

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: 'inexistent_card',
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.CARD_NOT_IN_BOARD);
      }
    });

    it('deve rejeitar ataque contra alvos inválidos (INVALID_TARGET)', () => {
      const state = createCombatReadyState();
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      // Tentativa de atacar a si próprio ou carta inexistente
      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: attacker.instanceId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_TARGET);
      }
    });

    it('deve rejeitar ataque de Estudante sob Silêncio (INVALID_ATTACK)', () => {
      const state = createCombatReadyState();
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1, {
        statuses: [Keyword.SILENCIO],
      });
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_ATTACK);
      }
    });
  });

  describe('2. Inércia, Impulso e Prontidão de Ataque', () => {
    it('deve rejeitar ataque de Estudante com Inércia que não possua Impulso (INERTIA_RESTRICTION)', () => {
      const state = createCombatReadyState();
      // Estudante que acabou de entrar com hasInertia = true e ready = false
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1, {
        hasInertia: true,
        ready: false,
      });
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INERTIA_RESTRICTION);
      }
    });

    it('deve permitir ataque de Estudante no turno de entrada caso possua IMPULSO', () => {
      const state = createCombatReadyState();
      // Desativa diplomacia para focar no teste de Impulso
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 1, {
        hasInertia: false,
        ready: true,
      });
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.combat.attacks).toHaveLength(1);
        expect(result.state.combat.attacks[0].attackerInstanceId).toBe(attacker.instanceId);
        // Atacante foi esgotado (ready = false)
        const updatedAttacker = result.state.players['player1'].board.find(
          (s) => s.instanceId === attacker.instanceId
        );
        expect(updatedAttacker?.ready).toBe(false);
      }
    });

    it('deve impedir que o mesmo Estudante ataque mais de uma vez no mesmo turno (INVALID_ATTACK)', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1, {
        ready: true,
        hasInertia: false,
      });
      state.players['player1'].board.push(attacker);

      // Primeiro ataque
      const res1 = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      expect(res1.success).toBe(true);
      if (!res1.success) return;

      // Segundo ataque com o mesmo atacante já declarado/esgotado
      const res2 = declareAttack(res1.state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(res2.success).toBe(false);
      if (!res2.success) {
        expect(res2.error.code).toBe(ActionErrorCode.INVALID_ATTACK);
      }
    });
  });

  describe('3. Regra de Diplomacia no Turno 1', () => {
    it('deve proibir ataque direto ao Representante no Turno 1 (DIPLOMACY_RESTRICTION)', () => {
      const state = createCombatReadyState();
      state.turn = 1;
      state.players['player1'].diplomacyActive = true;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.DIPLOMACY_RESTRICTION);
      }
    });

    it('IMPULSO NÃO ignora a restrição de Diplomacia contra o Representante', () => {
      const state = createCombatReadyState();
      state.turn = 1;
      state.players['player1'].diplomacyActive = true;

      const attacker = createTestStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.DIPLOMACY_RESTRICTION);
      }
    });

    it('INFILTRACAO NÃO ignora a restrição de Diplomacia contra o Representante', () => {
      const state = createCombatReadyState();
      state.turn = 1;
      state.players['player1'].diplomacyActive = true;

      const attacker = createTestStudent(ALPHA_STUDENT_INFILTRADOR_IMPULSO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.DIPLOMACY_RESTRICTION);
      }
    });

    it('proíbe atacar diretamente um Estudante adversário sem Provocação (INVALID_TARGET)', () => {
      const state = createCombatReadyState();
      state.turn = 1;
      state.players['player1'].diplomacyActive = true;

      const attacker = createTestStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const target = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      state.players['player2'].board.push(target);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: target.instanceId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_TARGET);
      }
    });

    it('redireciona ataque para Estudante adversário caso possua Provocação', () => {
      const state = createCombatReadyState();
      state.turn = 1;
      state.players['player1'].diplomacyActive = true;

      const attacker = createTestStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const target = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);
      state.players['player2'].board.push(target);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.combat.attacks).toHaveLength(1);
        expect(result.state.combat.attacks[0].targetId).toBe(target.instanceId);
      }
    });

    it('declaração de ataque sem targetId especificado direciona automaticamente ao Representante adversário', () => {
      const state = createCombatReadyState();
      state.turn = 2;
      state.players['player1'].diplomacyActive = false;
      state.players['player1'].turnCount = 2;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.combat.attacks[0].targetId).toBe('rep_akira');
      }
    });

    it('permite ataque direto ao Representante após expiração da Diplomacia (Turno >= 2)', () => {
      const state = createCombatReadyState();
      state.turn = 2;
      state.players['player1'].diplomacyActive = false;
      state.players['player1'].turnCount = 2;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.combat.attacks[0].targetId).toBe('player2');
      }
    });
  });

  describe('4. Interação entre Provocação e Infiltração', () => {
    it('deve proibir ataque direto ao Representante se houver Estudante com PROVOCACAO (INVALID_TARGET)', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      // Defensor possui um Estudante com Provocação
      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);
      state.players['player2'].board.push(provocador);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_TARGET);
      }
    });

    it('permite atacar o próprio Estudante com Provocação', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);
      state.players['player2'].board.push(provocador);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: provocador.instanceId,
      });

      expect(result.success).toBe(true);
    });

    it('deve proibir ataque a outro Estudante sem Provocação quando houver Estudante com PROVOCACAO em campo (INVALID_TARGET)', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);
      const outroEstudante = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);
      state.players['player2'].board.push(provocador, outroEstudante);

      // Tenta atacar outro estudante sem Provocação
      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: outroEstudante.instanceId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_TARGET);
      }
    });

    it('permite que Estudante com INFILTRACAO ignore Provocação e ataque o Representante diretamente', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const infiltrador = createTestStudent(ALPHA_STUDENT_INFILTRADOR, 'player1', 1);
      state.players['player1'].board.push(infiltrador);

      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);
      state.players['player2'].board.push(provocador);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: infiltrador.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.combat.attacks[0].targetId).toBe('player2');
      }
    });

    it('Estudante com INFILTRACAO não pode escolher atacar Estudante sem Provocação (todo ataque foca o Representante)', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const infiltrador = createTestStudent(ALPHA_STUDENT_INFILTRADOR, 'player1', 1);
      state.players['player1'].board.push(infiltrador);

      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);
      const outroEstudante = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);
      state.players['player2'].board.push(provocador, outroEstudante);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: infiltrador.instanceId,
        targetId: outroEstudante.instanceId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ActionErrorCode.INVALID_TARGET);
      }
    });
  });

  describe('5. Declaração de Bloqueio, Bloqueio Livre e Teto Alpha', () => {
    it('deve rejeitar bloqueio declarado pelo jogador ativo (INVALID_PLAYER)', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);
      const target = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      state.players['player2'].board.push(target);

      const atkRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;

      // player1 (ativo) tenta bloquear a si mesmo
      const blockRes = declareBlock(atkRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: target.instanceId,
      });

      expect(blockRes.success).toBe(false);
      if (!blockRes.success) {
        expect(blockRes.error.code).toBe(ActionErrorCode.INVALID_PLAYER);
      }
    });

    it('Bloqueio Livre: estudante SEM Guarda consegue bloquear ataque direcionado ao Representante com sucesso', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const studentNormal = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      state.players['player2'].board.push(studentNormal);

      const atkRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;

      // Estudante normal sem Guarda consegue bloquear com sucesso (Bloqueio Livre)
      const blockRes = declareBlock(atkRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: studentNormal.instanceId,
      });

      expect(blockRes.success).toBe(true);
      if (blockRes.success) {
        expect(blockRes.state.combat.attacks[0].blockerInstanceId).toBe(studentNormal.instanceId);
      }
    });

    it('Bloqueio Livre: estudante COM Guarda também consegue bloquear ataque com sucesso', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const guardaStudent = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 1);
      state.players['player2'].board.push(guardaStudent);

      const atkRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;

      const blockRes = declareBlock(atkRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: guardaStudent.instanceId,
      });

      expect(blockRes.success).toBe(true);
      if (blockRes.success) {
        expect(blockRes.state.combat.attacks[0].blockerInstanceId).toBe(
          guardaStudent.instanceId
        );
      }
    });

    it('Estudante com INFILTRACAO atacando Representante não pode ser bloqueado por nenhum estudante, nem mesmo com Guarda', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const infiltrador = createTestStudent(ALPHA_STUDENT_INFILTRADOR, 'player1', 1);
      state.players['player1'].board.push(infiltrador);

      const guardaStudent = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 1);
      const studentNormal = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);
      state.players['player2'].board.push(guardaStudent, studentNormal);

      const atkRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: infiltrador.instanceId,
        targetId: 'player2',
      });
      expect(atkRes.success).toBe(true);
      if (!atkRes.success) return;

      // Tentativa de bloqueio por estudante com Guarda
      const blockGuarda = declareBlock(atkRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: infiltrador.instanceId,
        blockerInstanceId: guardaStudent.instanceId,
      });

      expect(blockGuarda.success).toBe(false);
      if (!blockGuarda.success) {
        expect(blockGuarda.error.code).toBe(ActionErrorCode.INVALID_BLOCK);
      }

      // Tentativa de bloqueio por estudante comum sem Guarda
      const blockNormal = declareBlock(atkRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: infiltrador.instanceId,
        blockerInstanceId: studentNormal.instanceId,
      });

      expect(blockNormal.success).toBe(false);
      if (!blockNormal.success) {
        expect(blockNormal.error.code).toBe(ActionErrorCode.INVALID_BLOCK);
      }
    });

    it('Teto Alpha: rejeita mais de 1 bloqueador por atacante', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const guarda1 = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 1);
      const guarda2 = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 2);
      state.players['player2'].board.push(guarda1, guarda2);

      const atkRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      if (!atkRes.success) return;

      const block1 = declareBlock(atkRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: guarda1.instanceId,
      });
      expect(block1.success).toBe(true);
      if (!block1.success) return;

      // Tentativa de segundo bloqueador no mesmo atacante
      const block2 = declareBlock(block1.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: guarda2.instanceId,
      });

      expect(block2.success).toBe(false);
      if (!block2.success) {
        expect(block2.error.code).toBe(ActionErrorCode.INVALID_BLOCK);
      }
    });

    it('Teto Alpha: o mesmo bloqueador não pode bloquear mais de 1 atacante', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker1 = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      const attacker2 = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 2);
      state.players['player1'].board.push(attacker1, attacker2);

      const guarda = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 1);
      state.players['player2'].board.push(guarda);

      // Declara dois ataques
      const atk1 = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker1.instanceId,
        targetId: 'player2',
      });
      expect(atk1.success).toBe(true);
      if (!atk1.success) return;

      const atk2 = declareAttack(atk1.state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker2.instanceId,
        targetId: 'player2',
      });
      expect(atk2.success).toBe(true);
      if (!atk2.success) return;

      const s = atk2.state;

      // Guarda bloqueia o primeiro
      const block1 = declareBlock(s, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker1.instanceId,
        blockerInstanceId: guarda.instanceId,
      });
      expect(block1.success).toBe(true);
      if (!block1.success) return;

      // Guarda tenta bloquear também o segundo atacante
      const block2 = declareBlock(block1.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker2.instanceId,
        blockerInstanceId: guarda.instanceId,
      });

      expect(block2.success).toBe(false);
      if (!block2.success) {
        expect(block2.error.code).toBe(ActionErrorCode.INVALID_BLOCK);
      }
    });
  });

  describe('6. Cálculo Normativo de Dano e Resolução de Combate', () => {
    it('Caso 1 — Estudante vs Estudante (Bloqueado): Dano mútuo simultâneo', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      // Atacante: 2 Influence, 3 Moral
      const attacker = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player1', 1, {
        currentInfluence: 2,
        currentMorale: 3,
      });
      state.players['player1'].board.push(attacker);

      // Bloqueador: 1 Influence, 4 Moral
      const blocker = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 1, {
        currentInfluence: 1,
        currentMorale: 4,
      });
      state.players['player2'].board.push(blocker);

      const result = executeDirectCombat(
        state,
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: attacker.instanceId,
          targetId: 'player2',
        },
        blocker.instanceId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const p1Attacker = result.state.players['player1'].board.find(
          (s) => s.instanceId === attacker.instanceId
        );
        const p2Blocker = result.state.players['player2'].board.find(
          (s) => s.instanceId === blocker.instanceId
        );

        // Atacante sofreu 1 de dano: 3 - 1 = 2
        expect(p1Attacker?.currentMorale).toBe(2);
        // Bloqueador sofreu 2 de dano: 4 - 2 = 2
        expect(p2Blocker?.currentMorale).toBe(2);
        // Representante do defensor não sofreu dano
        expect(result.state.players['player2'].representative.currentMorale).toBe(20);
      }
    });

    it('Caso 2 — Ataque Não Bloqueado a Estudante: Atacante aplica dano sem sofrer retorno', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      // Atacante: 3 Influence, 3 Moral
      const attacker = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 1, {
        currentInfluence: 3,
        currentMorale: 3,
      });
      state.players['player1'].board.push(attacker);

      // Alvo com Provocação: 2 Influence, 4 Moral
      const target = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1, {
        currentInfluence: 2,
        currentMorale: 4,
      });
      state.players['player2'].board.push(target);

      // Ataque sem bloqueador
      const result = executeDirectCombat(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: target.instanceId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const p1Attacker = result.state.players['player1'].board.find(
          (s) => s.instanceId === attacker.instanceId
        );
        const p2Target = result.state.players['player2'].board.find(
          (s) => s.instanceId === target.instanceId
        );

        // Atacante não sofre dano de volta
        expect(p1Attacker?.currentMorale).toBe(3);
        // Alvo sofre 3 de dano: 4 - 3 = 1
        expect(p2Target?.currentMorale).toBe(1);
      }
    });

    it('Caso 3 — Ataque Não Bloqueado a Representante: Atacante aplica dano diretamente', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      // Atacante: 3 Influence, 3 Moral
      const attacker = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 1, {
        currentInfluence: 3,
        currentMorale: 3,
      });
      state.players['player1'].board.push(attacker);

      const result = executeDirectCombat(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const p1Attacker = result.state.players['player1'].board.find(
          (s) => s.instanceId === attacker.instanceId
        );
        // Atacante não sofre dano
        expect(p1Attacker?.currentMorale).toBe(3);
        // Representante do defensor sofre 3 de dano: 20 - 3 = 17
        expect(result.state.players['player2'].representative.currentMorale).toBe(17);
      }
    });

    it('Derrota de Estudante: Unidade com Moral <= 0 é movida para DISCARD', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      // Atacante com 3 Influence
      const attacker = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 1, {
        currentInfluence: 3,
        currentMorale: 3,
      });
      state.players['player1'].board.push(attacker);

      // Alvo com Provocação e 2 Moral (sofrerá 3 de dano e será derrotado)
      const target = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1, {
        currentInfluence: 1,
        currentMorale: 2,
      });
      state.players['player2'].board.push(target);

      const result = executeDirectCombat(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: target.instanceId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Alvo deve ter saído do campo
        const onBoard = result.state.players['player2'].board.find(
          (s) => s.instanceId === target.instanceId
        );
        expect(onBoard).toBeUndefined();

        // Alvo deve estar na pilha de descarte
        const inDiscard = result.state.players['player2'].discard.find(
          (s) => s.instanceId === target.instanceId
        );
        expect(inDiscard).toBeDefined();
        expect(inDiscard?.zone).toBe(CardZone.DISCARD);
      }
    });

    it('Derrota mútua simultânea: Ambos os Estudantes caem para <= 0 e vão para DISCARD', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      // Atacante: 2 Influence, 2 Moral
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1, {
        currentInfluence: 2,
        currentMorale: 2,
      });
      state.players['player1'].board.push(attacker);

      // Bloqueador: 2 Influence, 2 Moral
      const blocker = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1, {
        currentInfluence: 2,
        currentMorale: 2,
      });
      state.players['player2'].board.push(blocker);

      const result = executeDirectCombat(
        state,
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: attacker.instanceId,
          targetId: blocker.instanceId,
        },
        blocker.instanceId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.players['player1'].board).toHaveLength(0);
        expect(result.state.players['player2'].board).toHaveLength(0);

        expect(result.state.players['player1'].discard).toHaveLength(1);
        expect(result.state.players['player2'].discard).toHaveLength(1);
      }
    });

    it('Fim de jogo imediato quando Moral do Representante atinge 0 ou menos', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      // Reduz Moral do Representante do player2 para 2
      state.players['player2'].representative.currentMorale = 2;

      // Atacante com 3 de Influência
      const attacker = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 1, {
        currentInfluence: 3,
        currentMorale: 3,
      });
      state.players['player1'].board.push(attacker);

      const result = executeDirectCombat(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.players['player2'].representative.currentMorale).toBe(-1);
        expect(result.state.status).toBe(GameStatus.FINISHED);
        expect(result.state.winnerId).toBe('player1');
      }
    });
  });

  describe('7. Integração com gameEngine (applyAction) e Gatilhos', () => {
    it('deve processar o ciclo completo ATTACK -> BLOCK -> RESOLVE_COMBAT via applyAction', () => {
      let state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 1, {
        currentInfluence: 3,
        currentMorale: 3,
      });
      state.players['player1'].board.push(attacker);

      const blocker = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 1, {
        currentInfluence: 1,
        currentMorale: 4,
      });
      state.players['player2'].board.push(blocker);

      // 1. Jogador 1 declara ataque
      let res = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;
      expect(state.combat.active).toBe(true);

      // 2. Jogador 2 declara bloqueio
      res = applyAction(state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: blocker.instanceId,
      });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;
      expect(state.combat.attacks[0].blockerInstanceId).toBe(blocker.instanceId);

      // 3. Resolução do combate
      res = applyAction(state, {
        type: ActionType.RESOLVE_COMBAT,
        playerId: 'player1',
      });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;

      // Validação do estado final
      expect(state.combat.active).toBe(false);
      expect(state.combat.attacks).toHaveLength(0);
      const updatedAttacker = state.players['player1'].board.find(
        (s) => s.instanceId === attacker.instanceId
      );
      const updatedBlocker = state.players['player2'].board.find(
        (s) => s.instanceId === blocker.instanceId
      );
      expect(updatedAttacker?.currentMorale).toBe(2);
      expect(updatedBlocker?.currentMorale).toBe(1);
    });

    it('deve auto-resolver combates pendentes ao avançar de COMBAT para END', () => {
      let state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 1, {
        currentInfluence: 3,
        currentMorale: 3,
      });
      state.players['player1'].board.push(attacker);

      // Declara ataque não bloqueado
      let res = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;

      // Avança a fase para END diretamente sem chamar RESOLVE_COMBAT explicitamente
      res = applyAction(state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });
      expect(res.success).toBe(true);
      if (!res.success) return;
      state = res.state;

      expect(state.phase).toBe(GamePhase.END);
      expect(state.players['player2'].representative.currentMorale).toBe(17);
      expect(state.combat.active).toBe(false);
    });

    it('deve disparar ganho de Popularidade para Daichi ao declarar ataque', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;
      // Garante que o Representante é Daichi
      expect(state.players['player1'].representative.name).toBe('Daichi');
      expect(state.players['player1'].representative.popularity).toBe(0);

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const result = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.players['player1'].representative.popularity).toBe(1);
      }
    });
  });

  describe('8. Testes Diretos de Funções Puras (validateAttack, validateBlock, resolveCombat)', () => {
    it('validateAttack deve retornar details estruturados para ataque válido', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const val = validateAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(val.valid).toBe(true);
      if (val.valid) {
        expect(val.details.isRepresentativeTarget).toBe(true);
        expect(val.details.attacker.instanceId).toBe(attacker.instanceId);
      }
    });

    it('validateBlock deve retornar details estruturados para bloqueio válido', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const target = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      state.players['player2'].board.push(target);

      state.combat.attacks.push({
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      const val = validateBlock(state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: target.instanceId,
      });

      expect(val.valid).toBe(true);
      if (val.valid) {
        expect(val.details.blocker.instanceId).toBe(target.instanceId);
      }
    });

    it('validateBlock deve validar com sucesso estudante sem Guarda bloqueando ataque direcionado ao Representante', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const blockerSemGuarda = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      state.players['player2'].board.push(blockerSemGuarda);

      state.combat.attacks.push({
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      const val = validateBlock(state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: attacker.instanceId,
        blockerInstanceId: blockerSemGuarda.instanceId,
      });

      expect(val.valid).toBe(true);
      if (val.valid) {
        expect(val.details.blocker.instanceId).toBe(blockerSemGuarda.instanceId);
      }
    });

    it('resolveCombat pura deve retornar sucesso sem mutar estado original', () => {
      const state = createCombatReadyState();
      state.players['player1'].diplomacyActive = false;

      const attacker = createTestStudent(ALPHA_STUDENT_REBELDE, 'player1', 1);
      state.players['player1'].board.push(attacker);

      state.combat.attacks.push({
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      state.combat.active = true;

      const result = resolveCombat(state);
      expect(result.success).toBe(true);
      if (result.success) {
        // Estado retornado reflete dano
        expect(result.state.players['player2'].representative.currentMorale).toBe(17);
        // Estado original não foi modificado (Imutabilidade Estrita)
        expect(state.players['player2'].representative.currentMorale).toBe(20);
        expect(state.combat.attacks).toHaveLength(1);
      }
    });
  });
});
