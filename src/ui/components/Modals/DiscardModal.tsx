import React from 'react';
import { CardInstance, CardDefinition } from '../../../core/types/card';
import { CardComponent } from '../Card/CardComponent';

export interface DiscardModalProps {
  isOpen: boolean;
  handCards: CardInstance[];
  cardRegistry: Record<string, CardDefinition>;
  selectedCardIds: string[];
  requiredCount: number;
  onToggleCard: (cardId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({
  isOpen,
  handCards,
  cardRegistry,
  selectedCardIds,
  requiredCount,
  onToggleCard,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const canConfirm = selectedCardIds.length === requiredCount;

  return (
    <div className="scb-modal-overlay">
      <div className="scb-modal-content scb-discard-modal">
        <div className="scb-modal-header">
          <h3>Limite de Mão Excedido (Fim do Turno)</h3>
          <button className="scb-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="scb-modal-body">
          <p className="scb-modal-instruction">
            O limite da mão é de 8 cartas. Você possui {handCards.length} cartas e deve descartar{' '}
            <strong>{requiredCount} carta(s)</strong> para concluir seu turno:
          </p>

          <div className="scb-discard-counter">
            Selecionadas: {selectedCardIds.length} / {requiredCount}
          </div>

          <div className="scb-discard-grid">
            {handCards.map((card) => {
              const isSelected = selectedCardIds.includes(card.instanceId);
              return (
                <div
                  key={card.instanceId}
                  className={`scb-discard-item ${isSelected ? 'scb-discard-selected' : ''}`}
                  onClick={() => onToggleCard(card.instanceId)}
                >
                  <CardComponent
                    cardInstance={card}
                    cardRegistry={cardRegistry}
                    size="small"
                    isSelected={isSelected}
                  />
                  <div className="scb-discard-checkbox">
                    {isSelected ? '☒ Descartar' : '☐ Manter'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="scb-modal-footer">
          <button type="button" className="scb-btn-secondary" onClick={onCancel}>
            Voltar
          </button>
          <button
            type="button"
            className="scb-btn-primary"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Confirmar Descarte ({selectedCardIds.length}/{requiredCount})
          </button>
        </div>
      </div>
    </div>
  );
};
