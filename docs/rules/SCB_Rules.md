# School Card Battle — Game Rules

**Projeto:** School Card Battle  
**Abreviação:** SCB  
**Documento:** SCB_Rules.md  
**Versão:** 1.0  
**Status:** Alpha / Prototipagem  

---

# 1. Objetivo deste Documento

Este documento define as regras operacionais de uma partida de School Card Battle.

Ele deve servir como referência para:

- implementação do motor de regras;
- desenvolvimento de IA;
- testes automatizados;
- criação e validação de cartas;
- balanceamento;
- documentação do jogo.

Quando uma regra estiver marcada como `PROVISIONAL`, ela ainda está sujeita a testes e alterações.

Quando uma regra estiver marcada como `LOCKED`, ela deve ser considerada estabelecida até que uma nova decisão de design seja registrada.

---

# 2. Objetivo da Partida

Cada jogador controla um Representante.

O objetivo principal é reduzir a Moral do Representante adversário a 0.

Quando a Moral do Representante chega a 0:

> o jogador perde imediatamente a partida.

Existe uma segunda condição de derrota:

> se um jogador precisar comprar uma carta enquanto seu Deck estiver vazio, esse jogador perde.

---

# 3. Estrutura da Partida

Uma partida possui:

1. Preparação;
2. Mulligan;
3. Turnos alternados;
4. Condição de vitória ou derrota.

Durante cada turno existem cinco fases:

1. Start Phase;
2. Main Phase;
3. Debate Phase;
4. Combat Phase;
5. End Phase.

---

# 4. Preparação da Partida

Antes do primeiro turno:

- cada jogador recebe seu Representante;
- cada jogador embaralha seu Deck;
- cada jogador compra 4 cartas;
- cada jogador começa com 1 Energia;
- o limite máximo inicial de Energia é 1;
- nenhum Estudante está em campo;
- nenhum Ambiente está ativo.

---

# 5. Mão Inicial

A mão inicial possui:

> 4 cartas.

---

# 6. Mulligan

Após receber a mão inicial, cada jogador pode realizar um mulligan.

O mulligan é:

- opcional;
- parcial;
- realizado uma única vez.

O jogador pode selecionar qualquer quantidade de cartas da mão inicial.

As cartas selecionadas são substituídas pela mesma quantidade de cartas compradas do Deck.

As cartas devolvidas devem seguir a regra de embaralhamento definida pelo sistema.

Após o mulligan, o jogador não pode realizar outro mulligan.

---

# 7. Primeiro Turno

O primeiro turno segue a estrutura normal do jogo.

Existe uma regra especial que impede o jogador de atacar no seu primeiro turno: Diplomacia.

Não existe redução de Energia para compensar o primeiro jogador.

Portanto:

> Estudantes não podem atacar diretamente o Representante adversário no primeiro turno do jogador ativo, mesmo que eles possuam a habilidade Impulso.

---

# 8. Energia

Cada jogador possui:

- Energia atual;
- limite máximo de Energia.

No início da partida:

> Energia atual = 1  
> Energia máxima = 1

No início de cada turno:

1. o limite máximo de Energia aumenta em 1;
2. o limite máximo não pode ultrapassar 10;
3. a Energia atual é restaurada até o novo limite.

Exemplo:

```text
Turno 1:
Máximo = 1
Atual = 1

Turno 2:
Máximo = 2
Atual = 2

Turno 3:
Máximo = 3
Atual = 3

...

Turno 10:
Máximo = 10
Atual = 10

Turnos seguintes:
Máximo = 10
Atual = 10
````

A Energia é gasta para pagar custos de cartas e habilidades que possuam custo de Energia.

---

# 9. Compra

Durante a Start Phase, o jogador ativo compra 1 carta.

Se o Deck estiver vazio no momento em que uma compra for necessária:

> o jogador perde a partida.

A compra deve ser processada antes das ações da Main Phase.

---

# 10. Ordem do Turno

O turno segue:

```text
START
↓
MAIN
↓
DEBATE
↓
COMBAT
↓
END
```

O jogador ativo permanece sendo o mesmo durante todas as fases.

---

# 11. Start Phase

Na Start Phase:

1. aumentar o limite máximo de Energia;
2. restaurar Energia;
3. comprar 1 carta;
4. resolver efeitos de início de turno.

A ordem exata dos efeitos automáticos deve ser determinada pelo motor de regras de forma consistente.

---

# 12. Main Phase

Durante a Main Phase, o jogador ativo pode executar ações permitidas.

Entre elas:

* jogar Estudantes;
* jogar Ambientes;
* jogar Equipamentos;
* ativar habilidades;
* executar outras ações permitidas pelas cartas.

O jogador pode realizar múltiplas ações durante a Main Phase enquanto possuir recursos e ações legais.

A Main Phase termina quando o jogador passa para a Debate Phase.

---

# 13. Jogar uma Carta

Para jogar uma carta, o jogador deve:

1. possuir a carta em uma zona que permita sua utilização;
2. possuir Energia suficiente;
3. possuir um alvo válido quando necessário;
4. respeitar os limites de campo;
5. respeitar todas as regras da carta.

Após a validação:

1. o custo é pago;
2. a carta é colocada na zona apropriada;
3. seus efeitos de entrada ou resolução são processados.

---

# 14. Limite de Estudantes e Substituição

Cada jogador pode controlar no máximo 6 Estudantes.
Se o campo já possuir 6 Estudantes e o jogador desejar posicionar um novo, ocorre a Substituição, seguindo estritamente esta ordem de eventos:

1. Jogar o novo Estudante (declarar intenção e pagar custo).
2. Escolher o Estudante antigo para substituir.
3. Remover o Estudante antigo do campo (vai para o Descarte, salvo regra contrária).
4. Resolver efeitos de saída de campo do Estudante antigo.
5. Colocar o novo Estudante em campo.
6. Resolver efeitos de entrada do novo Estudante.

---

# 15. Limite de Ambientes

Cada jogador pode controlar no máximo:

> 1 Ambiente.

Ao jogar um novo Ambiente:

1. o Ambiente atualmente ativo deixa de estar ativo;
2. o novo Ambiente torna-se o Ambiente ativo.

O Ambiente anterior é movido para a zona correspondente conforme suas regras.

---

# 16. Equipamentos

Equipamentos devem possuir um alvo válido para serem anexados.

Um Equipamento permanece associado ao alvo enquanto suas regras permitirem.

Quando o alvo deixa o campo:

* o Equipamento deve seguir as regras específicas do Equipamento;
* caso não exista regra específica, o comportamento padrão deverá ser definido pelo motor de regras.

A regra geral de Equipamentos sobre Representantes e Estudantes deve respeitar a compatibilidade de cada efeito.

---

# 17. Inércia

Quando um Estudante entra em campo, ele normalmente recebe:

> Inércia.

Um Estudante com Inércia não pode declarar ataque naquele mesmo turno.

A Inércia é removida de acordo com a passagem de turno definida pelo motor.

---

# 18. Impulso

Um Estudante com Impulso pode atacar no mesmo turno em que entra em campo.

Impulso permite ignorar a restrição de ataque causada por Inércia.

Impulso não permite atacar diretamente o Representante adversário no primeiro turno do jogador ativo.

Portanto:

```text
Impulso
≠
ignorar Diplomacia
```

---

# 19. Debate Phase

A Debate Phase ocorre:

> uma vez por turno, imediatamente antes do Combat Phase.

A finalidade da Debate Phase é permitir interação entre os jogadores antes do combate.

A estrutura atual é:

```text
Ação Inicial
↓
Réplica
↓
Tréplica
↓
Contrarréplica
↓
Resolução
```

---

# 20. Início do Debate

O jogador ativo possui a iniciativa e sempre é o responsável por iniciar a Debate Phase, caso possua uma ação válida e deseje fazê-lo. Se o jogador ativo passar a prioridade sem iniciar um Debate, a Debate Phase é encerrada e o jogo prossegue para o Combat Phase.

---

# 21. Réplica

Após a ação inicial do jogador ativo:

> o jogador defensor recebe a oportunidade de responder.

Essa resposta é chamada:

> Réplica.

A Réplica deve ser uma ação legal dentro das regras da carta ou habilidade utilizada.

---

# 22. Tréplica

Após a Réplica:

> o jogador ativo recebe a oportunidade de responder novamente.

Essa resposta é chamada:

> Tréplica.

---

# 23. Contrarréplica

Após a Tréplica:

> o jogador defensor recebe a última oportunidade de resposta.

Essa resposta é chamada:

> Contrarréplica.

---

# 24. Limite do Debate

A cadeia máxima atual é:

```text
1. Ação Inicial
2. Réplica
3. Tréplica
4. Contrarréplica
```

Não existe uma quinta resposta dentro do mesmo Debate.

Após a Contrarréplica:

> o Debate é resolvido.

---

# 25. Resolução do Debate

O Debate é resolvido no formato Pilha Reversa (LIFO - Last-In, First-Out). A última ação adicionada à cadeia é a primeira a ser resolvida.
Ordem de resolução completa:

1. Contrarréplica
2. Tréplica
3. Réplica
4. Ação Inicial

Cada etapa altera o GameState antes que a etapa seguinte (abaixo dela na pilha) seja resolvida.

O Combat Phase começa somente após a resolução do Debate.

---

# 26. Debate sem Ação

Se o jogador ativo não iniciar um Debate:

> a Debate Phase é encerrada.

Se uma etapa do Debate não possuir uma resposta válida:

> a próxima etapa da sequência é encerrada ou avançada conforme as regras do motor.

O sistema não deve criar ações artificiais apenas para preencher a sequência.

---

# 27. Combat Phase

A Combat Phase acontece depois da Debate Phase.

A estrutura planejada é:

1. declaração de atacantes;
2. declaração de bloqueadores;
3. resolução do combate.

Durante a declaração de bloqueadores, cada Estudante defensor pode bloquear no máximo 1 atacante. Um atacante pode possuir no máximo 1 bloqueador.

---

# 28. Declaração de Atacantes

Durante a declaração de atacantes, o jogador ativo escolhe quais Estudantes irão atacar.

Um Estudante somente pode atacar se:

* estiver em campo;
* não possuir Inércia;
* estiver em condição válida para atacar;
* não estiver impedido por algum efeito;
* possuir um alvo legal.

O jogador pode declarar múltiplos atacantes na mesma Combat Phase.

---

# 29. Ataque ao Representante

Estudantes não podem atacar diretamente o Representante adversário no primeiro turno do jogador ativo.

Essa restrição é causada pela regra de:

> Diplomacia.

A regra permanece válida mesmo quando o Estudante possui Impulso ou Infiltração, salvo futura alteração explícita.

---

# 30. Declaração de Bloqueadores

Após os atacantes serem declarados, o jogador defensor escolhe os bloqueadores.

Bloqueio Livre: Qualquer Estudante em campo pode ser declarado como bloqueador para interceptar um ataque, seja esse ataque direcionado ao Representante ou a outro Estudante. O ato de bloquear NÃO é uma habilidade exclusiva de nenhuma Keyword.

Durante a declaração de bloqueadores:
* Cada Estudante defensor pode bloquear no máximo 1 atacante.
* Um atacante pode possuir no máximo 1 bloqueador.

---

# 31. Resolução do Combate

Após a declaração dos bloqueadores:

1. os bloqueios são determinados;
2. o dano é calculado;
3. o dano é aplicado;
4. Estudantes com Moral igual ou inferior a 0 são derrotados;
5. efeitos de combate são processados;
6. o combate termina.

A resolução deve ser consistente e previsível.

---

# 32. Combate entre Estudantes

Quando um Estudante ataca e é bloqueado:

* o atacante causa dano ao bloqueador;
* o bloqueador causa dano ao atacante.

A quantidade de dano é determinada pela Influência do respectivo Estudante.

O dano reduz a Moral.

---

# 33. Estudante Derrotado

Quando a Moral de um Estudante chega a 0 ou menos:

> o Estudante é derrotado.

Um Estudante derrotado é removido do campo.

O destino posterior da carta depende das regras da carta ou da zona correspondente.

Na ausência de regra especial:

> utilizar o Descarte como destino padrão.

---

# 34. Provocação

Provocação altera os alvos legais de ataques.

Durante a declaração de atacantes, o sistema deve verificar:

* quais Estudantes possuem Provocação;
* quais atacantes são afetados;
* quais alvos permanecem legais.

Provocação não deve ser implementada como um comportamento especial hardcoded de uma carta.

Deve ser parte do sistema geral de validação de alvos.

---

# 35. Guarda

Guarda é uma Keyword que interage com a declaração de bloqueadores.

Como qualquer Estudante pode bloquear livremente, a Guarda serve como um "guarda-costas" do Representante, mas como se pudesse escolher o "momento exato de lutar". 

A Guarda NÃO é um requisito obrigatório para proteger o Representante.

---

# 36. Infiltração

Infiltração permite ignorar determinadas restrições defensivas.

Na configuração atual:

> Infiltração ignora Provocação e Guarda quando essas habilidades estiverem impedindo ou alterando o alvo do ataque.

Infiltração não permite ignorar:

> Diplomacia.

Portanto, um Estudante com Infiltração continua impedido de atacar diretamente o Representante no primeiro turno do jogador ativo.

---

# 37. Popularidade

Cada Representante possui:

* valor atual de Popularidade;
* valor necessário para Destaque;
* condição específica de ganho.

A condição é definida pelo Representante.

Exemplo:

```text
Daichi:
Ganha Popularidade quando um Estudante aliado declara um ataque.
```

---

# 38. Ganho de Popularidade

A condição de Popularidade deve ser avaliada pelo motor de regras no momento em que seu gatilho ocorre. Múltiplos ganhos de Popularidade no mesmo turno são teoricamente possíveis, dependendo da condição e dos eventos gerados. O balanceamento de limites por turno será avaliado carta a carta ou por regras sistêmicas futuras.

---

# 39. Destaque

Quando a Popularidade atinge o requisito do Representante:

> o Destaque fica disponível.

O Destaque possui:

* custo;
* efeito;
* requisitos;
* regras próprias.

Após utilizar o Destaque:

> a Popularidade pode voltar a ser acumulada.

O Representante não fica permanentemente impedido de utilizar seu Destaque novamente.

---

# 40. Destaque — Daichi

Condição de referência:

> Ganhar Popularidade quando um Estudante aliado declara um ataque.

Destaque:

> Custo: 5 Energia.

Efeito:

> Estudantes aliados recebem +1 Influência e +1 Moral até o final do turno.

---

# 41. Destaque — Akira

Condição de referência:

> Ganhar Popularidade quando um Debate é resolvido.

Destaque:

> Custo: 5 Energia.

Efeito:

> Estudantes adversários perdem suas habilidades até o final do próximo turno do oponente.

---

# 42. Fim do Turno

Durante a End Phase:

1. resolver efeitos de fim de turno;
2. remover efeitos temporários cujo prazo terminou;
3. verificar o limite de mão;
4. descartar cartas excedentes;
5. encerrar o turno;
6. passar o controle para o próximo jogador.

---

# 43. Limite de Mão no Final do Turno

Se o jogador possuir mais de 8 cartas:

> deverá descartar cartas até possuir 8.

A escolha das cartas a serem descartadas pertence ao jogador, salvo efeitos que determinem outra regra.

---

# 44. Mudança de Turno

Após a End Phase:

> o próximo jogador se torna o jogador ativo.

O novo turno começa pela Start Phase.

---

# 45. Ordem de Prioridade

O sistema de regras deve possuir uma noção clara de:

* jogador ativo;
* jogador defensor;
* fase atual;
* ação atual.

Entretanto, SCB não deve reproduzir integralmente o sistema de prioridade do Magic.

A interação deve ocorrer principalmente dentro da:

> Debate Phase.

---

# 46. Ações Inválidas

Uma ação deve ser rejeitada quando:

* o jogador não possui Energia suficiente;
* a carta não está em uma zona válida;
* o alvo é inválido;
* o jogador não possui permissão para executar a ação;
* o limite de campo foi excedido;
* a fase atual não permite a ação;
* uma Keyword impede a ação;
* a ação viola uma regra global.

A UI não deve decidir isoladamente se uma ação é válida.

A validação deve ocorrer no motor de regras.

---

# 47. Custos

Custos de cartas e habilidades devem ser pagos antes da execução do efeito, conforme o tipo de ação.

Se o jogador não puder pagar o custo:

> a ação é inválida e não deve alterar o GameState.

Custos pagos não devem ser devolvidos automaticamente, salvo quando uma regra ou efeito determinar isso.

---

# 48. Alvos

Quando uma carta ou habilidade exigir alvo:

1. o sistema deve determinar os alvos válidos;
2. o jogador escolhe entre os alvos válidos;
3. o sistema valida novamente;
4. o efeito é resolvido.

Se um alvo deixar de ser válido (ex: foi removido do campo ou recebeu Proteção) antes da resolução do efeito, a ação não é anulada globalmente. O efeito correspondente simplesmente falha (fizzle) em relação àquele alvo específico. Os demais efeitos da mesma ação que independem do alvo inválido continuam sendo resolvidos normalmente.

---

# 49. Estado do Campo

O estado do campo deve registrar, no mínimo:

* Estudantes presentes;
* posição/slot;
* Moral atual;
* Influência atual, quando modificada;
* Keywords;
* efeitos temporários;
* Equipamentos anexados;
* Ambiente ativo.

---

# 50. Estado do Jogador

Cada jogador deve possuir, no mínimo:

* Representante;
* Moral do Representante;
* Popularidade;
* Energia atual;
* Energia máxima;
* Deck;
* Mão;
* Descarte;
* Detenção;
* Estudantes;
* Ambiente;
* Equipamentos relevantes.

---

# 51. Estado da Partida

A partida deve possuir, no mínimo:

* jogador ativo;
* turno atual;
* fase atual;
* estado de cada jogador;
* estado de combate;
* estado de Debate;
* resultado da partida.

---

# 52. Ações do Jogador

As ações básicas do jogador incluem:

* jogar carta;
* atacar;
* bloquear;
* iniciar Debate;
* responder a Debate;
* ativar habilidade;
* usar Destaque;
* equipar carta;
* passar;
* encerrar turno.

A lista pode ser expandida conforme novas regras forem adicionadas.

---

# 53. Eventos de Jogo

O motor pode produzir eventos como:

* TurnStarted;
* CardDrawn;
* CardPlayed;
* StudentSummoned;
* AttackDeclared;
* BlockDeclared;
* CombatResolved;
* StudentDefeated;
* DebateStarted;
* DebateActionPlayed;
* DebateResolved;
* EnergyChanged;
* PopularityChanged;
* HighlightUsed;
* EnvironmentChanged;
* TurnEnded;
* GameEnded.

Eventos são consequência do GameState e não substituem as regras.

---

# 54. IA

A IA deve jogar utilizando as mesmas ações disponíveis ao jogador humano.

A IA não deve:

* modificar diretamente o GameState;
* ignorar custos;
* ignorar alvos;
* obter informações ocultas;
* utilizar regras especiais.

A IA deve produzir ações legais e enviá-las ao motor de regras.

---

# 55. Condição de Vitória por Representante

Após qualquer efeito que altere a Moral do Representante:

1. verificar Moral;
2. se Moral <= 0:

   * declarar derrota;
   * encerrar a partida.

---

# 56. Condição de Vitória por Deck

Sempre que um jogador precisar comprar uma carta:

1. verificar se existe carta no Deck;
2. se existir, comprar;
3. se não existir:

   * declarar derrota;
   * encerrar a partida.

---

# 57. Regras Não Definidas

Quando uma interação ainda não tiver regra definida:

> não criar automaticamente uma regra permanente.

A implementação deve:

* marcar a questão;
* registrar a decisão como PROVISIONAL;
* utilizar a solução mínima necessária para o protótipo, quando possível;
* documentar a decisão.

---

# 58. Regras Provisórias Atuais

As seguintes regras permanecem em teste:

* sistema final de bloqueadores;
* número máximo de bloqueadores por atacante;
* interação completa entre Provocação, Guarda e Infiltração;
* substituição quando existem 6 Estudantes;
* interação da substituição com Debate;
* ganho exato de Popularidade;
* detalhes de prioridade;
* resolução de alguns efeitos complexos;
* regras avançadas de Equipamentos;
* comportamento de cartas quando alvos se tornam inválidos.

---

# 59. Princípio de Implementação

O motor de regras deve sempre seguir:

```text
Ação
↓
Validação
↓
Execução
↓
Alteração do GameState
↓
Eventos
↓
Apresentação
```

A interface não deve implementar regras próprias.

---

# 60. Princípio de Testabilidade

Toda regra importante deve possuir testes.

Os testes devem cobrir pelo menos:

* Energia;
* compra;
* mulligan;
* limite de mão;
* Estudantes;
* Ambiente;
* Inércia;
* Impulso;
* Diplomacia;
* Provocação;
* Guarda;
* Infiltração;
* combate;
* bloqueio;
* dano;
* Popularidade;
* Destaque;
* Debates;
* vitória;
* derrota.

---

# 61. Regra de Consistência

Quando duas regras entrarem em conflito:

1. verificar se existe uma regra específica da carta;
2. verificar a regra específica da Keyword;
3. verificar a regra geral do sistema;
4. identificar a interação explicitamente;
5. não resolver silenciosamente através de comportamento arbitrário.

---

# 62. Status das Regras

As regras podem possuir os seguintes estados:

### LOCKED

Regra estabelecida.

### PROVISIONAL

Regra definida para o protótipo, mas sujeita a alteração.

### EXPERIMENTAL

Regra em teste ativo.

### FUTURE

Regra planejada, ainda não implementada.

### UNDEFINED

Ainda não existe decisão de design.

---

# 63. Regra de Evolução

Alterações nas regras devem ser registradas neste documento.

Quando uma regra for modificada:

1. atualizar a regra;
2. atualizar seu status;
3. registrar o motivo da alteração;
4. verificar impactos em cartas existentes;
5. verificar impactos no motor de regras;
6. atualizar testes.

---

# 64. Estado Atual do Alpha

O Alpha deve priorizar:

```text
Turno
↓
Energia
↓
Compra
↓
Main Phase
↓
Debate
↓
Combate
↓
Fim do turno
```

O objetivo é obter uma partida completa e repetível antes de expandir o número de mecânicas.

---

# 65. Princípio Fundamental

Toda ação válida em SCB deve ser explicável através das regras.

O jogador deve conseguir entender:

* por que pode executar uma ação;
* por que não pode executar uma ação;
* quais são os alvos válidos;
* quais efeitos serão aplicados;
* quando uma carta será derrotada;
* quando uma partida termina.

O sistema deve priorizar:

> **clareza, consistência, interação e previsibilidade.**

```