import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialGameState,
  validateAction,
  ActionType,
  GamePhase,
  CardType,
  CardZone,
  CardDefinition,
  CardInstance,
  Keyword,
  ActionErrorCode,
  EffectType,
  EffectDuration,
  dispatchEvents,
  resetEventSequence,
  createDamageDealtEvent,
  createStudentDefeatedEvent,
  declareAttack,
  declareBlock,
  resolveCombat,
  playCard,
  isSilenced,
  isProtected,
  hasCardKeyword,
  validateTargetProtection,
  evaluateRivalryBonus,
  calculateCombatInfluence,
  evaluateContinuousEffects,
  updateLearningTurnStatus,
  ALPHA_CARDS,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_ATLETA_IMPULSO,
  ALPHA_STUDENT_PROVOCADOR,
  ALPHA_STUDENT_GUARDA,
  ALPHA_STUDENT_INFILTRADOR,
  ALPHA_STUDENT_INFILTRADOR_IMPULSO,
  ALPHA_STUDENT_INSPIRADOR,
  ALPHA_STUDENT_RESILIENTE,
  ALPHA_STUDENT_RECONHECIDO,
  ALPHA_STUDENT_SILENCIADO,
  ALPHA_STUDENT_PROTEGIDO,
  ALPHA_STUDENT_REBELDE,
  ALPHA_STUDENT_COLABORATIVO,
  ALPHA_STUDENT_RIVAL,
  ALPHA_STUDENT_APRENDIZ,
  applyEffect,
} from '../../src/core';

function createTestStudent(
  def: CardDefinition,
  ownerId: string,
  index = 1,
  overrides: Partial<CardInstance> = {}
): CardInstance {
  return {
    instanceId: `${ownerId}_${def.id}_${index}`,
    definitionId: def.id,
    ownerId,
    controllerId: ownerId,
    zone: CardZone.BOARD,
    currentInfluence: def.influence ?? 1,
    currentMorale: def.morale ?? 2,
    maxMorale: def.maxMorale ?? def.morale ?? 2,
    ready: true,
    hasInertia: false,
    statuses: [],
    ...overrides,
  };
}

function createCombatReadyState(turn = 2): ReturnType<typeof createInitialGameState> {
  const state = createInitialGameState();
  state.turn = turn;
  state.phase = GamePhase.COMBAT;
  state.activePlayerId = 'player1';
  state.players['player1'].energy = 5;
  state.players['player1'].maxEnergy = 5;
  state.players['player1'].diplomacyActive = false;
  state.players['player2'].energy = 5;
  state.players['player2'].maxEnergy = 5;
  state.players['player2'].diplomacyActive = false;
  return state;
}

