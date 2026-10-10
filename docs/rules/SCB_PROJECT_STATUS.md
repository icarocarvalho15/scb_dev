# School Card Battle — Project Status

> Documento de acompanhamento do estado atual do desenvolvimento.
>
> Este arquivo representa o estado do projeto, não substitui o GDD, Rules, Keywords, Architecture ou Balance.

---

# 1. Estado Geral

**Projeto:** School Card Battle (SCB)

**Fase atual:** FASE 10 — UI SYSTEM

**Objetivo atual:** Construir a interface visual interativa para um Alpha jogável local contra IA.

**Status geral:** IN_PROGRESS

**Última atualização:** 2026-10-09

---

# 2. Objetivo do Alpha

O Alpha deve permitir uma partida completa entre:

- jogador humano;
- IA.

Fluxo mínimo:

```text
Início
→ Setup
→ Mão inicial
→ Mulligan
→ Turnos
→ Energy
→ Jogar cartas
→ Campo
→ Combate
→ Debates
→ Keywords principais
→ Popularidade
→ Destaque
→ IA
→ Vitória / Derrota
```

---

# 3. Status por Sistema

| Sistema               | Status      | Prioridade | Observação                         |
| --------------------- | ----------- | ---------: | ---------------------------------- |
| Projeto / Build       | VERIFIED    |   CRITICAL | Vite + TS strict + Vitest operando |
| GameState             | VERIFIED    |   CRITICAL | createInitialGameState funcional   |
| PlayerState           | VERIFIED    |   CRITICAL | 2 jogadores e recursos iniciais    |
| CardDefinition        | VERIFIED    |   CRITICAL | Tipos e contratos estáticos prontos|
| CardInstance          | VERIFIED    |       HIGH | Instâncias e zonas mapeadas        |
| Zones                 | VERIFIED    |       HIGH | Zonas canônicas definidas          |
| Actions               | VERIFIED    |   CRITICAL | GameAction + ADVANCE_PHASE/DISCARD |
| Validation            | VERIFIED    |   CRITICAL | Validação de jogador, fase e limite|
| Turn System           | VERIFIED    |   CRITICAL | Ciclo START->MAIN->DEBATE->COMBAT->END |
| Phases                | VERIFIED    |   CRITICAL | Transição determinística de fases  |
| Energy                | VERIFIED    |   CRITICAL | Escala 1 a 10 e restauração        |
| Draw                  | VERIFIED    |       HIGH | Compra na Start Phase + Deckout    |
| Hand / Mulligan       | VERIFIED    |       HIGH | Limite 8 cartas + corte/descarte   |
| Deck System           | VERIFIED    |       HIGH | Transferência DECK -> HAND         |
| Board                 | VERIFIED    |       HIGH | Limite de 6 Estudantes e alocação na zona BOARD |
| Substituição          | VERIFIED    |       HIGH | Regra normativa no 6º estudante com descarte do antigo |
| Environment           | VERIFIED    |     MEDIUM | Limite de 1 Ambiente ativo com descarte automático do anterior |
| Equipment             | NOT_STARTED |     MEDIUM | —                                  |
| Basic Combat          | VERIFIED    |   CRITICAL | Ataque, bloqueio e resolução determinística operando |
| Inércia               | VERIFIED    |       HIGH | Estudantes entram com hasInertia = true (limpo no turno seguinte) |
| Impulso               | VERIFIED    |       HIGH | Ignora Inércia na entrada e ataca de imediato |
| Provocação            | VERIFIED    |       HIGH | Obriga atacante a declará-lo como alvo (protege Representante e outros estudantes) |
| Guarda                | VERIFIED    |       HIGH | Bloqueio Livre ativo para todos os estudantes (Guarda não é requisito exclusivo) |
| Infiltração           | VERIFIED    |       HIGH | Ignora Provocação ao focar Representante e inalcançável por qualquer bloqueador |
| Diplomacia            | VERIFIED    |       HIGH | Ativa no T1, expira no T2 (impede ataques a Representante) |
| Events                | VERIFIED    |       HIGH | Barramento determinístico com 6 tipos canônicos e dispatch puro |
| Effects               | VERIFIED    |       HIGH | Processador reativo data-driven, triggers e auras contínuas |
| Keywords              | VERIFIED    |       HIGH | Centralizador modular (keywordSystem.ts) com catálogo Alpha completo e testes |
| Representative System | VERIFIED    |       HIGH | Moral 20, Popularidade reativa e Destaque operando em Daichi/Akira |
| Popularidade          | VERIFIED    |       HIGH | Gatilho data-driven funcional via barramento de eventos |
| Destaque              | VERIFIED    |       HIGH | Desbloqueio automático via requisito de Popularidade |
| Debate System         | VERIFIED    |       HIGH | Pilha LIFO de 4 níveis, target invalidation parcial e ações de debate |
| AI                    | VERIFIED    |   CRITICAL | ActionGenerator, LegalActionFilter, Evaluator, DecisionPolicy, AIPlayer e Simulações |
| UI Board              | VERIFIED    |   CRITICAL | Mesa modular com OpponentArea, PlayerArea, CentralZone e slots |
| Card UI               | VERIFIED    |       HIGH | CardComponent rico com stats, traços, keywords, estados e zoom |
| Combat UI             | VERIFIED    |       HIGH | Visualização de confrontos, setas e seleção de bloqueador |
| Debate UI             | VERIFIED    |       HIGH | Pilha LIFO de 4 níveis, identificação de réplica e controle |
| Integration           | VERIFIED    |   CRITICAL | useGameController orquestrando Engine First e IA autônoma |
| QA                    | NOT_STARTED |   CRITICAL | —                                  |
| Alpha Release         | NOT_STARTED |   CRITICAL | —                                  |

