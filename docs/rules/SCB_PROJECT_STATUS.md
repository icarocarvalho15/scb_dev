# School Card Battle — Project Status

> Documento de acompanhamento do estado atual do desenvolvimento.
>
> Este arquivo representa o estado do projeto, não substitui o GDD, Rules, Keywords, Architecture ou Balance.

---

# 1. Estado Geral

**Projeto:** School Card Battle (SCB)

**Fase atual:** FASE 3 — CARTAS E CAMPO

**Objetivo atual:** Construir a fundação técnica necessária para um Alpha jogável local contra IA.

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
| Board                 | NOT_STARTED |       HIGH | —                                  |
| Substituição          | NOT_STARTED |       HIGH | —                                  |
| Environment           | NOT_STARTED |     MEDIUM | —                                  |
| Equipment             | NOT_STARTED |     MEDIUM | —                                  |
| Basic Combat          | NOT_STARTED |   CRITICAL | —                                  |
| Inércia               | NOT_STARTED |       HIGH | —                                  |
| Impulso               | NOT_STARTED |       HIGH | —                                  |
| Provocação            | NOT_STARTED |       HIGH | —                                  |
| Guarda                | NOT_STARTED |       HIGH | —                                  |
| Infiltração           | NOT_STARTED |       HIGH | —                                  |
| Diplomacia            | VERIFIED    |       HIGH | Ativa no T1, expira no T2          |
| Events                | NOT_STARTED |       HIGH | —                                  |
| Effects               | NOT_STARTED |       HIGH | —                                  |
| Keywords              | NOT_STARTED |       HIGH | —                                  |
| Representative System | NOT_STARTED |       HIGH | —                                  |
| Popularidade          | NOT_STARTED |       HIGH | —                                  |
| Destaque              | NOT_STARTED |       HIGH | —                                  |
| Debate System         | NOT_STARTED |       HIGH | —                                  |
| AI                    | NOT_STARTED |   CRITICAL | —                                  |
| UI Board              | NOT_STARTED |   CRITICAL | —                                  |
| Card UI               | NOT_STARTED |       HIGH | —                                  |
| Combat UI             | NOT_STARTED |       HIGH | —                                  |
| Debate UI             | NOT_STARTED |       HIGH | —                                  |
| Integration           | NOT_STARTED |   CRITICAL | —                                  |
| QA                    | NOT_STARTED |   CRITICAL | —                                  |
| Alpha Release         | NOT_STARTED |   CRITICAL | —                                  |

---

# 4. Fases

| Fase                 | Status      | Critério de conclusão                          |
| -------------------- | ----------- | ---------------------------------------------- |
| 0. Auditoria         | VERIFIED    | Projeto analisado e bloqueadores identificados |
| 1. Fundação          | VERIFIED    | Engine consegue representar partida inicial    |
| 2. Turnos e Recursos | VERIFIED    | Partida avança vários turnos                   |
| 3. Cartas e Campo    | NOT_STARTED | Cartas podem ser jogadas pela engine           |
| 4. Combate           | NOT_STARTED | Combate completo funciona sem UI               |
| 5. Events / Effects  | NOT_STARTED | Sistema reativo funcional                      |
| 6. Keywords          | NOT_STARTED | Keywords Alpha testadas                        |
| 7. Representantes    | NOT_STARTED | Popularidade e Destaque funcionam              |
| 8. Debate            | NOT_STARTED | Debate completo funciona                       |
| 9. IA                | NOT_STARTED | IA completa partidas                           |
| 10. UI               | NOT_STARTED | Jogador consegue controlar partida             |
| 11. Vertical Slice   | NOT_STARTED | Partida completa jogável                       |
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

**MISSÃO:** FASE 3 — Cartas e Campo (Play Card, Cost Validation, Board Placement, 6-Student Limit & Substitution, Inertia).

**Responsável:** Game Core Engineer ([SCB_Game_Core_Engineer.md](file:///c:/Users/icaro.carvalho/dravdev/scb_dev/docs/agents/SCB_Game_Core_Engineer.md)) & Rules Engineer ([SCB_Rules_Engineer.md](file:///c:/Users/icaro.carvalho/dravdev/scb_dev/docs/agents/SCB_Rules_Engineer.md))

**Objetivo:**
* Implementar ação `PLAY_CARD` na Main Phase com validação pura de custo de Energia;
* Implementar posicionamento de cartas nas zonas `BOARD` e `ENVIRONMENT`;
* Implementar limite de 6 Estudantes por jogador e regra normativa de Substituição;
* Implementar aplicação e verificação de Inércia / Impulso;
* Suíte de testes unitários pura.

**Critério de conclusão:**
* Estudantes, Ambientes e Equipamentos podem ser jogados pagando custos;
* Substituição funciona determinística no 6º Estudante;
* Testes cobrem todas as regras e compilam limpos.

---

# 11. Últimas Alterações

| Data       | Alteração                                                                 | Responsável    |
| ---------- | ------------------------------------------------------------------------- | -------------- |
| 2026-10-09 | Conclusão da Fase 2 (Turnos e Recursos: Engine pura, TurnSystem, Testes)   | Rules Engineer |
| 2026-10-09 | Conclusão da Fase 1 (Fundação: Tooling, Tipos e createInitialGameState)   | Tech Architect |
| 2026-10-09 | Conclusão da Fase 0 (Auditoria Técnica) e emissão de SCB_AUDIT.md         | Orchestrator   |
| 2026-10-09 | Criação do status inicial do projeto                                      | Orchestrator   |

---

# 12. Histórico de Fases

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
* [ ] Mão inicial funciona
* [ ] Mulligan funciona
* [x] Turnos funcionam
* [x] Energy funciona
* [ ] Cartas podem ser jogadas
* [ ] Campo funciona
* [ ] Combate funciona
* [ ] Keywords principais funcionam
* [ ] Debate funciona
* [ ] Popularidade funciona
* [ ] Destaque funciona
* [ ] IA consegue jogar
* [ ] Vitória funciona
* [x] Derrota funciona
* [ ] Partida pode ser reiniciada
* [ ] UI está sincronizada com GameState
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
