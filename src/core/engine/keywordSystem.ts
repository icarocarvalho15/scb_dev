import { GameState } from '../types/state';
import { CardInstance, Keyword, CardDefinition } from '../types/card';
import { ActionError, ActionErrorCode } from '../types/error';
import { cloneGameState } from './turnSystem';
import { findCardDefinition } from '../../cards/alphaCards';

/**
 * Keyword Engine — Centralizador e avaliador modular de Keywords e restrições de SCB.
 * Conforme docs/rules/SCB_Keywords.md e docs/agents/SCB_Keyword_Engineer.md.
 *
 * Princípios Arquiteturais:
 * 1. Zero Hardcoding: Proibido verificar nomes de carta (ex: card.name === "...").
 *    Toda lógica decorre puramente da presença de Keywords, traits ou definições de efeito.
 * 2. Imutabilidade Estrita: Não muta GameState in-place; operações de atualização retornam novos clones.
 * 3. Modularidade e Desacoplamento: Centraliza as regras operacionais de cada Keyword do Alpha:
 *    - Inércia, Impulso, Provocação, Guarda, Infiltração
 *    - Silêncio, Proteção
 *    - Persistência, Inspiração, Reconhecimento, Liderança, Colaboração, Rivalidade, Aprendizagem
 */

// ============================================================================
// 1. CONSULTA E VERIFICAÇÃO DE KEYWORDS (BASE & SILÊNCIO)
// ============================================================================

/**
 * Verifica se um Estudante está sob efeito de Silêncio.
 * Conforme docs/rules/SCB_Keywords.md Seção 4.16:
 * Estudantes sob Silêncio não podem atacar e perdem todas as suas habilidades ativas e passivas.
 */
export function isSilenced(
  instance: CardInstance,
  registry?: Record<string, CardDefinition>
): boolean {
  if (instance.statuses && instance.statuses.length > 0) {
    const hasSilencedStatus = instance.statuses.some((s) => {
      const lower = s.toLowerCase();
      return (
        lower === 'silêncio' ||
        lower === 'silencio' ||
        lower === 'status_silencio' ||
        lower === 'status_silêncio' ||
        lower === 'keyword_silêncio' ||
        lower === 'keyword_silencio'
      );
    });
    if (hasSilencedStatus) {
      return true;
    }
  }

  const def = findCardDefinition(instance.definitionId, registry);
  if (def?.keywords?.includes(Keyword.SILENCIO)) {
    return true;
  }

  return false;
}

/**
 * Verifica se uma carta ou instância possui determinada Keyword
 * (consulta estrutural independente do estado de Silêncio).
 */
export function hasKeyword(
  card: CardInstance | CardDefinition,
  keyword: Keyword,
  registry?: Record<string, CardDefinition>
): boolean {
  // Se for CardInstance
  if ('instanceId' in card) {
    if (card.statuses && card.statuses.length > 0) {
      const keyLower = keyword.toLowerCase();
      const hasStatus = card.statuses.some((s) => {
        const sLower = s.toLowerCase();
        return (
          sLower === keyLower ||
          sLower === `keyword_${keyLower}` ||
          s === keyword
        );
      });
      if (hasStatus) {
        return true;
      }
    }

    const def = findCardDefinition(card.definitionId, registry);
    if (def?.keywords?.includes(keyword)) {
      return true;
    }
    return false;
  }

  // Se for CardDefinition
  return card.keywords?.includes(keyword) ?? false;
}

/**
 * Verifica se uma Keyword está ATIVA na instância da carta.
 * Regra Normativa Estrita:
 * Se a carta estiver sob Silêncio, ela PERDE todas as suas habilidades ativas e passivas,
 * bem como suas Keywords operacionais (Provocação, Guarda, Infiltração, Proteção, etc.),
 * com exceção da própria Keyword SILÊNCIO.
 */
export function hasActiveKeyword(
  instance: CardInstance,
  keyword: Keyword,
  registry?: Record<string, CardDefinition>
): boolean {
  if (keyword !== Keyword.SILENCIO && isSilenced(instance, registry)) {
    return false;
  }
  return hasKeyword(instance, keyword, registry);
}

/**
 * Alias canônico retrocompatível para consulta de keywords em instâncias.
 */
export function hasCardKeyword(
  instance: CardInstance,
  keyword: Keyword,
  registry?: Record<string, CardDefinition>
): boolean {
  return hasActiveKeyword(instance, keyword, registry);
}

