import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialGameState,
  applyAction,
  resolveAction,
  validateAction,
  ActionType,
  GamePhase,
  CardType,
  CardZone,
  CardDefinition,
  CardInstance,
  GameEventType,
  GameEvent,
  EffectType,
  TriggerCondition,
  EventBus,
  dispatchEvents,
  evaluateContinuousEffects,
  resetEventSequence,
  createCardPlayedEvent,
  createStudentEnteredEvent,
  createStudentAttackedEvent,
  createDamageDealtEvent,
  createStudentDefeatedEvent,
  createTurnStartedEvent,
  createPhaseChangedEvent,
  ALPHA_CARDS,
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_INSPIRADOR,
  ALPHA_STUDENT_RESILIENTE,
  ALPHA_STUDENT_RECONHECIDO,
  ALPHA_STUDENT_LIDER,
  DEFAULT_REPRESENTATIVE_AKIRA,
} from '../../src/core';

function createTestStudent(def: CardDefinition, ownerId: string, index = 1): CardInstance {
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
  };
}

describe('Core Engine — Fase 5: Events & Effects Engine (eventSystem)', () => {
  beforeEach(() => {
    resetEventSequence();
  });

  // ==========================================================================
  // 1. INFRAESTRUTURA DE EVENTOS & GERAÇÃO DETERMINÍSTICA
  // ==========================================================================
  describe('1. Infraestrutura do Barramento de Eventos', () => {
    it('deve gerar eventos com identificadores sequenciais determinísticos', () => {
      const state = createInitialGameState();

      const e1 = createCardPlayedEvent(state, {
        playerId: 'player1',
        cardInstanceId: 'c1',
        definitionId: 'def1',
        cardType: CardType.STUDENT,
        cost: 2,
      });

      const e2 = createStudentEnteredEvent(state, {
        playerId: 'player1',
        cardInstanceId: 'c1',
        definitionId: 'def1',
        hasInertia: true,
        ready: false,
      });

      expect(e1.id).toBe(`evt_1_START_CARD_PLAYED_1`);
      expect(e2.id).toBe(`evt_1_START_STUDENT_ENTERED_2`);
      expect(e1.type).toBe(GameEventType.CARD_PLAYED);
      expect(e2.type).toBe(GameEventType.STUDENT_ENTERED);
    });

    it('deve permitir resetar a sequência de IDs para fins de reprodutibilidade em testes', () => {
      const state = createInitialGameState();
      const e1 = createTurnStartedEvent(state, { turn: 1, activePlayerId: 'player1' });
      expect(e1.id).toContain('_1');

      resetEventSequence();
      const e2 = createTurnStartedEvent(state, { turn: 1, activePlayerId: 'player1' });
      expect(e2.id).toContain('_1');
    });

    it('deve emitir os 6 tipos canônicos exigidos pela especificação', () => {
      const state = createInitialGameState();

      const cardPlayed = createCardPlayedEvent(state, {
        playerId: 'player1',
        cardInstanceId: 'c1',
        definitionId: 'novato',
        cardType: CardType.STUDENT,
        cost: 1,
      });
      const studentAttacked = createStudentAttackedEvent(state, {
        playerId: 'player1',
        attackerInstanceId: 'c1',
        targetId: 'player2',
      });
      const damageDealt = createDamageDealtEvent(state, {
        sourceId: 'c1',
        targetId: 'player2',
        targetType: 'REPRESENTATIVE',
        targetPlayerId: 'player2',
        amount: 3,
        isCombatDamage: true,
      });
      const studentDefeated = createStudentDefeatedEvent(state, {
        playerId: 'player2',
        cardInstanceId: 'c2',
        definitionId: 'novato',
        reason: 'COMBAT_DAMAGE',
      });
      const turnStarted = createTurnStartedEvent(state, { turn: 2, activePlayerId: 'player2' });
      const phaseChanged = createPhaseChangedEvent(state, {
        fromPhase: GamePhase.START,
        toPhase: GamePhase.MAIN,
        activePlayerId: 'player1',
      });

      expect(cardPlayed.type).toBe(GameEventType.CARD_PLAYED);
      expect(studentAttacked.type).toBe(GameEventType.STUDENT_ATTACKED);
      expect(damageDealt.type).toBe(GameEventType.DAMAGE_DEALT);
      expect(studentDefeated.type).toBe(GameEventType.STUDENT_DEFEATED);
      expect(turnStarted.type).toBe(GameEventType.TURN_STARTED);
      expect(phaseChanged.type).toBe(GameEventType.PHASE_CHANGED);
    });

    it('deve registrar e notificar callbacks inscritos no EventBus', () => {
      const state = createInitialGameState();
      const bus = new EventBus();
      const captured: GameEvent[] = [];

      const subId = bus.subscribe(GameEventType.DAMAGE_DEALT, (_st, evt) => {
        captured.push(evt);
      });

      const dmgEvent = createDamageDealtEvent(state, {
        sourceId: 'att_1',
        targetId: 'def_1',
        targetType: 'STUDENT',
        targetPlayerId: 'player2',
        amount: 4,
        isCombatDamage: true,
      });

      const res = bus.dispatch(state, dmgEvent);
      expect(res.emittedEvents).toHaveLength(1);
      expect(captured).toHaveLength(1);
      expect(captured[0].id).toBe(dmgEvent.id);

      // Cancelar inscrição
      bus.unsubscribe(subId);
      bus.dispatch(state, dmgEvent);
      expect(captured).toHaveLength(1); // Não recebeu novamente
    });

    it('deve interromper loops infinitos respeitando o teto de maxIterations', () => {
      const state = createInitialGameState();

      // Listener que gera um novo evento indefinidamente
      const pingPongListener = {
        id: 'infinite_loop',
        eventType: GameEventType.DAMAGE_DEALT,
        callback: (st: any) => {
          return {
            state: st,
            secondaryEvents: [
              createDamageDealtEvent(st, {
                targetId: 'p2',
                targetType: 'REPRESENTATIVE',
                targetPlayerId: 'player2',
                amount: 1,
                isCombatDamage: false,
              }),
            ],
          };
        },
      };

      const startEvent = createDamageDealtEvent(state, {
        targetId: 'p2',
        targetType: 'REPRESENTATIVE',
        targetPlayerId: 'player2',
        amount: 1,
        isCombatDamage: false,
      });

      // Executa com limite seguro de 10 iterações
      const res = dispatchEvents(state, [startEvent], {
        maxIterations: 10,
        listeners: [pingPongListener],
      });

      expect(res.emittedEvents.length).toBeGreaterThanOrEqual(10);
      expect(res.state).toBeDefined();
    });
  });

  // ==========================================================================
  // 2. INTEGRAÇÃO DA POPULARIDADE (DAICHI & DATA-DRIVEN TRIGGERS)
  // ==========================================================================
  describe('2. Integração do Acúmulo de Popularidade (Data-Driven)', () => {
    it('Daichi deve acumular Popularidade via data-driven trigger ao declarar ataque', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.players['player1'].diplomacyActive = false;
      expect(state.players['player1'].representative.name).toBe('Daichi');
      expect(state.players['player1'].representative.popularity).toBe(0);

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      // Declaração de ataque
      const result = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Popularidade acumulada para 1
        expect(result.state.players['player1'].representative.popularity).toBe(1);
        expect(result.state.players['player1'].representative.highlightAvailable).toBe(false);

        // Deve conter eventos emitidos: STUDENT_ATTACKED e POPULARITY_GAINED
        const attackedEvt = result.events?.find((e) => e.type === GameEventType.STUDENT_ATTACKED);
        const popEvt = result.events?.find((e) => e.type === GameEventType.POPULARITY_GAINED);
        expect(attackedEvt).toBeDefined();
        expect(popEvt).toBeDefined();
      }
    });

    it('Daichi deve desbloquear Destaque ao atingir o requisito de Popularidade (3)', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.players['player1'].diplomacyActive = false;
      // Começa com 2 de Popularidade (requisito é 3)
      state.players['player1'].representative.popularity = 2;
      expect(state.players['player1'].representative.highlightAvailable).toBe(false);

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(attacker);

      const result = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: attacker.instanceId,
        targetId: 'player2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.players['player1'].representative.popularity).toBe(3);
        expect(result.state.players['player1'].representative.highlightAvailable).toBe(true);

        const popEvt = result.events?.find(
          (e) => e.type === GameEventType.POPULARITY_GAINED
        ) as any;
        expect(popEvt).toBeDefined();
        expect(popEvt.highlightUnlocked).toBe(true);
        expect(popEvt.newPopularity).toBe(3);
      }
    });

    it('não deve conceder Popularidade a Daichi quando um Estudante INIMIGO declara ataque', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;
      state.activePlayerId = 'player2';
      state.players['player2'].diplomacyActive = false;

      // Player 1 é Daichi, Player 2 ataca
      const enemyAttacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player2', 1);
      state.players['player2'].board.push(enemyAttacker);

      const result = applyAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player2',
        attackerInstanceId: enemyAttacker.instanceId,
        targetId: 'player1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Player 1 não deve ter ganho popularidade com o ataque do adversário
        expect(result.state.players['player1'].representative.popularity).toBe(0);
      }
    });

    it('Akira deve possuir trigger cadastrado para DEBATE_RESOLVED', () => {
      const akiraDef = DEFAULT_REPRESENTATIVE_AKIRA;
      expect(akiraDef.triggers).toBeDefined();
      expect(akiraDef.triggers).toHaveLength(1);
      expect(akiraDef.triggers![0].event).toBe(GameEventType.DEBATE_RESOLVED);
      expect(akiraDef.triggers![0].effects[0].type).toBe(EffectType.GAIN_POPULARITY);
    });
  });

  // ==========================================================================
  // 3. PROCESSAMENTO DE GATILHOS REATIVOS ORIENTADOS A DADOS
  // ==========================================================================
  describe('3. Processamento de Gatilhos Reativos Orientados a Dados', () => {
    it('deve disparar efeito na entrada (Inspiração: ao entrar, concede +1 Influência a aliados)', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;
      state.players['player1'].energy = 5;

      // Já temos um estudante novato em campo (Influência 1)
      const allyStudent = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      state.players['player1'].board.push(allyStudent);
      expect(allyStudent.currentInfluence).toBe(1);

      // Coloca a carta de Inspiração na mão
      const inspiradorInstance: CardInstance = {
        instanceId: 'p1_inspirador_1',
        definitionId: ALPHA_STUDENT_INSPIRADOR.id,
        ownerId: 'player1',
        controllerId: 'player1',
        zone: CardZone.HAND,
        ready: false,
        hasInertia: true,
        statuses: [],
      };
      state.players['player1'].hand.push(inspiradorInstance);

      // Joga a carta
      const result = applyAction(
        state,
        {
          type: ActionType.PLAY_CARD,
          playerId: 'player1',
          cardInstanceId: inspiradorInstance.instanceId,
        },
        { cardRegistry: ALPHA_CARDS }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // O aliado em campo deve ter recebido +1 de Influência pelo trigger da Inspiração (1 + 1 = 2)
        const updatedAlly = result.state.players['player1'].board.find(
          (s) => s.instanceId === allyStudent.instanceId
        );
        expect(updatedAlly).toBeDefined();
        expect(updatedAlly!.currentInfluence).toBe(2);

        // Deve conter eventos: CARD_PLAYED, STUDENT_ENTERED, EFFECT_APPLIED
        const types = result.events?.map((e) => e.type);
        expect(types).toContain(GameEventType.CARD_PLAYED);
        expect(types).toContain(GameEventType.STUDENT_ENTERED);
        expect(types).toContain(GameEventType.EFFECT_APPLIED);
      }
    });

    it('deve disparar efeito na derrota (Persistência: ressurge com 1 de Moral ao ser derrotado)', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;

      // Player 1 tem um estudante comum atacante com 3 de Influência
      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      attacker.currentInfluence = 3;
      state.players['player1'].board.push(attacker);

      // Player 2 tem estudante com PERSISTÊNCIA (Moral 2)
      const resilientBlocker = createTestStudent(ALPHA_STUDENT_RESILIENTE, 'player2', 1);
      resilientBlocker.currentMorale = 2;
      resilientBlocker.maxMorale = 2;
      state.players['player2'].board.push(resilientBlocker);

      // Declara ataque e bloqueio
      state.combat = {
        active: true,
        attacks: [
          {
            attackerInstanceId: attacker.instanceId,
            targetId: 'player2',
            blockerInstanceId: resilientBlocker.instanceId,
          },
        ],
      };

      // Resolução do combate
      const result = applyAction(
        state,
        {
          type: ActionType.RESOLVE_COMBAT,
          playerId: 'player1',
        },
        { cardRegistry: ALPHA_CARDS }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Resiliente sofreu 3 de dano (Moral <= 0). O gatilho de Persistência deve tê-lo
        // retornado ao campo de batalha com 1 de Moral!
        const revivedStudent = result.state.players['player2'].board.find(
          (s) => s.instanceId === resilientBlocker.instanceId
        );
        expect(revivedStudent).toBeDefined();
        expect(revivedStudent!.currentMorale).toBe(1);
        expect(revivedStudent!.statuses).toContain('PERSISTENCIA_USED');

        // Deve conter eventos de DAMAGE_DEALT, STUDENT_DEFEATED, STUDENT_ENTERED (revived)
        const types = result.events?.map((e) => e.type);
        expect(types).toContain(GameEventType.DAMAGE_DEALT);
        expect(types).toContain(GameEventType.STUDENT_DEFEATED);
        expect(types).toContain(GameEventType.STUDENT_ENTERED);
      }
    });

    it('Persistência não deve ressuscitar uma segunda vez (apenas 1 vez por partida)', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.COMBAT;

      const attacker = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 1);
      attacker.currentInfluence = 5;
      state.players['player1'].board.push(attacker);

      // Estudante já usou persistência anteriormente
      const alreadyRevived = createTestStudent(ALPHA_STUDENT_RESILIENTE, 'player2', 1);
      alreadyRevived.currentMorale = 1;
      alreadyRevived.statuses.push('PERSISTENCIA_USED');
      state.players['player2'].board.push(alreadyRevived);

      state.combat = {
        active: true,
        attacks: [
          {
            attackerInstanceId: attacker.instanceId,
            targetId: 'player2',
            blockerInstanceId: alreadyRevived.instanceId,
          },
        ],
      };

      const result = applyAction(
        state,
        {
          type: ActionType.RESOLVE_COMBAT,
          playerId: 'player1',
        },
        { cardRegistry: ALPHA_CARDS }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Não deve estar mais no campo
        const onBoard = result.state.players['player2'].board.find(
          (s) => s.instanceId === alreadyRevived.instanceId
        );
        expect(onBoard).toBeUndefined();

        // Deve estar permanentemente no descarte
        const inDiscard = result.state.players['player2'].discard.find(
          (s) => s.instanceId === alreadyRevived.instanceId
        );
        expect(inDiscard).toBeDefined();
      }
    });

    it('deve disparar gatilho de morte de aliado para Estudantes que reagem a baixas', () => {
      const state = createInitialGameState();

      // Carta customizada com trigger ON_ALLY_DEFEATED que compra 1 carta
      const witnessDef: CardDefinition = {
        id: 'witness_card',
        name: 'Vingador da Turma',
        type: CardType.STUDENT,
        cost: 2,
        traits: ['Rebelde'],
        keywords: [],
        influence: 2,
        morale: 2,
        triggers: [
          {
            id: 'draw_on_ally_death',
            event: GameEventType.STUDENT_DEFEATED,
            condition: TriggerCondition.ON_ALLY_DEFEATED,
            targetScope: 'ALLY',
            effects: [
              {
                type: EffectType.DRAW_CARD,
                amount: 1,
              },
            ],
          },
        ],
      };

      const registry = {
        ...ALPHA_CARDS,
        [witnessDef.id]: witnessDef,
      };

      const witness = createTestStudent(witnessDef, 'player1', 1);
      const dyingAlly = createTestStudent(ALPHA_STUDENT_NOVATO, 'player1', 2);
      state.players['player1'].board.push(witness, dyingAlly);

      const initialHandCount = state.players['player1'].hand.length;

      // Emite evento de derrota do aliado
      const defeatEvent = createStudentDefeatedEvent(state, {
        playerId: 'player1',
        cardInstanceId: dyingAlly.instanceId,
        definitionId: dyingAlly.definitionId,
        reason: 'COMBAT_DAMAGE',
      });

      const res = dispatchEvents(state, [defeatEvent], { cardRegistry: registry });

      // O vingador comprou 1 carta
      expect(res.state.players['player1'].hand.length).toBe(initialHandCount + 1);
      const drawnEvt = res.emittedEvents.find((e) => e.type === GameEventType.CARD_DRAWN);
      expect(drawnEvt).toBeDefined();
    });
  });

  // ==========================================================================
  // 4. EFEITOS CONTÍNUOS / AURAS (RECONHECIMENTO & LIDERANÇA)
  // ==========================================================================
  describe('4. Efeitos Contínuos e Auras', () => {
    it('Reconhecimento deve conceder +1 Influência quando o Representante tem Popularidade > 0', () => {
      const state = createInitialGameState();
      const student = createTestStudent(ALPHA_STUDENT_RECONHECIDO, 'player1', 1);
      state.players['player1'].board.push(student);
      expect(student.currentInfluence).toBe(2);

      // Com Popularidade 0, não recebe bônus
      let evaluated = evaluateContinuousEffects(state, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(2);
      expect(evaluated.players['player1'].board[0].statuses).not.toContain('RECONHECIMENTO_ACTIVE');

      // Adiciona 1 de Popularidade
      evaluated.players['player1'].representative.popularity = 1;
      evaluated = evaluateContinuousEffects(evaluated, ALPHA_CARDS);

      // Agora deve ter ganho +1 de Influência (2 + 1 = 3)
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(3);
      expect(evaluated.players['player1'].board[0].statuses).toContain('RECONHECIMENTO_ACTIVE');

      // Se a Popularidade voltar a 0, perde o bônus
      evaluated.players['player1'].representative.popularity = 0;
      evaluated = evaluateContinuousEffects(evaluated, ALPHA_CARDS);
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(2);
      expect(evaluated.players['player1'].board[0].statuses).not.toContain('RECONHECIMENTO_ACTIVE');
    });

    it('Liderança deve conceder +1 Influência quando compartilha Traço com o Representante', () => {
      const state = createInitialGameState();
      // Representante 1 é Daichi (Traço 'Atleta')
      expect(state.players['player1'].representative.name).toBe('Daichi');

      // Estudante com Liderança e traço 'Atleta'
      const atletaStudent = createTestStudent(ALPHA_STUDENT_LIDER, 'player1', 1);
      state.players['player1'].board.push(atletaStudent);
      expect(atletaStudent.currentInfluence).toBe(2);

      const evaluated = evaluateContinuousEffects(state, ALPHA_CARDS);

      // Deve ter ganho +1 de Influência por compartilhar o traço 'Atleta' (2 + 1 = 3)
      expect(evaluated.players['player1'].board[0].currentInfluence).toBe(3);
      expect(evaluated.players['player1'].board[0].statuses).toContain('LIDERANCA_ACTIVE');
    });
  });

  // ==========================================================================
  // 5. TRANSIÇÃO DE FASES E TURNOS EMITINDO EVENTOS CANÔNICOS
  // ==========================================================================
  describe('5. Transição de Fases e Turnos emitindo eventos', () => {
    it('advancePhase deve emitir PHASE_CHANGED ao transicionar START -> MAIN', () => {
      const state = createInitialGameState();
      expect(state.phase).toBe(GamePhase.START);

      const result = applyAction(state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.phase).toBe(GamePhase.MAIN);
        const phaseEvt = result.events?.find((e) => e.type === GameEventType.PHASE_CHANGED) as any;
        expect(phaseEvt).toBeDefined();
        expect(phaseEvt.fromPhase).toBe(GamePhase.START);
        expect(phaseEvt.toPhase).toBe(GamePhase.MAIN);
      }
    });

    it('passagem de turno pela End Phase deve emitir TURN_ENDED, TURN_STARTED e PHASE_CHANGED', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.END;

      const result = applyAction(state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.turn).toBe(2);
        expect(result.state.activePlayerId).toBe('player2');
        expect(result.state.phase).toBe(GamePhase.START);

        const types = result.events?.map((e) => e.type);
        expect(types).toContain(GameEventType.TURN_ENDED);
        expect(types).toContain(GameEventType.TURN_STARTED);
        expect(types).toContain(GameEventType.PHASE_CHANGED);
      }
    });

    it('resolveAction deve retornar array de eventos puro conforme especificação do Core Engineer', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;

      const events = resolveAction(state, {
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player1',
      });

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe(GameEventType.PHASE_CHANGED);
    });

    it('validateAction deve validar ações sem executá-las', () => {
      const state = createInitialGameState();
      state.phase = GamePhase.MAIN;

      // Tentativa ilegal de atacar na Main Phase
      const val = validateAction(state, {
        type: ActionType.ATTACK,
        playerId: 'player1',
        attackerInstanceId: 'some_id',
        targetId: 'player2',
      });

      expect(val.valid).toBe(false);
      expect(val.error).toBeDefined();
    });
  });
});
