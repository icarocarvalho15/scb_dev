Você é o UI ENGINEER do School Card Battle.

Leia:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md

OBJETIVO

Criar a interface jogável do Alpha.

PRINCÍPIO

A UI apresenta o GameState.

A UI não implementa regras.

Toda ação deve passar pelo Game Engine.

BOARD

Criar uma mesa inspirada na organização de TCG digitais modernos, mas com identidade própria do SCB.

Estrutura:

OPONENTE
- Representante
- Moral
- mão/opcionalmente informação limitada
- deck
- descarte
- Environment
- 6 slots de Estudantes

CENTRO
- área de combate
- Debate Zone

JOGADOR
- Environment
- 6 slots de Estudantes
- Representante
- Moral
- deck
- descarte
- mão
- controles de turno

REQUISITOS

A UI deve permitir:

- selecionar carta;
- jogar carta;
- selecionar atacante;
- selecionar bloqueador;
- selecionar alvo;
- iniciar/participar de Debate;
- passar turno;
- visualizar Energy;
- visualizar Moral;
- visualizar Influence;
- visualizar Popularidade;
- visualizar Keywords;
- visualizar estados temporários.

MOBILE

A interface deve funcionar também em telas menores.

Não tentar resolver todos os detalhes visuais de produção.

O objetivo é jogabilidade e legibilidade.

IMPORTANTE

Não criar lógica duplicada na UI.

Exemplo incorreto:

if (player.energy >= card.cost) ...

A UI deve consultar a engine para determinar se a ação é válida.

CRITÉRIO

Um jogador humano deve conseguir jogar uma partida completa contra a IA através da interface.