import { GameState, GameStatus, AttackDeclaration } from '../types/state';
import { GamePhase } from '../types/phase';
import { CardInstance, Keyword, CardDefinition } from '../types/card';
import { CardZone } from '../types/zone';
import { PlayerState } from '../types/player';
import { AttackAction, BlockAction, ActionType } from '../types/action';
import { ActionErrorCode, ActionResult, ActionError } from '../types/error';
import { cloneGameState, getOpponentId } from './turnSystem';
import { isDiplomacyActive } from './diplomacy';
import {
  createStudentAttackedEvent,
  createStudentBlockedEvent,
  createDamageDealtEvent,
  createStudentDefeatedEvent,
  dispatchEvents,
} from './eventSystem';
import { GameEvent } from '../types/event';

/**
 * Detalhes estruturados da validação de declaração de ataque
 */
export interface AttackValidationDetails {
  attacker: CardInstance;
  targetId: string;
  isRepresentativeTarget: boolean;
  targetStudent?: CardInstance;
}

export type AttackValidationResult =
  | { valid: true; details: AttackValidationDetails }
  | { valid: false; error: ActionError };

/**
 * Detalhes estruturados da validação de declaração de bloqueador
 */
export interface BlockValidationDetails {
  attack: AttackDeclaration;
  blocker: CardInstance;
}

export type BlockValidationResult =
  | { valid: true; details: BlockValidationDetails }
  | { valid: false; error: ActionError };

import {
  hasCardKeyword,
  calculateCombatInfluence,
  markStudentAttacked,
} from './keywordSystem';

export { hasCardKeyword };

/**
 * Identifica se o targetId fornecido corresponde ao Representante do jogador adversário.
 */
export function isTargetRepresentative(
  targetId: string,
  opponentState: PlayerState
): boolean {
  if (!opponentState || !opponentState.representative) {
    return false;
  }
  return (
    targetId === opponentState.id ||
    targetId === opponentState.representative.definitionId ||
    targetId === opponentState.representative.ownerId ||
    targetId === opponentState.representative.name ||
    targetId === 'REPRESENTATIVE' ||
    targetId === 'representative'
  );
}

/**
 * Validação pura e determinística para declaração de ataque (ActionType.ATTACK).
 *
 * Conforme as 5 Regras Oficiais de Combate do SCB:
 * 1. O jogador ativo escolhe seus estudantes para atacar o Representante adversário (ou estudantes).
 * 2. Bloqueio Livre: Se o oponente possuir estudantes em campo, qualquer estudante pode bloquear (não é exclusivo de Guarda).
 * 3. Provocação: Se o defensor tiver um estudante com Provocação em campo, o atacante é obrigado a declará-lo como alvo do ataque (protegendo o Representante e outros estudantes de serem os alvos iniciais).
 * 4. Infiltração: Um atacante com Infiltração ignora a regra de Provocação (pode focar direto no Representante) e não pode ser bloqueado por nenhum estudante, nem mesmo os que têm Guarda.
 * 5. Diplomacia: Continua absoluta no Turno 1 (impede ataque direto ao Representante, mesmo com Impulso ou Infiltração).
 */
