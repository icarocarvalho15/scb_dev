import {
  CardDefinition,
  CardInstance,
  CardType,
  Keyword,
} from '../types/card';
import { GameEventType } from '../types/event';
import { EffectType, EffectTargetScope, TriggerCondition } from '../types/effect';
import { CardZone } from '../types/zone';
import { GamePhase } from '../types/phase';
import { PlayerId, PlayerState, RepresentativeState } from '../types/player';
import { CombatState, DebateState, GameState, GameStatus } from '../types/state';

/**
 * Representante padrão de referência 1 (Daichi - Atleta)
 * Conforme docs/rules/SCB_Rules.md seção 40
 */
export const DEFAULT_REPRESENTATIVE_DAICHI: CardDefinition = {
  id: 'rep_daichi',
  name: 'Daichi',
  type: CardType.REPRESENTATIVE,
  cost: 0,
  traits: ['Atleta'],
  keywords: [Keyword.POPULARIDADE],
  morale: 20,
  maxMorale: 20,
  popularityRequirement: 3,
  highlightCost: 5,
  text: 'Ganha Popularidade quando um Estudante aliado declara um ataque. Destaque (5): Estudantes aliados recebem +1/+1 este turno.',
  triggers: [
    {
      id: 'trigger_daichi_popularity_on_ally_attack',
      event: GameEventType.STUDENT_ATTACKED,
      condition: TriggerCondition.ON_ALLY_ATTACK,
      targetScope: 'ALLY',
      effects: [
        {
          type: EffectType.GAIN_POPULARITY,
          target: EffectTargetScope.OWNER_REPRESENTATIVE,
          amount: 1,
        },
      ],
      description: 'Ganha 1 de Popularidade quando um Estudante aliado declara um ataque.',
    },
  ],
};

/**
 * Representante padrão de referência 2 (Akira - Grêmio Estudantil)
 * Conforme docs/rules/SCB_Rules.md seção 41
 */
export const DEFAULT_REPRESENTATIVE_AKIRA: CardDefinition = {
  id: 'rep_akira',
  name: 'Akira',
  type: CardType.REPRESENTATIVE,
  cost: 0,
  traits: ['Gremio'],
  keywords: [Keyword.POPULARIDADE],
  morale: 20,
  maxMorale: 20,
  popularityRequirement: 3,
  highlightCost: 5,
  text: 'Ganha Popularidade quando um Debate é resolvido. Destaque (5): Estudantes adversários perdem habilidades.',
  triggers: [
    {
      id: 'trigger_akira_popularity_on_debate_resolved',
      event: GameEventType.DEBATE_RESOLVED,
      condition: TriggerCondition.ON_DEBATE_RESOLVED,
      targetScope: 'ANY',
      effects: [
        {
          type: EffectType.GAIN_POPULARITY,
          target: EffectTargetScope.OWNER_REPRESENTATIVE,
          amount: 1,
        },
      ],
      description: 'Ganha 1 de Popularidade quando um Debate é resolvido.',
    },
  ],
};

/**
 * Estudante de teste padrão para preenchimento de decks iniciais
 */
export const DEFAULT_STUDENT_CARD: CardDefinition = {
  id: 'student_novato',
  name: 'Calouro Dedicado',
  type: CardType.STUDENT,
  cost: 1,
  traits: ['Estudante'],
  keywords: [Keyword.INERCIA],
  influence: 1,
  morale: 2,
  maxMorale: 2,
  text: 'Estudante comum.',
};

/**
 * Configuração inicial de um jogador para a partida
 */
export interface PlayerInitialConfig {
  id: PlayerId;
  name: string;
  isAI?: boolean;
  representative: CardDefinition;
  deck: CardDefinition[];
}

/**
 * Opções de criação da partida inicial
 */
export interface CreateInitialGameOptions {
  matchId?: string;
  player1?: Partial<PlayerInitialConfig>;
  player2?: Partial<PlayerInitialConfig>;
  rngSeed?: number;
  initialHandSize?: number; // Padrão: 4 (conforme docs/rules/SCB_Rules.md seção 5)
  autoDrawInitialHand?: boolean; // Se verdadeiro, compra 4 cartas automaticamente no setup
  shuffleDeck?: boolean;
}

/**
 * Gerador pseudo-aleatório simples determinístico (Mulberry32)
 * Garante determinismo total a partir da seed (docs/rules/SCB_Architecture.md seção 34)
 */
