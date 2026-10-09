# School Card Battle (SCB) 🃏🏫

![Status](https://img.shields.io/badge/Status-Alpha_Development-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Vite](https://img.shields.io/badge/Bundler-Vite-purple)
![Architecture](https://img.shields.io/badge/Architecture-Engine_First-success)

**School Card Battle (SCB)** é um Trading Card Game (TCG) digital competitivo com temática escolar e estética anime. O projeto está sendo construído com uma arquitetura **Engine-First** rigorosa e desenvolvido através de um fluxo de trabalho **Multi-Agente (Agentic Workflow)** utilizando o Antigravity IDE.

Cada jogador lidera uma turma escolar através de um **Representante** e utiliza **Estudantes**, **Equipamentos**, **Ambientes** e **Debates** estratégicos para reduzir a Moral do adversário a zero.

---

## 🚀 Estado Atual do Projeto: Alpha (Motor de Regras)

Atualmente, o projeto foca na construção do núcleo determinístico do jogo (Game Engine) de forma totalmente independente da Interface de Usuário (UI). O motor é puro, imutável e validado por testes automatizados estruturados.

### 🎯 Fases Concluídas (Core Engine)

- [x] **Fase 1: Fundação** — `GameState` imutável, sistema de ações e validações puras.
- [x] **Fase 2: Turnos e Recursos** — Ciclo de turnos (Start, Main, Debate, Combat, End), progressão de Energia (escala até 10) e limites de mão.
- [x] **Fase 3: Cartas e Campo** — Validação de custos, zonas de jogo (`HAND`, `BOARD`, `ENVIRONMENT`), limite rígido de 6 Estudantes e regra de **Substituição**.
- [x] **Fase 4: Sistema de Combate** — Motor determinístico de declaração de ataques e bloqueios livres, cálculo de dano simultâneo (Influência vs Moral) e integração de Keywords táticas (*Diplomacia, Inércia, Impulso, Provocação, Guarda e Infiltração*).
- [x] **Fase 5 e 6: Eventos e Efeitos** — Infraestrutura reativa para desencadeamento de habilidades passivas e ativadas baseadas em dados (Data-Driven).
- [x] **Fase 7: Representantes & Sistema de Debate** — Implementação do sistema de progressão (Popularidade e Destaque) e o motor de interação de feitiços/habilidades (Debate Phase), resolvido em **Pilha Reversa (LIFO)** através de Ação Inicial, Réplica, Tréplica e Contrarréplica.

---

## 🏗️ Arquitetura e Princípios de Design

O SCB adota padrões rígidos de engenharia de software para garantir escalabilidade para o futuro multiplayer e estabilidade para a IA:

*   **Engine-First & UI Agnostic:** O React (UI) apenas despacha "Intenções de Ação" (Actions) e renderiza o `GameState`. A interface não toma decisões sobre regras, custos ou validação de alvos.
*   **Imutabilidade Estrita:** Todo o motor de regras processa as ações através de funções puras (`applyAction(state, action) => newState`).
*   **Data-Driven Design:** Cartas não possuem lógicas hardcoded. Elas são definidas por dados (`CardDefinition`) e instanciadas dinamicamente (`CardInstance`), separando características permanentes de estados mutáveis durante a partida.
*   **Determinismo:** Para facilitar simulações, IA e futuros replays, todo evento gerado na partida é reproduzível a partir de um estado inicial e uma sequência de ações.

---

## 🤖 Agentic Workflow (Orquestração de IA)

Este projeto foi construído delegando tarefas para agentes especializados de Inteligência Artificial, seguindo rigorosos documentos normativos de design e arquitetura. O fluxo inclui:

*   **Orchestrator (Tech Lead):** Analisa o GDD, regras globais e coordena o avanço das fases, validando o trabalho antes do merge.
*   **Tech Architect & Game Core Engineer:** Responsáveis pela estrutura TypeScript, motor de despacho de ações e integridade do GameState.
*   **Rules & Combat Engineers:** Encarregados de traduzir o Game Design Document em testes automatizados (Vitest) e implementar a lógica de turnos, custos e resolução de dano e Debates.

---

## 🛠️ Tecnologias Utilizadas

*   **Linguagem:** TypeScript (Strict Mode)
*   **Frontend (Em breve):** React
*   **Build Tool:** Vite
*   **Testes:** Vitest (TDD aplicado ao Core Engine)
*   **Futuro (Multiplayer):** Node.js, WebSockets, PostgreSQL

---

## ⚙️ Como Executar o Projeto Localmente

Como a engine é independente, você pode rodar e validar toda a lógica de TCG via terminal (Test Runner).

1. Clone o repositório:
   ```bash
   git clone [https://github.com/seu-usuario/school-card-battle.git](https://github.com/seu-usuario/school-card-battle.git)
   cd school-card-battle
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
---

## 📝 Próximas Fases (Planejamento Futuro)

A próxima fase do projeto é o **Frontend & Interface do Usuário (UI)**, seguido pela implementação da **Inteligência Artificial (IA)** para criar oponentes jogáveis.


*   **Fase 8 (IA):** Desenvolvimento da lógica de decisão para os personagens controlados pelo computador, baseada na arquitetura Engine-First criada atualmente.
*   **Fase 9 (UI):** Construção da interface visual em React para representar o campo de batalha, interagir com as cartas e visualizar os efeitos do jogo.