export function validateAttack(
  state: GameState,
  action: AttackAction,
  registry?: Record<string, CardDefinition>
): AttackValidationResult {
  // 1. Partida não pode estar finalizada
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.GAME_OVER,
        message: 'A partida já foi encerrada.',
      },
    };
  }

  // 2. Fase de combate obrigatória
  if (state.phase !== GamePhase.COMBAT) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: `Ataques só podem ser declarados na Combat Phase. Fase atual: ${state.phase}.`,
      },
    };
  }

  // 3. Apenas jogador ativo
  if (action.playerId !== state.activePlayerId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: 'Apenas o jogador ativo pode declarar ataques.',
      },
    };
  }

  const activePlayer = state.players[action.playerId];
  if (!activePlayer) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: `Jogador ${action.playerId} não encontrado no estado.`,
      },
    };
  }

  // 4. Presença do atacante no campo do jogador ativo
  const attacker = activePlayer.board.find((s) => s.instanceId === action.attackerInstanceId);
  if (!attacker || attacker.zone !== CardZone.BOARD) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.CARD_NOT_IN_BOARD,
        message: `O atacante ${action.attackerInstanceId} não está em campo no lado do jogador ativo.`,
      },
    };
  }

  // 5. Inércia vs Impulso
  const hasImpulse = hasCardKeyword(attacker, Keyword.IMPULSO, registry);
  if (attacker.hasInertia && !hasImpulse) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INERTIA_RESTRICTION,
        message: 'Inércia: Estudante não pode atacar no turno de entrada a menos que possua Impulso.',
      },
    };
  }

  // 6. Prontidão e duplicidade de declaração
  if (!attacker.ready) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_ATTACK,
        message: 'O Estudante já atacou neste turno ou não está pronto para combate.',
      },
    };
  }

  if (state.combat?.attacks?.some((a) => a.attackerInstanceId === action.attackerInstanceId)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_ATTACK,
        message: 'O Estudante já foi declarado como atacante nesta fase de combate.',
      },
    };
  }

  // 7. Silêncio
  if (hasCardKeyword(attacker, Keyword.SILENCIO, registry)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_ATTACK,
        message: 'Estudantes sob Silêncio não podem atacar.',
      },
    };
  }

  // 8. Identificação do adversário e validação de alvo
  const opponentId = getOpponentId(state, action.playerId);
  const opponent = state.players[opponentId];
  if (!opponent) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_TARGET,
        message: 'Adversário não encontrado.',
      },
    };
  }

  const isRepTarget = isTargetRepresentative(action.targetId, opponent);
  let targetStudent: CardInstance | undefined;

  if (!isRepTarget) {
    targetStudent = opponent.board.find((s) => s.instanceId === action.targetId);
    if (!targetStudent || targetStudent.zone !== CardZone.BOARD) {
      return {
        valid: false,
        error: {
          code: ActionErrorCode.INVALID_TARGET,
          message:
            'Alvo inválido: Deve ser um Estudante adversário em campo ou o Representante adversário.',
        },
      };
    }
  }

  // 9. Regra 5: Diplomacia — Continua absoluta no Turno 1 (impede ataque direto ao Representante, mesmo com Impulso ou Infiltração)
  if (isRepTarget && isDiplomacyActive(state, action.playerId)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.DIPLOMACY_RESTRICTION,
        message:
          'Diplomacia ativa: Estudantes não podem atacar diretamente o Representante adversário no primeiro turno.',
      },
    };
  }

  // 10. Regras 3 e 4: Provocação e Infiltração
  const opponentHasProvocation = opponent.board.some((s) =>
    hasCardKeyword(s, Keyword.PROVOCACAO, registry)
  );
  const hasInfiltration = hasCardKeyword(attacker, Keyword.INFILTRACAO, registry);

  if (opponentHasProvocation && !hasInfiltration) {
    // Se o defensor possuir Estudante com Provocação, o atacante é obrigado a declará-lo como alvo
    // (protegendo o Representante e outros estudantes de serem os alvos iniciais).
    if (isRepTarget) {
      return {
        valid: false,
        error: {
          code: ActionErrorCode.INVALID_TARGET,
          message:
            'O oponente possui Estudante com Provocação em campo. O atacante é obrigado a declará-lo como alvo do ataque.',
        },
      };
    }

    const isTargetProvocative =
      targetStudent && hasCardKeyword(targetStudent, Keyword.PROVOCACAO, registry);
    if (!isTargetProvocative) {
      return {
        valid: false,
        error: {
          code: ActionErrorCode.INVALID_TARGET,
          message:
            'O oponente possui Estudante com Provocação em campo. O atacante é obrigado a declará-lo como alvo do ataque.',
        },
      };
    }
  }

  return {
    valid: true,
    details: {
      attacker,
      targetId: action.targetId,
      isRepresentativeTarget: isRepTarget,
      targetStudent,
    },
  };
}

