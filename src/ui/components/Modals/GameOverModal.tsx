import React from 'react';
import { GameStatus } from '../../../core/types/state';
import { PlayerState } from '../../../core/types/player';

export interface GameOverModalProps {
  status: GameStatus;
  winnerId: string | null;
  turn: number;
  player1: PlayerState;
  player2: PlayerState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  winnerId,
  turn,
  player1,
  player2,
  onRestart,
}) => {
  if (status !== GameStatus.FINISHED) return null;

  const isPlayerWinner = winnerId === 'player1';

  return (
    <div className="scb-modal-overlay scb-gameover-overlay">
      <div className={`scb-modal-content scb-gameover-modal ${isPlayerWinner ? 'scb-victory' : 'scb-defeat'}`}>
        <div className="scb-gameover-header">
          <div className="scb-gameover-trophy">
            {isPlayerWinner ? '🏆' : '💔'}
          </div>
          <h2>{isPlayerWinner ? 'VITÓRIA DA TURMA!' : 'DERROTA NO TORNEIO'}</h2>
          <p className="scb-gameover-subtitle">
            {isPlayerWinner
              ? 'Daichi e o Clube de Esportes superaram o Grêmio Estudantil com maestria!'
              : 'Akira e o Grêmio Estudantil mantiveram a supremacia escolar.'}
          </p>
        </div>

        <div className="scb-gameover-stats">
          <div className="scb-gameover-stat-box">
            <span className="scb-stat-title">Duração</span>
            <span className="scb-stat-number">{turn} Turnos</span>
          </div>

          <div className="scb-gameover-stat-box">
            <span className="scb-stat-title">Moral de Daichi (Você)</span>
            <span className="scb-stat-number">
              {player1.representative.currentMorale} / {player1.representative.maxMorale}
            </span>
          </div>

          <div className="scb-gameover-stat-box">
            <span className="scb-stat-title">Moral de Akira (IA)</span>
            <span className="scb-stat-number">
              {player2.representative.currentMorale} / {player2.representative.maxMorale}
            </span>
          </div>

          <div className="scb-gameover-stat-box">
            <span className="scb-stat-title">Popularidade Conquistada</span>
            <span className="scb-stat-number">{player1.representative.popularity} ★</span>
          </div>
        </div>

        <div className="scb-gameover-footer">
          <button type="button" className="scb-btn-primary scb-btn-restart-large" onClick={onRestart}>
            Jogar Novamente 🔄
          </button>
        </div>
      </div>
    </div>
  );
};