// ============================================================================
// 2. PROTEÇÃO (KEYWORD PROTEÇÃO)
// ============================================================================

/**
 * Verifica se o Estudante possui Proteção ativa.
 * Conforme docs/rules/SCB_Keywords.md Seção 4.5:
 * Portadores de Proteção não podem ser escolhidos como alvos de habilidades e/ou Debates.
 */
export function isProtected(
  instance: CardInstance,
  registry?: Record<string, CardDefinition>
): boolean {
  return hasActiveKeyword(instance, Keyword.PROTECAO, registry);
}

/**
 * Validação normativa de alvo contra a restrição de Proteção.
 * Se o alvo possuir Proteção, a ação/efeito direcionado é ilegal.
 */
export function validateTargetProtection(
  target: CardInstance,
  registry?: Record<string, CardDefinition>
): { valid: boolean; error?: ActionError } {
  if (isProtected(target, registry)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.PROTECTION_RESTRICTION,
        message: 'O Estudante alvo possui Proteção e não pode ser alvo de habilidades e/ou Debates.',
      },
    };
  }
  return { valid: true };
}

// ============================================================================
// 3. COMBATE & RESTRIÇÃO (INÉRCIA, IMPULSO, PROVOCAÇÃO, INFILTRAÇÃO, SILÊNCIO)
// ============================================================================

/**
 * Valida a permissão básica de declaração de ataque considerando Silêncio e Inércia/Impulso.
 */
export function canDeclareAttack(
  attacker: CardInstance,
  registry?: Record<string, CardDefinition>
): { valid: boolean; error?: ActionError } {
  // 1. Silêncio impede ataques
  if (isSilenced(attacker, registry)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_ATTACK,
        message: 'Estudantes sob Silêncio não podem atacar.',
      },
    };
  }

  // 2. Inércia sem Impulso impede ataques
  const hasImpulse = hasActiveKeyword(attacker, Keyword.IMPULSO, registry);
  if (attacker.hasInertia && !hasImpulse) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INERTIA_RESTRICTION,
        message: 'Inércia: Estudante não pode atacar no turno de entrada a menos que possua Impulso.',
      },
    };
  }

  return { valid: true };
}

/**
 * Avalia o direcionamento obrigatório exigido por Estudantes com Provocação.
 * Se o oponente possuir Estudantes com Provocação ativos e o atacante não possuir Infiltração,
 * o ataque é obrigado a ter como alvo um desses Estudantes com Provocação.
 */
export function evaluateProvocation(
  opponentBoard: CardInstance[],
  attacker: CardInstance,
  _targetId: string,
  isRepresentativeTarget: boolean,
  targetStudent?: CardInstance,
  registry?: Record<string, CardDefinition>
): { valid: boolean; error?: ActionError } {
  const opponentHasProvocation = opponentBoard.some((s) =>
    hasActiveKeyword(s, Keyword.PROVOCACAO, registry)
  );
  const hasInfiltration = hasActiveKeyword(attacker, Keyword.INFILTRACAO, registry);

  if (opponentHasProvocation && !hasInfiltration) {
    if (isRepresentativeTarget) {
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
      targetStudent && hasActiveKeyword(targetStudent, Keyword.PROVOCACAO, registry);
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

  return { valid: true };
}

/**
 * Valida a tentativa de bloqueio contra um atacante considerando Infiltração.
 * Estudantes com Infiltração não podem ser bloqueados por nenhum estudante (mesmo com Guarda).
 */
export function canBlockAttacker(
  attacker: CardInstance,
  _blocker: CardInstance,
  registry?: Record<string, CardDefinition>
): { valid: boolean; error?: ActionError } {
  if (hasActiveKeyword(attacker, Keyword.INFILTRACAO, registry)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_BLOCK,
        message: 'O atacante possui Infiltração e não pode ser bloqueado por nenhum estudante.',
      },
    };
  }
  return { valid: true };
}

// ============================================================================
// 4. RIVALIDADE (KEYWORD RIVALIDADE)
// ============================================================================

/**
 * Avalia o bônus situacional de Rivalidade.
 * Conforme docs/rules/SCB_Keywords.md Seção 4.11:
 * "Concede bônus situacional enquanto enfrenta uma Classe diferente."
 * Se o portador possuir Rivalidade e o oponente em combate NÃO compartilhar nenhum
 * traço/classe com ele, concede bônus de +1 de Influência durante a resolução.
 */
