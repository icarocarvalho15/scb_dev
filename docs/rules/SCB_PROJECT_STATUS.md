# School Card Battle — Project Status

> Documento de acompanhamento do estado atual do desenvolvimento.
>
> Este arquivo representa o estado do projeto, não substitui o GDD, Rules, Keywords, Architecture ou Balance.

---

# 1. Estado Geral

**Projeto:** School Card Battle (SCB)

**Fase atual:** FASE 1 — FUNDAÇÃO

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
| Actions               | IMPLEMENTED |   CRITICAL | União discriminada de GameAction   |
| Validation            | NOT_STARTED |   CRITICAL | —                                  |
| Turn System           | NOT_STARTED |   CRITICAL | —                                  |
| Phases                | IMPLEMENTED |   CRITICAL | GamePhase enum canônico            |
| Energy                | NOT_STARTED |   CRITICAL | —          |
| Draw                  | NOT_STARTED |       HIGH | —          |
| Hand / Mulligan       | NOT_STARTED |       HIGH | —          |
| Deck System           | NOT_STARTED |       HIGH | —          |
| Board                 | NOT_STARTED |       HIGH | —          |
| Substituição          | NOT_STARTED |       HIGH | —          |
| Environment           | NOT_STARTED |     MEDIUM | —          |
| Equipment             | NOT_STARTED |     MEDIUM | —          |
| Basic Combat          | NOT_STARTED |   CRITICAL | —          |
| Inércia               | NOT_STARTED |       HIGH | —          |
| Impulso               | NOT_STARTED |       HIGH | —          |
| Provocação            | NOT_STARTED |       HIGH | —          |
| Guarda                | NOT_STARTED |       HIGH | —          |
| Infiltração           | NOT_STARTED |       HIGH | —          |
| Diplomacia            | NOT_STARTED |       HIGH | —          |
| Events                | NOT_STARTED |       HIGH | —          |
| Effects               | NOT_STARTED |       HIGH | —          |
| Keywords              | NOT_STARTED |       HIGH | —          |
| Representative System | NOT_STARTED |       HIGH | —          |
| Popularidade          | NOT_STARTED |       HIGH | —          |
| Destaque              | NOT_STARTED |       HIGH | —          |
| Debate System         | NOT_STARTED |       HIGH | —          |
| AI                    | NOT_STARTED |   CRITICAL | —          |
| UI Board              | NOT_STARTED |   CRITICAL | —          |
| Card UI               | NOT_STARTED |       HIGH | —          |
| Combat UI             | NOT_STARTED |       HIGH | —          |
| Debate UI             | NOT_STARTED |       HIGH | —          |
| Integration           | NOT_STARTED |   CRITICAL | —          |
| QA                    | NOT_STARTED |   CRITICAL | —          |
| Alpha Release         | NOT_STARTED |   CRITICAL | —          |

---

# 4. Fases

| Fase                 | Status      | Critério de conclusão                          |
| -------------------- | ----------- | ---------------------------------------------- |
| 0. Auditoria         | VERIFIED    | Projeto analisado e bloqueadores identificados |
| 1. Fundação          | VERIFIED    | Engine consegue representar partida inicial    |
| 2. Turnos e Recursos | NOT_STARTED | Partida avança vários turnos                   |
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

**MISSÃO:** FASE 2 — Turnos e Recursos (Turn Lifecycle, Start/End Phases, Energy Scaling, Card Draw).

**Responsável:** Rules Engineer ([SCB_Rules_Engineer.md](file:///c:/Users/icaro.carvalho/dravdev/scb_dev/docs/agents/SCB_Rules_Engineer.md)) & Game Core Engineer ([SCB_Game_Core_Engineer.md](file:///c:/Users/icaro.carvalho/dravdev/scb_dev/docs/agents/SCB_Game_Core_Engineer.md))

**Objetivo:**

* Implementar progressão de turnos (`applyAction` com `END_PHASE`, troca de jogador ativo e ciclo de fases START -> MAIN -> DEBATE -> COMBAT -> END -> START);
* Implementar incremento e restauração de Energia (1 a 10 máx);
* Implementar compra de carta no início do turno com condição de derrota por deckout;
* Implementar descarte ao final do turno se a mão exceder 8 cartas;
* Testes unitários para múltiplos turnos completos.

**Critério de conclusão:**

* Partida avança múltiplos turnos de forma determinística;
* Energia escala corretamente a cada novo turno até 10;
* Jogadores compram cartas e perdem por deckout se o deck estiver vazio.

---

# 11. Últimas Alterações

| Data       | Alteração                                                                 | Responsável    |
| ---------- | ------------------------------------------------------------------------- | -------------- |
| 2026-10-09 | Conclusão da Fase 1 (Fundação: Tooling, Tipos e createInitialGameState)   | Tech Architect |
| 2026-10-09 | Conclusão da Fase 0 (Auditoria Técnica) e emissão de SCB_AUDIT.md         | Orchestrator   |
| 2026-10-09 | Criação do status inicial do projeto                                      | Orchestrator   |

---

# 12. Histórico de Fases

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
* [ ] Turnos funcionam
* [ ] Energy funciona
* [ ] Cartas podem ser jogadas
* [ ] Campo funciona
* [ ] Combate funciona
* [ ] Keywords principais funcionam
* [ ] Debate funciona
* [ ] Popularidade funciona
* [ ] Destaque funciona
* [ ] IA consegue jogar
* [ ] Vitória funciona
* [ ] Derrota funciona
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
