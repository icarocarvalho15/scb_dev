import React from 'react';
import { PlayerState } from '../../../core/types/player';
import { CardInstance, CardDefinition } from '../../../core/types/card';
import { RepresentativeBadge } from '../Representative/RepresentativeBadge';
import { CardComponent } from '../Card/CardComponent';

export interface OpponentAreaProps {
  player: PlayerState;
  cardRegistry: Record<string, CardDefinition>;
  isTargetCandidateForAttack: (targetId: string) => boolean;
  onStudentClick: (student: CardInstance) => void;
  onRepresentativeClick: () => void;
  onInspectCard: (cardDef: CardDefinition) => void;
}

export const OpponentArea: React.FC<OpponentAreaProps> = ({
  player,
  cardRegistry,
  isTargetCandidateForAttack,
  onStudentClick,
  onRepresentativeClick,
  onInspectCard,
}) => {
  const isRepTarget = isTargetCandidateForAttack(player.representative.definitionId);

  return (
    <div className="scb-opponent-area">
      {/* Top Bar: Mão oculta, Deck, Discard e Status */}
      <div className="scb-zone-row scb-opponent-hand-row">
        {/* Deck & Descarte */}
        <div className="scb-deck-discard-cluster">
          <div className="scb-pile scb-deck-pile" title={`Deck do Oponente: ${player.deck.length} cartas restantes`}>
            <div className="scb-pile-card-back">SCB</div>
            <span className="scb-pile-count">{player.deck.length}</span>
            <span className="scb-pile-label">Deck</span>
          </div>

          <div
            className="scb-pile scb-discard-pile"
            title={`Descarte do Oponente: ${player.discard.length} cartas`}
          >
            <span className="scb-pile-count">{player.discard.length}</span>
            <span className="scb-pile-label">Descarte</span>
          </div>
        </div>

        {/* Mão Oculta */}
        <div className="scb-opponent-hand">
          {player.hand.map((card, idx) => (
            <CardComponent
              key={card.instanceId || idx}
              isOpponentHand
              size="small"
            />
          ))}
          {player.hand.length === 0 && (
            <div className="scb-empty-hand-notice">Mão vazia</div>
          )}
        </div>

        {/* Energia do Oponente */}
        <div className="scb-energy-display scb-opponent-energy">
          <span className="scb-energy-icon">⚡</span>
          <span className="scb-energy-val">
            {player.energy} / {player.maxEnergy}
          </span>
          <span className="scb-energy-label">Energia</span>
        </div>
      </div>

      {/* Row do Campo de Batalha: Ambiente, 6 Slots de Estudantes e Representante */}
      <div className="scb-zone-row scb-opponent-field-row">
        {/* Ambiente Ativo */}
        <div className="scb-environment-slot" title="Ambiente Ativo do Oponente">
          {player.environment ? (
            <CardComponent
              cardInstance={player.environment}
              cardRegistry={cardRegistry}
              size="small"
              onInspect={() => {
                const def = cardRegistry[player.environment!.definitionId];
                if (def) onInspectCard(def);
              }}
            />
          ) : (
            <div className="scb-empty-slot scb-env-empty">
              <span>Sem Ambiente</span>
            </div>
          )}
        </div>

        {/* 6 Slots de Estudantes */}
        <div className="scb-board-slots scb-opponent-board">
          {Array.from({ length: 6 }).map((_, slotIndex) => {
            const student = player.board[slotIndex];
            if (student) {
              const isTargetCandidate = isTargetCandidateForAttack(student.instanceId);
              const def = cardRegistry[student.definitionId];
              return (
                <div key={student.instanceId} className="scb-board-slot scb-slot-occupied">
                  <CardComponent
                    cardInstance={student}
                    cardRegistry={cardRegistry}
                    size="medium"
                    isTargetCandidate={isTargetCandidate}
                    onClick={() => onStudentClick(student)}
                    onInspect={() => {
                      if (def) onInspectCard(def);
                    }}
                  />
                </div>
              );
            }
            return (
              <div key={`empty_${slotIndex}`} className="scb-board-slot scb-slot-empty">
                <span className="scb-slot-number">{slotIndex + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Representante do Oponente */}
        <div className="scb-rep-slot">
          <RepresentativeBadge
            representative={player.representative}
            isPlayer={false}
            diplomacyActive={player.diplomacyActive}
            isTargetCandidate={isRepTarget}
            onClick={onRepresentativeClick}
          />
        </div>
      </div>
    </div>
  );
};