/**
 * Função utilitária para checagem rápida de legalidade de ataque
 */
export function canAttack(
  state: GameState,
  action: AttackAction,
  registry?: Record<string, CardDefinition>
): boolean {
  return validateAttack(state, action, registry).valid;
}

/**
 * Declaração pura de ataque (ActionType.ATTACK).
 * Registra a intenção em state.combat.attacks e atualiza o estado de prontidão do atacante.
 */
export function declareAttack(
  state: GameState,
  action: AttackAction,
  registry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const validation = validateAttack(state, action, registry);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const nextState = cloneGameState(state);
  const activePlayer = nextState.players[action.playerId];
  const attacker = activePlayer.board.find((s) => s.instanceId === action.attackerInstanceId);

  if (attacker) {
    attacker.ready = false;
    markStudentAttacked(attacker);
  }

  if (!nextState.combat) {
    nextState.combat = { active: false, attacks: [] };
  }

  nextState.combat.attacks.push({
    attackerInstanceId: action.attackerInstanceId,
    targetId: action.targetId,
  });
  nextState.combat.active = true;

  // Emite evento normativo de declaração de ataque e resolve via barramento determinístico
  // (Popularidade do Daichi e outros efeitos reativos disparam via data-driven triggers)
  const attackEvent = createStudentAttackedEvent(nextState, {
    playerId: action.playerId,
    attackerInstanceId: action.attackerInstanceId,
    targetId: action.targetId,
  });

  const dispatchResult = dispatchEvents(nextState, [attackEvent], {
    cardRegistry: registry,
  });

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}

/**
 * Validação pura e determinística para declaração de bloqueio (ActionType.BLOCK).
 *
 * Conforme as 5 Regras Oficiais de Combate do SCB:
 * 1. Partida ativa e na fase COMBAT.
 * 2. Apenas o jogador defensor pode declarar bloqueadores.
 * 3. O ataque referenciado deve existir em state.combat.attacks.
 * 4. Teto Alpha: Máximo de 1 bloqueador por atacante.
 * 5. Bloqueador deve estar no campo do defensor (zone === BOARD).
 * 6. Teto Alpha: Cada defensor pode bloquear no máximo 1 atacante.
 * 7. Bloqueio Livre: Se o oponente possuir estudantes em campo, ele escolhe com qual estudante
 *    quer bloquear ou se prefere receber o dano no Representante. Qualquer estudante pode bloquear,
 *    não é uma ação exclusiva de quem tem 'Guarda'.
 * 8. Infiltração: Um atacante com Infiltração não pode ser bloqueado por nenhum estudante,
 *    nem mesmo os que têm Guarda.
 */
