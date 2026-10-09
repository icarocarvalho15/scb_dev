import { CardDefinition, CardType, Keyword } from '../core/types/card';
import { GameEventType } from '../core/types/event';
import { EffectType, EffectTargetScope, EffectDuration, TriggerCondition } from '../core/types/effect';
import {
  DEFAULT_REPRESENTATIVE_DAICHI,
  DEFAULT_REPRESENTATIVE_AKIRA,
  DEFAULT_STUDENT_CARD,
} from '../core/state/createInitialGameState';

/**
 * Catálogo de cartas de teste para o ambiente Alpha de School Card Battle (SCB)
 * Conforme docs/rules/SCB_Architecture.md Seção 7 e Seção 16.
 */

// ==========================================
// ESTUDANTES ALPHA
// ==========================================

export const ALPHA_STUDENT_NOVATO: CardDefinition = {
  id: 'alpha_student_novato',
  name: 'Novato Ansioso',
  type: CardType.STUDENT,
  cost: 1,
  traits: ['Estudante', 'Calouro'],
  keywords: [Keyword.INERCIA],
  influence: 1,
  morale: 2,
  maxMorale: 2,
  text: 'Um calouro recém-chegado com vontade de aprender.',
};

export const ALPHA_STUDENT_ATLETA_IMPULSO: CardDefinition = {
  id: 'alpha_student_atleta_impulso',
  name: 'Velocista do Clube',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Atleta'],
  keywords: [Keyword.IMPULSO],
  influence: 2,
  morale: 1,
  maxMorale: 1,
  text: 'Impulso. Pode atacar no turno em que entra em campo.',
};

export const ALPHA_STUDENT_MONITOR: CardDefinition = {
  id: 'alpha_student_monitor',
  name: 'Monitor de Corredor',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Monitor', 'Disciplina'],
  keywords: [Keyword.INERCIA],
  influence: 1,
  morale: 4,
  maxMorale: 4,
  text: 'Mantém a ordem nos corredores com firmeza.',
};

export const ALPHA_STUDENT_REBELDE: CardDefinition = {
  id: 'alpha_student_rebelde',
  name: 'Veterano Rebelde',
  type: CardType.STUDENT,
  cost: 3,
  traits: ['Rebelde'],
  keywords: [Keyword.INERCIA],
  influence: 3,
  morale: 3,
  maxMorale: 3,
  text: 'Desafia as convenções do conselho estudantil.',
};

export const ALPHA_STUDENT_CAPITAO_IMPULSO: CardDefinition = {
  id: 'alpha_student_capitao_impulso',
  name: 'Capitão do Time',
  type: CardType.STUDENT,
  cost: 4,
  traits: ['Atleta', 'Líder'],
  keywords: [Keyword.IMPULSO],
  influence: 3,
  morale: 4,
  maxMorale: 4,
  text: 'Impulso. Lidera a ofensiva com determinação imediata.',
};

export const ALPHA_STUDENT_ESTRATEGISTA: CardDefinition = {
  id: 'alpha_student_estrategista',
  name: 'Estrategista do Grêmio',
  type: CardType.STUDENT,
  cost: 5,
  traits: ['Gremio', 'Estrategista'],
  keywords: [Keyword.INERCIA],
  influence: 4,
  morale: 5,
  maxMorale: 5,
  text: 'Calcula minuciosamente cada movimento da partida.',
};

export const ALPHA_STUDENT_ELITE: CardDefinition = {
  id: 'alpha_student_elite',
  name: 'Representante de Elite',
  type: CardType.STUDENT,
  cost: 8,
  traits: ['Honra', 'Elite'],
  keywords: [Keyword.INERCIA],
  influence: 7,
  morale: 8,
  maxMorale: 8,
  text: 'Estudante lendário com presença avassaladora.',
};

export const ALPHA_STUDENT_PROVOCADOR: CardDefinition = {
  id: 'alpha_student_provocador',
  name: 'Valentão Provocador',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Rebelde'],
  keywords: [Keyword.PROVOCACAO, Keyword.INERCIA],
  influence: 2,
  morale: 3,
  maxMorale: 3,
  text: 'Provocação. Ataques direcionados ao Representante devem priorizá-lo.',
};

