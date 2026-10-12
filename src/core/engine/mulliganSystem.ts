import { GameState, GameStatus } from '../types/state';
import { ActionErrorCode, ActionResult, ActionError } from '../types/error';
import { MulliganAction } from '../types/action';
import { CardZone } from '../types/zone';
import { CardInstance, CardDefinition, CardType } from '../types/card';
import { GameEvent, GameEventType } from '../types/event';
import { cloneGameState } from './turnSystem';

/**
 * Embaralha cartas com determinismo se rng for fornecido (Fisher-Yates)
 */
function shuffleCards<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Gerador pseudo-aleatório determinístico Mulberry32 baseado na semente do estado.
 * Conforme docs/rules/SCB_Architecture.md seção 34.
 */
function createMulberry32(seed: number) {
  let s = seed >>> 0;
  return {
    next(): number {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    getSeed(): number {
      return s >>> 0;
    },
  };
}

/**
 * Validação declarativa para ActionType.MULLIGAN.
 * Conforme docs/rules/SCB_Rules.md Seção 6 e docs/rules/SCB_Architecture.md Seção 14.
 */
export function validateMulligan(
  state: GameState,
  action: MulliganAction,
  _options?: { cardRegistry?: Record<string, CardDefinition> }
): { valid: boolean; error?: ActionError } {
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

  // 2. Jogador deve existir no estado
  const player = state.players[action.playerId];
  if (!player) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PLAYER,
        message: `Jogador ${action.playerId} não encontrado no estado de jogo.`,
      },
    };
  }

  // 3. Oportunidade única: rejeição se o jogador já realizou mulligan
  if (player.hasMulliganed) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.ALREADY_MULLIGANED,
        message: 'O jogador já utilizou sua oportunidade única de Mulligan nesta partida.',
      },
    };
  }

  // 4. Momento de ocorrência: etapa de abertura da partida (Turno 1)
  if (state.turn > 2 || player.turnCount > 1) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.INVALID_PHASE,
        message: 'O Mulligan só pode ser realizado na etapa de abertura da partida.',
      },
    };
  }

  // 5. Array de substituição deve ser válido
  if (!Array.isArray(action.cardInstanceIdsToReplace)) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: 'A lista de cartas para substituição deve ser um array.',
      },
    };
  }

  // 6. Limite de cartas: no máximo 4 cartas (ou quantidade atual na mão)
  if (action.cardInstanceIdsToReplace.length > 4) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.HAND_LIMIT_EXCEEDED,
        message: 'Não é possível substituir mais do que 4 cartas no Mulligan.',
      },
    };
  }

  // 7. Não pode conter IDs duplicados
  const uniqueSet = new Set(action.cardInstanceIdsToReplace);
  if (uniqueSet.size !== action.cardInstanceIdsToReplace.length) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: 'A lista de substituição contém cartas duplicadas.',
      },
    };
  }

  // 8. Todas as cartas selecionadas devem pertencer à mão atual do jogador
  for (const cardId of action.cardInstanceIdsToReplace) {
    const cardInHand = player.hand.some((c) => c.instanceId === cardId);
    if (!cardInHand) {
      return {
        valid: false,
        error: {
          code: ActionErrorCode.CARD_NOT_IN_HAND,
          message: `A carta ${cardId} não está na mão do jogador.`,
        },
      };
    }
  }

  // 9. O baralho precisa ter cartas suficientes para repor as trocas
  if (player.deck.length < action.cardInstanceIdsToReplace.length) {
    return {
      valid: false,
      error: {
        code: ActionErrorCode.DECK_EMPTY,
        message: 'O baralho não possui cartas suficientes para repor as cartas substituídas.',
      },
    };
  }

  return { valid: true };
}

/**
 * Executa a ação de Mulligan de forma pura, imutável e determinística.
 * Conforme docs/rules/SCB_Rules.md Seção 6:
 * - Parcial: seleciona de 0 a 4 cartas.
 * - 0 cartas equivale a manter a mão intacta.
 * - 1 a 4 cartas: devolve ao deck, compra mesma quantidade do topo, reembaralha deterministicamente.
 * - Mão do jogador permanece exatamente 4 cartas.
 * - Marca hasMulliganed = true.
 */
