import { describe, it, expect } from 'vitest';
import {
  CardType,
  CardZone,
  GamePhase,
  ActionType,
  ActionErrorCode,
  Keyword,
  GameStatus,
} from '../../src/core';

describe('Core Types & Contracts Integrity', () => {
  it('deve conter todos os tipos de carta fundamentais de SCB', () => {
    expect(CardType.REPRESENTATIVE).toBe('REPRESENTATIVE');
    expect(CardType.STUDENT).toBe('STUDENT');
    expect(CardType.DEBATE).toBe('DEBATE');
    expect(CardType.EQUIPMENT).toBe('EQUIPMENT');
    expect(CardType.ENVIRONMENT).toBe('ENVIRONMENT');
  });

  it('deve conter todas as zonas de cartas normativas', () => {
    expect(CardZone.DECK).toBe('DECK');
    expect(CardZone.HAND).toBe('HAND');
    expect(CardZone.BOARD).toBe('BOARD');
    expect(CardZone.DISCARD).toBe('DISCARD');
    expect(CardZone.DETENTION).toBe('DETENTION');
    expect(CardZone.ENVIRONMENT).toBe('ENVIRONMENT');
    expect(CardZone.DEBATE).toBe('DEBATE');
  });

  it('deve conter as 5 fases canônicas do turno', () => {
    expect(GamePhase.START).toBe('START');
    expect(GamePhase.MAIN).toBe('MAIN');
    expect(GamePhase.DEBATE).toBe('DEBATE');
    expect(GamePhase.COMBAT).toBe('COMBAT');
    expect(GamePhase.END).toBe('END');
  });

  it('deve conter os tipos de ação fundamentais', () => {
    expect(ActionType.PLAY_CARD).toBe('PLAY_CARD');
    expect(ActionType.ATTACK).toBe('ATTACK');
    expect(ActionType.BLOCK).toBe('BLOCK');
    expect(ActionType.START_DEBATE).toBe('START_DEBATE');
    expect(ActionType.RESPOND_DEBATE).toBe('RESPOND_DEBATE');
    expect(ActionType.ACTIVATE_HIGHLIGHT).toBe('ACTIVATE_HIGHLIGHT');
    expect(ActionType.MULLIGAN).toBe('MULLIGAN');
    expect(ActionType.END_PHASE).toBe('END_PHASE');
  });

  it('deve conter os códigos de erro estruturados para validação', () => {
    expect(ActionErrorCode.NOT_ENOUGH_ENERGY).toBe('NOT_ENOUGH_ENERGY');
    expect(ActionErrorCode.BOARD_FULL).toBe('BOARD_FULL');
    expect(ActionErrorCode.DIPLOMACY_RESTRICTION).toBe('DIPLOMACY_RESTRICTION');
    expect(ActionErrorCode.INERTIA_RESTRICTION).toBe('INERTIA_RESTRICTION');
    expect(ActionErrorCode.DEBATE_CHAIN_FULL).toBe('DEBATE_CHAIN_FULL');
  });

  it('deve validar a integridade das Keywords normativas do Alpha', () => {
    expect(Keyword.POPULARIDADE).toBe('Popularidade');
    expect(Keyword.DIPLOMACIA).toBe('Diplomacia');
    expect(Keyword.INERCIA).toBe('Inércia');
    expect(Keyword.IMPULSO).toBe('Impulso');
    expect(Keyword.PROVOCACAO).toBe('Provocação');
    expect(Keyword.GUARDA).toBe('Guarda');
    expect(Keyword.INFILTRACAO).toBe('Infiltração');
    expect(Keyword.SILENCIO).toBe('Silêncio');
  });

  it('deve conter os estados de ciclo de vida do jogo', () => {
    expect(GameStatus.NOT_STARTED).toBe('NOT_STARTED');
    expect(GameStatus.IN_PROGRESS).toBe('IN_PROGRESS');
    expect(GameStatus.FINISHED).toBe('FINISHED');
  });
});