export function evaluateRivalryBonus(
  student: CardInstance,
  opponentStudent: CardInstance,
  registry?: Record<string, CardDefinition>
): number {
  if (!hasActiveKeyword(student, Keyword.RIVALIDADE, registry)) {
    return 0;
  }

  const studentDef = findCardDefinition(student.definitionId, registry);
  const opponentDef = findCardDefinition(opponentStudent.definitionId, registry);

  if (!studentDef || !opponentDef) {
    return 0;
  }

  const studentTraits = studentDef.traits ?? [];
  const opponentTraits = opponentDef.traits ?? [];

  const sharesTrait = studentTraits.some((trait) => opponentTraits.includes(trait));
  // Se NÃO compartilham nenhuma classe, ativa o bônus de Rivalidade
  if (!sharesTrait && studentTraits.length > 0 && opponentTraits.length > 0) {
    return 1;
  }

  return 0;
}

/**
 * Calcula a Influência de combate efetiva de um Estudante contra um alvo específico,
 * incluindo modificadores dinâmicos de combate (como Rivalidade).
 */
export function calculateCombatInfluence(
  student: CardInstance,
  targetStudent?: CardInstance,
  registry?: Record<string, CardDefinition>
): number {
  const base = student.currentInfluence ?? 0;
  if (!targetStudent) {
    return base;
  }
  return base + evaluateRivalryBonus(student, targetStudent, registry);
}

// ============================================================================
// 5. APRENDIZAGEM (KEYWORD APRENDIZAGEM)
// ============================================================================

/**
 * Registra que um Estudante realizou ataque durante o turno atual.
 * Invalida imediatamente qualquer elegibilidade de Aprendizagem.
 */
export function markStudentAttacked(student: CardInstance): void {
  if (!student.statuses.includes('ATTACKED_THIS_TURN')) {
    student.statuses.push('ATTACKED_THIS_TURN');
  }
  if (student.statuses.includes('APRENDIZAGEM_ELIGIBLE')) {
    student.statuses = student.statuses.filter((s) => s !== 'APRENDIZAGEM_ELIGIBLE');
  }
}

/**
 * Atualiza o status de elegibilidade de Aprendizagem ao final do turno do jogador ativo.
 * Conforme docs/rules/SCB_Keywords.md Seção 4.13:
 * Concede bônus quando o Estudante NÃO realizou ataque no turno anterior.
 */
export function updateLearningTurnStatus(
  state: GameState,
  activePlayerId: string,
  registry?: Record<string, CardDefinition>
): GameState {
  const nextState = cloneGameState(state);
  const activePlayer = nextState.players[activePlayerId];
  if (!activePlayer) return nextState;

  for (const student of activePlayer.board) {
    if (!hasActiveKeyword(student, Keyword.APRENDIZAGEM, registry)) {
      continue;
    }

    const hasAttacked = student.statuses.includes('ATTACKED_THIS_TURN');
    if (hasAttacked) {
      // Atacou neste turno: remove a flag de ataque para o próximo ciclo e perde a elegibilidade
      student.statuses = student.statuses.filter(
        (s) => s !== 'ATTACKED_THIS_TURN' && s !== 'APRENDIZAGEM_ELIGIBLE'
      );
    } else {
      // NÃO atacou neste turno: torna-se elegível para o bônus de Aprendizagem
      if (!student.statuses.includes('APRENDIZAGEM_ELIGIBLE')) {
        student.statuses.push('APRENDIZAGEM_ELIGIBLE');
      }
    }
  }

  return nextState;
}

// ============================================================================
// 6. AURAS E EFEITOS CONTÍNUOS DE KEYWORDS (RECONHECIMENTO, LIDERANÇA, COLABORAÇÃO, APRENDIZAGEM)
// ============================================================================

/**
 * Avalia de forma pura e determinística todos os efeitos contínuos e auras das Keywords em campo:
 * 1. Silêncio: Desativa e remove todos os bônus contínuos passivos de cartas silenciadas.
 * 2. Reconhecimento: Concede +1 Influência enquanto o Representante tiver Popularidade > 0.
 * 3. Liderança: Concede +1 Influência enquanto compartilha Classe com o Representante.
 * 4. Colaboração: Concede +1 Influência enquanto atua junto de outro Estudante da mesma Classe no campo.
 * 5. Aprendizagem: Concede +1 Influência se o Estudante não atacou no turno anterior (APRENDIZAGEM_ELIGIBLE).
 */
