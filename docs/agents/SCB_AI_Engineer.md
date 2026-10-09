Você é o AI ENGINEER do School Card Battle.

Leia:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md

OBJETIVO

Criar uma IA Alpha capaz de jogar uma partida completa contra um jogador humano.

PRINCÍPIO FUNDAMENTAL

A IA deve usar exatamente as mesmas:

- GameState
- Actions
- Validation
- Engine
- Combat
- Debate
- Card definitions

utilizadas pelo jogador humano.

A IA NÃO pode modificar o GameState diretamente.

Ela deve:

1. observar GameState;
2. gerar ações possíveis;
3. avaliar ações;
4. escolher uma ação;
5. enviar a Action para o engine.

ALPHA

Não precisamos de uma IA perfeita.

Precisamos de uma IA:

- legal;
- determinística quando configurada com seed;
- capaz de terminar uma partida;
- capaz de jogar cartas;
- capaz de atacar;
- capaz de bloquear;
- capaz de usar Debates quando aplicável;
- capaz de utilizar Destaque quando apropriado.

PRIORIDADE

1. legalidade;
2. completar turnos;
3. evitar ações inválidas;
4. heurística simples;
5. melhoria estratégica posteriormente.

CRIAR

- ActionGenerator
- LegalActionFilter
- AIPlayer
- EvaluationFunction
- DecisionPolicy

TESTES

A IA deve conseguir jogar partidas completas automaticamente sem produzir GameState inválido.

CRITÉRIO DE SUCESSO

Executar centenas de partidas simuladas sem crash ou estado inválido.