export const ALPHA_STUDENT_GUARDA: CardDefinition = {
  id: 'alpha_student_guarda',
  name: 'Guarda Escolar',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Monitor'],
  keywords: [Keyword.GUARDA, Keyword.INERCIA],
  influence: 1,
  morale: 4,
  maxMorale: 4,
  text: 'Guarda. Pode interceptar ataques direcionados ao Representante.',
};

export const ALPHA_STUDENT_INFILTRADOR: CardDefinition = {
  id: 'alpha_student_infiltrador',
  name: 'Infiltrador Furtivo',
  type: CardType.STUDENT,
  cost: 3,
  traits: ['Estrategista'],
  keywords: [Keyword.INFILTRACAO, Keyword.INERCIA],
  influence: 2,
  morale: 2,
  maxMorale: 2,
  text: 'Infiltração. Ignora Provocação e Guarda para atacar o Representante.',
};

export const ALPHA_STUDENT_INFILTRADOR_IMPULSO: CardDefinition = {
  id: 'alpha_student_infiltrador_impulso',
  name: 'Infiltrador Veloz',
  type: CardType.STUDENT,
  cost: 4,
  traits: ['Atleta', 'Estrategista'],
  keywords: [Keyword.INFILTRACAO, Keyword.IMPULSO],
  influence: 3,
  morale: 2,
  maxMorale: 2,
  text: 'Infiltração e Impulso. Ataca de imediato e ignora defesas ao visar o Representante.',
};

export const ALPHA_STUDENT_INSPIRADOR: CardDefinition = {
  id: 'alpha_student_inspirador',
  name: 'Líder de Torcida Inspiradora',
  type: CardType.STUDENT,
  cost: 3,
  traits: ['Atleta', 'Inspirador'],
  keywords: [Keyword.INSPIRACAO, Keyword.INERCIA],
  influence: 2,
  morale: 3,
  maxMorale: 3,
  text: 'Inspiração: Ao entrar em campo, concede +1 Influência para todos os Estudantes aliados até o final do turno.',
  triggers: [
    {
      id: 'trigger_inspiracao_on_enter',
      event: GameEventType.STUDENT_ENTERED,
      condition: TriggerCondition.ON_ENTER,
      targetScope: 'SELF',
      effects: [
        {
          type: EffectType.MODIFY_STAT,
          target: EffectTargetScope.ALL_ALLIED_STUDENTS,
          stat: 'influence',
          amount: 1,
          duration: EffectDuration.UNTIL_END_OF_TURN,
        },
      ],
      description: 'Concede +1 Influência a todos os aliados até o final do turno.',
    },
  ],
};

export const ALPHA_STUDENT_RESILIENTE: CardDefinition = {
  id: 'alpha_student_resiliente',
  name: 'Capitão Resiliente',
  type: CardType.STUDENT,
  cost: 3,
  traits: ['Resiliente'],
  keywords: [Keyword.PERSISTENCIA, Keyword.INERCIA],
  influence: 2,
  morale: 2,
  maxMorale: 2,
  text: 'Persistência: A primeira vez que este Estudante é derrotado, retorna ao campo com 1 de Moral.',
  triggers: [
    {
      id: 'trigger_persistencia_on_defeat',
      event: GameEventType.STUDENT_DEFEATED,
      condition: TriggerCondition.ON_DEFEATED,
      targetScope: 'SELF',
      effects: [
        {
          type: EffectType.REVIVE_STUDENT,
          target: EffectTargetScope.SELF,
          amount: 1,
        },
      ],
      description: 'Retorna ao campo com 1 de Moral ao ser derrotado.',
    },
  ],
};

export const ALPHA_STUDENT_RECONHECIDO: CardDefinition = {
  id: 'alpha_student_reconhecido',
  name: 'Veterano Reconhecido',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Honra'],
  keywords: [Keyword.RECONHECIMENTO, Keyword.INERCIA],
  influence: 2,
  morale: 3,
  maxMorale: 3,
  text: 'Reconhecimento: Recebe +1 Influência enquanto seu Representante possui acúmulo de Popularidade.',
};

export const ALPHA_STUDENT_LIDER: CardDefinition = {
  id: 'alpha_student_lider',
  name: 'Atleta Disciplinado',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Atleta'],
  keywords: [Keyword.LIDERANCA, Keyword.INERCIA],
  influence: 2,
  morale: 3,
  maxMorale: 3,
  text: 'Liderança: Recebe +1 Influência se compartilhar Classe com seu Representante.',
};

