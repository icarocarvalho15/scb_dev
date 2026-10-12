# School Card Battle (SCB) 🃏🏫

![Status](https://img.shields.io/badge/Status-Alpha_Vertical_Slice-success)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Vite](https://img.shields.io/badge/Bundler-Vite-purple)
![Architecture](https://img.shields.io/badge/Architecture-Engine_First-orange)
![Tests](https://img.shields.io/badge/Tests-226_Passing-brightgreen)

**School Card Battle (SCB)** é um Trading Card Game (TCG) digital competitivo com temática escolar e estética anime. O jogo combina gerenciamento de recursos, combate tático de Estudantes e um sistema único de interrupções e magias chamado **Debate**.

Este projeto foi construído com uma arquitetura **Engine-First** rigorosa e desenvolvido através de um **Fluxo de Trabalho Multi-Agente (Agentic Workflow)**, onde IA e desenvolvedor humano colaboram baseados em uma documentação de Game Design e Regras (GDD) estrita e imutável.

---

## 🚀 Estado Atual: Alpha Jogável (Fase 11 - Vertical Slice)

O projeto atingiu seu principal marco de desenvolvimento estrutural: **Uma partida completa de ponta a ponta (Humano vs IA) diretamente no navegador.** 

O motor de regras (`Game Engine`) é 100% puro e isolado da Interface de Usuário (`UI`). A IA e o jogador humano operam sob as mesmas restrições, validando ações através do mesmo despachador central (`applyAction`).

### 🎯 Fases Concluídas (Roadmap)

- [x] **Fase 0 & 1: Fundação** — Arquitetura de tipos, `GameState` imutável e gerador de estado inicial.
- [x] **Fase 2: Turnos e Energia** — Ciclo automático de 5 fases (`START`, `MAIN`, `DEBATE`, `COMBAT`, `END`), escalonamento determinístico de Energia (1 a 10) e limites de mão.
- [x] **Fase 3: Cartas e Campo** — Validação de custos, alocação no `BOARD` (limite de 6 Estudantes) com regra oficial de **Substituição**, e `ENVIRONMENT` (1 Ambiente ativo).
- [x] **Fase 4: Sistema de Combate** — Combate tático onde o **alvo é sempre o Representante adversário** (exceto sob *Provocação*). O defensor possui controle total via **Bloqueio Livre**. Resolução de dano simultâneo (Influência vs Moral).
- [x] **Fase 5 & 6: Eventos, Efeitos e Keywords** — Infraestrutura reativa (Event Bus) e Keywords orientadas a dados: *Inércia (temporária), Impulso, Provocação, Guarda, Infiltração, Diplomacia (Turno 1), Persistência, Silêncio, Inspiração, etc.*
- [x] **Fase 7: Representantes** — Sistema de **Popularidade** reativa e ativação de **Destaque** (habilidade ultimate que custa apenas Popularidade, sem gasto de Energia).
- [x] **Fase 8: Sistema de Debate** — Motor de interrupção mágica resolvido em **Pilha Reversa LIFO** de 4 níveis (Ação Inicial, Réplica, Tréplica, Contrarréplica) com invalidação parcial de alvos (fizzle).
- [x] **Fase 9: AI System** — IA autônoma determinística. Utiliza geradores de ação, filtros de legalidade e heurísticas de decisão integradas diretamente ao core, sem trapaças de estado.
- [x] **Fase 10: UI System** — Interface web em **React**, responsiva, com estética *Glassmorphism/Anime*. Tabuleiro completo, *CardComponents* dinâmicos, modais de substituição/descarte e visualização de conexões de combate em tempo real.
- [x] **Fase 11: Vertical Slice** — Integração ponta a ponta, resolução de *soft-locks* em transições de turno assíncronas, automatização fluida da `Start Phase` e homologação E2E.

---

## 🏗️ Arquitetura e Princípios de Design

O SCB adota padrões rígidos de engenharia de software para garantir estabilidade, zero trapaças e escalabilidade para um futuro modo Multiplayer com servidor autoritativo:

1.  **Engine-First & UI Agnostic:** O frontend (React) funciona apenas como uma camada de visualização (*View Layer*). Toda lógica, permissão de jogada, bloqueio ou combate ocorre estritamente dentro da Engine TypeScript isolada.
2.  **Imutabilidade Estrita:** Nenhuma função altera o estado global. As ações geram um novo `GameState` através do despachador central de validações.
3.  **Data-Driven Design:** As cartas são registros estáticos no catálogo. Ao entrarem em jogo, viram instâncias (`CardInstance`) que rastreiam seus status dinâmicos (dano, inércia, silêncio), facilitando balanceamento em massa.
4.  **Desenvolvimento por Agentes:** Construído de forma modular com *Orchestrator, Game Core Engineer, AI Engineer* e *UI Engineer* operando via prompts sistemáticos para garantir zero desvio das regras do `SCB_Rules.md`.

---

## ⚔️ Mecânicas de Destaque

*   **Bloqueio Livre (Free Block):** Diferente de jogos onde o atacante escolhe a unidade que vai bater, no SCB os ataques são focados no Representante. Cabe ao defensor a tática de usar seus Estudantes para interceptar (Bloquear) os ataques.
*   **Debates (A Pilha):** Um sistema contido e estratégico de respostas (Ação $\rightarrow$ Réplica $\rightarrow$ Tréplica $\rightarrow$ Contrarréplica).
*   **Representantes:** Lideram o deck, possuem vida (Moral) e acumulam *Popularidade* ao cumprir condições passivas (ex: sempre que um aliado ataca). Ao atingir o limite, liberam o *Destaque*, uma ultimate gratuita de Energia que pode virar a mesa.

---

## 🛠️ Tecnologias Utilizadas

*   **Linguagem:** TypeScript (Strict Mode)
*   **Frontend:** React 18
*   **Build Tool:** Vite
*   **Test Runner:** Vitest (com 220+ testes unitários e de simulação passando)
*   **Estilização:** CSS Vanilla Moderno (CSS Variables, Flexbox/Grid, Backdrop-filter)

---

## ⚙️ Como Executar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/icarocarvalho15/scb_dev.git](https://github.com/icarocarvalho15/scb_dev.git)
   cd scb_dev
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute a bateria de testes (Vitest) para validar a engine:
   ```bash
   npm run test
   ```

4. Verifique a integridade dos tipos e builde o projeto:
   ```bash
   npm run typecheck
   npm run build
   ```

5. Inicie o servidor de desenvolvimento para jogar:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:5173/ no seu browser para iniciar uma partida.
---

## 📝 Próximas Fases (Planejamento Futuro)

- [ ] **Fase 12 & 13: Polish & Alpha Release** — Refinamento de UX, sistema de Mulligan e congelamento definitivo da versão Alpha 1.0.

---

Desenvolvido com Inteligência Artificial.

School Card Battle &copy DravDev - 2026.