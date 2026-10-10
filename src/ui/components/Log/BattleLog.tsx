import React from 'react';
import { LogEntry } from '../../types';

export interface BattleLogProps {
  isOpen: boolean;
  logs: LogEntry[];
  onClose: () => void;
}

export const BattleLog: React.FC<BattleLogProps> = ({ isOpen, logs, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="scb-log-drawer">
      <div className="scb-log-header">
        <h4>📜 Histórico de Batalha</h4>
        <button className="scb-btn-close-log" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="scb-log-list">
        {logs.map((entry) => (
          <div key={entry.id} className={`scb-log-item scb-log-actor-${entry.actor}`}>
            <span className="scb-log-turn">T{entry.turn}</span>
            <span className="scb-log-message">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