---

# 4. Fases

| Fase                 | Status      | Critério de conclusão                          |
| -------------------- | ----------- | ---------------------------------------------- |
| 0. Auditoria         | VERIFIED    | Projeto analisado e bloqueadores identificados |
| 1. Fundação          | VERIFIED    | Engine consegue representar partida inicial    |
| 2. Turnos e Recursos | VERIFIED    | Partida avança vários turnos                   |
| 3. Cartas e Campo    | VERIFIED    | Cartas podem ser jogadas pela engine           |
| 4. Combate           | VERIFIED    | Combate completo funciona sem UI               |
| 5. Events / Effects  | VERIFIED    | Sistema reativo funcional                      |
| 6. Keywords          | VERIFIED    | Keywords Alpha testadas                        |
| 7. Representantes    | VERIFIED    | Popularidade e Destaque funcionam              |
| 8. Debate            | VERIFIED    | Debate completo funciona                       |
| 9. IA                | VERIFIED    | IA completa partidas                           |
| 10. UI               | VERIFIED    | Interface gráfica interativa e responsiva operacional |
| 11. Vertical Slice   | IN_PROGRESS | Partida completa jogável ponta a ponta         |
| 12. QA               | NOT_STARTED | Sem bugs CRITICAL conhecidos                   |
| 13. Alpha            | NOT_STARTED | Alpha funcional                                |

---

# 5. Documentação

| Documento                       | Status      | Observação                                 |
| ------------------------------- | ----------- | ------------------------------------------ |
| docs/agents/SKILL.md            | READY       | Contrato dos agentes                       |
| docs/agents/SCB_Orchestrator.md | READY       | Governança do desenvolvimento              |
| docs/rules/SCB_GDD.md           | READY       | Design                                     |
| docs/rules/SCB_Rules.md         | READY       | Regras                                     |
| docs/rules/SCB_Keywords.md      | READY       | Keywords                                   |
| docs/rules/SCB_Architecture.md  | READY       | Arquitetura                                |
| docs/rules/SCB_Balance.md       | READY       | Balanceamento                              |
| docs/rules/SCB_AUDIT.md         | READY       | Relatório de auditoria técnica (Fase 0)    |
| docs/rules/SCB_QA_REPORT.md     | NOT_STARTED | Criado durante QA                          |
| docs/rules/SCB_ALPHA_STATUS.md  | NOT_STARTED | Criado no fechamento do Alpha              |

---

# 6. Decisões de Design Importantes

## LOCKED

### Plataforma

O projeto será desenvolvido como aplicação web.

