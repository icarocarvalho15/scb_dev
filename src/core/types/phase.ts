/**
 * Fases de jogo de School Card Battle (SCB)
 * Conforme especificado em docs/rules/SCB_Architecture.md seção 12 e docs/rules/SCB_Rules.md seção 10
 */
export enum GamePhase {
  START = 'START',
  MAIN = 'MAIN',
  DEBATE = 'DEBATE',
  COMBAT = 'COMBAT',
  END = 'END',
}
