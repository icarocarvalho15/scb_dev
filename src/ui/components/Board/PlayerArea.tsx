import React from 'react';
import { PlayerState } from '../../../core/types/player';
import { CardInstance, CardDefinition } from '../../../core/types/card';
import { RepresentativeBadge } from '../Representative/RepresentativeBadge';
import { CardComponent } from '../Card/CardComponent';

export interface PlayerAreaProps {
  player: PlayerState;
  cardRegistry: Record<string, CardDefinition>;
  selectedAttackerId: string | null;
  canPlayCard: (card: CardInstance) => boolean;
  canAttackWith: (studentId: string) => boolean;
  onHandCardClick: (card: CardInstance) => void;
  onAllyStudentClick: (student: CardInstance) => void;
  onActivateHighlight: () => void;
  onInspectCard: (cardDef: CardDefinition) => void;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  cardRegistry,
  selectedAttackerId,
  canPlayCard,
  canAttackWith,
  onHandCardClick,
  onAllyStudentClick,
  onActivateHighlight,
  onInspectCard,
}) => {
  return (
    <div className="scb-player-area">
      {/* Row do Campo de Batalha: Ambiente, 6 Slots de Estudantes e Representante */}
      <div className="scb-zone-row scb-player-field-row">
        {/* Ambiente Ativo */}
        <div className="scb-environment-slot" title="Seu Ambiente Ativo">
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
        <div className="scb-board-slots scb-player-board">
          {Array.from({ length: 6 }).map((_, slotIndex) => {
            const student = player.board[slotIndex];
            if (student) {
              const isSelected = selectedAttackerId === student.instanceId;
              const canAttack = canAttackWith(student.instanceId);
              const def = cardRegistry[student.definitionId];

              return (
                <div key={student.instanceId} className="scb-board-slot scb-slot-occupied">
                  <CardComponent
                    cardInstance={student}
                    cardRegistry={cardRegistry}
                    size="medium"
                    isSelected={isSelected}
                    isPlayable={canAttack}
                    onClick={() => onAllyStudentClick(student)}
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

        {/* Representante do Jogador */}
        <div className="scb-rep-slot">
          <RepresentativeBadge
            representative={player.representative}
            isPlayer={true}
            diplomacyActive={player.diplomacyActive}
            onActivateHighlight={onActivateHighlight}
          />
        </div>
      </div>

      {/* Row Inferior: Deck, Descarte e Mão Interativa */}
      <div className="scb-zone-row scb-player-hand-row">
        {/* Deck & Descarte */}
        <div className="scb-deck-discard-cluster">
          <div className="scb-pile scb-deck-pile" title={`Seu Deck: ${player.deck.length} cartas restantes`}>
            <div className="scb-pile-card-back">SCB</div>
            <span className="scb-pile-count">{player.deck.length}</span>
            <span className="scb-pile-label">Deck</span>
          </div>

          <div className="scb-pile scb-discard-pile" title={`Seu Descarte: ${player.discard.length} cartas`}>
            <span className="scb-pile-count">{player.discard.length}</span>
            <span className="scb-pile-label">Descarte</span>
          </div>
        </div>

        {/* Mão Interativa do Jogador */}
        <div className="scb-player-hand">
          {player.hand.map((card) => {
            const playable = canPlayCard(card);
            const def = cardRegistry[card.definitionId];

            return (
              <div
                key={card.instanceId}
                className={`scb-hand-card-wrapper ${playable ? 'scb-hand-card-playable' : ''}`}
              >
                <CardComponent
                  cardInstance={card}
                  cardRegistry={cardRegistry}
                  size="medium"
                  isPlayable={playable}
                  onClick={() => onHandCardClick(card)}
                  onInspect={() => {
                    if (def) onInspectCard(def);
                  }}
                />
              </div>
            );
          })}
          {player.hand.length === 0 && (
            <div className="scb-empty-hand-notice">Sua mão está vazia neste momento.</div>
          )}
        </div>
      </div>
    </div>
  );
};
