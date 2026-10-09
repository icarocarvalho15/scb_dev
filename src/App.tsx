import { useMemo } from 'react';
import { createInitialGameState } from './core';

export default function App() {
  const initialGameState = useMemo(() => createInitialGameState(), []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>School Card Battle (SCB)</h1>
      <p><strong>Fase 1 — Fundação:</strong> Motor de regras inicializado com sucesso.</p>
      <section style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <h2>Estado Inicial do Jogo</h2>
        <p><strong>ID da Partida:</strong> {initialGameState.matchId}</p>
        <p><strong>Turno:</strong> {initialGameState.turn} ({initialGameState.phase})</p>
        <p><strong>Status:</strong> {initialGameState.status}</p>
        <p><strong>Jogador Ativo:</strong> {initialGameState.activePlayerId}</p>
        <h3>Jogadores:</h3>
        <ul>
          {Object.values(initialGameState.players).map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> ({p.id}) — Representante: {p.representative.name} (Moral: {p.representative.currentMorale}/{p.representative.maxMorale}, Popularidade: {p.representative.popularity}) | Energia: {p.energy}/{p.maxEnergy} | Mão: {p.hand.length} cartas | Deck: {p.deck.length} cartas
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