export const ALPHA_STUDENT_SILENCIADO: CardDefinition = {
  id: 'alpha_student_silenciado',
  name: 'Estudante Suspenso',
  type: CardType.STUDENT,
  cost: 1,
  traits: ['Rebelde'],
  keywords: [Keyword.SILENCIO, Keyword.INERCIA],
  influence: 3,
  morale: 3,
  maxMorale: 3,
  text: 'Silêncio. Não pode atacar e perde todas as suas habilidades ativas e passivas.',
};

export const ALPHA_STUDENT_PROTEGIDO: CardDefinition = {
  id: 'alpha_student_protegido',
  name: 'Porta-Voz Blindado',
  type: CardType.STUDENT,
  cost: 3,
  traits: ['Gremio', 'Diplomata'],
  keywords: [Keyword.PROTECAO, Keyword.INERCIA],
  influence: 2,
  morale: 3,
  maxMorale: 3,
  text: 'Proteção. Não pode ser alvo de habilidades e/ou Debates.',
};

export const ALPHA_STUDENT_COLABORATIVO: CardDefinition = {
  id: 'alpha_student_colaborativo',
  name: 'Atleta em Equipe',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Atleta'],
  keywords: [Keyword.COLABORACAO, Keyword.INERCIA],
  influence: 2,
  morale: 3,
  maxMorale: 3,
  text: 'Colaboração: Recebe +1 Influência enquanto atua junto de outro Estudante Atleta no campo.',
};

export const ALPHA_STUDENT_RIVAL: CardDefinition = {
  id: 'alpha_student_rival',
  name: 'Duelista Rival',
  type: CardType.STUDENT,
  cost: 3,
  traits: ['Rebelde'],
  keywords: [Keyword.RIVALIDADE, Keyword.INERCIA],
  influence: 2,
  morale: 3,
  maxMorale: 3,
  text: 'Rivalidade: Recebe +1 Influência em combate ao enfrentar um Estudante de Classe diferente.',
};

export const ALPHA_STUDENT_APRENDIZ: CardDefinition = {
  id: 'alpha_student_aprendiz',
  name: 'Pesquisador Aplicado',
  type: CardType.STUDENT,
  cost: 2,
  traits: ['Academico'],
  keywords: [Keyword.APRENDIZAGEM, Keyword.INERCIA],
  influence: 1,
  morale: 3,
  maxMorale: 3,
  text: 'Aprendizagem: Recebe +1 Influência se não realizou ataque no turno anterior.',
};

// ==========================================
// AMBIENTES ALPHA
// ==========================================

export const ALPHA_ENV_SALA_GREMIO: CardDefinition = {
  id: 'alpha_env_sala_gremio',
  name: 'Sala do Grêmio Estudantil',
  type: CardType.ENVIRONMENT,
  cost: 1,
  traits: ['Ambiente', 'Gremio'],
  keywords: [],
  text: 'O coração administrativo das atividades da escola.',
};

export const ALPHA_ENV_QUADRA: CardDefinition = {
  id: 'alpha_env_quadra',
  name: 'Quadra Poliesportiva',
  type: CardType.ENVIRONMENT,
  cost: 2,
  traits: ['Ambiente', 'Esportes'],
  keywords: [],
  text: 'Local de competições intensas e treinamento atlético.',
};

export const ALPHA_ENV_BIBLIOTECA: CardDefinition = {
  id: 'alpha_env_biblioteca',
  name: 'Biblioteca Central',
  type: CardType.ENVIRONMENT,
  cost: 3,
  traits: ['Ambiente', 'Academico'],
  keywords: [],
  text: 'Silêncio absoluto para estudos focados e estratégias profundas.',
};

// ==========================================
// CARTAS DE DEBATE ALPHA
// ==========================================

export const ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL: CardDefinition = {
  id: 'alpha_debate_argumento_irrefutavel',
  name: 'Argumento Irrefutável',
  type: CardType.DEBATE,
  cost: 2,
  traits: ['Debate', 'Academico'],
  keywords: [],
  text: 'Reduz a Moral de um Estudante alvo em 2. Compre 1 carta.',
  effects: [
    {
      type: EffectType.MODIFY_STAT,
      target: EffectTargetScope.TARGET_STUDENT,
      stat: 'morale',
      amount: -2,
    },
    {
      type: EffectType.DRAW_CARD,
      target: EffectTargetScope.OWNER_REPRESENTATIVE,
      amount: 1,
    },
  ],
};