function createDeterministicRandom(seed: number) {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Embaralha cartas com determinismo se rng for fornecido
 */
function shuffle<T>(array: T[], rng?: () => number): T[] {
  const result = [...array];
  const random = rng ?? Math.random;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Cria uma instância de carta a partir da sua definição estática
 */
export function createCardInstance(
  definition: CardDefinition,
  ownerId: PlayerId,
  instanceIndex: number,
  zone: CardZone = CardZone.DECK
): CardInstance {
  return {
    instanceId: `${ownerId}_${definition.id}_${instanceIndex}`,
    definitionId: definition.id,
    ownerId,
    controllerId: ownerId,
    zone,
    currentInfluence: definition.influence,
    currentMorale: definition.morale,
    maxMorale: definition.maxMorale ?? definition.morale,
    ready: false,
    hasInertia: definition.keywords?.includes(Keyword.INERCIA) ?? true,
    statuses: [],
  };
}

/**
 * Cria o estado inicial de um Representante
 */
export function createRepresentativeState(
  definition: CardDefinition,
  ownerId: PlayerId
): RepresentativeState {
  const morale = definition.morale ?? 20;
  return {
    definitionId: definition.id,
    name: definition.name,
    ownerId,
    currentMorale: morale,
    maxMorale: definition.maxMorale ?? morale,
    popularity: 0,
    popularityRequirement: definition.popularityRequirement ?? 3,
    highlightAvailable: false,
    highlightCost: definition.highlightCost ?? 5,
  };
}

/**
 * Monta o PlayerState inicial
 */
function buildInitialPlayerState(
  config: PlayerInitialConfig,
  handSize: number,
  autoDraw: boolean,
  rng?: () => number
): PlayerState {
  const representative = createRepresentativeState(config.representative, config.id);

  // Cria instâncias das cartas do deck
  let instances: CardInstance[] = config.deck.map((def, idx) =>
    createCardInstance(def, config.id, idx + 1, CardZone.DECK)
  );

  if (rng) {
    instances = shuffle(instances, rng);
  }

  const hand: CardInstance[] = [];
  const deck: CardInstance[] = [];

  if (autoDraw && instances.length >= handSize) {
    for (let i = 0; i < handSize; i++) {
      const card = instances[i];
      card.zone = CardZone.HAND;
      hand.push(card);
    }
    for (let i = handSize; i < instances.length; i++) {
      deck.push(instances[i]);
    }
  } else {
    deck.push(...instances);
  }

  return {
    id: config.id,
    name: config.name,
    isAI: config.isAI ?? false,
    representative,
    deck,
    hand,
    discard: [],
    detention: [],
    board: [],
    environment: null,
    energy: 1, // Conforme docs/rules/SCB_Rules.md seção 8 (inicia em 1)
    maxEnergy: 1, // Conforme docs/rules/SCB_Rules.md seção 8 (máximo inicial é 1)
    hasMulliganed: false,
    diplomacyActive: true, // Conforme docs/rules/SCB_Rules.md seção 7 (ativo no turno 1)
    turnCount: 0,
  };
}

/**
 * Cria 40 cartas padrão para testes caso deck não seja fornecido
 */
function createDefaultDeck(): CardDefinition[] {
  return Array.from({ length: 40 }, (_, i) => ({
    ...DEFAULT_STUDENT_CARD,
    id: `student_${i + 1}`,
    name: `Estudante #${i + 1}`,
  }));
}

/**
 * Cria o estado de partida inicial (GameState) puro, imutável e determinístico.
 *
 * Conforme docs/rules/SCB_Architecture.md seção 5 e 33 e docs/rules/SCB_Rules.md seção 4.
 */
export function createInitialGameState(
  options: CreateInitialGameOptions = {}
): GameState {
  const matchId = options.matchId ?? `match_${Date.now()}`;
  const rngSeed = options.rngSeed ?? 1337;
  const initialHandSize = options.initialHandSize ?? 4;
  const autoDrawInitialHand = options.autoDrawInitialHand ?? true;
  const rng = options.shuffleDeck ? createDeterministicRandom(rngSeed) : undefined;

  const p1Config: PlayerInitialConfig = {
    id: options.player1?.id ?? 'player1',
    name: options.player1?.name ?? 'Jogador 1',
    isAI: options.player1?.isAI ?? false,
    representative: options.player1?.representative ?? DEFAULT_REPRESENTATIVE_DAICHI,
    deck: options.player1?.deck ?? createDefaultDeck(),
  };

  const p2Config: PlayerInitialConfig = {
    id: options.player2?.id ?? 'player2',
    name: options.player2?.name ?? 'IA Adversária',
    isAI: options.player2?.isAI ?? true,
    representative: options.player2?.representative ?? DEFAULT_REPRESENTATIVE_AKIRA,
    deck: options.player2?.deck ?? createDefaultDeck(),
  };

  const p1State = buildInitialPlayerState(p1Config, initialHandSize, autoDrawInitialHand, rng);
  const p2State = buildInitialPlayerState(p2Config, initialHandSize, autoDrawInitialHand, rng);

  // Jogador inicial está no seu turno 1
  p1State.turnCount = 1;

  const initialDebate: DebateState = {
    active: false,
    initiatorPlayerId: null,
    currentStep: 0,
    actions: [],
  };

  const initialCombat: CombatState = {
    active: false,
    attacks: [],
  };

  return {
    matchId,
    turn: 1,
    activePlayerId: p1Config.id,
    phase: GamePhase.START,
    status: GameStatus.IN_PROGRESS,
    players: {
      [p1Config.id]: p1State,
      [p2Config.id]: p2State,
    },
    debate: initialDebate,
    combat: initialCombat,
    stack: [],
    winnerId: null,
    rngSeed,
    history: [],
  };
}
