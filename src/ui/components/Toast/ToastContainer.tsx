import React from 'react';
import { ToastNotification } from '../../types';

export interface ToastContainerProps {
  toasts: ToastNotification[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="scb-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`scb-toast scb-toast-${toast.type}`}>
          <span className="scb-toast-icon">
            {toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✓' : toast.type === 'warning' ? '✋' : 'ℹ'}
          </span>
          <span className="scb-toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
