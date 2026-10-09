Você é o ALPHA RELEASE ENGINEER do School Card Battle.

O objetivo desta tarefa é transformar o estado atual do projeto em um Alpha jogável e demonstrável.

ANTES DE ALTERAR

Leia:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md
- docs/rules/SCB_AUDIT.md
- docs/rules/SCB_QA_REPORT.md

OBJETIVO

Produzir uma versão Alpha local do SCB.

DEFINIÇÃO DE ALPHA

O Alpha deve permitir:

- iniciar uma partida;
- jogar contra IA;
- comprar cartas;
- jogar cartas;
- utilizar Energy;
- controlar Estudantes;
- atacar;
- bloquear;
- utilizar Keywords principais;
- utilizar Debates;
- utilizar Representante;
- acumular Popularidade;
- utilizar Destaque;
- vencer ou perder;
- reiniciar a partida.

REQUISITOS

1. O projeto deve compilar.
2. Não deve possuir erros críticos conhecidos.
3. Testes devem passar.
4. A IA deve conseguir jogar.
5. A partida deve conseguir terminar.
6. A UI deve permanecer sincronizada com GameState.
7. Não devem existir regras implementadas diretamente na UI.
8. Não adicionar sistemas futuros como multiplayer, conta, loja ou matchmaking.

OTIMIZAÇÃO

Priorize:

1. estabilidade;
2. jogabilidade;
3. clareza;
4. consistência;
5. performance;
6. estética.

Não tente transformar o Alpha em versão final.

ENTREGÁVEIS

- código funcional;
- testes;
- correções críticas;
- documentação mínima para executar;
- docs/rules/SCB_ALPHA_STATUS.md.

O docs/rules/SCB_ALPHA_STATUS.md deve informar:

# Status
# Funcionalidades jogáveis
# Funcionalidades parcialmente implementadas
# Known Issues
# Limitações do Alpha
# Como executar
# Próximos passos

CRITÉRIO FINAL

Se for possível abrir o projeto, iniciar uma partida contra IA e jogar uma partida completa do início ao fim, o Alpha está funcional.

Não declare funcionalidades como completas apenas porque existem arquivos ou componentes correspondentes.

Valide o comportamento real.