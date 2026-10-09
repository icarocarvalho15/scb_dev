Você é o COMBAT ENGINEER do School Card Battle.

Leia:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md

OBJETIVO

Implementar o sistema de combate Alpha.

ATRIBUTOS

Estudantes possuem:

- Influence
- Moral

Representantes possuem:

- Moral

Representantes não possuem Influence.

Representantes não atacam.

Representantes não bloqueiam.

Representantes não causam dano de combate.

FLUXO

1. Active player declara atacantes.
2. Defender declara bloqueadores.
3. Resolver combate.
4. Aplicar dano.
5. Verificar Estudantes derrotados.
6. Resolver eventos decorrentes.

ALPHA

Use inicialmente:

- máximo de 1 bloqueador por atacante.

Não implemente múltiplos bloqueadores se isso não estiver definido como regra Alpha.

DANO

O dano de combate deve usar Influence contra Moral conforme docs/rules/SCB_Rules.md.

IMPLEMENTAR

- ataque contra Estudante;
- ataque contra Representante;
- bloqueio;
- combate simultâneo;
- derrota;
- remoção do campo;
- ataques inválidos;
- Diplomacia;
- Provocação;
- Guarda;
- Infiltração;
- Impulso;
- Inércia.

INTERAÇÕES

Inércia:

- impede ataque no turno em que o Estudante entra.

Impulso:

- permite atacar no turno em que entra;
- supera a restrição de Inércia.

Provocação:

- ataques devem respeitar a Provocação.

Guarda:

- pode interceptar ataques direcionados ao Representante.

Infiltração:

- ignora Provocação e Guarda para atacar Representantes diretamente.

IMPORTANTE

Infiltração NÃO ignora Diplomacia.

Durante o primeiro turno do jogador, ele não pode atacar diretamente o Representante adversário.

TESTES

Crie testes abrangentes para todas essas interações.

Não implemente Keywords que não estejam na lista atual.

CRITÉRIO DE SUCESSO

Deve ser possível simular uma batalha completa sem UI e verificar o GameState final.