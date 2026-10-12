# School Card Battle (SCB) — ALPHA 0.1 Release Status

> **Documento Oficial de Congelamento e Homologação da Versão ALPHA 0.1**  
> **Status:** `RELEASE_CANDIDATE_APPROVED` / `FROZEN`  
> **Data de Homologação:** 2026-10-12  
> **Engenheiros Responsáveis:** Game Core Engineer & UI Engineer  
> **Supervisão e Governança:** Orchestrator / Tech Lead  
> **Versão da Build:** Alpha v0.1.3 (Hotfix 3 — Extinção de Soft-Lock Bifásico na Combat Phase)

---

## 1. Sumário Executivo

A versão **ALPHA 0.1** de School Card Battle (SCB) atinge o status de **congelamento definitivo e homologação com Hotfixes 1, 2 e 3 aplicados**. Todas as metas canônicas estabelecidas no [GDD](file:///docs/rules/SCB_GDD.md), [Rules](file:///docs/rules/SCB_Rules.md) e [Architecture](file:///docs/rules/SCB_Architecture.md) foram implementadas, integradas e rigorosamente validadas.

A partida completa entre um jogador humano e a IA autônoma opera de ponta a ponta sem qualquer dependência externa, vazamento de estado mutável ou desvio das regras fundamentais.

---

## 2. Escopo Homologado da Fase 12 / 13 & Hotfixes

### 2.1 Sistema de Mulligan (Engine First & Determinismo)
- **Ação Canônica:** `ActionType.MULLIGAN` despachada através de `applyAction` e validada por `validateAction`.
- **Momento:** Executado na etapa de abertura (Turno 1 / pré-Main Phase).
- **Flexibilidade Parcial:** Cada jogador (Humano e IA) avalia suas 4 cartas iniciais e pode substituir de 0 a 4 cartas. Selecionar 0 cartas é interpretado como "Manter Mão" (*Skip Mulligan*).
- **Oportunidade Única:** Rejeição estrita de tentativas repetidas com código de erro `ActionErrorCode.ALREADY_MULLIGANED`.
- **Conservação de Mão:** A mão do jogador contém exatamente 4 cartas antes e após a resolução do Mulligan.
- **Embaralhamento Determinístico:** As cartas devolvidas são reinseridas no baralho e reembaralhadas via gerador PRNG Mulberry32 sincronizado com o `rngSeed` do `GameState`.

### 2.2 Autonomia da IA (AIPlayer & ActionGenerator)
- **Heurística de Mulligan:** Implementação determinística em [evaluateAiMulligan](file:///src/core/engine/mulliganSystem.ts). A IA avalia a curva inicial de custo 1-2 e descarta cartas pesadas (> 3) ou situacionais para garantir consistência de jogo no início da partida.
- **Simulação Completa:** 100% de taxa de conclusão em testes de estresse com partidas consecutivas, sem soft-locks, sem ações ilegais e com reprodução idêntica de partidas dada a mesma semente.

### 2.3 Interface e Design System (UI/UX)
- **MulliganModal.tsx:** Componente modal glassmorphism com paleta anime acadêmica (`#38bdf8`, `#818cf8`, `#f59e0b`, `#10b981`), apresentação em destaque das 4 cartas com toggle interativo, indicador de estado ("Substituir X Cartas" vs "Manter Mão Inicial") e botões de atalho rápido ("Selecionar Todas", "Limpar Seleção").
- **Handoff Transparente:** Transição suave da abertura para a MAIN phase do Turno 1 sem interrupções visuais, preservando a automação da START phase.
- **Refinamento de Badges no Tabuleiro:**
  - `Inércia`: Ribbon translúcido e fita destacada com ícone de ampulheta (`⏳ Inércia`).
  - `Prontidão`: Efeito pulsar de halo ciano (`scb-ready-pulse`) indicando que o Estudante está apto a agir.
  - `Bloqueio Livre`: Identificação normativa nos estudantes e área de combate de que qualquer estudante ativo sem Inércia pode interceptar atacantes adversários.
  - `Destaque`: Botão de prestígio acadêmico com aura dourada pulsante desbloqueado pelo medidor de Popularidade.

### 2.4 Hotfix 1: Sequenciamento de Mulligan e Start Phase do Turno 1
- **Bug Detectado:** A automação reativa da Start Phase disparava no mount do componente antes da interação com o modal, comprando a 5ª carta prematuramente e exibindo 5 cartas no `MulliganModal`.
- **Correção Aplicada:**
  - `useGameController.ts`: Adicionado guardião no `useEffect` de Start Phase e no `dispatchAction` verificando `player1.hasMulliganed`.
  - O `MulliganModal` avalia e exibe estritamente as 4 cartas iniciais geradas por `createInitialGameState`.
  - Apenas após a confirmação e resolução atômica de `ActionType.MULLIGAN` (Jogador e IA), a engine despacha o avanço `START -> MAIN`, executando `resolveStartPhase()` que então compra a 5ª carta do Turno 1.

### 2.5 Hotfix 2: Máquina de Estados Bifásica na Combat Phase (Bloqueio Livre)
- **Bug Detectado:** Ao declarar um ataque, o jogador ativo (ou IA) despachava `ADVANCE_PHASE`, e a Game Engine resolvia o combate imediatamente, pulando para a fase `END` e roubando a prioridade de bloqueio do defensor.
- **Correção Aplicada (Fluxo Bifásico Engine First):**
  - **Etapa 1 (Atacante):** Ao despachar `ADVANCE_PHASE`, a engine NÃO encerra o combate nem avança para `END`. Ela estritamente marca `state.combat.attackersDeclared = true`, mantém a fase em `COMBAT` e transfere a prioridade (`getExpectedActor`) para o defensor.
  - **Etapa 2 (Defensor):** O defensor realiza Bloqueio Livre via `ActionType.BLOCK` se desejar. Somente quando o defensor despacha a sua própria confirmação de `ADVANCE_PHASE` ("Concluir Defesa"), a engine executa `resolveCombat`, aplica danos e avança a fase para `END`.
  - **Validação de Jogador:** Ações repetidas do atacante são rejeitadas com `ActionErrorCode.INVALID_PLAYER` enquanto o combate aguarda a confirmação do defensor.
  - **Autonomia da IA:** A IA aprendeu a concluir a etapa de ataque e também a despachar `ADVANCE_PHASE` para avançar a fase quando estiver defendendo.

### 2.6 Hotfix 3: Extinção de Deadlock / Soft-lock no Encerramento de Defesa
- **Bug Detectado:** Quando o atacante declarava ataques com todos os seus atacantes disponíveis, a prioridade (`getExpectedActor`) era transferida prematuramente para o defensor antes do despacho formal de `ADVANCE_PHASE` pelo atacante. Em seguida, o filtro `legalActionFilter.ts` descartava a ação `ADVANCE_PHASE` do defensor (`playerId !== activePlayerId`), e o fallback da IA tentava despachar avanço que a Engine rejeitava (`attackersDeclared` ainda era `false`), gerando soft-lock completo no combate.
- **Correções Aplicadas:**
  - **`legalActionFilter.ts`:** Removida a checagem redundante de jogador ativo para `ADVANCE_PHASE`/`END_PHASE`, deferindo integralmente à validação autoritativa de `validateAction` da Engine (que aceita o defensor quando `attackersDeclared = true`).
  - **`aiPlayer.ts` (`getExpectedActor`):** Mantém a prioridade no atacante (`activePlayerId`) até que este efetivamente despache `ADVANCE_PHASE` (`attackersDeclared === true`). A prioridade só é transferida para o defensor após essa confirmação explícita.
  - **`aiPlayer.ts` (`AIPlayer.takeTurn` / `simulateMatch`):** Garante que o defensor em combate despache `ADVANCE_PHASE` com sua própria identidade (`actorId`), permitindo resolução limpa do combate.
  - **`PhaseControls.tsx`:** Atualizado texto do botão para "Concluir Ataques ➔" enquanto o atacante declara/confirma, e "Aguardando Defesa..." (desabilitado) assim que a prioridade é entregue ao defensor.

---

## 3. Matriz de Cobertura de Testes e QA

| Suíte de Testes | Arquivo | Casos | Status |
| :--- | :--- | :---: | :---: |
| **Mulligan System** | `tests/core/mulliganSystem.test.ts` | 16 | ✅ PASS |
| **AI Simulations (Full Match)** | `tests/ai/aiSimulation.test.ts` | 8 | ✅ PASS |
| **AI Action Generator** | `tests/ai/actionGenerator.test.ts` | 12 | ✅ PASS |
| **AI Decision Policy** | `tests/ai/decisionPolicy.test.ts` | 5 | ✅ PASS |
| **AI Evaluator** | `tests/ai/evaluator.test.ts` | 8 | ✅ PASS |
| **AI Legal Action Filter** | `tests/ai/legalActionFilter.test.ts` | 10 | ✅ PASS |
| **Combat System** | `tests/core/combatSystem.test.ts` | 40 | ✅ PASS |
| **Debate System** | `tests/core/debateSystem.test.ts` | 26 | ✅ PASS |
| **Keywords Engine** | `tests/core/keywords.test.ts` | 24 | ✅ PASS |
| **Card Play System** | `tests/core/cardPlaySystem.test.ts` | 20 | ✅ PASS |
| **Event System** | `tests/core/eventSystem.test.ts` | 19 | ✅ PASS |
| **Turn System** | `tests/core/turnSystem.test.ts` | 18 | ✅ PASS |
| **UI System Integration** | `tests/ui/uiSystem.test.ts` | 17 | ✅ PASS |
| **Initial Game State** | `tests/core/initialGameState.test.ts` | 10 | ✅ PASS |
| **Representative System** | `tests/core/representativeSystem.test.ts` | 7 | ✅ PASS |
| **Types & Contracts** | `tests/core/types.test.ts` | 7 | ✅ PASS |
| **TOTAL CONSOLIDADO** | **16 Arquivos de Teste** | **247** | **100% VERDE** |

- **Taxa de Regressão:** 0% (todos os 247 testes aprovados sem falhas).
- **TypeScript:** `npx tsc --noEmit` completado com zero erros em modo estrito.
- **Production Bundle:** `npm run build` gerado com sucesso (Vite v6, 1.16s).

---

## 4. Checklist de Aceite do ALPHA 0.1

- [x] Criação determinística de partida e decks de 40 cartas ([createInitialGameState](file:///src/core/state/createInitialGameState.ts)).
- [x] Compra de mão inicial de 4 cartas.
- [x] Sistema de Mulligan parcial determinístico com UI dedicada ([MulliganModal.tsx](file:///src/ui/components/Modals/MulliganModal.tsx)).
- [x] Ciclo completo de turnos (START → MAIN → DEBATE → COMBAT → END).
- [x] Progressão e restauração de Energia (escala de 1 a 10).
- [x] Zonas canônicas operacionais (Deck, Mão, Campo de 6 slots, Ambiente, Descarte, Detenção).
- [x] Regra de Substituição com descarte ao jogar o 6º Estudante.
- [x] Regra de Ambiente ativo único.
- [x] Combate tático com dano simultâneo, Inércia, Impulso, Provocação, Infiltração e Bloqueio Livre.
- [x] Regra de abertura de Diplomacia no Turno 1 (proteção do Representante).
- [x] Cadeia de Debate LIFO de 4 níveis (Ação Inicial → Réplica → Tréplica → Contrarréplica).
- [x] Representantes Daichi e Akira com Moral 20, Popularidade reativa e Destaque a custo 0 de Energia.
- [x] IA autônoma determinística capaz de concluir partidas completas.
- [x] Condições canônicas de vitória e derrota (Moral a 0 e derrota por Deckout).
- [x] Interface jogável interativa no navegador com estética anime/glassmorphism de prestígio acadêmico.
- [x] Zero bugs críticos ou impasses conhecidos.

---

## 5. Declaração Formal de Fechamento

Pelo presente documento, os papéis de **Game Core Engineer** e **UI Engineer** declaram a versão **ALPHA 0.1 de School Card Battle (SCB) como OFICIALMENTE CONCLUÍDA E CONGELADA**.

O repositório encontra-se pronto para distribuição de testes internos, playtests comunitários da turma e preparação para a Fase Beta.
