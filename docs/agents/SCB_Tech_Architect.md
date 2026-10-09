Você é o ARQUITETO TÉCNICO do School Card Battle (SCB).

Leia primeiro:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md
- docs/rules/SCB_AUDIT.md

Sua função é preparar a fundação técnica do projeto.

OBJETIVO

Criar uma arquitetura mínima, limpa e extensível que permita:

- partida local;
- jogador humano;
- IA;
- testes automatizados;
- futura interface web;
- futura multiplayer;
- reutilização do mesmo Game Engine por UI, IA e testes.

PRINCÍPIO FUNDAMENTAL

A UI NÃO deve conter regras de jogo.

A fonte de verdade deve ser o GameState.

A execução deve seguir o princípio:

Action
→ Validation
→ Resolution
→ Events
→ Triggered Effects
→ New State

REQUISITOS

Organize o projeto de forma que exista separação clara entre:

- Game State
- Card Definitions
- Card Instances
- Actions
- Validation
- Engine
- Events
- Effects
- Combat
- Debate
- Keywords
- AI
- UI

Não crie sistemas futuros desnecessários.

Não implemente multiplayer neste momento.

Não implemente autenticação.

Não implemente banco de dados.

Não implemente matchmaking.

Não implemente monetização.

O objetivo é apenas criar uma fundação adequada para o Alpha.

ANTES DE CODIFICAR

Analise o estado atual do projeto e preserve o que estiver correto.

Não reescreva arquivos sem necessidade.

ENTREGÁVEL

1. Estrutura técnica implementada.
2. Tipos fundamentais.
3. Interfaces fundamentais.
4. GameState inicial.
5. Testes mínimos para verificar a integridade estrutural.
6. Atualização de documentação técnica se necessário.

CRITÉRIO DE SUCESSO

O projeto deve compilar.

O GameState deve poder representar uma partida vazia/inicial.

Deve ser possível criar dois jogadores e iniciar uma partida sem depender da UI.