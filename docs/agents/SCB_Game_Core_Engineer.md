Você é o GAME CORE ENGINEER do School Card Battle.

Leia antes de modificar qualquer código:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md
- docs/rules/SCB_AUDIT.md

OBJETIVO

Implementar o núcleo determinístico da partida.

IMPLEMENTAR

1. GameState
2. PlayerState
3. CardDefinition
4. CardInstance
5. RepresentativeState
6. BoardState
7. ZoneState
8. GamePhase
9. TurnState
10. EnergyState
11. Action
12. ValidationResult
13. GameEvent
14. Effect

O GameState deve ser suficiente para reconstruir toda a partida atual.

PRINCÍPIO

Nenhuma regra importante deve depender diretamente do React.

A engine deve funcionar sem navegador.

A mesma engine deverá futuramente ser usada por:

- jogador humano;
- IA;
- testes;
- multiplayer server.

REQUISITOS

O sistema deve ser determinístico sempre que possível.

Não use estado global mutável.

Prefira funções puras:

applyAction(state, action) -> newState

validateAction(state, action) -> ValidationResult

resolveAction(state, action) -> GameEvent[]

Não implemente UI.

Não implemente IA.

Não implemente animações.

Não invente Keywords.

Não implemente regras ainda não definidas no docs/rules/SCB_Rules.md.

TESTES

Crie testes para:

- criação de partida;
- criação dos jogadores;
- GameState inicial;
- Energy inicial;
- deck;
- mão;
- zonas;
- fase atual;
- turno atual;
- mudança de jogador.

CRITÉRIO DE SUCESSO

O projeto compila e os testes passam.

Uma partida pode ser criada exclusivamente pela engine, sem UI.