export function executeMulligan(
  state: GameState,
  action: MulliganAction,
  options?: { cardRegistry?: Record<string, CardDefinition> }
): ActionResult<GameState> {
  const validation = validateMulligan(state, action, options);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error!,
    };
  }

  const nextState = cloneGameState(state);
  const player = nextState.players[action.playerId];
  const toReplaceIds = action.cardInstanceIdsToReplace;

  // 1. Manter Mão (0 cartas substituídas)
  if (toReplaceIds.length === 0) {
    player.hasMulliganed = true;
    return {
      success: true,
      state: nextState,
      events: [],
    };
  }

  // 2. Substituição parcial de 1 a 4 cartas
  const cardsToReturn: CardInstance[] = [];
  const remainingHand: CardInstance[] = [];

  for (const card of player.hand) {
    if (toReplaceIds.includes(card.instanceId)) {
      cardsToReturn.push({ ...card, zone: CardZone.DECK });
    } else {
      remainingHand.push(card);
    }
  }

  // Compras de reposição retiradas do topo do deck
  const newDrawnCards: CardInstance[] = [];
  const events: GameEvent[] = [];
  const countToDraw = cardsToReturn.length;

  for (let i = 0; i < countToDraw; i++) {
    if (player.deck.length > 0) {
      const drawn = player.deck.shift()!;
      drawn.zone = CardZone.HAND;
      newDrawnCards.push(drawn);
      events.push({
        id: `event_mulligan_draw_${Date.now()}_${drawn.instanceId}`,
        type: GameEventType.CARD_DRAWN,
        turn: nextState.turn,
        phase: nextState.phase,
        playerId: action.playerId,
        cardInstanceId: drawn.instanceId,
      });
    }
  }

  // Devolve as cartas substituídas para o baralho
  player.deck.push(...cardsToReturn);

  // Embaralha o baralho de forma determinística via rngSeed
  const prng = createMulberry32(nextState.rngSeed);
  player.deck = shuffleCards(player.deck, () => prng.next());
  nextState.rngSeed = prng.getSeed();

  // Atualiza a mão (tamanho permanece exatamente 4 cartas)
  player.hand = [...remainingHand, ...newDrawnCards];
  player.hasMulliganed = true;

  return {
    success: true,
    state: nextState,
    events,
  };
}

/**
 * Avaliação heurística determinística de Mulligan para a IA (AIPlayer).
 * Conforme Diretiva Alpha 1.0:
 * - Avalia as 4 cartas iniciais;
 * - Se não possuir nenhum Estudante de custo 1-2, descarta cartas de custo > 2 e Debates situacionais;
 * - Se já possuir pelo menos um Estudante de custo 1-2, descarta apenas cartas pesadas (custo > 3);
 * - Se a mão já possui boa curva e jogabilidade inicial, mantém a mão (retorna array vazio).
 */
export function evaluateAiMulligan(
  hand: CardInstance[],
  cardRegistry?: Record<string, CardDefinition>
): string[] {
  if (!hand || hand.length === 0) {
    return [];
  }

  const cardDetails = hand.map((card) => {
    const def = cardRegistry ? cardRegistry[card.definitionId] : undefined;
    return { card, def };
  });

  // Estudantes de início de jogo (custo 1 ou 2)
  const lowCostStudents = cardDetails.filter(
    ({ def }) => def && def.type === CardType.STUDENT && def.cost <= 2
  );

  const hasEarlyPlay = lowCostStudents.length > 0;
  const toReplace: string[] = [];

  for (const { card, def } of cardDetails) {
    if (!def) continue;

    if (!hasEarlyPlay) {
      // Sem estudantes de custo 1-2: substitui cartas pesadas ou não-estudantes
      if (def.cost > 2 || def.type !== CardType.STUDENT) {
        toReplace.push(card.instanceId);
      }
    } else {
      // Com estudantes de custo 1-2: substitui cartas muito caras (custo > 3)
      if (def.cost > 3) {
        toReplace.push(card.instanceId);
      }
    }
  }

  return toReplace;
}
