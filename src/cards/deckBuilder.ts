import { CardDefinition } from '../core/types/card';
import {
  DEFAULT_REPRESENTATIVE_DAICHI,
  DEFAULT_REPRESENTATIVE_AKIRA,
} from '../core/state/createInitialGameState';
import {
  ALPHA_STUDENT_NOVATO,
  ALPHA_STUDENT_ATLETA_IMPULSO,
  ALPHA_STUDENT_MONITOR,
  ALPHA_STUDENT_REBELDE,
  ALPHA_STUDENT_CAPITAO_IMPULSO,
  ALPHA_STUDENT_ESTRATEGISTA,
  ALPHA_STUDENT_ELITE,
  ALPHA_STUDENT_PROVOCADOR,
  ALPHA_STUDENT_GUARDA,
  ALPHA_STUDENT_INFILTRADOR,
  ALPHA_STUDENT_INFILTRADOR_IMPULSO,
  ALPHA_STUDENT_INSPIRADOR,
  ALPHA_STUDENT_RESILIENTE,
  ALPHA_STUDENT_RECONHECIDO,
  ALPHA_STUDENT_LIDER,
  ALPHA_STUDENT_PROTEGIDO,
  ALPHA_STUDENT_COLABORATIVO,
  ALPHA_STUDENT_RIVAL,
  ALPHA_STUDENT_APRENDIZ,
  ALPHA_ENV_SALA_GREMIO,
  ALPHA_ENV_QUADRA,
  ALPHA_ENV_BIBLIOTECA,
  ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL,
  ALPHA_DEBATE_CONTRAPONTO,
  ALPHA_DEBATE_DISCURSO_MOTIVACIONAL,
  ALPHA_DEBATE_ESCUDO_VERBAL,
  ALPHA_DEBATE_PEDIDO_DE_ORDEM,
  ALPHA_DEBATE_PROVOCACOES_RETORICAS,
  CARD_REGISTRY,
} from './alphaCards';

/**
 * Cria o deck temático equilibrado de 40 cartas para o jogador (Daichi - Clube de Esportes)
 */
export function createDaichiPlayerDeck(): CardDefinition[] {
  const cardsPool: CardDefinition[] = [
    ALPHA_STUDENT_NOVATO,
    ALPHA_STUDENT_ATLETA_IMPULSO,
    ALPHA_STUDENT_CAPITAO_IMPULSO,
    ALPHA_STUDENT_INFILTRADOR,
    ALPHA_STUDENT_INFILTRADOR_IMPULSO,
    ALPHA_STUDENT_PROVOCADOR,
    ALPHA_STUDENT_MONITOR,
    ALPHA_STUDENT_INSPIRADOR,
    ALPHA_STUDENT_REBELDE,
    ALPHA_STUDENT_RESILIENTE,
    ALPHA_STUDENT_LIDER,
    ALPHA_ENV_QUADRA,
    ALPHA_DEBATE_DISCURSO_MOTIVACIONAL,
    ALPHA_DEBATE_PROVOCACOES_RETORICAS,
    ALPHA_DEBATE_CONTRAPONTO,
  ];

  const deck: CardDefinition[] = [];
  for (let i = 0; i < 40; i++) {
    const template = cardsPool[i % cardsPool.length];
    deck.push({
      ...template,
      id: `${template.id}_p1_${i + 1}`,
    });
  }
  return deck;
}

/**
 * Cria o deck temático equilibrado de 40 cartas para a IA (Akira - Grêmio Estudantil)
 */
export function createAkiraAIDeck(): CardDefinition[] {
  const cardsPool: CardDefinition[] = [
    ALPHA_STUDENT_NOVATO,
    ALPHA_STUDENT_ESTRATEGISTA,
    ALPHA_STUDENT_ELITE,
    ALPHA_STUDENT_GUARDA,
    ALPHA_STUDENT_PROTEGIDO,
    ALPHA_STUDENT_COLABORATIVO,
    ALPHA_STUDENT_APRENDIZ,
    ALPHA_STUDENT_RECONHECIDO,
    ALPHA_STUDENT_RIVAL,
    ALPHA_ENV_SALA_GREMIO,
    ALPHA_ENV_BIBLIOTECA,
    ALPHA_DEBATE_ARGUMENTO_IRREFUTAVEL,
    ALPHA_DEBATE_CONTRAPONTO,
    ALPHA_DEBATE_ESCUDO_VERBAL,
    ALPHA_DEBATE_PEDIDO_DE_ORDEM,
  ];

  const deck: CardDefinition[] = [];
  for (let i = 0; i < 40; i++) {
    const template = cardsPool[i % cardsPool.length];
    deck.push({
      ...template,
      id: `${template.id}_p2_${i + 1}`,
    });
  }
  return deck;
}

/**
 * Monta o registro completo de cartas em tempo de execução incluindo as instâncias do deck
 */
export function buildMatchRegistry(playerDeck: CardDefinition[], aiDeck: CardDefinition[]): Record<string, CardDefinition> {
  const registry: Record<string, CardDefinition> = {
    ...CARD_REGISTRY,
    [DEFAULT_REPRESENTATIVE_DAICHI.id]: DEFAULT_REPRESENTATIVE_DAICHI,
    [DEFAULT_REPRESENTATIVE_AKIRA.id]: DEFAULT_REPRESENTATIVE_AKIRA,
  };

  for (const card of playerDeck) {
    registry[card.id] = card;
  }
  for (const card of aiDeck) {
    registry[card.id] = card;
  }

  return registry;
}
