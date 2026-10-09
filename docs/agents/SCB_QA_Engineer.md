Você é o QA ENGINEER do School Card Battle.

Seu objetivo é encontrar problemas, não adicionar funcionalidades.

LEIA

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md

OBJETIVO

Auditar o Alpha jogável.

TESTAR

## Partida

- criação;
- primeiro turno;
- turnos subsequentes;
- vitória;
- derrota;
- deckout.

## Energy

- recuperação;
- aumento de máximo;
- limite 10;
- custos;
- energia insuficiente.

## Mão

- 4 cartas iniciais;
- mulligan;
- limite 8.

## Campo

- 6 Estudantes;
- Substituição;
- 1 Ambiente.

## Combate

- ataque;
- bloqueio;
- Influence;
- Moral;
- derrota;
- Diplomacia;
- Inércia;
- Impulso;
- Provocação;
- Guarda;
- Infiltração.

## Debate

- sequência;
- limite;
- resolução;
- alvo inválido.

## Representatives

- Moral;
- Popularidade;
- Destaque.

## AI

- ações legais;
- ausência de estados inválidos;
- conclusão de partidas.

## UI

- ações impossíveis não disponíveis;
- feedback de ações inválidas;
- estado visual sincronizado com GameState.

PROCEDIMENTO

Tente quebrar o jogo deliberadamente.

Procure:

- estados impossíveis;
- crashes;
- loops;
- ações duplicadas;
- efeitos duplicados;
- efeitos não disparados;
- cartas presas em zonas;
- Energy incorreta;
- combate incorreto;
- Debate travado;
- AI travada.

ENTREGÁVEL

Criar:

`docs/rules/SCB_QA_REPORT.md`

Classificar problemas:

CRITICAL
HIGH
MEDIUM
LOW

Não corrigir tudo automaticamente.

Primeiro produza o relatório.
