import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, GameStatus } from '../../core/types/state';
import { GameAction, ActionType } from '../../core/types/action';
import { CardInstance, CardDefinition, CardType, Keyword } from '../../core/types/card';
import { GamePhase } from '../../core/types/phase';
import { applyAction, validateAction } from '../../core/engine/gameEngine';
import { hasCardKeyword } from '../../core/engine/keywordSystem';
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

  // Estado canônico do jogo (iniciado com Start Phase processada automaticamente)
  const [gameState, setGameState] = useState<GameState>(() => {
    const initial = createInitialGameState({
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
    });
    const startRes = applyAction(
      initial,
      {
        type: ActionType.ADVANCE_PHASE,
        playerId: initial.activePlayerId,
      },
      { cardRegistry }
    );
    return startRes.success ? startRes.state : initial;
  });

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

  // Referência / Mutex para evitar execução simultânea da IA ou condições de corrida
  const isProcessingAI = useRef(false);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

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
          turn: gameStateRef.current.turn,
          actor,
          message,
          action,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 49),
      ]);
    },
    []
  );

  // Execução pura de ações via GameEngine
  const dispatchAction = useCallback(
    (action: GameAction, actor: LogEntry['actor'] = 'player'): boolean => {
      const currentState = gameStateRef.current;
      if (currentState.status === GameStatus.FINISHED) {
        if (actor === 'player') {
          addToast('A partida já foi encerrada.', 'warning');
        }
        return false;
      }

      // Validação Engine First
      const validation = validateAction(currentState, action, { cardRegistry });
      if (!validation.valid) {
        if (actor === 'player') {
          addToast(validation.error?.message || 'Ação inválida pelas regras.', 'error');
        }
        return false;
      }

      const result = applyAction(currentState, action, { cardRegistry });
      if (!result.success) {
        if (actor === 'player') {
          addToast(result.error?.message || 'Erro ao aplicar ação.', 'error');
        }
        return false;
      }

      let nextState = result.state;

      // Auto Start Phase: Se a ação resultou em START phase (ex: virada de turno em END phase),
      // processa imediatamente a Start Phase no motor para que o novo jogador ativo
      // já inicie com energia escalada, carta comprada e estado estabilizado em MAIN phase.
      if (nextState.phase === GamePhase.START && nextState.status !== GameStatus.FINISHED) {
        const startResult = applyAction(
          nextState,
          {
            type: ActionType.ADVANCE_PHASE,
            playerId: nextState.activePlayerId,
          },
          { cardRegistry }
        );
        if (startResult.success) {
          nextState = startResult.state;
          const activeName = nextState.activePlayerId === 'player1' ? 'Jogador' : 'IA';
          addLog(
            `Início do Turno ${nextState.turn} processado automaticamente para ${activeName} (Energia atualizada e compra realizada).`,
            'engine'
          );
        }
      }

      gameStateRef.current = nextState;
      setGameState(nextState);

      // Gerar descrição legível para o Battle Log
      let logDesc = `Ação executada: ${action.type}`;
      if (action.type === ActionType.PLAY_CARD) {
        const cardDef = cardRegistry[currentState.players[action.playerId]?.hand.find(c => c.instanceId === action.cardInstanceId)?.definitionId || ''];
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} jogou ${cardDef?.name || 'carta'}`;
      } else if (action.type === ActionType.ATTACK) {
        const attackerDef = cardRegistry[currentState.players[action.playerId]?.board.find(c => c.instanceId === action.attackerInstanceId)?.definitionId || ''];
        const isTargetRep = !action.targetId || action.targetId.includes('rep') || action.targetId === 'player1' || action.targetId === 'player2';
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} atacou ${isTargetRep ? 'o Representante' : 'um Estudante (Provocação)'} com ${attackerDef?.name || 'Estudante'}`;
      } else if (action.type === ActionType.BLOCK) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} declarou bloqueio`;
      } else if (action.type === ActionType.ADVANCE_PHASE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} avançou a fase (${nextState.phase})`;
      } else if (action.type === ActionType.START_DEBATE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} iniciou um Debate`;
      } else if (action.type === ActionType.RESPOND_DEBATE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} respondeu ao Debate`;
      } else if (action.type === ActionType.PASS_DEBATE) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} passou a vez no Debate`;
      } else if (action.type === ActionType.RESOLVE_DEBATE) {
        logDesc = `Debate resolvido na mesa`;
      } else if (action.type === ActionType.ACTIVATE_HIGHLIGHT) {
        logDesc = `${action.playerId === 'player1' ? 'Jogador' : 'IA'} ativou a habilidade de Destaque!`;
      }

      addLog(logDesc, actor, action);
      return true;
    },
    [cardRegistry, addToast, addLog]
  );

  // =========================================================================
  // FALLBACK ROBUSTO DA IA (Previne Soft-Locks e Promessas Travadas)
  // =========================================================================
  const handleAiFallback = useCallback(
    (currentState: GameState) => {
      try {
        if (currentState.status === GameStatus.FINISHED) return;

        // Se a IA for o defensor em COMBAT e não puder ou não quiser bloquear
        if (currentState.phase === GamePhase.COMBAT && currentState.activePlayerId === 'player1') {
          addLog('IA optou por não declarar mais bloqueadores.', 'ai');
          dispatchAction({ type: ActionType.ADVANCE_PHASE, playerId: 'player1' }, 'player');
          return;
        }

        // Se for debate ativo e a IA não tem réplica, ela passa no debate
        if (currentState.phase === GamePhase.DEBATE && currentState.debate.active) {
          addLog('IA passou a réplica no Debate.', 'ai');
          dispatchAction({ type: ActionType.PASS_DEBATE, playerId: 'player2' }, 'ai');
          return;
        }

        // Se a IA for o jogador ativo, ela avança a fase canônica
        if (currentState.activePlayerId === 'player2') {
          // Se estiver em COMBAT e possuir ataques declarados sem Infiltração:
          if (currentState.phase === GamePhase.COMBAT) {
            const attacks = currentState.combat?.attacks ?? [];
            const hasBlockableAttack = attacks.some((a) => {
              const attacker = currentState.players.player2.board.find((s) => s.instanceId === a.attackerInstanceId);
              return attacker ? !hasCardKeyword(attacker, Keyword.INFILTRACAO, cardRegistry) : true;
            });

            // Se há ataque bloqueável e o defensor humano ainda não concluiu a defesa, transfere prioridade para ele
            if (attacks.length > 0 && hasBlockableAttack && !currentState.combat?.defenderPassed) {
              const nextState: GameState = {
                ...currentState,
                combat: {
                  ...currentState.combat,
                  attackersDeclared: true,
                },
              };
              gameStateRef.current = nextState;
              setGameState(nextState);
              addLog('IA concluiu a declaração de ataques. Sua vez de declarar Bloqueio Livre!', 'ai');
              return;
            }
          }

          let discardIds: string[] | undefined;
          if (currentState.phase === GamePhase.END) {
            const aiHand = currentState.players.player2.hand;
            if (aiHand.length > 8) {
              discardIds = aiHand.slice(0, aiHand.length - 8).map((c) => c.instanceId);
            }
          }

          dispatchAction(
            {
              type: ActionType.ADVANCE_PHASE,
              playerId: 'player2',
              cardInstanceIdsToDiscard: discardIds,
            },
            'ai'
          );
          return;
        }
      } catch (fallbackError) {
        console.error('Falha no fallback da IA:', fallbackError);
      }
    },
    [addLog, dispatchAction]
  );

  // =========================================================================
  // LOOP AUTÔNOMO DA IA (Com Mutex, Estabilização e Fallback Robusto)
  // =========================================================================
  useEffect(() => {
    // 1. Partida finalizada
    if (gameState.status === GameStatus.FINISHED) {
      setIsAiThinking(false);
      isProcessingAI.current = false;
      return;
    }

    // 2. Estado não estabilizado: START phase é fase transitória interna da engine
    // (A IA só inicia suas decisões após a fase estabilizar em MAIN ou posterior)
    if (gameState.phase === GamePhase.START) {
      setIsAiThinking(false);
      return;
    }

    // 3. Confirmar se a prioridade pertence de fato à IA ('player2')
    const expectedActor = getExpectedActor(gameState);
    if (expectedActor !== 'player2') {
      setIsAiThinking(false);
      isProcessingAI.current = false;
      return;
    }

    // 4. Mutex: impedir que múltiplos renders disparem o processamento simultaneamente
    if (isProcessingAI.current) {
      return;
    }
    isProcessingAI.current = true;
    setIsAiThinking(true);

    const timer = setTimeout(() => {
      try {
        const currentState = gameStateRef.current;

        // Re-validações de segurança com o estado mais atualizado
        if (
          currentState.status === GameStatus.FINISHED ||
          currentState.phase === GamePhase.START ||
          getExpectedActor(currentState) !== 'player2'
        ) {
          setIsAiThinking(false);
          isProcessingAI.current = false;
          return;
        }

        let aiAction: GameAction | null = null;
        try {
          aiAction = chooseAction(currentState, 'player2', {
            cardRegistry,
            rngSeed: currentState.rngSeed + Date.now(),
          });
        } catch (evalErr) {
          console.error('Erro na avaliação heurística da IA:', evalErr);
          aiAction = null;
        }

        if (aiAction) {
          const success = dispatchAction(aiAction, 'ai');
          if (!success) {
            console.warn('Ação sugerida pela IA rejeitada pela engine. Acionando fallback.');
            handleAiFallback(currentState);
          }
        } else {
          // IA não tem ação legal vantajosa: aciona fallback de avanço sem travar
          handleAiFallback(currentState);
        }
      } catch (loopError) {
        console.error('Exceção no ciclo assíncrono da IA:', loopError);
        handleAiFallback(gameStateRef.current);
      } finally {
        isProcessingAI.current = false;
        setIsAiThinking(false);
      }
    }, 700);

    // CRUCIAL: Cleanup do timer e liberação do mutex para prevenir travamento se o efeito for reciclado
    return () => {
      clearTimeout(timer);
      isProcessingAI.current = false;
    };
  }, [gameState, cardRegistry, dispatchAction, handleAiFallback]);

  // =========================================================================
  // PROCESSAMENTO AUTOMÁTICO DA START PHASE (Safety Net Reativo)
  // =========================================================================
  useEffect(() => {
    if (gameState.status === GameStatus.FINISHED) return;
    if (gameState.phase === GamePhase.START) {
      const activePlayerId = gameState.activePlayerId;
      const result = applyAction(
        gameState,
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: activePlayerId,
        },
        { cardRegistry }
      );
      if (result.success) {
        gameStateRef.current = result.state;
        setGameState(result.state);
        const activeName = activePlayerId === 'player1' ? 'Jogador' : 'IA';
        addLog(
          `Início do Turno ${result.state.turn} processado automaticamente para ${activeName} (Energia atualizada e compra realizada).`,
          'engine'
        );
      }
    }
  }, [gameState.phase, gameState.turn, cardRegistry, addLog]);

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

      const test = validateAction(
        gameState,
        {
          type: ActionType.ATTACK,
          playerId: 'player1',
          attackerInstanceId: studentInstanceId,
        },
        { cardRegistry }
      );
      return test.valid;
    },
    [gameState, cardRegistry]
  );

  /**
   * Consulta a engine se um alvo é válido para o atacante atualmente selecionado
   */
  const isTargetValidForAttacker = useCallback(
    (_targetId: string): boolean => {
      // Conforme Seção 29 de SCB_Rules.md: o atacante não seleciona alvos
      return false;
    },
    []
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
        if (canAttackWith(student.instanceId)) {
          const success = dispatchAction({
            type: ActionType.ATTACK,
            playerId: 'player1',
            attackerInstanceId: student.instanceId,
          });
          if (success) {
            const def = cardRegistry[student.definitionId];
            addToast(`Ataque declarado com ${def?.name || 'Estudante'}!`, 'info');
          }
        } else {
          addToast(
            'Este Estudante não pode atacar agora (Inércia, já atacou ou Diplomacia ativa no T1).',
            'warning'
          );
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
      selectedHandCardId,
      gameState.debate.active,
      dispatchAction,
    ]
  );

  /**
   * Clique no Representante Oponente
   */
  const handleOpponentRepresentativeClick = useCallback(() => {
    // Alvo de ataque é automático, não requer clique
  }, []);

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
   * Cancelar seleção corrente
   */
  const cancelSelection = useCallback(() => {
    setSelectionMode('NONE');
    setSelectedAttackerId(null);
    setSelectedHandCardId(null);
    setSelectedBlockAttackIndex(null);
  }, []);

  /**
   * Cancelar Substituição de Estudante
   */
  const handleCancelSubstitution = useCallback(() => {
    setIsSubstitutionModalOpen(false);
    setPendingSubstitutionCardId(null);
  }, []);

  /**
   * Passar ou Avançar Fase / Turno
   */
  const handleAdvancePhase = useCallback(() => {
    if (getExpectedActor(gameState) !== 'player1') {
      addToast('Aguarde sua vez de agir.', 'warning');
      return;
    }

    cancelSelection();

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
      dispatchAction(
        {
          type: ActionType.ADVANCE_PHASE,
          playerId: 'player2',
        },
        'ai'
      );
      return;
    }

    // Se o jogador humano estiver atacando em COMBAT e optar por concluir ataques
    if (gameState.phase === GamePhase.COMBAT && gameState.activePlayerId === 'player1') {
      const attacks = gameState.combat?.attacks ?? [];
      const hasBlockableAttack = attacks.some((a) => {
        const attacker = gameState.players.player1.board.find((s) => s.instanceId === a.attackerInstanceId);
        return attacker ? !hasCardKeyword(attacker, Keyword.INFILTRACAO, cardRegistry) : true;
      });

      // Se há ataques declarados e o defensor ainda não passou:
      // O jogador encerra a etapa de declaração de ataques e transfere a prioridade para o bloqueio da IA
      if (attacks.length > 0 && hasBlockableAttack && !gameState.combat?.defenderPassed) {
        const nextState: GameState = {
          ...gameState,
          combat: {
            ...gameState.combat,
            attackersDeclared: true,
          },
        };
        gameStateRef.current = nextState;
        setGameState(nextState);
        addLog(
          'Jogador concluiu a declaração de ataques. Aguardando declaração de bloqueios da IA...',
          'player'
        );
        return;
      }
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
  }, [gameState, dispatchAction, addToast, cancelSelection, addLog]);

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
   * Reiniciar partida (Novo Jogo)
   */
  const handleRestartMatch = useCallback(() => {
    const freshPlayerDeck = createDaichiPlayerDeck();
    const freshAiDeck = createAkiraAIDeck();
    const freshRegistry = buildMatchRegistry(freshPlayerDeck, freshAiDeck);

    const initial = createInitialGameState({
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

    const startRes = applyAction(
      initial,
      {
        type: ActionType.ADVANCE_PHASE,
        playerId: initial.activePlayerId,
      },
      { cardRegistry: freshRegistry }
    );
    const newGame = startRes.success ? startRes.state : initial;

    gameStateRef.current = newGame;
    isProcessingAI.current = false;
    setIsAiThinking(false);
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

  const expectedActor = getExpectedActor(gameState);

  return {
    gameState,
    cardRegistry,
    isAiThinking: isAiThinking && expectedActor === 'player2',
    expectedActor,
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
    handleCancelSubstitution,
    handleConfirmDiscard,
    handleActivateHighlight,
    handleAdvancePhase,
    cancelSelection,
    handleRestartMatch,
  };
}
