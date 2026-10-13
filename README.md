# School Card Battle (SCB) 🃏🏫

![Status](https://img.shields.io/badge/Status-FROZEN_Alpha_0.1.3-success)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Vite](https://img.shields.io/badge/Bundler-Vite-purple)
![Architecture](https://img.shields.io/badge/Architecture-Engine_First-orange)
![Tests](https://img.shields.io/badge/Tests-247_Passing-brightgreen)

**School Card Battle (SCB)** é um Trading Card Game (TCG) digital competitivo com temática escolar e estética anime. O jogo combina gerenciamento de recursos, combate tático de Estudantes e um sistema único de interrupções e magias chamado **Debate**.

Construído sob a rigorosa arquitetura **Engine-First**, a lógica do SCB é perfeitamente desacoplada da interface, permitindo que a IA autônoma e os jogadores humanos obedeçam ao mesmo motor de regras determinístico, sem trapaças.

---

## 🚀 Versão Congelada: Alpha 0.1.3 (Completo)

O projeto atingiu seu marco estrutural máximo para a fase Alpha: **Partida Completa de Ponta a Ponta (Humano vs IA) Estável no Navegador.** 

### 🎯 Funcionalidades Principais Implementadas:

- **Regras Imutáveis:** Validações de Fase, Jogador Ativo, Custos, Limite de Mão (8) e Limite de Campo (6 + Substituição).
- **Turnos Determinísticos:** 5 Fases Automáticas (`START`, `MAIN`, `DEBATE`, `COMBAT`, `END`) com progressão natural de 1 a 10 de Energia.
- **Mulligan Estratégico:** Troca modular na mão inicial de 4 cartas.
- **Combate de Bloqueio Livre:** Os ataques sempre focam o Representante inimigo (salvo sob *Provocação*). O defensor tem a prioridade tática para designar bloqueios através de uma máquina de estados bifásica inviolável.
- **Sistema de Debate (LIFO):** Motor de interrupções de 4 níveis (*Ação Inicial $\rightarrow$ Réplica $\rightarrow$ Tréplica $\rightarrow$ Contrarréplica*) resolvidos em pilha reversa.
- **IA Autônoma:** Heurísticas baseadas em avaliação de atributos, controle de mesa e deduplicação de ações ilegais, rodando perfeitamente integrada no loop React.
- **Representantes Vivos:** Destaques ultimate gratuitos baseados em gatilhos de *Popularidade* reativos (Events & Effects System).
- **Interface Glassmorphism:** Tabuleiro imersivo renderizado em React, com conexões dinâmicas de combate, badges contextuais para as Keywords (Inércia, Impulso, etc.) e controles de fase inteligentes.

---

## 🏗️ Arquitetura (O Princípio Engine-First)

1.  **UI Agnostic (View Layer):** O React não contém regras de jogo. Todo clique no tabuleiro despacha um `ActionType` validado pelo validador central `validateAction`.
2.  **Imutabilidade Estrita:** Ações modificam o mundo retornando um novo `GameState`. Isso bloqueia *soft-locks* e garante que todas as 247 asserções de teste automatizado (Vitest) permaneçam consistentes.
3.  **Data-Driven Design:** As Cartas (Definições) são dissociadas de suas representações no tabuleiro (Instâncias), facilitando a adição em massa de feitiços e novos Representantes sem reescrever a engine.

---

## 🛠️ Tecnologias Utilizadas

*   **Linguagem:** TypeScript (Strict Mode)
*   **Frontend:** React 18
*   **Build Tool:** Vite
*   **Test Runner:** Vitest (com 247 testes estritos passando em 11.39s)
*   **Estilização:** CSS Vanilla Moderno

---

## ⚙️ Como Executar o SCB Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/icarocarvalho15/scb_dev.git
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

- [ ] **Fase 14: Polish & Beta Release** — Refinamento de UX, VFX e algumas outras melhorias.

---

Desenvolvido através de uma orquestração Multi-Agente (Agentic Workflow).

School Card Battle - Alpha 0.1.3 &copy; DravDev - 2026.
