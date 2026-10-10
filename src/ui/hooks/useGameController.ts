import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, GameStatus } from '../../core/types/state';
import { GameAction, ActionType } from '../../core/types/action';
import { CardInstance, CardDefinition, CardType } from '../../core/types/card';
import { GamePhase } from '../../core/types/phase';
import { applyAction, validateAction } from '../../core/engine/gameEngine';
import { getExpectedActor, chooseAction } from '../../ai/aiPlayer';
import { createInitialGameState } from '../../core/state/createInitialGameState';
import {
  createDaichiPlayerDeck,
  createAkiraAIDeck,
  buildMatchRegistry,
} from '../../cards/deckBuilder';
import { findCardDefinition } from '../../cards/alphaCards';
import { ToastNotification, LogEntry, UISelectionMode } from '../types';

export function useGameController() {
  // Inicialização determinística de Decks e Registro
  const playerDeck = useMemo(() => createDaichiPlayerDeck(), []);
  const aiDeck = useMemo(() => createAkiraAIDeck(), []);
  const cardRegistry = useMemo(
    () => buildMatchRegistry(playerDeck, aiDeck),
    [playerDeck, aiDeck]
  );

  // Estado canônico do jogo
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState({
      matchId: `alpha_${Date.now()}`,
      rngSeed: Math.floor(Math.random() * 100000),
      shuffleDeck: true,
      autoDrawInitialHand: true,
      player1: {
        id: 'player1',
        name: 'Jogador (Daichi)',
        isAI: false,
        deck: playerDeck,
      },
      player2: {
        id: 'player2',
        name: 'IA (Akira)',
        isAI: true,
        deck: aiDeck,
      },
    })
  );

  // Estados de Interação da UI
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectionMode, setSelectionMode] = useState<UISelectionMode>('NONE');
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [selectedBlockAttackIndex, setSelectedBlockAttackIndex] = useState<number | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardDefinition | null>(null);

  // Modais
  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  const [pendingSubstitutionCardId, setPendingSubstitutionCardId] = useState<string | null>(null);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [selectedDiscardCardIds, setSelectedDiscardCardIds] = useState<string[]>([]);

  // Logs e Toasts
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: `log_init_${Date.now()}`,
      turn: 1,
      actor: 'engine',
      message: 'Partida iniciada! Daichi vs Akira no torneio Alpha.',
      timestamp: Date.now(),
    },
  ]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Referência para evitar execução simultânea da IA
  const aiExecutionRef = useRef(false);

  // Helper para adicionar toasts
  const addToast = useCallback((message: string, type: ToastNotification['type'] = 'info') => {
    const newToast: ToastNotification = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      message,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  }, []);

  // Helper para adicionar logs
  const addLog = useCallback(
    (message: string, actor: LogEntry['actor'] = 'engine', action?: GameAction) => {
      setLogs((prev) => [
        {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          turn: gameState.turn,
          actor,
          message,
          action,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 49),
      ]);
    },
    [gameState.turn]
  );

  // Execução pura de ações via GameEngine
  const dispatchAction = useCallback(
    (action: GameAction, actor: LogEntry['actor'] = 'player'): boolean => {
      if (gameState.status === GameStatus.FINISHED) {
        addToast('A partida já foi encerrada.', 'warning');
        return false;
      }

      // Validação Engine First
      const validation = validateAction(gameState, action, { cardRegistry });
      if (!validation.valid) {
        addToast(validation.error?.message || 'Ação inválida pelas regras.', 'error');
        return false;
      }

      const result = applyAction(gameState, action, { cardRegistry });
      if (!result.success) {
        addToast(result.error?.message || 'Erro ao aplicar ação.', 'error');
        return false;
      }

      setGameState(result.state);

      // Gerar descrição legível para o Battle Log
      let logDesc = `Ação executada: ${action.type}`;
      if (action.type === ActionType.PLAY_CARD) {
        const cardDef = cardRegistry[gameState.players[action.playerId]?.hand.find(c => c.instanceId === action.cardInstanceId)?.definitionId || ''];
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} jogou ${cardDef?.name || 'carta'}`;
      } else if (action.type === ActionType.ATTACK) {
        const attackerDef = cardRegistry[gameState.players[action.playerId]?.board.find(c => c.instanceId === action.attackerInstanceId)?.definitionId || ''];
        const isTargetRep = action.targetId.includes('rep') || action.targetId === 'player1' || action.targetId === 'player2';
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} atacou ${isTargetRep ? 'o Representante' : 'um Estudante'} com ${attackerDef?.name || 'Estudante'}`;
      } else if (action.type === ActionType.BLOCK) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} declarou bloqueio`;
      } else if (action.type === ActionType.ADVANCE_PHASE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} avançou a fase (${result.state.phase})`;
      } else if (action.type === ActionType.START_DEBATE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} iniciou um Debate`;
      } else if (action.type === ActionType.RESPOND_DEBATE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} respondeu ao Debate`;
      } else if (action.type === ActionType.PASS_DEBATE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} passou a vez no Debate`;
      } else if (action.type === ActionType.RESOLVE_DEBATE) {
        logDesc = `Debate resolvido na mesa`;
      }

      addLog(logDesc, actor, action);
      return true;
    },
    [gameState, cardRegistry, addToast, addLog]
  );

  // =========================================================================
  // LOOP AUTÔNOMO DA IA
  // =========================================================================
  useEffect(() => {
    if (gameState.status === GameStatus.FINISHED) {
      setIsAiThinking(false);
      return;
    }

    const expectedActor = getExpectedActor(gameState);
    if (expectedActor !== 'player2') {
      setIsAiThinking(false);
      aiExecutionRef.current = false;
      return;
    }

    if (aiExecutionRef.current) return;
    aiExecutionRef.current = true;
    setIsAiThinking(true);

    const timer = setTimeout(() => {
      aiExecutionRef.current = false;
      const currentActor = getExpectedActor(gameState);
      if (currentActor !== 'player2' || gameState.status === GameStatus.FINISHED) {
        setIsAiThinking(false);
        return;
      }

      const aiAction = chooseAction(gameState, 'player2', {
        cardRegistry,
        rngSeed: gameState.rngSeed + Date.now(),
      });

      if (aiAction) {
        dispatchAction(aiAction, 'ai');
      } else {
        // Se a IA for o defensor em COMBAT e não quer bloquear, o atacante humano avança
        if (gameState.phase === GamePhase.COMBAT && gameState.activePlayerId === 'player1') {
          // IA optou por não bloquear mais
          addLog('IA optou por não declarar mais bloqueadores.', 'ai');
          dispatchAction({ type: ActionType.ADVANCE_PHASE, playerId: 'player1' }, 'player');
        } else if (gameState.activePlayerId === 'player2') {
          // Se a IA for o jogador ativo e não tiver ações, ela avança a fase
          dispatchAction({ type: ActionType.ADVANCE_PHASE, playerId: 'player2' }, 'ai');
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [gameState, cardRegistry, dispatchAction, addLog]);

  // =========================================================================
  // ENGINE FIRST: CONSULTAS DECLARATIVAS DE VALIDADE
  // =========================================================================

  /**
   * Consulta a engine se uma carta na mão pode ser jogada agora
   */
  const canPlayCard = useCallback(
    (cardInstance: CardInstance): boolean => {
      if (gameState.status === GameStatus.FINISHED) return false;
      if (getExpectedActor(gameState) !== 'player1') return false;

      const cardDef = cardRegistry[cardInstance.definitionId] || findCardDefinition(cardInstance.definitionId);
      if (!cardDef) return false;

      // Se for carta de Debate na Debate Phase ou resposta
      if (cardDef.type === CardType.DEBATE) {
        if (!gameState.debate.active) {
          const startVal = validateAction(
            gameState,
            {
              type: ActionType.START_DEBATE,
              playerId: 'player1',
              cardInstanceId: cardInstance.instanceId,
            },
            { cardRegistry }
          );
          return startVal.valid;
        } else {
          const respVal = validateAction(
            gameState,
            {
              type: ActionType.RESPOND_DEBATE,
              playerId: 'player1',
              cardInstanceId: cardInstance.instanceId,
            },
            { cardRegistry }
          );
          return respVal.valid;
        }
      }

      // Se for estudante e o campo estiver cheio (6), valida se é possível substituir
      if (cardDef.type === CardType.STUDENT && gameState.players.player1.board.length >= 6) {
        const anyStudentOnBoard = gameState.players.player1.board[0];
        if (anyStudentOnBoard) {
          const substVal = validateAction(
            gameState,
            {
              type: ActionType.PLAY_CARD,
              playerId: 'player1',
              cardInstanceId: cardInstance.instanceId,
              replaceCardInstanceId: anyStudentOnBoard.instanceId,
            },
            { cardRegistry }
          );
          return substVal.valid;
        }
      }

      // Jogar normalmente
      const playVal = validateAction(
        gameState,
        {
          type: ActionType.PLAY_CARD,
          playerId: 'player1',
          cardInstanceId: cardInstance.instanceId,
        },
        { cardRegistry }
      );
      return playVal.valid;
    },
    [gameState, cardRegistry]
  );

  /**
   * Consulta a engine se um estudante no campo aliado pode atacar agora
   */
  const canAttackWith = useCallback(
    (studentInstanceId: string): boolean => {
      if (gameState.status === GameStatus.FINISHED) return false;
      if (gameState.phase !== GamePhase.COMBAT) return false;
      if (gameState.activePlayerId !== 'player1') return false;

      // Verifica se existe pelo menos um alvo legal consultando a engine
      const opponentRepTargetId = gameState.players.player2.representative.definitionId;
      const testRep = validateAction(
        gameState,
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: studentInstanceId,
          targetId: opponentRepTargetId,
        },
        { cardRegistry }
      );
      if (testRep.valid) return true;

      for (const oppStudent of gameState.players.player2.board) {
        const testStudent = validateAction(
          gameState,
          {
            type: ActionType.ATTACK,
            playerId: 'player1',
            attackerInstanceId: studentInstanceId,
            targetId: oppStudent.instanceId,
          },
          { cardRegistry }
        );
        if (testStudent.valid) return true;
      }

      return false;
    },
    [gameState, cardRegistry]
  );

  /**
   * Consulta a engine se um alvo é válido para o atacante atualmente selecionado
   */
  const isTargetValidForAttacker = useCallback(
    (targetId: string): boolean => {
      if (!selectedAttackerId) return false;
      const test = validateAction(
        gameState,
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: selectedAttackerId,
          targetId,
        },
        { cardRegistry }
      );
      return test.valid;
    },
    [gameState, selectedAttackerId, cardRegistry]
  );

  /**
   * Consulta a engine se um estudante aliado pode bloquear um ataque específico
   */
  const canBlockAttack = useCallback(
    (blockerInstanceId: string, attackerInstanceId: string): boolean => {
      const test = validateAction(
        gameState,
        {
          type: ActionType.BLOCK,
          playerId: 'player1',
          blockerInstanceId,
          attackerInstanceId,
        },
        { cardRegistry }
      );
      return test.valid;
    },
    [gameState, cardRegistry]
  );

  // =========================================================================
  // INTERAÇÕES DE CLIQUE DO JOGADOR
  // =========================================================================

  /**
   * Clique em carta na mão
   */
  const handleHandCardClick = useCallback(
    (card: CardInstance) => {
      if (getExpectedActor(gameState) !== 'player1') {
        addToast('Aguarde sua vez de agir.', 'warning');
        return;
      }

      const cardDef = cardRegistry[card.definitionId] || findCardDefinition(card.definitionId);
      if (!cardDef) return;

      // Se for carta de debate
      if (cardDef.type === CardType.DEBATE) {
        // Se requer alvo e há alvos na mesa
        if (cardDef.text?.includes('alvo') || cardDef.effects?.some((e: any) => e.target === 'TARGET_STUDENT')) {
          setSelectedHandCardId(card.instanceId);
          setSelectionMode('SELECTING_DEBATE_TARGET');
          addToast(`Selecione um Estudante alvo para ${cardDef.name}.`, 'info');
          return;
        }

        // Tenta iniciar ou responder
        const isStart = !gameState.debate.active;
        const action: GameAction = isStart
          ? {
              type: ActionType.START_DEBATE,
              playerId: 'player1',
              cardInstanceId: card.instanceId,
            }
          : {
              type: ActionType.RESPOND_DEBATE,
              playerId: 'player1',
              cardInstanceId: card.instanceId,
            };
        dispatchAction(action);
        return;
      }

      // Se for estudante e o campo possui 6 estudantes: abrir modal de substituição
      if (cardDef.type === CardType.STUDENT && gameState.players.player1.board.length >= 6) {
        setPendingSubstitutionCardId(card.instanceId);
        setIsSubstitutionModalOpen(true);
        return;
      }

      // Jogar carta normalmente
      dispatchAction({
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: card.instanceId,
      });
    },
    [gameState, cardRegistry, dispatchAction, addToast]
  );

  /**
   * Confirmação da substituição de estudante
   */
  const handleConfirmSubstitution = useCallback(
    (replaceCardInstanceId: string) => {
      if (!pendingSubstitutionCardId) return;
      dispatchAction({
        type: ActionType.PLAY_CARD,
        playerId: 'player1',
        cardInstanceId: pendingSubstitutionCardId,
        replaceCardInstanceId,
      });
      setIsSubstitutionModalOpen(false);
      setPendingSubstitutionCardId(null);
    },
    [pendingSubstitutionCardId, dispatchAction]
  );

  /**
   * Clique em estudante aliado no campo
   */
  const handleAllyStudentClick = useCallback(
    (student: CardInstance) => {
      // Se estamos escolhendo bloqueador para um ataque da IA
      if (selectionMode === 'SELECTING_BLOCK_DEFENDER' && selectedBlockAttackIndex !== null) {
        const attack = gameState.combat.attacks[selectedBlockAttackIndex];
        if (attack && canBlockAttack(student.instanceId, attack.attackerInstanceId)) {
          dispatchAction({
            type: ActionType.BLOCK,
            playerId: 'player1',
            blockerInstanceId: student.instanceId,
            attackerInstanceId: attack.attackerInstanceId,
          });
          setSelectionMode('NONE');
          setSelectedBlockAttackIndex(null);
        } else {
          addToast('Este Estudante não pode bloquear este ataque.', 'error');
        }
        return;
      }

      // Se estivermos em COMBAT e formos o atacante ativo
      if (gameState.phase === GamePhase.COMBAT && gameState.activePlayerId === 'player1') {
        if (selectedAttackerId === student.instanceId) {
          // Deseleciona
          setSelectedAttackerId(null);
          setSelectionMode('NONE');
        } else if (canAttackWith(student.instanceId)) {
          setSelectedAttackerId(student.instanceId);
          setSelectionMode('SELECTING_ATTACK_TARGET');
          addToast('Selecione o alvo do ataque (Representante ou Estudante inimigo).', 'info');
        } else {
          addToast('Este Estudante não pode atacar agora (Inércia ou já atacou).', 'warning');
        }
        return;
      }

      // Se estamos escolhendo alvo para um debate
      if (selectionMode === 'SELECTING_DEBATE_TARGET' && selectedHandCardId) {
        const action: GameAction = !gameState.debate.active
          ? {
              type: ActionType.START_DEBATE,
              playerId: 'player1',
              cardInstanceId: selectedHandCardId,
              targetId: student.instanceId,
            }
          : {
              type: ActionType.RESPOND_DEBATE,
              playerId: 'player1',
              cardInstanceId: selectedHandCardId,
              targetId: student.instanceId,
            };
        dispatchAction(action);
        setSelectionMode('NONE');
        setSelectedHandCardId(null);
      }
    },
    [
      selectionMode,
      selectedBlockAttackIndex,
      gameState,
      selectedAttackerId,
      canAttackWith,
      canBlockAttack,
      selectedHandCardId,
      dispatchAction,
      addToast,
    ]
  );

  /**
   * Clique em estudante oponente no campo
   */
  const handleOpponentStudentClick = useCallback(
    (student: CardInstance) => {
      // Se estamos selecionando alvo de ataque
      if (selectionMode === 'SELECTING_ATTACK_TARGET' && selectedAttackerId) {
        if (isTargetValidForAttacker(student.instanceId)) {
          dispatchAction({
            type: ActionType.ATTACK,
            playerId: 'player1',
            attackerInstanceId: selectedAttackerId,
            targetId: student.instanceId,
          });
          setSelectedAttackerId(null);
          setSelectionMode('NONE');
        } else {
          addToast('Alvo inválido para este ataque (verifique Provocação).', 'error');
        }
        return;
      }

      // Se estamos selecionando alvo para um debate
      if (selectionMode === 'SELECTING_DEBATE_TARGET' && selectedHandCardId) {
        const action: GameAction = !gameState.debate.active
          ? {
              type: ActionType.START_DEBATE,
              playerId: 'player1',
              cardInstanceId: selectedHandCardId,
              targetId: student.instanceId,
            }
          : {
              type: ActionType.RESPOND_DEBATE,
              playerId: 'player1',
              cardInstanceId: selectedHandCardId,
              targetId: student.instanceId,
            };
        dispatchAction(action);
        setSelectionMode('NONE');
        setSelectedHandCardId(null);
      }
    },
    [
      selectionMode,
      selectedAttackerId,
      isTargetValidForAttacker,
      selectedHandCardId,
      gameState.debate.active,
      dispatchAction,
      addToast,
    ]
  );

  /**
   * Clique no Representante Oponente (alvo de ataque)
   */
  const handleOpponentRepresentativeClick = useCallback(() => {
    if (selectionMode === 'SELECTING_ATTACK_TARGET' && selectedAttackerId) {
      const repTargetId = gameState.players.player2.representative.definitionId;
      if (isTargetValidForAttacker(repTargetId)) {
        dispatchAction({
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: selectedAttackerId,
          targetId: repTargetId,
        });
        setSelectedAttackerId(null);
        setSelectionMode('NONE');
      } else {
        addToast(
          'Não é possível atacar o Representante (Diplomacia ativa ou Estudante com Provocação em campo).',
          'error'
        );
      }
    }
  }, [
    selectionMode,
    selectedAttackerId,
    gameState.players.player2.representative.definitionId,
    isTargetValidForAttacker,
    dispatchAction,
    addToast,
  ]);

  /**
   * Clique em um ataque na área de combate para selecionar defensor
   */
  const handleAttackSelectForBlock = useCallback(
    (attackIndex: number) => {
      if (gameState.phase !== GamePhase.COMBAT || gameState.activePlayerId !== 'player2') {
        return;
      }
      setSelectedBlockAttackIndex(attackIndex);
      setSelectionMode('SELECTING_BLOCK_DEFENDER');
      addToast('Selecione um Estudante aliado para bloquear este ataque.', 'info');
    },
    [gameState, addToast]
  );

  /**
   * Ativar Destaque do Representante
   */
  const handleActivateHighlight = useCallback(() => {
    if (getExpectedActor(gameState) !== 'player1') {
      addToast('Não é sua vez de agir.', 'warning');
      return;
    }
    dispatchAction({
      type: ActionType.ACTIVATE_HIGHLIGHT,
      playerId: 'player1',
    });
  }, [gameState, dispatchAction, addToast]);

  /**
   * Passar ou Avançar Fase / Turno
   */
  const handleAdvancePhase = useCallback(() => {
    if (getExpectedActor(gameState) !== 'player1') {
      addToast('Aguarde sua vez de agir.', 'warning');
      return;
    }

    // Se estiver na fase de debate e um debate estiver ativo
    if (gameState.phase === GamePhase.DEBATE && gameState.debate.active) {
      dispatchAction({
        type: ActionType.PASS_DEBATE,
        playerId: 'player1',
      });
      return;
    }

    // Se estiver defendendo em COMBAT e optar por não bloquear
    if (gameState.phase === GamePhase.COMBAT && gameState.activePlayerId === 'player2') {
      // Informa que não bloqueará e a IA avança o combate
      dispatchAction({
        type: ActionType.ADVANCE_PHASE,
        playerId: 'player2',
      }, 'ai');
      return;
    }

    // Se estiver na End Phase e a mão exceder 8 cartas: abrir modal de descarte
    if (gameState.phase === GamePhase.END && gameState.players.player1.hand.length > 8) {
      setIsDiscardModalOpen(true);
      return;
    }

    // Avanço padrão de fase
    dispatchAction({
      type: ActionType.ADVANCE_PHASE,
      playerId: 'player1',
    });
  }, [gameState, dispatchAction, addToast]);

  /**
   * Confirmar descarte da End Phase
   */
  const handleConfirmDiscard = useCallback(() => {
    const requiredDiscardCount = gameState.players.player1.hand.length - 8;
    if (selectedDiscardCardIds.length !== requiredDiscardCount) {
      addToast(`Selecione exatamente ${requiredDiscardCount} cartas para descartar.`, 'error');
      return;
    }

    dispatchAction({
      type: ActionType.ADVANCE_PHASE,
      playerId: 'player1',
      cardInstanceIdsToDiscard: selectedDiscardCardIds,
    });
    setIsDiscardModalOpen(false);
    setSelectedDiscardCardIds([]);
  }, [gameState, selectedDiscardCardIds, dispatchAction, addToast]);

  /**
   * Cancelar seleção corrente
   */
  const cancelSelection = useCallback(() => {
    setSelectionMode('NONE');
    setSelectedAttackerId(null);
    setSelectedHandCardId(null);
    setSelectedBlockAttackIndex(null);
  }, []);

  /**
   * Reiniciar partida (Novo Jogo)
   */
  const handleRestartMatch = useCallback(() => {
    const freshPlayerDeck = createDaichiPlayerDeck();
    const freshAiDeck = createAkiraAIDeck();

    const newGame = createInitialGameState({
      matchId: `alpha_${Date.now()}`,
      rngSeed: Math.floor(Math.random() * 100000),
      shuffleDeck: true,
      autoDrawInitialHand: true,
      player1: {
        id: 'player1',
        name: 'Jogador (Daichi)',
        isAI: false,
        deck: freshPlayerDeck,
      },
      player2: {
        id: 'player2',
        name: 'IA (Akira)',
        isAI: true,
        deck: freshAiDeck,
      },
    });

    setGameState(newGame);
    setSelectionMode('NONE');
    setSelectedAttackerId(null);
    setSelectedHandCardId(null);
    setSelectedBlockAttackIndex(null);
    setIsSubstitutionModalOpen(false);
    setIsDiscardModalOpen(false);
    setLogs([
      {
        id: `log_restart_${Date.now()}`,
        turn: 1,
        actor: 'engine',
        message: 'Nova partida iniciada! Que vença o melhor debatedor.',
        timestamp: Date.now(),
      },
    ]);
    addToast('Nova partida iniciada!', 'success');
  }, [addToast]);

  return {
    gameState,
    cardRegistry,
    isAiThinking,
    selectionMode,
    selectedHandCardId,
    selectedAttackerId,
    selectedBlockAttackIndex,
    inspectedCard,
    setInspectedCard,
    isSubstitutionModalOpen,
    setIsSubstitutionModalOpen,
    pendingSubstitutionCardId,
    isDiscardModalOpen,
    setIsDiscardModalOpen,
    selectedDiscardCardIds,
    setSelectedDiscardCardIds,
    logs,
    toasts,
    canPlayCard,
    canAttackWith,
    isTargetValidForAttacker,
    canBlockAttack,
    handleHandCardClick,
    handleAllyStudentClick,
    handleOpponentStudentClick,
    handleOpponentRepresentativeClick,
    handleAttackSelectForBlock,
    handleConfirmSubstitution,
    handleConfirmDiscard,
    handleActivateHighlight,
    handleAdvancePhase,
    cancelSelection,
    handleRestartMatch,
  };
}
