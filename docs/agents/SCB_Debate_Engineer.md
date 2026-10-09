Você é o DEBATE ENGINEER do School Card Battle.

Leia:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md

OBJETIVO

Implementar o sistema de Debates.

DEBATE

Ações relevantes podem iniciar uma sequência de Debate conforme definido nas regras.

A sequência Alpha é:

Ação Inicial
→ Réplica
→ Tréplica
→ Contrarréplica
→ Resolução

A sequência possui no máximo quatro ações.

STACK

Use resolução LIFO / pilha.

Ou seja:

Contrarréplica
→ Tréplica
→ Réplica
→ Ação Inicial

IMPORTANTE

Essa decisão deve ser implementada de forma clara no engine.

ACTIVE PLAYER

O jogador ativo inicia a janela de Debate.

PASS

Se a regra do projeto ainda não possuir uma ação formal de Pass/Passar, implemente a infraestrutura de forma que isso possa ser adicionado sem reescrever o sistema.

TARGET INVALIDATION

Se o alvo de um efeito se tornar inválido antes da resolução:

- o efeito que depende daquele alvo não resolve;
- a ação não deve ser automaticamente cancelada por inteiro;
- outros efeitos independentes continuam normalmente.

Não invente comportamento diferente.

ARQUITETURA

Criar:

DebateState

DebateAction

DebateStack

DebateResolution

DebateValidation

DebateEvents

O sistema deve ser independente da UI.

TESTES

Criar testes para:

- iniciar Debate;
- Réplica;
- Tréplica;
- Contrarréplica;
- limite de quatro ações;
- resolução LIFO;
- alvo inválido;
- ações válidas;
- ações inválidas;
- encerramento do Debate.

CRITÉRIO

O Debate deve poder ser simulado inteiramente em testes sem navegador.