### Stack

Direção atual:

* React
* TypeScript
* Vite
* HTML
* CSS

### Engine

A lógica do jogo deve ser separada da UI.

### GameState

GameState é a fonte de verdade da partida.

### IA

A IA deve utilizar o mesmo Game Engine do jogador.

### Energy

Energy começa em 1.

Max Energy aumenta em +1 por turno até 10.

### Mão inicial

4 cartas.

### Mulligan

Mulligan parcial.

Uma oportunidade.

Pode substituir qualquer quantidade de cartas.

### Limite de mão

8 cartas.

### Campo

Máximo de 6 Estudantes.

### Environment

Máximo de 1 Environment ativo por jogador.

### Deck

1 Representante + 40 cartas singleton no formato principal.

### Representante

Possui Moral e não possui Influence.

### Diplomacia

Existe somente no primeiro turno de cada jogador.

Durante esse turno, seus Estudantes não podem atacar diretamente o Representante adversário.

### Termos

Preferir:

* derrotado;
* removido do campo.

Evitar:

* morto;
* morrer;
* eliminado.

---

# 7. Decisões Provisórias

Estas decisões ainda podem ser alteradas após testes.

| Item                                     | Status      | Observação             |
| ---------------------------------------- | ----------- | ---------------------- |
| Máximo de 1 bloqueador por atacante      | PROVISIONAL | Alpha                  |
| Iniciativa do jogador ativo no Debate    | PROVISIONAL | Alpha                  |
| Popularidade máxima de uma vez por turno | PROVISIONAL | Validar durante testes |
| Resolução LIFO do Debate                 | PROVISIONAL | Implementação Alpha    |
| Comportamento completo de alvo inválido  | PROVISIONAL | Validar casos reais    |

---

# 8. Bloqueadores Atuais

Nenhum bloqueador conhecido.

---

# 9. Problemas Conhecidos

Nenhum problema registrado.

---

# 10. Próxima Missão

**MISSÃO:** FASE 11 — Vertical Slice (Partida Completa Jogável, Validação e Balanceamento do Alpha).

**Responsável:** Tech Lead & Game Designer

**Objetivo:**
* Validação ponta a ponta do fluxo completo de gameplay humano vs IA no navegador e homologação da experiência de usuário.

**Critério de conclusão:**
* Partidas completas disputadas com feedback fluido, sem regressões de regras e estabilidade comprovada.

---

# 11. Últimas Alterações

| Data       | Alteração                                                                 | Responsável    |
| ---------- | ------------------------------------------------------------------------- | -------------- |
| 2026-10-09 | Conclusão da Fase 10 (UI System: Interface gráfica completa em React, Board modular, CardComponent rico, CentralZone de Combate e Debates, PhaseControls, Modais e integração Engine-First com AIPlayer) | UI Engineer |
| 2026-10-09 | Conclusão da Fase 9 (AI System: ActionGenerator, LegalActionFilter, EvaluationFunction, DecisionPolicy, AIPlayer e Simulação Determinística) | AI Engineer |
| 2026-10-09 | Conclusão da Fase 8 (Debate System: Pilha LIFO 4 níveis, Invalidação Parcial, START/RESPOND/PASS/RESOLVE) | Debate & Rules Engineers |
| 2026-10-09 | Conclusão da Fase 7 (Representantes: Destaque operando e Popularidade via Eventos reativos) | Representative & Game Core Engineers |
| 2026-10-09 | Conclusão da Fase 6 (Keywords Engine: Centralizador modular, Proteção, Silêncio, Colaboração, Rivalidade, Aprendizagem) | Keyword & Rules Engineers |
| 2026-10-09 | Conclusão da Fase 5 (Events & Effects: Barramento puro, Triggers, Auras)  | Game Core & Rules Engineers |
| 2026-10-09 | Conclusão da Fase 4 (Combate: ATTACK, BLOCK, RESOLVE_COMBAT, Keywords)    | Combat & Rules Engineers |
| 2026-10-09 | Conclusão da Fase 3 (Cartas e Campo: PLAY_CARD, Board, Substituição, etc) | Card System & Game Core |
| 2026-10-09 | Conclusão da Fase 2 (Turnos e Recursos: Engine pura, TurnSystem, Testes)   | Rules Engineer |
| 2026-10-09 | Conclusão da Fase 1 (Fundação: Tooling, Tipos e createInitialGameState)   | Tech Architect |
| 2026-10-09 | Conclusão da Fase 0 (Auditoria Técnica) e emissão de SCB_AUDIT.md         | Orchestrator   |
| 2026-10-09 | Criação do status inicial do projeto                                      | Orchestrator   |