export function evaluateContinuousKeywords(
  state: GameState,
  cardRegistry?: Record<string, CardDefinition>
): GameState {
  const nextState = cloneGameState(state);

  for (const player of Object.values(nextState.players)) {
    const repDef = findCardDefinition(player.representative.definitionId, cardRegistry);
    const hasPopularity = player.representative.popularity > 0;
    const repTraits = repDef?.traits ?? [];

    for (const student of player.board) {
      const studentDef = findCardDefinition(student.definitionId, cardRegistry);
      if (!studentDef) continue;

      const silenced = isSilenced(student, cardRegistry);

      // Limpeza obrigatória de auras se a unidade estiver sob Silêncio
      if (silenced) {
        if (student.statuses.includes('RECONHECIMENTO_ACTIVE')) {
          student.statuses = student.statuses.filter((s) => s !== 'RECONHECIMENTO_ACTIVE');
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
        if (student.statuses.includes('LIDERANCA_ACTIVE')) {
          student.statuses = student.statuses.filter((s) => s !== 'LIDERANCA_ACTIVE');
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
        if (student.statuses.includes('COLABORACAO_ACTIVE')) {
          student.statuses = student.statuses.filter((s) => s !== 'COLABORACAO_ACTIVE');
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
        if (student.statuses.includes('APRENDIZAGEM_ACTIVE')) {
          student.statuses = student.statuses.filter((s) => s !== 'APRENDIZAGEM_ACTIVE');
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
        continue;
      }

      // 1. RECONHECIMENTO
      if (hasKeyword(student, Keyword.RECONHECIMENTO, cardRegistry)) {
        const statusName = 'RECONHECIMENTO_ACTIVE';
        const hasStatus = student.statuses.includes(statusName);

        if (hasPopularity && !hasStatus) {
          student.statuses.push(statusName);
          student.currentInfluence = (student.currentInfluence ?? 0) + 1;
        } else if (!hasPopularity && hasStatus) {
          student.statuses = student.statuses.filter((s) => s !== statusName);
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
      }

      // 2. LIDERANÇA
      if (hasKeyword(student, Keyword.LIDERANCA, cardRegistry)) {
        const sharesRepTrait = studentDef.traits.some((t) => repTraits.includes(t));
        const statusName = 'LIDERANCA_ACTIVE';
        const hasStatus = student.statuses.includes(statusName);

        if (sharesRepTrait && !hasStatus) {
          student.statuses.push(statusName);
          student.currentInfluence = (student.currentInfluence ?? 0) + 1;
        } else if (!sharesRepTrait && hasStatus) {
          student.statuses = student.statuses.filter((s) => s !== statusName);
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
      }

      // 3. COLABORAÇÃO
      if (hasKeyword(student, Keyword.COLABORACAO, cardRegistry)) {
        const hasOtherAlliedWithSameTrait = player.board.some((other) => {
          if (other.instanceId === student.instanceId) return false;
          const otherDef = findCardDefinition(other.definitionId, cardRegistry);
          return otherDef?.traits.some((t) => studentDef.traits.includes(t));
        });

        const statusName = 'COLABORACAO_ACTIVE';
        const hasStatus = student.statuses.includes(statusName);

        if (hasOtherAlliedWithSameTrait && !hasStatus) {
          student.statuses.push(statusName);
          student.currentInfluence = (student.currentInfluence ?? 0) + 1;
        } else if (!hasOtherAlliedWithSameTrait && hasStatus) {
          student.statuses = student.statuses.filter((s) => s !== statusName);
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
      }

      // 4. APRENDIZAGEM
      if (hasKeyword(student, Keyword.APRENDIZAGEM, cardRegistry)) {
        const isEligible = student.statuses.includes('APRENDIZAGEM_ELIGIBLE');
        const statusName = 'APRENDIZAGEM_ACTIVE';
        const hasStatus = student.statuses.includes(statusName);

        if (isEligible && !hasStatus) {
          student.statuses.push(statusName);
          student.currentInfluence = (student.currentInfluence ?? 0) + 1;
        } else if (!isEligible && hasStatus) {
          student.statuses = student.statuses.filter((s) => s !== statusName);
          student.currentInfluence = Math.max(0, (student.currentInfluence ?? 1) - 1);
        }
      }
    }
  }

  return nextState;
}
