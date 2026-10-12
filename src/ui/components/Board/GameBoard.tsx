import React, { useState } from 'react';
import { useGameController } from '../../hooks/useGameController';
import { OpponentArea } from './OpponentArea';
import { PlayerArea } from './PlayerArea';
import { CentralZone } from '../Central/CentralZone';
import { PhaseControls } from '../Controls/PhaseControls';
import { CardZoomModal } from '../Card/CardZoomModal';
import { SubstitutionModal } from '../Modals/SubstitutionModal';
import { DiscardModal } from '../Modals/DiscardModal';
import { GameOverModal } from '../Modals/GameOverModal';
import { BattleLog } from '../Log/BattleLog';
import { ToastContainer } from '../Toast/ToastContainer';

export const GameBoard: React.FC = () => {
  const {
    gameState,
    cardRegistry,
    isAiThinking,
    expectedActor,
    selectionMode,
    selectedAttackerId,
    selectedBlockAttackIndex,
    inspectedCard,
    setInspectedCard,
    isSubstitutionModalOpen,
    isDiscardModalOpen,
    setIsDiscardModalOpen,
    selectedDiscardCardIds,
    setSelectedDiscardCardIds,
    logs,
    toasts,
    canPlayCard,
    canAttackWith,
    isTargetValidForAttacker,
    handleHandCardClick,
    handleAllyStudentClick,
    handleOpponentStudentClick,
    handleOpponentRepresentativeClick,
    handleAttackSelectForBlock,
    handleConfirmSubstitution,
    handleCancelSubstitution,
    handleConfirmDiscard,
    handleActivateHighlight,
    handleAdvancePhase,
    cancelSelection,
    handleRestartMatch,
  } = useGameController();

  const [isLogOpen, setIsLogOpen] = useState(false);

  const player1 = gameState.players.player1;
  const player2 = gameState.players.player2;

  // Alterna carta para descarte na End Phase
  const handleToggleDiscardCard = (cardId: string) => {
    setSelectedDiscardCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  return (
    <div className="scb-gameboard-container">
      {/* Top Banner / Navegação Minimalista */}
      <header className="scb-top-nav">
        <div className="scb-brand">
          <span className="scb-brand-logo">SCB</span>
          <span className="scb-brand-name">School Card Battle</span>
          <span className="scb-version-pill">Alpha v0.10</span>
        </div>

        <div className="scb-status-banner">
          {selectionMode === 'SELECTING_BLOCK_DEFENDER' && (
            <div className="scb-banner-action-hint scb-hint-defense">
              🛡 Selecione um Estudante seu para bloquear o ataque
            </div>
          )}
          {selectionMode === 'SELECTING_DEBATE_TARGET' && (
            <div className="scb-banner-action-hint scb-hint-debate">
              🗣 Selecione um Estudante alvo para a réplica de Debate
            </div>
          )}
        </div>

        <div className="scb-nav-actions">
          <button
            type="button"
            className="scb-btn-ghost"
            onClick={() => setIsLogOpen((prev) => !prev)}
          >
            📜 Log ({logs.length})
          </button>
        </div>
      </header>

      {/* Mesa de Jogo */}
      <main className="scb-board-surface">
        {/* Área do Oponente (IA) */}
        <OpponentArea
          player={player2}
          cardRegistry={cardRegistry}
          isTargetCandidateForAttack={isTargetValidForAttacker}
          onStudentClick={handleOpponentStudentClick}
          onRepresentativeClick={handleOpponentRepresentativeClick}
          onInspectCard={(def) => setInspectedCard(def)}
        />

        {/* Área Central (Combate e Debates) */}
        <CentralZone
          combat={gameState.combat}
          debate={gameState.debate}
          cardRegistry={cardRegistry}
          isAiThinking={isAiThinking}
          activePlayerId={gameState.activePlayerId}
          expectedActor={expectedActor}
          selectedBlockAttackIndex={selectedBlockAttackIndex}
          players={gameState.players}
          onSelectAttackForBlock={handleAttackSelectForBlock}
          onInspectCard={(def) => setInspectedCard(def)}
          onPassDebate={gameState.debate.active && expectedActor === 'player1' ? handleAdvancePhase : undefined}
        />

        {/* Área do Jogador Humano */}
        <PlayerArea
          player={player1}
          cardRegistry={cardRegistry}
          selectedAttackerId={selectedAttackerId}
          canPlayCard={canPlayCard}
          canAttackWith={canAttackWith}
          onHandCardClick={handleHandCardClick}
          onAllyStudentClick={handleAllyStudentClick}
          onActivateHighlight={handleActivateHighlight}
          onInspectCard={(def) => setInspectedCard(def)}
        />
      </main>

      {/* Controles de Fases e Recursos (Barra Inferior Fixa) */}
      <footer className="scb-footer-controls">
        <PhaseControls
          currentPhase={gameState.phase}
          turn={gameState.turn}
          activePlayerId={gameState.activePlayerId}
          isAiThinking={isAiThinking}
          expectedActor={expectedActor}
          attacksCount={gameState.combat?.attacks?.length ?? 0}
          hasReadyAttacker={player1.board.some((s) => s.ready && !gameState.combat?.attacks?.some((a) => a.attackerInstanceId === s.instanceId))}
          player={player1}
          debateActive={gameState.debate.active}
          selectionMode={selectionMode}
          onAdvancePhase={handleAdvancePhase}
          onCancelSelection={cancelSelection}
          onToggleLog={() => setIsLogOpen((prev) => !prev)}
          onRestartMatch={handleRestartMatch}
        />
      </footer>

      {/* Modais de Gameplay */}
      <CardZoomModal
        cardDefinition={inspectedCard}
        onClose={() => setInspectedCard(null)}
      />

      <SubstitutionModal
        isOpen={isSubstitutionModalOpen}
        boardStudents={player1.board}
        cardRegistry={cardRegistry}
        onConfirm={handleConfirmSubstitution}
        onCancel={handleCancelSubstitution}
      />

      <DiscardModal
        isOpen={isDiscardModalOpen}
        handCards={player1.hand}
        cardRegistry={cardRegistry}
        selectedCardIds={selectedDiscardCardIds}
        requiredCount={Math.max(0, player1.hand.length - 8)}
        onToggleCard={handleToggleDiscardCard}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setIsDiscardModalOpen(false)}
      />

      <GameOverModal
        status={gameState.status}
        winnerId={gameState.winnerId}
        turn={gameState.turn}
        player1={player1}
        player2={player2}
        onRestart={handleRestartMatch}
      />

      {/* Painel Retrátil de Log */}
      <BattleLog
        isOpen={isLogOpen}
        logs={logs}
        onClose={() => setIsLogOpen(false)}
      />

      {/* Feedback de Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
};