---

# 12. Histórico de Fases

## Fase 10 — UI System

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Implementação completa da interface visual e interativa web em React para o Alpha de School Card Battle. Arquitetura 100% aderente ao princípio Engine First (nenhuma regra duplicada na interface; toda permissão/bloqueio consulta `validateAction` e mutações passam estritamente por `applyAction`). Construção modular de componentes sob `src/ui/`: `GameBoard`, `OpponentArea`, `PlayerArea`, `CentralZone` (Battlefield e Debate Zone LIFO), `CardComponent` (com renderização de custo, traços, keywords, estados de inércia, prontidão e dano), `RepresentativeBadge` (com moral, popularidade reativa e destaque), `PhaseControls` (trilha das 5 fases, orbes de energia luminosos e botões de avanço), `SubstitutionModal` (para limite de 6 estudantes no board), `DiscardModal` (para limite de 8 cartas na End Phase), `GameOverModal` (telas de vitória/derrota com métricas), `BattleLog` (histórico de eventos) e `ToastContainer` (feedback não invasivo da engine). Criação do hook desacoplado `useGameController` com loop autônomo da IA (com delay legível de ~700ms). Design System moderno em CSS Vanilla (`src/index.css`) com estética escolar/anime sofisticada, glassmorphism e responsividade para resoluções menores e mobile. Suíte de testes automatizados expandida para 207 testes verdes no Vitest (14 arquivos) e compilação limpa em TypeScript estrito (`npm run build`).

---

## Fase 9 — AI System

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Implementação completa, desacoplada e 100% aderente ao princípio Engine First do subsistema autônomo de inteligência artificial sob `src/ai/`. Criação modular de `actionGenerator.ts` (geração de ações candidatas por fase para START, MAIN, DEBATE, COMBAT e END), `legalActionFilter.ts` (filtragem rigorosa usando `validateAction` e validações canônicas de despacho), `evaluator.ts` (função heurística de estado avaliando condições terminais, moral de Representantes, controle/atributos de mesa, keywords e vantagem de cartas), `decisionPolicy.ts` (avaliação determinística pura via simulação `applyAction`, bônus táticos para combate, desenvolvimento de mesa e desempate determinístico com semente pseudo-aleatória) e `aiPlayer.ts` (`AIPlayer`, `chooseAction`, `stepGame`, `takeTurn` e orquestrador de partidas `simulateMatch`). Criação de suíte completa sob `tests/ai/` com 34 testes automatizados cobrindo geração, filtragem, heurísticas, políticas de decisão e simulação de partidas ponta a ponta sem qualquer crash ou emissão de ações ilegais (`success: true` em 100% dos despachos). Total de 202 testes globais verdes no Vitest com build e typecheck 100% limpos.

---

## Fase 8 — Debate System

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Implementação do motor de Debates com resolução em Pilha Reversa LIFO, ações integradas (START, RESPOND, PASS, RESOLVE), controle de invalidação parcial de alvos. (Suíte de testes concluída e aprovada).

---

## Fase 7 — Representantes

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Sistema de Representantes funcional. Popularidade integrada ao motor de eventos (ON_ALLY_ATTACK, etc). Habilidade de Destaque operacional com dedução de Energia e aplicação de efeitos contínuos no Board, utilizando a infraestrutura criada na Fase 5.

---

