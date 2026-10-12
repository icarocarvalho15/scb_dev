import React from 'react';
import { CardInstance, CardDefinition } from '../../../core/types/card';
import { CardComponent } from '../Card/CardComponent';

export interface MulliganModalProps {
  isOpen: boolean;
  handCards: CardInstance[];
  cardRegistry: Record<string, CardDefinition>;
  selectedCardIds: string[];
  onToggleCard: (cardId: string) => void;
  onConfirm: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onInspectCard?: (cardDef: CardDefinition) => void;
}

export const MulliganModal: React.FC<MulliganModalProps> = ({
  isOpen,
  handCards,
  cardRegistry,
  selectedCardIds,
  onToggleCard,
  onConfirm,
  onSelectAll,
  onClearSelection,
  onInspectCard,
}) => {
  if (!isOpen) return null;

  const selectedCount = selectedCardIds.length;
  const isKeepingHand = selectedCount === 0;

  return (
    <div className="scb-modal-overlay scb-mulligan-overlay" role="dialog" aria-modal="true">
      <div className="scb-modal-content scb-mulligan-modal">
        {/* Cabeçalho do Modal */}
        <div className="scb-modal-header scb-mulligan-header">
          <div className="scb-mulligan-title-cluster">
            <span className="scb-mulligan-icon">🃏</span>
            <div>
              <h3>Fase de Mulligan — Abertura da Partida</h3>
              <p className="scb-mulligan-subtitle">
                Oportunidade Única de Preparação Estratégica (Turno 1)
              </p>
            </div>
          </div>
          <span className="scb-version-pill">Alpha 1.0</span>
        </div>

        {/* Corpo com Instrução e Grid das 4 Cartas */}
        <div className="scb-modal-body scb-mulligan-body">
          <div className="scb-mulligan-instructions-box">
            <p>
              Avalie sua mão inicial de 4 cartas. Você pode escolher de <strong>0 a 4 cartas</strong> para substituir.
              As cartas selecionadas serão devolvidas ao baralho e repostas por novas compras do topo.
              Caso não marque nenhuma carta, você optará por <strong>Manter a Mão</strong>.
            </p>
          </div>

          <div className="scb-mulligan-quick-toolbar">
            <div className="scb-mulligan-counter-badge">
              {isKeepingHand ? (
                <span className="scb-badge-keep">✨ Modo: Manter Mão Completa</span>
              ) : (
                <span className="scb-badge-replace">
                  🔄 {selectedCount} de {handCards.length} carta(s) marcada(s) para troca
                </span>
              )}
            </div>

            <div className="scb-mulligan-quick-actions">
              {onSelectAll && selectedCount < handCards.length && (
                <button
                  type="button"
                  className="scb-btn-ghost scb-btn-xs"
                  onClick={onSelectAll}
                  title="Marcar todas as cartas para substituição"
                >
                  Selecionar Todas
                </button>
              )}
              {onClearSelection && selectedCount > 0 && (
                <button
                  type="button"
                  className="scb-btn-ghost scb-btn-xs"
                  onClick={onClearSelection}
                  title="Desmarcar todas as cartas e manter a mão"
                >
                  Limpar Seleção
                </button>
              )}
            </div>
          </div>

          {/* Grid com Destaque para as 4 Cartas */}
          <div className="scb-mulligan-grid">
            {handCards.map((card) => {
              const isSelected = selectedCardIds.includes(card.instanceId);
              const def = cardRegistry[card.definitionId];

              return (
                <div
                  key={card.instanceId}
                  className={`scb-mulligan-card-wrapper ${
                    isSelected ? 'scb-mulligan-card-selected' : 'scb-mulligan-card-kept'
                  }`}
                  onClick={() => onToggleCard(card.instanceId)}
                >
                  <div className="scb-mulligan-status-tag">
                    {isSelected ? (
                      <span className="scb-tag-swap">🔄 Trocar</span>
                    ) : (
                      <span className="scb-tag-keep">✓ Manter</span>
                    )}
                  </div>

                  <CardComponent
                    cardInstance={card}
                    cardRegistry={cardRegistry}
                    size="medium"
                    isSelected={isSelected}
                    onInspect={def && onInspectCard ? () => onInspectCard(def) : undefined}
                  />

                  <div className="scb-mulligan-toggle-indicator">
                    {isSelected ? '☒ Marcar para devolver' : '☐ Clique para trocar'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé com Confirmação Dinâmica */}
        <div className="scb-modal-footer scb-mulligan-footer">
          <div className="scb-mulligan-footer-hint">
            <span>💡 A IA do oponente responderá ao Mulligan simultaneamente.</span>
          </div>

          <button
            type="button"
            className={`scb-btn-primary ${
              isKeepingHand ? 'scb-btn-keep-hand' : 'scb-btn-replace-cards'
            }`}
            onClick={onConfirm}
          >
            {isKeepingHand ? (
              <span>✨ Manter Mão Inicial</span>
            ) : (
              <span>
                🔄 Substituir {selectedCount} Carta{selectedCount > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
