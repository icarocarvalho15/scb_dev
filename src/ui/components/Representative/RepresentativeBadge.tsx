import React from 'react';
import { RepresentativeState } from '../../../core/types/player';

export interface RepresentativeBadgeProps {
  representative: RepresentativeState;
  isPlayer: boolean;
  diplomacyActive: boolean;
  isTargetCandidate?: boolean;
  onActivateHighlight?: () => void;
  onClick?: () => void;
}

export const RepresentativeBadge: React.FC<RepresentativeBadgeProps> = ({
  representative,
  isPlayer,
  diplomacyActive,
  isTargetCandidate = false,
  onActivateHighlight,
  onClick,
}) => {
  const moralePercent = Math.max(
    0,
    Math.min(100, (representative.currentMorale / representative.maxMorale) * 100)
  );

  const canActivateHighlight =
    isPlayer &&
    representative.popularity >= representative.popularityRequirement &&
    representative.highlightAvailable;

  return (
    <div
      className={`scb-representative-badge ${isPlayer ? 'scb-rep-player' : 'scb-rep-opponent'} ${
        isTargetCandidate ? 'scb-rep-target-candidate' : ''
      }`}
      onClick={onClick}
      title={`Representante: ${representative.name}\nMoral: ${representative.currentMorale}/${representative.maxMorale}\nPopularidade: ${representative.popularity}/${representative.popularityRequirement}`}
    >
      <div className="scb-rep-avatar">
        <div className="scb-rep-avatar-icon">
          {representative.name.charAt(0)}
        </div>
        {diplomacyActive && (
          <span className="scb-diplomacy-badge" title="Diplomacia ativa: Imune a ataques diretos no turno 1">
            🕊 Diplomacia
          </span>
        )}
      </div>

      <div className="scb-rep-details">
        <div className="scb-rep-header">
          <span className="scb-rep-name">{representative.name}</span>
          <span className="scb-rep-role">{isPlayer ? 'Seu Representante' : 'Oponente (IA)'}</span>
        </div>

        {/* Barra de Moral */}
        <div className="scb-morale-container">
          <div className="scb-morale-bar-bg">
            <div
              className={`scb-morale-bar-fill ${
                moralePercent < 30 ? 'scb-morale-low' : moralePercent < 60 ? 'scb-morale-medium' : ''
              }`}
              style={{ width: `${moralePercent}%` }}
            />
          </div>
          <span className="scb-morale-label">
            ♥ {representative.currentMorale} / {representative.maxMorale}
          </span>
        </div>

        {/* Medidor de Popularidade */}
        <div className="scb-popularity-meter">
          <span className="scb-popularity-icon">★</span>
          <span className="scb-popularity-text">
            Popularidade: {representative.popularity} / {representative.popularityRequirement}
          </span>
          <div className="scb-popularity-dots">
            {Array.from({ length: representative.popularityRequirement }).map((_, i) => (
              <span
                key={i}
                className={`scb-pop-dot ${i < representative.popularity ? 'scb-pop-dot-filled' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Botão de Destaque para o Jogador */}
        {isPlayer && onActivateHighlight && (
          <button
            type="button"
            className={`scb-btn-highlight ${canActivateHighlight ? 'scb-highlight-active' : ''}`}
            disabled={!canActivateHighlight}
            onClick={(e) => {
              e.stopPropagation();
              onActivateHighlight();
            }}
            title="Ativar habilidade especial de Destaque da Turma"
          >
            ✨ Destaque {canActivateHighlight ? '(PRONTO)' : `(${representative.popularity}/${representative.popularityRequirement})`}
          </button>
        )}
      </div>
    </div>
  );
};
