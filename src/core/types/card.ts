import { CardZone } from './zone';

/**
 * Tipos fundamentais de carta em School Card Battle (SCB)
 * Conforme especificado em docs/rules/SCB_GDD.md e docs/rules/SCB_Architecture.md
 */
export enum CardType {
  REPRESENTATIVE = 'REPRESENTATIVE',
  STUDENT = 'STUDENT',
  DEBATE = 'DEBATE',
  EQUIPMENT = 'EQUIPMENT',
  ENVIRONMENT = 'ENVIRONMENT',
}

/**
 * Palavras-chave normativas de SCB (Alpha)
 * Conforme especificado em docs/rules/SCB_Keywords.md
 */
export enum Keyword {
  POPULARIDADE = 'Popularidade',
  DIPLOMACIA = 'Diplomacia',
  INERCIA = 'Inércia',
  IMPULSO = 'Impulso',
  PROTECAO = 'Proteção',
  PROVOCACAO = 'Provocação',
  GUARDA = 'Guarda',
  INSPIRACAO = 'Inspiração',
  PERSISTENCIA = 'Persistência',
  RECONHECIMENTO = 'Reconhecimento',
  RIVALIDADE = 'Rivalidade',
  LIDERANCA = 'Liderança',
  APRENDIZAGEM = 'Aprendizagem',
  COLABORACAO = 'Colaboração',
  INFILTRACAO = 'Infiltração',
  SILENCIO = 'Silêncio',
  SUBSTITUICAO = 'Substituição',
}

/**
 * Traço / Classe escolar de uma carta (ex: 'Atleta', 'Monitor', 'Conselho')
 */
export type Trait = string;

/**
 * Estrutura declarativa de efeito de carta orientada a dados (Data-Driven)
 */
export interface CardEffect {
  id: string;
  type: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Definição estática de uma carta (o que a carta É)
 * Imutável durante o decorrer da partida.
 */
export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  traits: Trait[];
  keywords: Keyword[];
  influence?: number; // Representantes NÃO possuem Influência; Estudantes possuem.
  morale?: number;
  maxMorale?: number;
  text?: string;
  effects?: CardEffect[];

  // Atributos específicos para Representantes
  popularityRequirement?: number;
  highlightCost?: number;
}

/**
 * Instância dinâmica de uma carta em jogo (o que a carta ESTÁ)
 * Representa uma cópia específica em uma zona específica da partida.
 */
export interface CardInstance {
  instanceId: string;
  definitionId: string;
  ownerId: string;
  controllerId: string;
  zone: CardZone;

  currentInfluence?: number;
  currentMorale?: number;
  maxMorale?: number;

  ready: boolean;
  hasInertia: boolean;
  statuses: string[];
}
export { CardZone };