describe('Keywords Engine — Fase 6: Validação Completa de Keywords do Alpha', () => {
  beforeEach(() => {
    resetEventSequence();
  });

  // ==========================================================================
  // 1. INÉRCIA & IMPULSO
  // ==========================================================================
  describe('1. Inércia & Impulso', () => {
    it('Estudante sem Impulso deve entrar com Inércia (hasInertia=true, ready=false) e não poder atacar', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.players['player1'].energy = 5;

      const handCard: CardInstance = {
        instanceId: 'hand_novato_1',
        definitionId: ALPHA_STUDENT_NOVATO.id,
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.HAND,
        ready: false,
        hasInertia: false,
        statuses: [],
      };
      state.players['player1'].hand.push(handCard);

      const result = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: handCard.instanceId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const boardCard = result.state.players['player1'].board[0];
        expect(boardCard.hasInertia).toBe(true);
        expect(boardCard.ready).toBe(false);

        // Tentativa de ataque deve falhar por Inércia
        result.state.phase = GamePhase.COMBAT;
        result.state.turn = 2;
        const attackRes = declareAttack(result.state, {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: boardCard.instanceId,
          targetId: 'player2',
        });
        expect(attackRes.success).toBe(false);
        if (!attackRes.success) {
          expect(attackRes.error.code).toBe(ActionErrorCode.INERTIA_RESTRICTION);
        }
      }
    });

    it('Estudante com Impulso deve superar Inércia e poder atacar no turno em que entra', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.players['player1'].energy = 5;

      const handCard: CardInstance = {
        instanceId: 'hand_atleta_1',
        definitionId: ALPHA_STUDENT_ATLETA_IMPULSO.id,
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.HAND,
        ready: false,
        hasInertia: false,
        statuses: [],
      };
      state.players['player1'].hand.push(handCard);

      const result = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: handCard.instanceId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const boardCard = result.state.players['player1'].board[0];
        expect(boardCard.hasInertia).toBe(false);
        expect(boardCard.ready).toBe(true);

        // Turno 2 (sem Diplomacia): pode atacar de imediato
        result.state.phase = GamePhase.COMBAT;
        result.state.turn = 2;
        result.state.players['player1'].diplomacyActive = false;

        const attackRes = declareAttack(result.state, {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: boardCard.instanceId,
          targetId: 'player2',
        });
        expect(attackRes.success).toBe(true);
      }
    });

    it('Impulso NÃO pode ignorar Diplomacia no 1º turno', () => {
      const state = createCombatReadyState(1);
      state.players['player1'].diplomacyActive = true;

      const attacker = createTestStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(attackRes.success).toBe(false);
      if (!attackRes.success) {
        expect(attackRes.error.code).toBe(ActionErrorCode.DIPLOMACY_RESTRICTION);
      }
    });
  });

  // ==========================================================================
  // 2. PROVOCAÇÃO, GUARDA E INFILTRAÇÃO
  // ==========================================================================
  describe('2. Provocação, Guarda e Infiltração', () => {
    it('Provocação força o atacante sem Infiltração a declarar o Provocador como alvo', () => {
      const state = createCombatReadyState();
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);
      const normalEnemy = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);

      state.players['player1'].board.push(attacker);
      state.players['player2'].board.push(provocador, normalEnemy);

      // 1. Tentar atacar o Representante é proibido por Provocação
      const repAttack = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });
      expect(repAttack.success).toBe(false);
      if (!repAttack.success) {
        expect(repAttack.error.code).toBe(ActionErrorCode.INVALID_TARGET);
      }

      // 2. Tentar atacar outro estudante sem Provocação é proibido
      const otherAttack = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: normalEnemy.instanceId,
      });
      expect(otherAttack.success).toBe(false);
      if (!otherAttack.success) {
        expect(otherAttack.error.code).toBe(ActionErrorCode.INVALID_TARGET);
      }

      // 3. Atacar o Provocador é permitido
      const provAttack = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: provocador.instanceId,
      });
      expect(provAttack.success).toBe(true);
    });

    it('Infiltração ignora Provocação e pode atacar diretamente o Representante', () => {
      const state = createCombatReadyState();
      const infiltrator = createTestStudent(ALPHA_STUDENT_INFILTRADOR, 'player1', 1);
      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);

      state.players['player1'].board.push(infiltrator);
      state.players['player2'].board.push(provocador);

      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: infiltrator.instanceId,
        targetId: 'player2',
      });
      expect(attackRes.success).toBe(true);
    });

    it('Infiltração não pode ser bloqueada por nenhum Estudante (mesmo com Guarda)', () => {
      const state = createCombatReadyState();
      const infiltrator = createTestStudent(ALPHA_STUDENT_INFILTRADOR, 'player1', 1);
      const guarda = createTestStudent(ALPHA_STUDENT_GUARDA, 'player2', 1);

      state.players['player1'].board.push(infiltrator);
      state.players['player2'].board.push(guarda);

      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: infiltrator.instanceId,
        targetId: 'player2',
      });
      expect(attackRes.success).toBe(true);

      if (attackRes.success) {
        const blockRes = declareBlock(attackRes.state, {
          type: ActionType.BLOCK,
          playerId: 'player2',
          blockerInstanceId: guarda.instanceId,
          attackerInstanceId: infiltrator.instanceId,
        });
        expect(blockRes.success).toBe(false);
        if (!blockRes.success) {
          expect(blockRes.error.code).toBe(ActionErrorCode.INVALID_BLOCK);
          expect(blockRes.error.message).toContain('Infiltração');
        }
      }
    });

    it('Infiltração não supera Diplomacia no turno 1', () => {
      const state = createCombatReadyState(1);
      state.players['player1'].diplomacyActive = true;

      const infiltrator = createTestStudent(ALPHA_STUDENT_INFILTRADOR_IMPULSO, 'player1', 1);
      state.players['player1'].board.push(infiltrator);

      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: infiltrator.instanceId,
        targetId: 'player2',
      });

      expect(attackRes.success).toBe(false);
      if (!attackRes.success) {
        expect(attackRes.error.code).toBe(ActionErrorCode.DIPLOMACY_RESTRICTION);
      }
    });
  });

  // ==========================================================================
  // 3. SILÊNCIO
  // ==========================================================================
  describe('3. Silêncio', () => {
    it('Estudante sob Silêncio não pode declarar ataque', () => {
      const state = createCombatReadyState();
      const silencedStudent = createTestStudent(ALPHA_STUDENT_SILENCIADO, 'player1', 1);
      state.players['player1'].board.push(silencedStudent);

      expect(isSilenced(silencedStudent)).toBe(true);

      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: silencedStudent.instanceId,
        targetId: 'player2',
      });

      expect(attackRes.success).toBe(false);
      if (!attackRes.success) {
        expect(attackRes.error.code).toBe(ActionErrorCode.INVALID_ATTACK);
        expect(attackRes.error.message).toContain('Silêncio');
      }
    });

    it('Silêncio desativa Provocação de um Estudante, permitindo atacar outros alvos livremente', () => {
      const state = createCombatReadyState();
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      // Provocador que foi silenciado
      const silencedProvocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1, {
        statuses: [Keyword.SILENCIO],
      });

      state.players['player1'].board.push(attacker);
      state.players['player2'].board.push(silencedProvocador);

      // Como o Provocador está silenciado, Provocação está inativa:
      expect(hasCardKeyword(silencedProvocador, Keyword.PROVOCACAO)).toBe(false);

      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(attackRes.success).toBe(true);
    });

    it('Silêncio desativa auras e efeitos contínuos passivos (Reconhecimento, Liderança, etc.)', () => {
      const state = createInitialGameState();
      state.players['player1'].representative.popularity = 2;

      // Estudante com Reconhecimento
      const student = createTestStudent(ALPHA_STUDENT_RECONHECIDO, 'player1', 1);
      state.players['player1'].board.push(student);

      // Antes do Silêncio: ganha +1 Influência de Reconhecimento (2 -> 3)
      let evaluated = evaluateContinuousEffects(state, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(3);
      expect(evaluated.players['player1'].board[0].statuses).toContain('RECONHECIMENTO_ACTIVE');

      // Aplica Silêncio
      evaluated.players['player1'].board[0].statuses.push(Keyword.SILENCIO);
      evaluated = evaluateContinuousEffects(evaluated, ALPHA_CARDS);

      // Bônus deve ser removido e revertido (3 -> 2)
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(2);
      expect(evaluated.players['player1'].board[0].statuses).not.toContain('RECONHECIMENTO_ACTIVE');
    });

    it('Silêncio impede ressurreição por Persistência se o Estudante for derrotado sob Silêncio', () => {
      const state = createCombatReadyState();
      const resilientDefeated = createTestStudent(ALPHA_STUDENT_RESILIENTE, 'player2', 1, {
        currentMorale: 0,
        statuses: [Keyword.SILENCIO],
      });
      resilientDefeated.zone = CardZone.DISCARD;
      state.players['player2'].discard.push(resilientDefeated);

      const defeatEvent = createStudentDefeatedEvent(state, {
        playerId: 'player2',
        cardInstanceId: resilientDefeated.instanceId,
        definitionId: resilientDefeated.definitionId,
        reason: 'COMBAT_DAMAGE',
      });

      const res = dispatchEvents(state, [defeatEvent], { cardRegistry: ALPHA_CARDS });

      // Não revive: continua no descarte
      expect(res.state.players['player2'].board.length).toBe(0);
      expect(res.state.players['player2'].discard.length).toBe(1);
    });
  });

  // ==========================================================================
  // 4. PROTEÇÃO
  // ==========================================================================
  describe('4. Proteção', () => {
    it('Estudante com Proteção não pode ser alvo de habilidades direcionadas ou Debates', () => {
      const state = createInitialGameState();
      const protectedStudent = createTestStudent(ALPHA_STUDENT_PROTEGIDO, 'player1', 1);
      state.players['player1'].board.push(protectedStudent);

      expect(isProtected(protectedStudent)).toBe(true);

      const val = validateTargetProtection(protectedStudent, ALPHA_CARDS);
      expect(val.valid).toBe(false);
      expect(val.error?.code).toBe(ActionErrorCode.PROTECTION_RESTRICTION);

      // Validação via gameEngine validateAction
      const actionVal = validateAction(state, {
        type: ActionType.ACTIVATE_ABILITY,
        playerId: 'player2',
        sourceInstanceId: 'some_source',
        abilityId: 'silence_ability',
        targetId: protectedStudent.instanceId,
      });
      expect(actionVal.valid).toBe(false);
      expect(actionVal.error?.code).toBe(ActionErrorCode.PROTECTION_RESTRICTION);
    });

    it('Efeitos direcionados (targetIds) ignoram unidades com Proteção', () => {
      const state = createInitialGameState();
      const protectedStudent = createTestStudent(ALPHA_STUDENT_PROTEGIDO, 'player2', 1);
      const normalStudent = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 2);
      state.players['player2'].board.push(protectedStudent, normalStudent);

      // Dispara efeito direcionado com targetIds
      const dummyEvent = createDamageDealtEvent(state, {
        targetId: normalStudent.instanceId,
        targetType: 'STUDENT',
        targetPlayerId: 'player2',
        amount: 1,
        isCombatDamage: false,
      });

      const res = applyEffect({
        state,
        effect: {
          type: EffectType.MODIFY_STAT,
          targetIds: [protectedStudent.instanceId, normalStudent.instanceId],
          stat: 'influence',
          amount: 2,
          duration: EffectDuration.PERMANENT,
        },
        sourcePlayerId: 'player1',
        sourceInstanceId: 'source_1',
        triggeringEvent: dummyEvent,
        cardRegistry: ALPHA_CARDS,
      });

      // O protegido NÃO recebeu o bônus
      expect(res.state.players['player2'].board[0].currentInfluence).toBe(2);
      // O normal recebeu o bônus (1 + 2 = 3)
      expect(res.state.players['player2'].board[1].currentInfluence).toBe(3);
    });

    it('Proteção NÃO impede ser atacado em combate', () => {
      const state = createCombatReadyState();
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      const protectedStudent = createTestStudent(ALPHA_STUDENT_PROTEGIDO, 'player2', 1, {
        statuses: ['keyword_provocação'],
      });

      state.players['player1'].board.push(attacker);
      state.players['player2'].board.push(protectedStudent);

      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
      });

      expect(attackRes.success).toBe(true);
      if (attackRes.success) {
        expect(attackRes.state.combat.attacks[0].targetId).toBe(protectedStudent.instanceId);
      }
    });
  });

  // ==========================================================================
  // 5. PERSISTÊNCIA & INSPIRAÇÃO
  // ==========================================================================
  describe('5. Persistência & Inspiração', () => {
    it('Persistência deve reviver o Estudante na 1ª derrota com 1 de Moral', () => {
      const state = createCombatReadyState();
      const resilient = createTestStudent(ALPHA_STUDENT_RESILIENTE, 'player1', 1, {
        currentMorale: 0,
      });
      resilient.zone = CardZone.DISCARD;
      state.players['player1'].discard.push(resilient);

      const defeatEvent = createStudentDefeatedEvent(state, {
        playerId: 'player1',
        cardInstanceId: resilient.instanceId,
        definitionId: resilient.definitionId,
        reason: 'COMBAT_DAMAGE',
      });

      const res = dispatchEvents(state, [defeatEvent], { cardRegistry: ALPHA_CARDS });

      // Revive no campo
      expect(res.state.players['player1'].board.length).toBe(1);
      const revived = res.state.players['player1'].board[0];
      expect(revived.currentMorale).toBe(1);
      expect(revived.statuses).toContain('PERSISTENCIA_USED');
    });

    it('Persistência NÃO deve reviver se já foi utilizada anteriormente (PERSISTENCIA_USED)', () => {
      const state = createCombatReadyState();
      const resilient = createTestStudent(ALPHA_STUDENT_RESILIENTE, 'player1', 1, {
        currentMorale: 0,
        statuses: ['PERSISTENCIA_USED'],
      });
      resilient.zone = CardZone.DISCARD;
      state.players['player1'].discard.push(resilient);

      const defeatEvent = createStudentDefeatedEvent(state, {
        playerId: 'player1',
        cardInstanceId: resilient.instanceId,
        definitionId: resilient.definitionId,
        reason: 'COMBAT_DAMAGE',
      });

      const res = dispatchEvents(state, [defeatEvent], { cardRegistry: ALPHA_CARDS });

      // Permanece no descarte
      expect(res.state.players['player1'].board.length).toBe(0);
      expect(res.state.players['player1'].discard.length).toBe(1);
    });

    it('Inspiração dispara ao entrar no campo concedendo bônus aos aliados', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.players['player1'].energy = 5;

      const ally = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(ally);
      expect(ally.currentInfluence).toBe(1);

      const inspiradorHand: CardInstance = {
        instanceId: 'hand_inspirador_1',
        definitionId: ALPHA_STUDENT_INSPIRADOR.id,
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.HAND,
        ready: false,
        hasInertia: false,
        statuses: [],
      };
      state.players['player1'].hand.push(inspiradorHand);

      const result = playCard(state, {
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: inspiradorHand.instanceId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // O aliado Novato deve ter recebido +1 de Influência (1 -> 2)
        const updatedAlly = result.state.players['player1'].board.find(
          (s) => s.instanceId === ally.instanceId
        );
        expect(updatedAlly?.currentInfluence).toBe(2);
      }
    });
  });

  // ==========================================================================
  // 6. COLABORAÇÃO
  // ==========================================================================
  describe('6. Colaboração', () => {
    it('Colaboração concede +1 Influência quando há outro Estudante da mesma Classe no campo', () => {
      const state = createInitialGameState();
      // Atleta em Equipe tem traço 'Atleta' e Keyword COLABORACAO
      const colabStudent = createTestStudent(ALPHA_STUDENT_COLABORATIVO, 'player1', 1);
      state.players['player1'].board.push(colabStudent);

      // 1. Sozinho no campo: não ganha o bônus
      let evaluated = evaluateContinuousEffects(state, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(2);
      expect(evaluated.players['player1'].board[0].statuses).not.toContain('COLABORACAO_ACTIVE');

      // 2. Outro estudante 'Atleta' entra no campo
      const teammate = createTestStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player1', 2);
      evaluated.players['player1'].board.push(teammate);

      evaluated = evaluateContinuousEffects(evaluated, ALPHA_CARDS);

      // Agora deve ter recebido o bônus (2 + 1 = 3)
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(3);
      expect(evaluated.players['player1'].board[0].statuses).toContain('COLABORACAO_ACTIVE');

      // 3. Se o colega sair do campo (ex: derrotado/descartado), o bônus é removido
      evaluated.players['player1'].board = [evaluated.players['player1'].board[0]];
      evaluated = evaluateContinuousEffects(evaluated, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(2);
      expect(evaluated.players['player1'].board[0].statuses).not.toContain('COLABORACAO_ACTIVE');
    });

    it('Colaboração não ativa se o colega de campo for de Classe/Traço diferente', () => {
      const state = createInitialGameState();
      const colabStudent = createTestStudent(ALPHA_STUDENT_COLABORATIVO, 'player1', 1); // Traço: Atleta
      const diferenteStudent = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 2); // Traço: Calouro

      state.players['player1'].board.push(colabStudent, diferenteStudent);

      const evaluated = evaluateContinuousEffects(state, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(2);
      expect(evaluated.players['player1'].board[0].statuses).not.toContain('COLABORACAO_ACTIVE');
    });
  });

  // ==========================================================================
  // 7. RIVALIDADE
  // ==========================================================================
  describe('7. Rivalidade', () => {
    it('Rivalidade concede +1 Influência de combate ao enfrentar Estudante de Classe diferente', () => {
      const state = createCombatReadyState();
      // Duelista Rival: Traço 'Rebelde'
      const rival = createTestStudent(ALPHA_STUDENT_RIVAL, 'player1', 1);
      // Oponente: Traço 'Atleta' (Classe diferente)
      const atletaEnemy = createTestStudent(ALPHA_STUDENT_ATLETA_IMPULSO, 'player2', 1, {
        currentMorale: 5,
      });

      state.players['player1'].board.push(rival);
      state.players['player2'].board.push(atletaEnemy);

      const bonus = evaluateRivalryBonus(rival, atletaEnemy, ALPHA_CARDS);
      expect(bonus).toBe(1);

      const combatInf = calculateCombatInfluence(rival, atletaEnemy, ALPHA_CARDS);
      expect(combatInf).toBe(rival.currentInfluence! + 1); // 2 + 1 = 3

      // Resolução no combate: rival ataca Representante e atletaEnemy bloqueia (Bloqueio Livre)
      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: rival.instanceId,
        targetId: 'player2',
      });
      expect(attackRes.success).toBe(true);
      if (!attackRes.success) return;

      const blockRes = declareBlock(attackRes.state, {
        type: ActionType.BLOCK,
        playerId: 'player2',
        attackerInstanceId: rival.instanceId,
        blockerInstanceId: atletaEnemy.instanceId,
      });
      expect(blockRes.success).toBe(true);
      if (!blockRes.success) return;

      const resolveRes = resolveCombat(blockRes.state, ALPHA_CARDS);
      expect(resolveRes.success).toBe(true);
      if (!resolveRes.success) return;
      // Moral do defensor deve ter caído em 3 (5 - 3 = 2)
      expect(resolveRes.state.players['player2'].board[0].currentMorale).toBe(2);
    });

    it('Rivalidade NÃO concede bônus se o oponente compartilhar a mesma Classe', () => {
      const state = createCombatReadyState();
      // Duelista Rival: Traço 'Rebelde'
      const rival = createTestStudent(ALPHA_STUDENT_RIVAL, 'player1', 1);
      // Oponente com traço 'Rebelde' também
      const rebeldeEnemy = createTestStudent(ALPHA_STUDENT_REBELDE, 'player2', 1, {
        currentMorale: 5,
      });

      state.players['player1'].board.push(rival);
      state.players['player2'].board.push(rebeldeEnemy);

      const bonus = evaluateRivalryBonus(rival, rebeldeEnemy, ALPHA_CARDS);
      expect(bonus).toBe(0);

      const combatInf = calculateCombatInfluence(rival, rebeldeEnemy, ALPHA_CARDS);
      expect(combatInf).toBe(rival.currentInfluence); // 2
    });
  });

  // ==========================================================================
  // 8. APRENDIZAGEM
  // ==========================================================================
  describe('8. Aprendizagem', () => {
    it('Aprendizagem concede +1 Influência se o Estudante não atacou no turno anterior', () => {
      const state = createInitialGameState();
      state.turn = 1;
      state.activePlayerId = 'player1';

      const aprendiz = createTestStudent(ALPHA_STUDENT_APRENDIZ, 'player1', 1);
      state.players['player1'].board.push(aprendiz);
      expect(aprendiz.currentInfluence).toBe(1);

      // O jogador passa o turno sem atacar
      const updatedOnEnd = updateLearningTurnStatus(state, 'player1', ALPHA_CARDS);
      expect(updatedOnEnd.players['player1'].board[0].statuses).toContain('APRENDIZAGEM_ELIGIBLE');

      // No início do próximo turno, o bônus de Aprendizagem ativa (+1)
      const evaluated = evaluateContinuousEffects(updatedOnEnd, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(2);
      expect(evaluated.players['player1'].board[0].statuses).toContain('APRENDIZAGEM_ACTIVE');
    });

    it('Aprendizagem perde o bônus se o Estudante realizar um ataque', () => {
      const state = createCombatReadyState();
      const aprendiz = createTestStudent(ALPHA_STUDENT_APRENDIZ, 'player1', 1, {
        statuses: ['APRENDIZAGEM_ELIGIBLE', 'APRENDIZAGEM_ACTIVE'],
        currentInfluence: 2,
      });
      state.players['player1'].board.push(aprendiz);

      // Ao declarar ataque, perde a elegibilidade e marca que atacou
      const attackRes = declareAttack(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: aprendiz.instanceId,
        targetId: 'player2',
      });
      expect(attackRes.success).toBe(true);
      if (!attackRes.success) return;

      const attackerBoard = attackRes.state.players['player1'].board[0];
      expect(attackerBoard.statuses).toContain('ATTACKED_THIS_TURN');
      expect(attackerBoard.statuses).not.toContain('APRENDIZAGEM_ELIGIBLE');

      // Ao final do turno, a Aprendizagem é limpa e não é renovada
      const endState = updateLearningTurnStatus(attackRes.state, 'player1', ALPHA_CARDS);
      const evaluated = evaluateContinuousEffects(endState, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(1);
      expect(evaluated.players['player1'].board[0].statuses).not.toContain('APRENDIZAGEM_ACTIVE');
    });
  });

  // ==========================================================================
  // 9. ZERO HARDCODING & EXTENSIBILIDADE TOTAL
  // ==========================================================================
  describe('9. Zero Hardcoding & Extensibilidade de Cartas', () => {
    it('Nova carta desconhecida com Keywords pré-existentes deve funcionar imediatamente sem alterar a engine', () => {
      const customCardDef: CardDefinition = {
        id: 'custom_dragon_striker',
        name: 'Guerreiro Dragão Mágico',
        type: CardType.STUDENT,
        cost: 2,
        traits: ['Dragao', 'Lendario'],
        keywords: [Keyword.IMPULSO, Keyword.INFILTRACAO, Keyword.PROTECAO],
        influence: 4,
        morale: 4,
        maxMorale: 4,
        text: 'Carta inédita para testar ausência total de hardcoding.',
      };

      const customRegistry = {
        ...ALPHA_CARDS,
        [customCardDef.id]: customCardDef,
      };

      const state = createCombatReadyState(2);
      const customStudent = createTestStudent(customCardDef, 'player1', 1);
      const provocador = createTestStudent(ALPHA_STUDENT_PROVOCADOR, 'player2', 1);

      state.players['player1'].board.push(customStudent);
      state.players['player2'].board.push(provocador);

      // 1. Impulso e Infiltração funcionam perfeitamente na carta inédita:
      // Pode focar o Representante ignorando o Provocador
      const attackRes = declareAttack(
        state,
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: customStudent.instanceId,
          targetId: 'player2',
        },
        customRegistry
      );
      expect(attackRes.success).toBe(true);

      // 2. Proteção funciona perfeitamente na carta inédita:
      expect(isProtected(customStudent, customRegistry)).toBe(true);
      const protVal = validateTargetProtection(customStudent, customRegistry);
      expect(protVal.valid).toBe(false);
      expect(protVal.error?.code).toBe(ActionErrorCode.PROTECTION_RESTRICTION);
    });
  });
});
