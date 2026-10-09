import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  DEFAULT_REPRESENTATIVE_DAICHI,
  DEFAULT_REPRESENTATIVE_AKIRA,
  GamePhase,
  GameStatus,
  CardZone,
  Keyword,
  CardType,
} from '../../src/core';

describe('Core Engine — Initial Game State (createInitialGameState)', () => {
  it('deve inicializar uma partida válida com 2 jogadores por padrão', () => {
    const state = createInitialGameState();

    expect(state).toBeDefined();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe(GamePhase.START);
    expect(state.status).toBe(GameStatus.IN_PROGRESS);
    expect(state.activePlayerId).toBe('player1');
    expect(state.winnerId).toBeNull();

    // 2 jogadores configurados
    const playerIds = Object.keys(state.players);
    expect(playerIds).toHaveLength(2);
    expect(playerIds).toContain('player1');
    expect(playerIds).toContain('player2');
  });

  it('deve inicializar os Representantes com Moral 20, Popularidade 0 e Destaque indisponível', () => {
    const state = createInitialGameState();

    const p1 = state.players['player1'];
    const p2 = state.players['player2'];

    // Jogador 1 (Daichi)
    expect(p1.representative.name).toBe(DEFAULT_REPRESENTATIVE_DAICHI.name);
    expect(p1.representative.currentMorale).toBe(20);
    expect(p1.representative.maxMorale).toBe(20);
    expect(p1.representative.popularity).toBe(0);
    expect(p1.representative.highlightAvailable).toBe(false);
    expect(p1.representative.highlightCost).toBe(5);

    // Jogador 2 (Akira)
    expect(p2.representative.name).toBe(DEFAULT_REPRESENTATIVE_AKIRA.name);
    expect(p2.representative.currentMorale).toBe(20);
    expect(p2.representative.maxMorale).toBe(20);
    expect(p2.representative.popularity).toBe(0);
    expect(p2.representative.highlightAvailable).toBe(false);
  });

  it('deve inicializar a Energia dos jogadores em 1 e Max Energia em 1', () => {
    const state = createInitialGameState();

    for (const player of Object.values(state.players)) {
      expect(player.energy).toBe(1);
      expect(player.maxEnergy).toBe(1);
    }
  });

  it('deve distribuir 4 cartas na mão inicial e alocar as restantes no Deck', () => {
    const state = createInitialGameState();

    for (const player of Object.values(state.players)) {
      expect(player.hand).toHaveLength(4);
      expect(player.deck).toHaveLength(36); // 40 - 4 = 36

      // Verifica se a zona das cartas foi setada corretamente
      player.hand.forEach((card) => {
        expect(card.zone).toBe(CardZone.HAND);
        expect(card.ownerId).toBe(player.id);
      });

      player.deck.forEach((card) => {
        expect(card.zone).toBe(CardZone.DECK);
        expect(card.ownerId).toBe(player.id);
      });
    }
  });

  it('deve inicializar com campo vazio (board e environment vazios, descarte e detenção vazios)', () => {
    const state = createInitialGameState();

    for (const player of Object.values(state.players)) {
      expect(player.board).toHaveLength(0);
      expect(player.environment).toBeNull();
      expect(player.discard).toHaveLength(0);
      expect(player.detention).toHaveLength(0);
    }
  });

  it('deve configurar Diplomacia ativa no primeiro turno e Mulligan pendente', () => {
    const state = createInitialGameState();

    for (const player of Object.values(state.players)) {
      expect(player.diplomacyActive).toBe(true);
      expect(player.hasMulliganed).toBe(false);
    }
  });

  it('deve inicializar a cadeia de Debate inativa com 0 ações', () => {
    const state = createInitialGameState();

    expect(state.debate.active).toBe(false);
    expect(state.debate.initiatorPlayerId).toBeNull();
    expect(state.debate.currentStep).toBe(0);
    expect(state.debate.actions).toHaveLength(0);
    expect(state.stack).toHaveLength(0);
  });

  it('deve ser 100% determinístico quando executado com a mesma seed de RNG', () => {
    const stateA = createInitialGameState({ rngSeed: 42, shuffleDeck: true });
    const stateB = createInitialGameState({ rngSeed: 42, shuffleDeck: true });
    const stateC = createInitialGameState({ rngSeed: 99999, shuffleDeck: true });

    // Com mesma seed, mãos devem ser idênticas na mesma ordem
    const p1HandA = stateA.players['player1'].hand.map((c) => c.instanceId);
    const p1HandB = stateB.players['player1'].hand.map((c) => c.instanceId);
    const p1HandC = stateC.players['player1'].hand.map((c) => c.instanceId);

    expect(p1HandA).toEqual(p1HandB);
    expect(p1HandA).not.toEqual(p1HandC);
  });

  it('deve respeitar a opção de não comprar mão inicial automaticamente', () => {
    const state = createInitialGameState({ autoDrawInitialHand: false });

    for (const player of Object.values(state.players)) {
      expect(player.hand).toHaveLength(0);
      expect(player.deck).toHaveLength(40);
    }
  });

  it('deve permitir injetar decks e representantes customizados', () => {
    const customRep = {
      id: 'rep_custom',
      name: 'Representante Especial',
      type: CardType.REPRESENTATIVE,
      cost: 0,
      traits: ['ClubeDeCinema'],
      keywords: [Keyword.POPULARIDADE],
      morale: 25,
      maxMorale: 25,
      popularityRequirement: 4,
      highlightCost: 6,
    };

    const state = createInitialGameState({
      player1: {
        id: 'alice',
        name: 'Alice',
        representative: customRep,
      },
    });

    const alice = state.players['alice'];
    expect(alice).toBeDefined();
    expect(alice.representative.name).toBe('Representante Especial');
    expect(alice.representative.currentMorale).toBe(25);
    expect(alice.representative.popularityRequirement).toBe(4);
    expect(alice.representative.highlightCost).toBe(6);
  });
});