## Fase 6 — Keywords Engine

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Implementação centralizada, determinística e puramente orientada a dados do motor de Keywords sob `src/core/engine/keywordSystem.ts`, integrado perfeitamente aos motores de combate (`combatSystem.ts`), eventos/efeitos (`eventSystem.ts`), turnos (`turnSystem.ts`) e despacho geral (`gameEngine.ts`). Validação estrita e desacoplada das Keywords de combate e restrição: Inércia, Impulso, Provocação (obrigando atacantes sem infiltração a alvejá-lo), Guarda, Infiltração (bypassing Provocação e defensores), Silêncio (impedindo ataques e anulando integralmente habilidades passivas/ativas e auras contínuas) e Proteção (impedindo direcionamento de habilidades e debates, preservando combate e efeitos em área). Implementação de Keywords de progressão e sinergia orientadas a dados: Persistência (ressurgimento no 1º nocaute com 1 de Moral), Inspiração (disparo ON_ENTER), Reconhecimento (+1 Influência contínua com Popularidade > 0), Liderança (+1 Influência por classe compartilhada com o Representante), Colaboração (+1 Influência por atuar junto de aliados da mesma classe em campo), Rivalidade (+1 Influência situacional ao combater estudantes de classe diferente) e Aprendizagem (+1 Influência contínua concedida se não atacou no turno anterior). Enriquecimento do catálogo com cartas Alpha demonstrativas em `src/cards/alphaCards.ts`. Suíte completa com 24 testes dedicados cobrindo ativações, restrições e falhas em `tests/core/keywords.test.ts`. Total de 134 testes globais passando 100% no Vitest com build e typecheck 100% limpos.

---

## Fase 5 — Eventos e Efeitos

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Implementação completa, determinística e desacoplada da infraestrutura de eventos e processamento reativo de efeitos orientados a dados sob `src/core/engine/eventSystem.ts`. Criação dos tipos canônicos de eventos (`CARD_PLAYED`, `STUDENT_ENTERED`, `STUDENT_ATTACKED`, `STUDENT_BLOCKED`, `DAMAGE_DEALT`, `STUDENT_DEFEATED`, `TURN_STARTED`, `TURN_ENDED`, `PHASE_CHANGED`, `POPULARITY_GAINED`, `EFFECT_APPLIED`) e contratos de efeitos (`GAIN_POPULARITY`, `MODIFY_STAT`, `DRAW_CARD`, `REVIVE_STUDENT`, `GAIN_ENERGY`, `APPLY_STATUS`, etc.). Substituição integral da lógica hardcoded de Popularidade por gatilho reativo data-driven (`ON_ALLY_ATTACK` concedendo +1 de Popularidade e desbloqueando Destaque no limiar). Suporte a efeitos contínuos e auras (`evaluateContinuousEffects` para `Reconhecimento` e `Liderança`). Suporte a ressurreição por Persistência (`ON_DEFEATED`) e bônus de entrada por Inspiração (`ON_ENTER`). Despacho integrado em `gameEngine.ts` com disponibilização de `applyAction`, `resolveAction` e `validateAction`. Suíte com 19 testes dedicados de eventos e efeitos e 110 testes globais passando 100% no Vitest com build e typecheck 100% limpos.

---

## Fase 4 — Combate Básico

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Implementação completa, pura e determinística do motor de combate na fase COMBAT sob `src/core/engine/combatSystem.ts`, despachado via `applyAction` em `gameEngine.ts` e com auto-resolução em `advancePhase`. Suporte completo a declaração de atacantes (`ActionType.ATTACK`), declaração de bloqueadores (`ActionType.BLOCK`) e resolução (`ActionType.RESOLVE_COMBAT`). Validações estritas de regras conforme o design oficial: Inércia (impedindo ataques de entrada), bypass por Impulso, respeito absoluto à Diplomacia no Turno 1 (proibindo ataques diretos ao Representante mesmo com Impulso ou Infiltração), restrição de Provocação obrigando o atacante a declará-lo como alvo (protegendo o Representante e outros estudantes de serem os alvos iniciais, salvo atacante com Infiltração), Bloqueio Livre geral (onde qualquer estudante no campo do defensor pode bloquear qualquer ataque ou escolher receber o dano no Representante, sem exclusividade inventada para Guarda), e Infiltração (que ignora Provocação para focar diretamente o Representante e não pode ser bloqueado por nenhum estudante, nem mesmo os com Guarda). Teto Alpha de no máximo 1 bloqueador por atacante e 1 atacante por bloqueador. Cálculo simultâneo de dano mútuo entre Estudantes (Influence vs Moral) e dano direto ao Representante. Derrota imediata com envio para `CardZone.DISCARD` para Estudantes com Moral <= 0 e vitória instantânea na partida quando o Representante atinge Moral <= 0. Suíte completa com 38 testes dedicados de combate e 91 testes globais passando 100% no Vitest com build e typecheck 100% limpos.