export const ALPHA_DEBATE_CONTRAPONTO: CardDefinition = {
  id: 'alpha_debate_contraponto',
  name: 'Contraponto Afiado',
  type: CardType.DEBATE,
  cost: 1,
  traits: ['Debate', 'Retorica'],
  keywords: [],
  text: 'Reduz a Moral de um Estudante alvo em 1.',
  effects: [
    {
      type: EffectType.MODIFY_STAT,
      target: EffectTargetScope.TARGET_STUDENT,
      stat: 'morale',
      amount: -1,
    },
  ],
};

export const ALPHA_DEBATE_DISCURSO_MOTIVACIONAL: CardDefinition = {
  id: 'alpha_debate_discurso_motivacional',
  name: 'Discurso Motivacional',
  type: CardType.DEBATE,
  cost: 2,
  traits: ['Debate', 'Inspiracao'],
  keywords: [],
  text: 'Concede +2 de Moral a um Estudante aliado. Ganha 1 de Popularidade.',
  effects: [
    {
      type: EffectType.MODIFY_STAT,
      target: EffectTargetScope.TARGET_STUDENT,
      stat: 'morale',
      amount: 2,
    },
    {
      type: EffectType.GAIN_POPULARITY,
      target: EffectTargetScope.OWNER_REPRESENTATIVE,
      amount: 1,
    },
  ],
};

export const ALPHA_DEBATE_ESCUDO_VERBAL: CardDefinition = {
  id: 'alpha_debate_escudo_verbal',
  name: 'Escudo Verbal',
  type: CardType.DEBATE,
  cost: 1,
  traits: ['Debate', 'Defesa'],
  keywords: [],
  text: 'Concede Proteção a um Estudante aliado alvo.',
  effects: [
    {
      type: EffectType.GRANT_KEYWORD,
      target: EffectTargetScope.TARGET_STUDENT,
      keyword: Keyword.PROTECAO,
      status: 'KEYWORD_Proteção',
    },
  ],
};

export const ALPHA_DEBATE_PEDIDO_DE_ORDEM: CardDefinition = {
  id: 'alpha_debate_pedido_de_ordem',
  name: 'Pedido de Ordem',
  type: CardType.DEBATE,
  cost: 1,
  traits: ['Debate', 'Regulamento'],
  keywords: [],
  text: 'Restaura 1 de Energia e compra 1 carta.',
  effects: [
    {
      type: EffectType.GAIN_ENERGY,
      target: EffectTargetScope.OWNER_REPRESENTATIVE,
      amount: 1,
    },
    {
      type: EffectType.DRAW_CARD,
      target: EffectTargetScope.OWNER_REPRESENTATIVE,
      amount: 1,
    },
  ],
};

export const ALPHA_DEBATE_PROVOCACOES_RETORICAS: CardDefinition = {
  id: 'alpha_debate_provocacoes_retoricas',
  name: 'Provocações Retóricas',
  type: CardType.DEBATE,
  cost: 2,
  traits: ['Debate', 'Provocacao'],
  keywords: [],
  text: 'Reduz a Influência de um Estudante alvo em 2 até o fim do turno.',
  effects: [
    {
      type: EffectType.MODIFY_STAT,
      target: EffectTargetScope.TARGET_STUDENT,
      stat: 'influence',
      amount: -2,
      duration: EffectDuration.UNTIL_END_OF_TURN,
    },
  ],
};

// ==========================================
// REGISTRO E MAPAS DE BUSCA
// ==========================================

