import React from 'react';
import { CombatState, DebateState } from '../../../core/types/state';
import { CardDefinition } from '../../../core/types/card';

export interface CentralZoneProps {
  combat: CombatState;
  debate: DebateState;
  cardRegistry: Record<string, CardDefinition>;
  isAiThinking: boolean;
  activePlayerId: string;
  selectedBlockAttackIndex: number | null;
  onSelectAttackForBlock: (attackIndex: number) => void;
  onInspectCard: (cardDef: CardDefinition) => void;
  onPassDebate?: () => void;
}

export const CentralZone: React.FC<CentralZoneProps> = ({
  combat,
  debate,
  cardRegistry,
  isAiThinking,
  activePlayerId,
  selectedBlockAttackIndex,
  onSelectAttackForBlock,
  onInspectCard,
  onPassDebate,
}) => {
  const hasCombat = combat.attacks && combat.attacks.length > 0;
  const hasDebate = debate.active || debate.actions.length > 0;

  return (
    <div className="scb-central-zone">
      {/* 1. SEÇÃO DE DEBATE (se ativo) */}
      {hasDebate && (
        <div className="scb-debate-banner">
          <div className="scb-debate-header">
            <span className="scb-debate-title">
              🗣 Debate em Andamento (Etapa {debate.currentStep}/4)
            </span>
            {onPassDebate && (
              <button
                type="button"
                className="scb-btn-secondary scb-btn-pass-debate"
                onClick={onPassDebate}
              >
                Passar Réplica
              </button>
            )}
          </div>

          <div className="scb-debate-stack">
            {debate.actions.map((entry, idx) => {
              const def = entry.cardDefinitionId ? cardRegistry[entry.cardDefinitionId] : undefined;
              const isP1 = entry.playerId === 'player1';

              return (
                <div
                  key={idx}
                  className={`scb-debate-entry ${isP1 ? 'scb-debate-player' : 'scb-debate-ai'}`}
                >
                  <span className="scb-debate-step-tag">
                    #{entry.step} {entry.stepName || `Nível ${entry.step}`}
                  </span>
                  <span className="scb-debate-actor">
                    {isP1 ? 'Jogador' : 'IA'}
                  </span>
                  {entry.passed ? (
                    <span className="scb-debate-passed-tag">Passou</span>
                  ) : def ? (
                    <div
                      className="scb-debate-card-pill"
                      onClick={() => onInspectCard(def)}
                      title={def.text}
                    >
                      <span>{def.name}</span>
                    </div>
                  ) : (
                    <span>Carta de Debate</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SEÇÃO DE COMBATE (se houver ataques declarados) */}
      {hasCombat && (
        <div className="scb-combat-banner">
          <div className="scb-combat-header">
            <span className="scb-combat-title">⚔ Combate Declarado</span>
          </div>

          <div className="scb-combat-clashes">
            {combat.attacks.map((attack, idx) => {
              // Atacante
              const attackerDef = Object.values(cardRegistry).find(
                (c) => attack.attackerInstanceId.includes(c.id)
              );
              // Bloqueador se houver
              const blockerDef = attack.blockerInstanceId
                ? Object.values(cardRegistry).find((c) =>
                    attack.blockerInstanceId!.includes(c.id)
                  )
                : null;

              const isTargetRep =
                attack.targetId.includes('rep') ||
                attack.targetId === 'player1' ||
                attack.targetId === 'player2';

              const isSelected = selectedBlockAttackIndex === idx;

              return (
                <div
                  key={idx}
                  className={`scb-combat-clash ${isSelected ? 'scb-clash-selected' : ''}`}
                  onClick={() => onSelectAttackForBlock(idx)}
                >
                  {/* Atacante */}
                  <div className="scb-clash-unit scb-clash-attacker">
                    <span className="scb-unit-role">Atacante</span>
                    <span className="scb-unit-name">
                      {attackerDef?.name || 'Estudante'}
                    </span>
                    <span className="scb-unit-stat">
                      ⚔ {attackerDef?.influence ?? '?'}
                    </span>
                  </div>

                  {/* Seta do confronto */}
                  <div className="scb-clash-arrow">
                    <span>➔</span>
                  </div>

                  {/* Bloqueador ou Alvo */}
                  <div className="scb-clash-unit scb-clash-target">
                    {attack.blockerInstanceId ? (
                      <>
                        <span className="scb-unit-role scb-role-blocker">
                          🛡 Bloqueador
                        </span>
                        <span className="scb-unit-name">
                          {blockerDef?.name || 'Defensor'}
                        </span>
                        <span className="scb-unit-stat">
                          ♥ {blockerDef?.morale ?? '?'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="scb-unit-role scb-role-direct">
                          🎯 Alvo
                        </span>
                        <span className="scb-unit-name">
                          {isTargetRep ? 'Representante' : 'Estudante'}
                        </span>
                        <button
                          type="button"
                          className="scb-btn-small scb-btn-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAttackForBlock(idx);
                          }}
                        >
                          Definir Bloqueio
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PLAYMAT CENTRAL / STATUS PADRÃO */}
      {!hasCombat && !hasDebate && (
        <div className="scb-central-idle">
          <div className="scb-central-watermark">
            <span className="scb-watermark-title">SCHOOL CARD BATTLE</span>
            <span className="scb-watermark-subtitle">Torneio Interclasses Alpha</span>
          </div>

          <div className="scb-turn-indicator-badge">
            {isAiThinking ? (
              <div className="scb-indicator-thinking">
                <span className="scb-spinner" />
                <span>IA do Grêmio analisando jogada...</span>
              </div>
            ) : activePlayerId === 'player1' ? (
              <div className="scb-indicator-player-turn">
                <span>✦ Sua Vez de Jogar ✦</span>
              </div>
            ) : (
              <div className="scb-indicator-ai-turn">
                <span>Vez do Oponente (IA)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
