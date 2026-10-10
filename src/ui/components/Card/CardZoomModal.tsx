import React from 'react';
import { CardDefinition } from '../../../core/types/card';
import { CardComponent } from './CardComponent';

export interface CardZoomModalProps {
  cardDefinition: CardDefinition | null;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({ cardDefinition, onClose }) => {
  if (!cardDefinition) return null;

  return (
    <div className="scb-modal-overlay" onClick={onClose}>
      <div className="scb-modal-content scb-card-zoom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scb-modal-header">
          <h3>Detalhes da Carta</h3>
          <button className="scb-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="scb-modal-body scb-card-zoom-body">
          <CardComponent cardDefinition={cardDefinition} size="large" />
          <div className="scb-card-zoom-info">
            <h4>{cardDefinition.name}</h4>
            <div className="scb-zoom-meta">
              <span className="scb-badge scb-badge-cost">Custo: {cardDefinition.cost} Energia</span>
              <span className="scb-badge scb-badge-type">{cardDefinition.type}</span>
            </div>
            {cardDefinition.traits && cardDefinition.traits.length > 0 && (
              <div className="scb-zoom-traits">
                <strong>Traços:</strong> {cardDefinition.traits.join(', ')}
              </div>
            )}
            {cardDefinition.keywords && cardDefinition.keywords.length > 0 && (
              <div className="scb-zoom-keywords">
                <strong>Palavras-chave:</strong> {cardDefinition.keywords.join(', ')}
              </div>
            )}
            <div className="scb-zoom-desc">
              <strong>Habilidade / Texto:</strong>
              <p>{cardDefinition.text || 'Sem efeito adicional registrado.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
