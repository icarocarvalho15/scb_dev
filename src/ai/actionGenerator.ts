import { GameAction, ActionType } from '../core/types/action';
import { GameState, GameStatus } from '../core/types/state';
import { GamePhase } from '../core/types/phase';
import { PlayerId } from '../core/types/player';
import { CardType, Keyword } from '../core/types/card';
import { getOpponentId } from '../core/engine/turnSystem';
import { getNextDebatePlayerId } from '../core/engine/debateSystem';
import { hasCardKeyword } from '../core/engine/keywordSystem';
import { findCardDefinition } from '../cards/alphaCards';
import { evaluateAiMulligan } from '../core/engine/mulliganSystem';
import { ActionGeneratorOptions } from './types';

/**
 * Gerador de ações candidatas determinístico para qualquer fase da partida.
 * Conforme docs/agents/SCB_AI_Engineer.md e Seção 4 da Diretiva da Fase 8.
 *
 * A IA gera intenções de ação sem alterar o estado de jogo, para posterior
 * filtragem estrita pelo LegalActionFilter via engine.validateAction().
 */
export function generateCandidateActions(
  state: GameState,
  playerId: PlayerId,
  options?: ActionGeneratorOptions
): GameAction[] {
  // 1. Partida terminada não possui ações possíveis
  if (state.status === GameStatus.FINISHED) {
    return [];
  }

  const player = state.players[playerId];
  if (!player) {
    return [];
  }

  const opponentId = getOpponentId(state, playerId);
  const opponent = state.players[opponentId];

  const actions: GameAction[] = [];

  switch (state.phase) {
    case GamePhase.START: {
      // START Phase: Apenas o jogador ativo avança para MAIN
      if (state.activePlayerId === playerId) {
        actions.push({
          type: ActionType.ADVANCE_PHASE,
          playerId,
        });
      }
      break;
    }

    case GamePhase.MAIN: {
      // MAIN Phase: Apenas o jogador ativo age
      if (state.activePlayerId === playerId) {
        // Opção A: Jogar cartas da mão
        for (const cardInst of player.hand) {
          const cardDef = findCardDefinition(cardInst.definitionId, options?.cardRegistry);
          if (!cardDef) continue;

          if (cardDef.type === CardType.STUDENT) {
            if (player.board.length < 6) {
              actions.push({
                type: ActionType.PLAY_CARD,
                playerId,
                cardInstanceId: cardInst.instanceId,
              });
            } else {
              // Teto de 6 Estudantes: Regra de Substituição
              for (const replaceStudent of player.board) {
                actions.push({
                  type: ActionType.PLAY_CARD,
                  playerId,
                  cardInstanceId: cardInst.instanceId,
                  replaceCardInstanceId: replaceStudent.instanceId,
                });
              }
            }
          } else if (cardDef.type === CardType.ENVIRONMENT) {
            actions.push({
              type: ActionType.PLAY_CARD,
              playerId,
              cardInstanceId: cardInst.instanceId,
            });
          }
        }

        // Opção B: Ativar Destaque do Representante se disponível (requisito exclusivo: Popularidade)
        if (
          player.representative?.highlightAvailable ||
          (player.representative &&
            player.representative.popularity >= player.representative.popularityRequirement)
        ) {
          actions.push({
            type: ActionType.ACTIVATE_HIGHLIGHT,
            playerId,
          });
        }

        // Opção C: Avançar para a Debate Phase
        actions.push({
          type: ActionType.ADVANCE_PHASE,
          playerId,
        });
      }
      break;
    }

    case GamePhase.DEBATE: {
      if (!state.debate.active) {
        // Debate inativo: Apenas jogador ativo tem a iniciativa
        if (state.activePlayerId === playerId) {
          // Opção A: Iniciar um Debate com carta do tipo DEBATE
          for (const cardInst of player.hand) {
            const cardDef = findCardDefinition(cardInst.definitionId, options?.cardRegistry);
            if (!cardDef || cardDef.type !== CardType.DEBATE) continue;

            // Alvo: nenhum (para cartas de efeito geral ou sem alvo individual obrigatório)
            actions.push({
              type: ActionType.START_DEBATE,
              playerId,
              cardInstanceId: cardInst.instanceId,
            });

            // Alvo: cada estudante adversário no campo
            if (opponent) {
              for (const enemyStudent of opponent.board) {
                actions.push({
                  type: ActionType.START_DEBATE,
                  playerId,
                  cardInstanceId: cardInst.instanceId,
                  targetId: enemyStudent.instanceId,
                });
              }

              // Alvo: Representante adversário
              actions.push({
                type: ActionType.START_DEBATE,
                playerId,
                cardInstanceId: cardInst.instanceId,
                targetId: opponent.id,
              });
            }

            // Alvo: cada estudante aliado (para efeitos de suporte/buff)
            for (const alliedStudent of player.board) {
              actions.push({
                type: ActionType.START_DEBATE,
                playerId,
                cardInstanceId: cardInst.instanceId,
                targetId: alliedStudent.instanceId,
              });
            }

            // Alvo: Representante aliado
            actions.push({
              type: ActionType.START_DEBATE,
              playerId,
              cardInstanceId: cardInst.instanceId,
              targetId: player.id,
            });
          }

          // Opção B: Passar o Debate (avança para COMBAT)
          actions.push({
            type: ActionType.PASS_DEBATE,
            playerId,
          });
        }
      } else {
        // Debate ativo: Jogador com prioridade corrente pode responder ou passar
        const priorityPlayerId = getNextDebatePlayerId(state);
        if (priorityPlayerId === playerId) {
          // Opção A: Responder com carta de Debate da mão
          for (const cardInst of player.hand) {
            const cardDef = findCardDefinition(cardInst.definitionId, options?.cardRegistry);
            if (!cardDef || cardDef.type !== CardType.DEBATE) continue;

            actions.push({
              type: ActionType.RESPOND_DEBATE,
              playerId,
              cardInstanceId: cardInst.instanceId,
            });

            if (opponent) {
              for (const enemyStudent of opponent.board) {
                actions.push({
                  type: ActionType.RESPOND_DEBATE,
                  playerId,
                  cardInstanceId: cardInst.instanceId,
                  targetId: enemyStudent.instanceId,
                });
              }
              actions.push({
                type: ActionType.RESPOND_DEBATE,
                playerId,
                cardInstanceId: cardInst.instanceId,
                targetId: opponent.id,
              });
            }

            for (const alliedStudent of player.board) {
              actions.push({
                type: ActionType.RESPOND_DEBATE,
                playerId,
                cardInstanceId: cardInst.instanceId,
                targetId: alliedStudent.instanceId,
              });
            }

            actions.push({
              type: ActionType.RESPOND_DEBATE,
              playerId,
              cardInstanceId: cardInst.instanceId,
              targetId: player.id,
            });
          }

          // Opção B: Passar a resposta (fecha e resolve o debate LIFO)
          actions.push({
            type: ActionType.RESPOND_DEBATE,
            playerId,
            pass: true,
          });
          actions.push({
            type: ActionType.PASS_DEBATE,
            playerId,
          });
        }
      }
      break;
    }

    case GamePhase.COMBAT: {
      if (state.activePlayerId === playerId) {
        // Jogador atacante: só pode agir enquanto NÃO declarou o encerramento da etapa de ataque
        if (!state.combat?.attackersDeclared) {
          for (const student of player.board) {
            if (!student.ready) continue;
            if (
              student.hasInertia &&
              !hasCardKeyword(student, Keyword.IMPULSO, options?.cardRegistry)
            ) {
              continue;
            }
            if (hasCardKeyword(student, Keyword.SILENCIO, options?.cardRegistry)) {
              continue;
            }

            const alreadyAttacking = state.combat?.attacks?.some(
              (a) => a.attackerInstanceId === student.instanceId
            );
            if (alreadyAttacking) continue;

            // Conforme Seção 29 de SCB_Rules.md: O ataque é sempre direcionado ao Representante adversário (ou Provocador)
            if (opponent) {
              actions.push({
                type: ActionType.ATTACK,
                playerId,
                attackerInstanceId: student.instanceId,
              });
            }
          }

          // Opção de avançar fase:
          // Se 0 ataques -> pula combate direto para END.
          // Se >0 ataques -> sinaliza encerramento da etapa de ataque (attackersDeclared = true)
          actions.push({
            type: ActionType.ADVANCE_PHASE,
            playerId,
          });
        }
      } else {
        // Jogador defensor: age na sub-etapa de Bloqueio Livre para ataques declarados
        const attacks = state.combat?.attacks ?? [];
        if (attacks.length > 0) {
          for (const attack of attacks) {
            if (attack.blockerInstanceId) continue; // Já possui bloqueador

            for (const student of player.board) {
              const alreadyBlocking = attacks.some(
                (a) => a.blockerInstanceId === student.instanceId
              );
              if (alreadyBlocking) continue;

              actions.push({
                type: ActionType.BLOCK,
                playerId,
                attackerInstanceId: attack.attackerInstanceId,
                blockerInstanceId: student.instanceId,
              });
            }
          }

          // O defensor pode (e deve poder) avançar a fase ("Terminei meus bloqueios / Concluir Defesa")
          actions.push({
            type: ActionType.ADVANCE_PHASE,
            playerId,
          });
        }
      }
      break;
    }

    case GamePhase.END: {
      if (state.activePlayerId === playerId) {
        // Se mão exceder 8 cartas, pode gerar opção de descarte explícito
        if (player.hand.length > 8) {
          const excess = player.hand.length - 8;
          // Subconjuntos simples das últimas cartas
          const toDiscard = player.hand.slice(-excess).map((c) => c.instanceId);
          actions.push({
            type: ActionType.DISCARD_CARDS,
            playerId,
            cardInstanceIds: toDiscard,
          });
        }

        // Avanço de fase canônico (turnSystem executa autoCutExcess por padrão)
        actions.push({
          type: ActionType.ADVANCE_PHASE,
          playerId,
        });
      }
      break;
    }
  }

  return actions;
}

/**
 * Gera deterministicamente uma MulliganAction candidata para a IA.
 * Utiliza evaluateAiMulligan para avaliar as cartas e selecionar as trocas.
 */
export function generateMulliganAction(
  state: GameState,
  playerId: PlayerId,
  options?: ActionGeneratorOptions
): import('../core/types/action').MulliganAction | null {
  const player = state.players[playerId];
  if (!player || player.hasMulliganed) {
    return null;
  }
  const cardsToReplace = evaluateAiMulligan(player.hand, options?.cardRegistry);
  return {
    type: ActionType.MULLIGAN,
    playerId,
    cardInstanceIdsToReplace: cardsToReplace,
  };
}
