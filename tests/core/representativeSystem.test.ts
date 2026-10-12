import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../src/core/state/createInitialGameState';
import { ActionType, ActivateHighlightAction } from '../../src/core/types/action';
import { GamePhase } from '../../src/core/types/phase';
import { ActionErrorCode } from '../../src/core/types/error';
import { CardZone, Keyword } from '../../src/core/types/card';
import { applyAction, validateAction } from '../../src/core/engine/gameEngine';
import { advancePhase } from '../../src/core/engine/turnSystem';
import { validateActivateHighlight } from '../../src/core/engine/representativeSystem';

describe('Representative System — Destaque (SCB_Rules.md seções 39, 40 e 41)', () => {
  it('deve validar e ativar Destaque de Daichi com sucesso quando os requisitos forem atendidos', () => {
    const state = createInitialGameState();
    state.phase = GamePhase.MAIN;
    state.activePlayerId = 'player1';

    const p1 = state.players.player1;
    p1.energy = 5;
    p1.maxEnergy = 5;
    p1.representative.popularity = 3;
    p1.representative.highlightAvailable = true;

    // Adiciona um estudante aliado ao campo
    p1.board.push({
      instanceId: 'daichi_student_1',
      definitionId: 'student_1',
      ownerId: 'player1',
      controllerId: 'player1',
      zone: CardZone.BOARD,
      currentInfluence: 2,
      currentMorale: 3,
      maxMorale: 3,
      ready: true,
      hasInertia: false,
      statuses: [],
    });

    const action: ActivateHighlightAction = {
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player1',
    };

    // 1. Validação
    const val = validateAction(state, action);
    expect(val.valid).toBe(true);

    // 2. Aplicação
    const result = applyAction(state, action);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const nextP1 = result.state.players.player1;
    // Energia NÃO é deduzida (Destaque não custa Energia)
    expect(nextP1.energy).toBe(5);
    // Popularidade e disponibilidade resetadas conforme Seção 39
    expect(nextP1.representative.popularity).toBe(0);
    expect(nextP1.representative.highlightAvailable).toBe(false);

    // Estudante aliado recebeu +1 Influência e +1 Moral
    const student = nextP1.board[0];
    expect(student.currentInfluence).toBe(3);
    expect(student.currentMorale).toBe(4);
    expect(student.statuses).toContain('TEMP_HIGHLIGHT_BUFF');
  });

  it('deve reverter o buff temporário do Destaque de Daichi no final do turno', () => {
    let state = createInitialGameState();
    state.phase = GamePhase.MAIN;
    state.activePlayerId = 'player1';

    const p1 = state.players.player1;
    p1.energy = 5;
    p1.representative.highlightAvailable = true;

    p1.board.push({
      instanceId: 'student_buff_test',
      definitionId: 'student_1',
      ownerId: 'player1',
      controllerId: 'player1',
      zone: CardZone.BOARD,
      currentInfluence: 2,
      currentMorale: 3,
      maxMorale: 3,
      ready: true,
      hasInertia: false,
      statuses: [],
    });

    const action: ActivateHighlightAction = {
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player1',
    };

    const res = applyAction(state, action);
    expect(res.success).toBe(true);
    if (!res.success) return;
    state = res.state;

    expect(state.players.player1.board[0].currentInfluence).toBe(3);
    expect(state.players.player1.board[0].currentMorale).toBe(4);

    // Avança para DEBATE -> COMBAT -> END
    state.phase = GamePhase.END;
    const endRes = advancePhase(state, { type: ActionType.ADVANCE_PHASE, playerId: 'player1' });
    expect(endRes.success).toBe(true);
    if (!endRes.success) return;

    // No próximo turno, estudante deve ter voltado para 2/3
    const revertedStudent = endRes.state.players.player1.board[0];
    expect(revertedStudent.currentInfluence).toBe(2);
    expect(revertedStudent.currentMorale).toBe(3);
    expect(revertedStudent.statuses).not.toContain('TEMP_HIGHLIGHT_BUFF');
  });

  it('deve aplicar Silêncio nos estudantes adversários com o Destaque de Akira', () => {
    const state = createInitialGameState();
    state.phase = GamePhase.MAIN;
    state.activePlayerId = 'player2'; // Turno de Akira

    const p2 = state.players.player2;
    p2.energy = 5;
    p2.representative.highlightAvailable = true;

    // Estudante no campo do jogador 1
    state.players.player1.board.push({
      instanceId: 'enemy_student_1',
      definitionId: 'student_1',
      ownerId: 'player1',
      controllerId: 'player1',
      zone: CardZone.BOARD,
      currentInfluence: 2,
      currentMorale: 3,
      ready: true,
      hasInertia: false,
      statuses: [],
    });

    const action: ActivateHighlightAction = {
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player2',
    };

    const result = applyAction(state, action);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const enemyStudent = result.state.players.player1.board[0];
    expect(enemyStudent.statuses).toContain(Keyword.SILENCIO);
    expect(enemyStudent.statuses).toContain('TEMP_SILENCE');
  });

  it('deve permitir ativação mesmo com 0 de Energia, pois Destaque requer apenas Popularidade', () => {
    const state = createInitialGameState();
    state.phase = GamePhase.MAIN;
    state.activePlayerId = 'player1';

    state.players.player1.energy = 0; // 0 de Energia
    state.players.player1.representative.popularity = 3;
    state.players.player1.representative.highlightAvailable = true;

    const action: ActivateHighlightAction = {
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player1',
    };

    const val = validateActivateHighlight(state, action);
    expect(val.valid).toBe(true);
  });

  it('deve rejeitar ativação com código HIGHLIGHT_NOT_AVAILABLE se Popularidade for insuficiente', () => {
    const state = createInitialGameState();
    state.phase = GamePhase.MAIN;
    state.activePlayerId = 'player1';

    state.players.player1.energy = 5;
    state.players.player1.representative.popularity = 2; // Requisito é 3
    state.players.player1.representative.highlightAvailable = false;

    const action: ActivateHighlightAction = {
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player1',
    };

    const val = validateActivateHighlight(state, action);
    expect(val.valid).toBe(false);
    expect(val.error?.code).toBe(ActionErrorCode.HIGHLIGHT_NOT_AVAILABLE);
  });

  it('deve rejeitar ativação se executada fora da Main Phase', () => {
    const state = createInitialGameState();
    state.phase = GamePhase.COMBAT; // Fora da Main Phase
    state.activePlayerId = 'player1';

    state.players.player1.energy = 5;
    state.players.player1.representative.highlightAvailable = true;

    const action: ActivateHighlightAction = {
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player1',
    };

    const val = validateActivateHighlight(state, action);
    expect(val.valid).toBe(false);
    expect(val.error?.code).toBe(ActionErrorCode.INVALID_PHASE);
  });

  it('deve rejeitar ativação solicitada por jogador inativo', () => {
    const state = createInitialGameState();
    state.phase = GamePhase.MAIN;
    state.activePlayerId = 'player1';

    state.players.player2.energy = 5;
    state.players.player2.representative.highlightAvailable = true;

    // player2 tenta ativar durante o turno de player1
    const action: ActivateHighlightAction = {
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player2',
    };

    const val = validateActivateHighlight(state, action);
    expect(val.valid).toBe(false);
    expect(val.error?.code).toBe(ActionErrorCode.INVALID_PLAYER);
  });
});