export const ALPHA_CARDS: Record<string, CardDefinition> = {
  [ALPHA_STUDENT_NOVATO.id]: ALPHA_STUDENT_NOVATO,
  [ALPHA_STUDENT_ATLETA_IMPULSO.id]: ALPHA_STUDENT_ATLETA_IMPULSO,
  [ALPHA_STUDENT_MONITOR.id]: ALPHA_STUDENT_MONITOR,
  [ALPHA_STUDENT_REBELDE.id]: ALPHA_STUDENT_REBELDE,
  [ALPHA_STUDENT_CAPITAO_IMPULSO.id]: ALPHA_STUDENT_CAPITAO_IMPULSO,
  [ALPHA_STUDENT_ESTRATEGISTA.id]: ALPHA_STUDENT_ESTRATEGISTA,
  [ALPHA_STUDENT_ELITE.id]: ALPHA_STUDENT_ELITE,
  [ALPHA_STUDENT_PROVOCADOR.id]: ALPHA_STUDENT_PROVOCADOR,
  [ALPHA_STUDENT_GUARDA.id]: ALPHA_STUDENT_GUARDA,
  [ALPHA_STUDENT_INFILTRADOR.id]: ALPHA_STUDENT_INFILTRADOR,
  [ALPHA_STUDENT_INFILTRADOR_IMPULSO.id]: ALPHA_STUDENT_INFILTRADOR_IMPULSO,
  [ALPHA_STUDENT_INSPIRADOR.id]: ALPHA_STUDENT_INSPIRADOR,
  [ALPHA_STUDENT_RESILIENTE.id]: ALPHA_STUDENT_RESILIENTE,
  [ALPHA_STUDENT_RECONHECIDO.id]: ALPHA_STUDENT_RECONHECIDO,
  [ALPHA_STUDENT_LIDER.id]: ALPHA_STUDENT_LIDER,
  [ALPHA_STUDENT_SILENCIADO.id]: ALPHA_STUDENT_SILENCIADO,
  [ALPHA_STUDENT_PROTEGIDO.id]: ALPHA_STUDENT_PROTEGIDO,
  [ALPHA_STUDENT_COLABORATIVO.id]: ALPHA_STUDENT_COLABORATIVO,
  [ALPHA_STUDENT_RIVAL.id]: ALPHA_STUDENT_RIVAL,
  [ALPHA_STUDENT_APRENDIZ.id]: ALPHA_STUDENT_APRENDIZ,
  [ALPHA_ENV_SALA_GREMIO.id]: ALPHA_ENV_SALA_GREMIO,
  [ALPHA_ENV_QUADRA.id]: ALPHA_ENV_QUADRA,
  [ALPHA_ENV_BIBLIOTECA.id]: ALPHA_ENV_BIBLIOTECA,
  [ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL.id]: ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL,
  [ALPHA_DEBATE_CONTRAPONTO.id]: ALPHA_DEBATE_CONTRAPONTO,
  [ALPHA_DEBATE_DISCURSO_MOTIVACIONAL.id]: ALPHA_DEBATE_DISCURSO_MOTIVACIONAL,
  [ALPHA_DEBATE_ESCUDO_VERBAL.id]: ALPHA_DEBATE_ESCUDO_VERBAL,
  [ALPHA_DEBATE_PEDIDO_DE_ORDEM.id]: ALPHA_DEBATE_PEDIDO_DE_ORDEM,
  [ALPHA_DEBATE_PROVOCACOES_RETORICAS.id]: ALPHA_DEBATE_PROVOCACOES_RETORICAS,
};

/**
 * Registro unificado padrão com todas as cartas de referência conhecidas
 */
export const CARD_REGISTRY: Record<string, CardDefinition> = {
  ...ALPHA_CARDS,
  [DEFAULT_STUDENT_CARD.id]: DEFAULT_STUDENT_CARD,
  [DEFAULT_REPRESENTATIVE_DAICHI.id]: DEFAULT_REPRESENTATIVE_DAICHI,
  [DEFAULT_REPRESENTATIVE_AKIRA.id]: DEFAULT_REPRESENTATIVE_AKIRA,
};

/**
 * Localiza a definição estática de uma carta pelo seu definitionId.
 * Suporta registros customizados passados por parâmetro ou catálogo padrão Alpha,
 * além do fallback determinístico para cartas geradas proceduralmente (ex: student_1..40).
 */
export function findCardDefinition(
  definitionId: string,
  customRegistry?: Record<string, CardDefinition>
): CardDefinition | undefined {
  if (customRegistry && customRegistry[definitionId]) {
    return customRegistry[definitionId];
  }
  if (CARD_REGISTRY[definitionId]) {
    return CARD_REGISTRY[definitionId];
  }
  // Suporte a student_1, student_2, etc. criados pelo createDefaultDeck
  if (definitionId.startsWith('student_')) {
    return {
      ...DEFAULT_STUDENT_CARD,
      id: definitionId,
    };
  }
  return undefined;
}
