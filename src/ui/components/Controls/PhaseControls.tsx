import React from 'react';
import { GamePhase } from '../../../core/types/phase';
import { PlayerState } from '../../../core/types/player';

export interface PhaseControlsProps {
  currentPhase: GamePhase;
  turn: number;
  activePlayerId: string;
  isAiThinking: boolean;
  expectedActor?: string | null;
  attacksCount?: number;
  hasReadyAttacker?: boolean;
  player: PlayerState;
  debateActive: boolean;
  selectionMode: string;
  onAdvancePhase: () => void;
  onCancelSelection: () => void;
  onToggleLog: () => void;
  onRestartMatch: () => void;
}

const PHASES_ORDER: { key: GamePhase; label: string; icon: string }[] = [
  { key: GamePhase.START, label: 'Início', icon: '☀' },
  { key: GamePhase.MAIN, label: 'Principal', icon: '🎴' },
  { key: GamePhase.DEBATE, label: 'Debate', icon: '💬' },
  { key: GamePhase.COMBAT, label: 'Combate', icon: '⚔' },
  { key: GamePhase.END, label: 'Fim', icon: '🌙' },
];

export const PhaseControls: React.FC<PhaseControlsProps> = ({
  currentPhase,
  turn,
  activePlayerId,
  isAiThinking,
  expectedActor,
  attacksCount,
  hasReadyAttacker,
  player,
  debateActive,
  selectionMode,
  onAdvancePhase,
  onCancelSelection,
  onToggleLog,
  onRestartMatch,
}) => {
  const isPlayerTurn = activePlayerId === 'player1';
  const isPlayerExpected = expectedActor === 'player1';

  // Texto descritivo para o botão principal de avanço
  let actionButtonText = 'Avançar Fase';
  if (isPlayerTurn) {
    switch (currentPhase) {
      case GamePhase.START:
        actionButtonText = 'Iniciando Turno...';
        break;
      case GamePhase.MAIN:
        actionButtonText = 'Fase de Debate ➔';
        break;
      case GamePhase.DEBATE:
        actionButtonText = debateActive ? 'Passar no Debate' : 'Fase de Combate ➔';
        break;
      case GamePhase.COMBAT:
        if ((attacksCount ?? 0) === 0) {
          actionButtonText = 'Pular Combate ➔';
        } else if (hasReadyAttacker) {
          actionButtonText = 'Concluir Ataques ➔';
        } else {
          actionButtonText = 'Resolver Combate ➔';
        }
        break;
      case GamePhase.END:
        actionButtonText = 'Concluir Turno ↺';
        break;
    }
  } else {
    // Vez da IA
    if (currentPhase === GamePhase.COMBAT && isPlayerExpected) {
      actionButtonText = 'Concluir Defesa / Resolver';
    } else if (currentPhase === GamePhase.DEBATE && debateActive && isPlayerExpected) {
      actionButtonText = 'Passar no Debate';
    } else {
      actionButtonText = 'Turno da IA...';
    }
  }

  const isButtonDisabled = isAiThinking || !isPlayerExpected || currentPhase === GamePhase.START;

  return (
    <div className="scb-phase-controls">
      {/* Turno e Indicador de Energia */}
      <div className="scb-controls-left">
        <div className="scb-turn-counter">
          <span className="scb-turn-number">Turno {turn}</span>
          <span className="scb-turn-player-tag">
            {isPlayerTurn ? 'Seu Turno' : 'Turno Oponente'}
          </span>
        </div>

        {/* Orbes de Energia do Jogador */}
        <div className="scb-player-energy-bar">
          <div className="scb-energy-icon-wrap">
            <span className="scb-energy-icon">⚡</span>
            <span className="scb-energy-count">
              {player.energy} / {player.maxEnergy}
            </span>
          </div>
          <div className="scb-energy-orbs">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isFilled = idx < player.energy;
              const isUnlocked = idx < player.maxEnergy;
              return (
                <div
                  key={idx}
                  className={`scb-energy-orb ${isFilled ? 'scb-orb-filled' : isUnlocked ? 'scb-orb-empty' : 'scb-orb-locked'
                    }`}
                  title={`Energia ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Trilha de Fases */}
      <div className="scb-phase-tracker">
        {PHASES_ORDER.map((phase) => {
          const isActive = currentPhase === phase.key;
          return (
            <div
              key={phase.key}
              className={`scb-phase-step ${isActive ? 'scb-phase-active' : ''}`}
              title={`Fase: ${phase.label}`}
            >
              <span className="scb-phase-icon">{phase.icon}</span>
              <span className="scb-phase-name">{phase.label}</span>
              {isActive && <div className="scb-phase-glow" />}
            </div>
          );
        })}
      </div>

      {/* Botões de Ação do Turno */}
      <div className="scb-controls-right">
        {selectionMode !== 'NONE' && (
          <button
            type="button"
            className="scb-btn-secondary scb-btn-cancel"
            onClick={onCancelSelection}
          >
            ✕ Cancelar Seleção
          </button>
        )}

        <button
          type="button"
          className="scb-btn-primary scb-btn-advance"
          disabled={isButtonDisabled}
          onClick={onAdvancePhase}
        >
          {actionButtonText}
        </button>

        <button
          type="button"
          className="scb-btn-icon"
          onClick={onToggleLog}
          title="Histórico de Ações"
        >
          📜
        </button>

        <button
          type="button"
          className="scb-btn-icon scb-btn-restart"
          onClick={onRestartMatch}
          title="Reiniciar Partida"
        >
          🔄
        </button>
      </div>
    </div>
  );
};
