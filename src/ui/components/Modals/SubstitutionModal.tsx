import React, { useState } from 'react';
import { CardInstance, CardDefinition } from '../../../core/types/card';
import { CardComponent } from '../Card/CardComponent';

export interface SubstitutionModalProps {
  isOpen: boolean;
  boardStudents: CardInstance[];
  cardRegistry: Record<string, CardDefinition>;
  onConfirm: (replaceCardInstanceId: string) => void;
  onCancel: () => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  boardStudents,
  cardRegistry,
  onConfirm,
  onCancel,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="scb-modal-overlay">
      <div className="scb-modal-content scb-substitution-modal">
        <div className="scb-modal-header">
          <h3>Regra de Substituição (Campo Cheio)</h3>
          <button className="scb-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="scb-modal-body">
          <p className="scb-modal-instruction">
            Seu campo já atingiu o limite de <strong>6 Estudantes</strong>. Selecione qual Estudante aliado
            será aposentado/descartado para abrir vaga para o novo calouro:
          </p>

          <div className="scb-substitution-grid">
            {boardStudents.map((student) => {
              const isSelected = selectedStudentId === student.instanceId;
              return (
                <div
                  key={student.instanceId}
                  className={`scb-sub-item ${isSelected ? 'scb-sub-selected' : ''}`}
                  onClick={() => setSelectedStudentId(student.instanceId)}
                >
                  <CardComponent
                    cardInstance={student}
                    cardRegistry={cardRegistry}
                    size="small"
                    isSelected={isSelected}
                  />
                  <button
                    type="button"
                    className={`scb-btn-select-sub ${isSelected ? 'scb-btn-selected' : ''}`}
                  >
                    {isSelected ? '✓ Selecionado' : 'Substituir este'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="scb-modal-footer">
          <button type="button" className="scb-btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="scb-btn-primary"
            disabled={!selectedStudentId}
            onClick={() => {
              if (selectedStudentId) onConfirm(selectedStudentId);
            }}
          >
            Confirmar Substituição
          </button>
        </div>
      </div>
    </div>
  );
};