---

## Fase 3 — Cartas e Campo

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Implementação completa, pura e determinística do fluxo para jogar cartas da mão (`ActionType.PLAY_CARD`) sob `src/core/engine/cardPlaySystem.ts`, despachado via `applyAction` em `gameEngine.ts`. Validação estrita de fase (MAIN), jogador ativo, posse na mão (`CardZone.HAND`) e cobrança exata de custos de Energia. Alocação correta nas zonas `CardZone.BOARD` e `CardZone.ENVIRONMENT`. Teto de 6 Estudantes respeitado com rejeição `BOARD_FULL` e regra normativa de Substituição (remoção do Estudante substituído para `CardZone.DISCARD` e inserção do novo). Limite de 1 Ambiente ativo por jogador com descarte automático do anterior. Atribuição de prontidão e Inércia (`hasInertia = true`, `ready = false`), superada imediatamente por `Keyword.IMPULSO` (`hasInertia = false`, `ready = true`). Catálogo inicial de cartas Alpha em `src/cards/alphaCards.ts`. Suíte com 20 testes unitários específicos e 53 testes globais passando 100% no Vitest com compilação TypeScript limpa.

---

## Fase 2 — Turnos e Recursos

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Lógica pura e determinística de turnos implementada sob `src/core/engine/` (`turnSystem.ts`, `diplomacy.ts`, `gameEngine.ts`). Ciclo canônico de 5 fases (START -> MAIN -> DEBATE -> COMBAT -> END -> START) com alternância do jogador ativo; escalonamento estrito de Energia de 1 a 10 a cada rodada de jogador e restauração na Start Phase; compra obrigatória de 1 carta com detecção de Deckout e declaração imediata de vitória; regra de Diplomacia de Abertura ativa no turno 1 e inativa a partir do turno 2; limite de 8 cartas na mão com suporte a descarte explícito e regra de corte (autoCutExcess); suíte com 33 testes automatizados passando 100%.

---

## Fase 1 — Fundação

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Repositório git inicializado; tooling instalado (Vite, TS strict, Vitest); arquitetura de camadas do núcleo estruturada sob `src/core/types/` e `src/core/state/`; contratos fundamentais implementados; gerador determinístico de estado inicial `createInitialGameState` implementado com 100% de testes verdes.

---

## Fase 0 — Auditoria

**Status:** VERIFIED

**Início:** 2026-10-09

**Conclusão:** 2026-10-09

**Resultado:** Auditoria completa concluída. Relatório gerado em docs/rules/SCB_AUDIT.md. Identificada ausência total de código e necessidade de inicialização de tooling para a Fase 1.

---

# 13. Critérios de Alpha

O Alpha será considerado funcional somente quando:

* [x] Projeto compila
* [x] Testes passam
* [x] Partida pode ser criada
* [x] Mão inicial funciona
* [ ] Mulligan funciona
* [x] Turnos funcionam
* [x] Energy funciona
* [x] Cartas podem ser jogadas
* [x] Campo funciona
* [x] Combate funciona
* [x] Keywords principais funcionam
* [x] Debate funciona
* [x] Popularidade funciona
* [x] Destaque funciona
* [x] IA consegue jogar
* [x] Vitória funciona
* [x] Derrota funciona
* [x] Partida pode ser reiniciada
* [x] UI está sincronizada com GameState
* [ ] Não existem bugs CRITICAL conhecidos

---

# 14. Regra deste documento

Este arquivo acompanha o estado do projeto.

Ele NÃO deve ser utilizado para redefinir:

* regras de gameplay;
* arquitetura;
* identidade do jogo;
* balanceamento.

Quando uma decisão mudar, primeiro atualizar o documento normativo correspondente.

Depois atualizar este arquivo para refletir o novo estado.

```