export function validateBlock(
  state: GameState,
  action: BlockAction,
  registry?: Record<string, CardDefinition>
): BlockValidationResult {
  // 1. Partida ativa
  if (state.status === GameStatus.FINISHED) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.GAME_OVER,
        message: 'A partida já foi encerrada.',
      },
    };
  }

  // 2. Fase de combate
  if (state.phase !== GamePhase.COMBAT) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: `Bloqueios só podem ser declarados na Combat Phase. Fase atual: ${state.phase}.`,
      },
    };
  }

  // 3. Apenas jogador defensor
  const defenderId = getOpponentId(state, state.activePlayerId);
  if (action.playerId !== defenderId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: 'Apenas o jogador defensor pode declarar bloqueadores.',
      },
    };
  }

  const defender = state.players[defenderId];
  if (!defender) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: 'Jogador defensor não encontrado.',
      },
    };
  }

  // 4. Ataque declarado existente
  const attack = state.combat?.attacks?.find(
    (a) => a.attackerInstanceId === action.attackerInstanceId
  );
  if (!attack) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_BLOCK,
        message: `O atacante ${action.attackerInstanceId} não possui um ataque declarado na fase atual.`,
      },
    };
  }

  // 5. Teto Alpha: Máximo de 1 bloqueador por atacante
  if (attack.blockerInstanceId) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_BLOCK,
        message: 'Este atacante já possui um bloqueador atribuído (máximo de 1 bloqueador por atacante).',
      },
    };
  }

  // 6. Bloqueador no campo do defensor
  const blocker = defender.board.find((s) => s.instanceId === action.blockerInstanceId);
  if (!blocker || blocker.zone !== CardZone.BOARD) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.CARD_NOT_IN_BOARD,
        message: `O bloqueador ${action.blockerInstanceId} não está em campo no lado do jogador defensor.`,
      },
    };
  }

  // 7. Cada defensor pode bloquear no máximo 1 atacante (Teto Alpha)
  const isAlreadyBlocking = state.combat?.attacks?.some(
    (a) => a.blockerInstanceId === action.blockerInstanceId
  );
  if (isAlreadyBlocking) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_BLOCK,
        message: 'Este Estudante já está bloqueando outro atacante (máximo de 1 bloqueio por Estudante).',
      },
    };
  }

  // 8. Infiltração: Atacante com Infiltração não pode ser bloqueado por nenhum estudante, nem mesmo os que têm Guarda
  const activePlayer = state.players[state.activePlayerId];
  const attacker = activePlayer?.board.find((s) => s.instanceId === attack.attackerInstanceId);
  if (attacker && hasCardKeyword(attacker, Keyword.INFILTRACAO, registry)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_BLOCK,
        message: 'O atacante possui Infiltração e não pode ser bloqueado por nenhum estudante.',
      },
    };
  }

  // 9. Bloqueio Livre: Qualquer estudante no campo do defensor pode bloquear qualquer ataque.
  // Não há exclusividade de Guarda nem restrição de apenas o alvo bloquear.
  return {
    valid: true,
    details: {
      attack,
      blocker,
    },
  };
}

/**
 * Função utilitária para checagem rápida de legalidade de bloqueio
 */
export function canBlock(
  state: GameState,
  action: BlockAction,
  registry?: Record<string, CardDefinition>
): boolean {
  return validateBlock(state, action, registry).valid;
}

/**
 * Declaração pura de bloqueio (ActionType.BLOCK).
 * Atribui o bloqueador ao ataque declarado correspondente.
 */
export function declareBlock(
  state: GameState,
  action: BlockAction,
  registry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const validation = validateBlock(state, action, registry);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const nextState = cloneGameState(state);
  const targetAttack = nextState.combat?.attacks?.find(
    (a) => a.attackerInstanceId === action.attackerInstanceId
  );

  if (targetAttack) {
    targetAttack.blockerInstanceId = action.blockerInstanceId;
  }

  const blockEvent = createStudentBlockedEvent(nextState, {
    playerId: action.playerId,
    blockerInstanceId: action.blockerInstanceId,
    attackerInstanceId: action.attackerInstanceId,
  });

  const dispatchResult = dispatchEvents(nextState, [blockEvent], {
    cardRegistry: registry,
  });

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}

/**
 * Resolução pura e determinística do combate.
 *
 * Processamento normativo:
 * 1. Para cada ataque declarado em combat.attacks:
 *    - Se BLOQUEADO por Estudante:
 *      * Dano mútuo e simultâneo:
 *        Atacante causa Influence na Moral do bloqueador.
 *        Bloqueador causa Influence na Moral do atacante.
 *    - Se NÃO BLOQUEADO contra Estudante:
 *      * Atacante causa Influence na Moral do Estudante alvo.
 *    - Se NÃO BLOQUEADO contra Representante:
 *      * Atacante causa Influence diretamente na Moral do Representante adversário.
 * 2. Processamento de derrotas (Moral <= 0):
 *    - Estudantes com Moral <= 0 são derrotados e movidos para CardZone.DISCARD.
 *    - Se a Moral de qualquer Representante for <= 0, encerra a partida com vitória/derrota imediata.
 * 3. Limpa a lista de ataques declarados e encerra a fase de combate.
 */
