import { GameAction } from '../core/types/action';

export type UISelectionMode =
  | 'NONE'
  | 'SELECTING_ATTACK_TARGET'
  | 'SELECTING_BLOCK_DEFENDER'
  | 'SELECTING_DEBATE_TARGET';

export interface CombatInteractionState {
  selectedAttackerId: string | null;
  selectedBlockerId: string | null;
  selectedAttackIndex: number | null;
}

export interface ToastNotification {
  id: string;
  type: 'error' | 'info' | 'success' | 'warning';
  message: string;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  turn: number;
  actor: 'player' | 'ai' | 'engine';
  message: string;
  action?: GameAction;
  timestamp: number;
}
