import React from 'react';
import { CardInstance, CardDefinition, CardType, Keyword } from '../../../core/types/card';
import { CardZone } from '../../../core/types/zone';
import { findCardDefinition } from '../../../cards/alphaCards';

export interface CardComponentProps {
  cardInstance?: CardInstance;
  cardDefinition?: CardDefinition;
  cardRegistry?: Record<string, CardDefinition>;
  isPlayable?: boolean;
  isSelected?: boolean;
  isTargetCandidate?: boolean;
  isAttacking?: boolean;
  isDefending?: boolean;
  isOpponentHand?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  onInspect?: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  cardInstance,
  cardDefinition,
  cardRegistry,
  isPlayable = false,
  isSelected = false,
  isTargetCandidate = false,
  isAttacking = false,
  isDefending = false,
  isOpponentHand = false,
  size = 'medium',
  onClick,
  onInspect,
}) => {
  // Se for o verso da carta na mão do oponente
  if (isOpponentHand) {
    return (
      <div
        className={`scb-card scb-card-back scb-card-${size}`}
        title="Carta do oponente"
      >
        <div className="scb-card-back-pattern">
          <div className="scb-card-back-crest">SCB</div>
        </div>
      </div>
    );
  }

  // Determina a definição estática da carta
  const definition: CardDefinition | undefined =
    cardDefinition ||
    (cardInstance
      ? cardRegistry?.[cardInstance.definitionId] || findCardDefinition(cardInstance.definitionId)
      : undefined);

  if (!definition) {
    return (
      <div className={`scb-card scb-card-unknown scb-card-${size}`}>
        <span>Desconhecida</span>
      </div>
    );
  }

  const isStudent = definition.type === CardType.STUDENT;
  const isDebate = definition.type === CardType.DEBATE;
  const isEnvironment = definition.type === CardType.ENVIRONMENT;

  const currentInfluence = cardInstance?.currentInfluence ?? definition.influence;
  const currentMorale = cardInstance?.currentMorale ?? definition.morale;
  const maxMorale = cardInstance?.maxMorale ?? definition.maxMorale ?? definition.morale;
  const isDamaged = currentMorale !== undefined && maxMorale !== undefined && currentMorale < maxMorale;
  const hasInertia = cardInstance?.hasInertia ?? false;
  const isReady = cardInstance?.ready ?? false;

  const cardClasses = [
    'scb-card',
    `scb-card-${size}`,
    `scb-card-type-${definition.type.toLowerCase()}`,
    isPlayable ? 'scb-card-playable' : '',
    isSelected ? 'scb-card-selected' : '',
    isTargetCandidate ? 'scb-card-target-candidate' : '',
    isAttacking ? 'scb-card-attacking' : '',
    isDefending ? 'scb-card-defending' : '',
    hasInertia ? 'scb-card-inertia' : '',
    isReady && !hasInertia ? 'scb-card-ready' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      onContextMenu={(e) => {
        if (onInspect) {
          e.preventDefault();
          onInspect();
        }
      }}
      title={`${definition.name}\n${definition.text || ''}`}
    >
      {/* Top Header: Custo de Energia e Tipo */}
      <div className="scb-card-header">
        <div className="scb-card-cost" title={`Custo: ${definition.cost} Energia`}>
          {definition.cost}
        </div>
        <div className="scb-card-type-badge">
          {isStudent ? 'Estudante' : isDebate ? 'Debate' : isEnvironment ? 'Ambiente' : definition.type}
        </div>
      </div>

      {/* Nome da Carta */}
      <div className="scb-card-title">{definition.name}</div>

      {/* Traços / Classes */}
      {definition.traits && definition.traits.length > 0 && (
        <div className="scb-card-traits">
          {definition.traits.map((t, idx) => (
            <span key={idx} className="scb-trait-badge">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Área de Ilustração Estilizada */}
      <div className="scb-card-illustration">
        <div className="scb-card-art-symbol">
          {isStudent && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
          {isDebate && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
          {isEnvironment && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          )}
        </div>
        {hasInertia && <div className="scb-inertia-ribbon">Inércia</div>}
        {isReady && !hasInertia && isStudent && <div className="scb-ready-pulse" />}
      </div>

      {/* Keywords (Badges) */}
      {definition.keywords && definition.keywords.length > 0 && (
        <div className="scb-card-keywords">
          {definition.keywords
            .filter((kw) => {
              if (kw === Keyword.INERCIA && cardInstance?.zone === CardZone.BOARD && !hasInertia) {
                return false;
              }
              return true;
            })
            .map((kw, idx) => (
              <span key={idx} className="scb-keyword-badge" title={`Palavra-chave: ${kw}`}>
                {kw}
              </span>
            ))}
        </div>
      )}

      {/* Texto de Efeito */}
      {definition.text && (
        <div className="scb-card-body" title={definition.text}>
          <p>{definition.text}</p>
        </div>
      )}

      {/* Footer com Stats (Influência e Moral) */}
      {isStudent && (
        <div className="scb-card-stats">
          <div className="scb-stat scb-stat-influence" title={`Influência (Ataque): ${currentInfluence}`}>
            <span className="scb-stat-icon">⚔</span>
            <span className="scb-stat-value">{currentInfluence}</span>
          </div>
          <div
            className={`scb-stat scb-stat-morale ${isDamaged ? 'scb-stat-damaged' : ''}`}
            title={`Moral (Vida): ${currentMorale}/${maxMorale}`}
          >
            <span className="scb-stat-icon">♥</span>
            <span className="scb-stat-value">
              {currentMorale}
              {isDamaged && <small className="scb-stat-max">/{maxMorale}</small>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