export function resolveCombat(
  state: GameState,
  _registry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  if (state.status === GameStatus.FINISHED) {
    return {
      success: false,
      error: {
        code: ActionErrorCode.GAME_OVER,
        message: 'A partida já foi encerrada.',
      },
    };
  }

  const nextState = cloneGameState(state);

  if (!nextState.combat || nextState.combat.attacks.length === 0) {
    if (nextState.combat) {
      nextState.combat.active = false;
      nextState.combat.attacks = [];
    }
    return { success: true, state: nextState };
  }

  const activePlayer = nextState.players[nextState.activePlayerId];
  const defenderId = getOpponentId(nextState, activePlayer.id);
  const defender = nextState.players[defenderId];

  // 1. Processamento determinístico de dano para cada ataque e emissão de eventos
  const combatEvents: GameEvent[] = [];

  for (const attack of nextState.combat.attacks) {
    const attacker = activePlayer.board.find((s) => s.instanceId === attack.attackerInstanceId);
    if (!attacker) {
      continue; // Atacante não está mais em campo (fizzle)
    }

    const attackerInfluence = attacker.currentInfluence ?? 0;

    if (attack.blockerInstanceId) {
      // Caso 1: Estudante vs Estudante (Bloqueado) — Dano mútuo simultâneo
      const blocker = defender.board.find((s) => s.instanceId === attack.blockerInstanceId);
      if (blocker) {
        const attackerInfluence = calculateCombatInfluence(attacker, blocker, _registry);
        const blockerInfluence = calculateCombatInfluence(blocker, attacker, _registry);

        blocker.currentMorale = (blocker.currentMorale ?? 0) - attackerInfluence;
        attacker.currentMorale = (attacker.currentMorale ?? 0) - blockerInfluence;

        combatEvents.push(
          createDamageDealtEvent(nextState, {
            sourceId: attacker.instanceId,
            targetId: blocker.instanceId,
            targetType: 'STUDENT',
            targetPlayerId: defender.id,
            amount: attackerInfluence,
            isCombatDamage: true,
          })
        );

        combatEvents.push(
          createDamageDealtEvent(nextState, {
            sourceId: blocker.instanceId,
            targetId: attacker.instanceId,
            targetType: 'STUDENT',
            targetPlayerId: activePlayer.id,
            amount: blockerInfluence,
            isCombatDamage: true,
          })
        );
      } else {
        // Se o bloqueador desapareceu antes da resolução, o ataque resolve contra o alvo original
        if (isTargetRepresentative(attack.targetId, defender)) {
          defender.representative.currentMorale -= attackerInfluence;
          combatEvents.push(
            createDamageDealtEvent(nextState, {
              sourceId: attacker.instanceId,
              targetId: defender.id,
              targetType: 'REPRESENTATIVE',
              targetPlayerId: defender.id,
              amount: attackerInfluence,
              isCombatDamage: true,
            })
          );
        } else {
          const targetStudent = defender.board.find((s) => s.instanceId === attack.targetId);
          if (targetStudent) {
            const effectiveAttackerInf = calculateCombatInfluence(attacker, targetStudent, _registry);
            targetStudent.currentMorale = (targetStudent.currentMorale ?? 0) - effectiveAttackerInf;
            combatEvents.push(
              createDamageDealtEvent(nextState, {
                sourceId: attacker.instanceId,
                targetId: targetStudent.instanceId,
                targetType: 'STUDENT',
                targetPlayerId: defender.id,
                amount: effectiveAttackerInf,
                isCombatDamage: true,
              })
            );
          }
        }
      }
    } else {
      // Ataque Não Bloqueado
      if (isTargetRepresentative(attack.targetId, defender)) {
        // Caso 3: Ataque Não Bloqueado a Representante
        defender.representative.currentMorale -= attackerInfluence;
        combatEvents.push(
          createDamageDealtEvent(nextState, {
            sourceId: attacker.instanceId,
            targetId: defender.id,
            targetType: 'REPRESENTATIVE',
            targetPlayerId: defender.id,
            amount: attackerInfluence,
            isCombatDamage: true,
          })
        );
      } else {
        // Caso 2: Ataque Não Bloqueado a Estudante
        const targetStudent = defender.board.find((s) => s.instanceId === attack.targetId);
        if (targetStudent) {
          const effectiveAttackerInf = calculateCombatInfluence(attacker, targetStudent, _registry);
          targetStudent.currentMorale = (targetStudent.currentMorale ?? 0) - effectiveAttackerInf;
          combatEvents.push(
            createDamageDealtEvent(nextState, {
              sourceId: attacker.instanceId,
              targetId: targetStudent.instanceId,
              targetType: 'STUDENT',
              targetPlayerId: defender.id,
              amount: effectiveAttackerInf,
              isCombatDamage: true,
            })
          );
        }
      }
    }
  }

  // 2. Verificação de Derrota do Representante (Condição Imediata de Fim de Partida)
  if (defender.representative.currentMorale <= 0) {
    nextState.status = GameStatus.FINISHED;
    nextState.winnerId = activePlayer.id;
  } else if (activePlayer.representative.currentMorale <= 0) {
    nextState.status = GameStatus.FINISHED;
    nextState.winnerId = defenderId;
  }

  // 3. Verificação de Derrota de Estudantes (Moral <= 0 -> DISCARD) e emissão de STUDENT_DEFEATED
  const defeatedActive: CardInstance[] = [];
  activePlayer.board = activePlayer.board.filter((student) => {
    if ((student.currentMorale ?? 0) <= 0) {
      student.zone = CardZone.DISCARD;
      defeatedActive.push(student);
      combatEvents.push(
        createStudentDefeatedEvent(nextState, {
          playerId: activePlayer.id,
          cardInstanceId: student.instanceId,
          definitionId: student.definitionId,
          reason: 'COMBAT_DAMAGE',
        })
      );
      return false;
    }
    return true;
  });
  activePlayer.discard.push(...defeatedActive);

  const defeatedDefender: CardInstance[] = [];
  defender.board = defender.board.filter((student) => {
    if ((student.currentMorale ?? 0) <= 0) {
      student.zone = CardZone.DISCARD;
      defeatedDefender.push(student);
      combatEvents.push(
        createStudentDefeatedEvent(nextState, {
          playerId: defender.id,
          cardInstanceId: student.instanceId,
          definitionId: student.definitionId,
          reason: 'COMBAT_DAMAGE',
        })
      );
      return false;
    }
    return true;
  });
  defender.discard.push(...defeatedDefender);

  // 4. Limpeza da fase de combate
  nextState.combat.attacks = [];
  nextState.combat.active = false;

  // 5. Despacho dos eventos acumulados do combate no barramento determinístico
  const dispatchResult = dispatchEvents(nextState, combatEvents, {
    cardRegistry: _registry,
  });

  return {
    success: true,
    state: dispatchResult.state,
    events: dispatchResult.emittedEvents,
  };
}

/**
 * Função utilitária de alto nível para executar um combate direto em uma única chamada.
 * Conveniente para suítes de testes ou lógica de IA.
 */
export function executeDirectCombat(
  state: GameState,
  attack: AttackAction,
  blockerInstanceId?: string,
  registry?: Record<string, CardDefinition>
): ActionResult<GameState> {
  const attackRes = declareAttack(state, attack, registry);
  if (!attackRes.success) {
    return attackRes;
  }

  let currentState = attackRes.state;

  if (blockerInstanceId) {
    const opponentId = getOpponentId(currentState, attack.playerId);
    const blockRes = declareBlock(
      currentState,
      {
        type: ActionType.BLOCK,
        playerId: opponentId,
        blockerInstanceId,
        attackerInstanceId: attack.attackerInstanceId,
      },
      registry
    );
    if (!blockRes.success) {
      return blockRes;
    }
    currentState = blockRes.state;
  }

  return resolveCombat(currentState, registry);
}
