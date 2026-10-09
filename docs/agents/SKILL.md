# School Card Battle — Agent Skill

## 1. Identidade

Você está trabalhando no projeto **School Card Battle (SCB)**, um TCG digital competitivo com temática escolar/anime.

O projeto é desenvolvido inicialmente como uma aplicação web, com foco em um Alpha local jogável contra IA.

Sua função é contribuir para o desenvolvimento do SCB respeitando integralmente:

- a identidade do jogo;
- as decisões de design;
- as regras;
- a arquitetura;
- os padrões técnicos;
- os critérios de qualidade;
- o escopo atual do projeto.

Você não deve tratar o SCB como um projeto genérico de software ou como um TCG genérico.

---

# 2. REGRA FUNDAMENTAL

Antes de implementar qualquer coisa:

1. entenda a tarefa;
2. localize a documentação relevante;
3. leia os documentos necessários;
4. inspecione o código relacionado;
5. identifique dependências;
6. verifique o estado atual do projeto;
7. somente então implemente.

Nunca comece alterando código apenas com base no nome da tarefa.

---

# 3. DOCUMENTAÇÃO OFICIAL

Os principais documentos do projeto são:

- `docs/agents/SKILL.md`
- `docs/agents/SCB_Orchestrator.md`
- `docs/rules/SCB_GDD.md`
- `docs/rules/SCB_Rules.md`
- `docs/rules/SCB_Keywords.md`
- `docs/rules/SCB_Architecture.md`
- `docs/rules/SCB_Balance.md`
- `docs/rules/SCB_PROJECT_STATUS.md`

Outros documentos podem existir durante o desenvolvimento.

---

# 4. FUNÇÃO DE CADA DOCUMENTO

## docs/agents/SKILL.md

Define como agentes devem trabalhar no projeto.

É o contrato operacional dos agentes.

Não deve ser usado para armazenar regras específicas de gameplay ou progresso do projeto.

---

## docs/agents/SCB_Orchestrator.md

Define como o agente Orchestrator / Tech Lead coordena o desenvolvimento.

Ele decide:

- o que deve ser feito;
- em qual ordem;
- por qual agente;
- quais critérios de aceite devem ser cumpridos;
- quando uma etapa pode avançar.

---

## docs/rules/SCB_GDD.md

Define a visão e intenção de design do SCB.

Inclui:

- identidade;
- objetivos;
- filosofia;
- sistemas;
- experiência desejada;
- escopo;
- direção visual;
- visão de produto.

---

## docs/rules/SCB_Rules.md

É a principal referência normativa para o funcionamento da partida.

Quando uma implementação de gameplay estiver sendo feita, este documento deve ser consultado.

---

## docs/rules/SCB_Keywords.md

Define as Keywords e seus comportamentos.

Não invente interpretações alternativas para Keywords existentes.

---

## docs/rules/SCB_Architecture.md

Define a direção técnica do projeto.

Implementações devem respeitar a separação entre:

- UI;
- Application;
- Game Engine;
- Game State;
- Card Definitions;
- AI;
- futuro multiplayer.

---

## docs/rules/SCB_Balance.md

Define como o equilíbrio do jogo deve ser avaliado.

Não deve ser utilizado para alterar regras silenciosamente.

Uma sugestão de balanceamento que exigir mudança de regra deve ser tratada como decisão de design.

---

## docs/rules/SCB_PROJECT_STATUS.md

Representa o estado atual do desenvolvimento.

Ele responde:

> "Onde estamos agora?"

Não deve ser usado para redefinir regras.

---

# 5. HIERARQUIA DE DECISÃO

Quando houver conflito entre implementação e documentação:

```text
Documentação
    ↓
Decisão de Design
    ↓
Implementação
    ↓
Testes
```

O código não deve ser considerado autoridade simplesmente porque já existe.

Se o código contradizer uma regra documentada:

1. identifique a inconsistência;
2. determine o comportamento correto conforme a documentação;
3. corrija a implementação quando apropriado;
4. não altere a documentação apenas para justificar o código existente.

---

# 6. ESTADOS DAS DECISÕES

As decisões de projeto podem possuir os seguintes estados:

### LOCKED

Decisão consolidada.

Não deve ser alterada sem decisão explícita.

### PROVISIONAL

Decisão atual, mas ainda sujeita a validação.

Implementar de forma modular.

### EXPERIMENTAL

Hipótese sendo testada.

Não tratar como regra definitiva.

### FUTURE

Planejado para uma etapa posterior.

Não implementar sem necessidade para a etapa atual.

### UNDEFINED

Ainda não existe decisão suficiente.

Não inventar comportamento definitivo.

### RETIRED

Decisão ou sistema anteriormente utilizado, mas abandonado.

Não reintroduzir sem autorização.

---

# 7. REGRA CONTRA INVENÇÃO

Se uma informação não estiver definida na documentação e for necessária para implementar uma funcionalidade:

NÃO invente uma regra como se fosse oficial.

Você pode:

* apontar a lacuna;
* explicar o impacto;
* sugerir alternativas;
* marcar a questão como `UNDEFINED`;
* solicitar decisão ao Orchestrator.

Uma implementação experimental deve ser explicitamente identificada como experimental.

---

# 8. REGRA CONTRA ALTERAÇÕES SILENCIOSAS

Não altere silenciosamente:

* regras;
* custos;
* Keywords;
* atributos;
* fases;
* condições de vitória;
* comportamento de cartas;
* arquitetura;
* estrutura de dados importante.

Se uma alteração for necessária:

1. explique o motivo;
2. identifique o impacto;
3. indique os documentos afetados;
4. solicite ou registre a decisão adequada.

---

# 9. ESCOPO DA TAREFA

Cada agente deve trabalhar dentro do escopo recebido.

Não aproveitar uma tarefa para:

* refatorar o projeto inteiro;
* reescrever sistemas não relacionados;
* trocar bibliotecas sem necessidade;
* alterar arquitetura por preferência;
* criar funcionalidades futuras;
* modificar regras de gameplay não relacionadas.

Se encontrar um problema fora do escopo:

registre o problema e informe o Orchestrator.

---

# 10. PRINCÍPIO GAMEPLAY FIRST

Durante a construção do Alpha, priorize:

1. funcionamento correto;
2. regras;
3. estabilidade;
4. testabilidade;
5. jogabilidade;
6. clareza da interface;
7. estética;
8. otimização avançada.

Não transformar o Alpha em uma produção visual completa antes de existir uma partida funcional.

---

# 11. PRINCÍPIO ENGINE FIRST

O Game Engine é a fonte de verdade da partida.

A UI não deve possuir regras próprias.

O fluxo esperado é:

```text
UI
 ↓
Action
 ↓
Validation
 ↓
Game Engine
 ↓
Events / Effects
 ↓
New GameState
 ↓
UI
```

A UI apresenta o estado.

Ela não decide o estado.

---

# 12. GAMESTATE

O `GameState` deve representar o estado completo da partida.

Sempre que possível, uma partida deve poder ser reproduzida ou testada somente a partir de:

```text
GameState
+
Action
```

Não esconder estado essencial em componentes React.

Não depender de variáveis globais para regras.

---

# 13. ACTIONS

Ações do jogador ou da IA devem passar pelo sistema de Actions.

Exemplos conceituais:

* jogar carta;
* atacar;
* bloquear;
* ativar habilidade;
* iniciar Debate;
* responder Debate;
* passar;
* selecionar alvo.

Uma Action deve ser validada antes de modificar o estado.

---

# 14. VALIDATION

A validação deve verificar:

* fase;
* turno;
* jogador;
* custos;
* alvos;
* zonas;
* limites;
* requisitos;
* Keywords;
* regras específicas.

Uma ação inválida não deve modificar o GameState.

---

# 15. EVENTOS E EFEITOS

Sempre que apropriado, utilizar:

```text
Action
→ Resolution
→ Event
→ Trigger
→ Effect
→ New Event
```

Evitar criar cadeias de lógica fortemente acopladas.

Eventos devem permitir que sistemas futuros reajam a acontecimentos sem reescrever o núcleo.

---

# 16. DADOS E LÓGICA

Cartas devem ser preferencialmente orientadas a dados.

Evitar:

```typescript
if (card.name === "Daichi") {
    ...
}
```

Preferir:

```typescript
{
    cardId: "...",
    keywords: [...],
    effects: [...]
}
```

O engine deve interpretar dados genéricos.

Uma nova carta com uma mecânica existente não deveria exigir alteração da engine sempre que possível.

---

# 17. REGRAS DO ALPHA

O Alpha deve priorizar uma partida completa.

O objetivo mínimo é permitir:

```text
Criar partida
    ↓
Mão inicial
    ↓
Mulligan
    ↓
Turnos
    ↓
Energy
    ↓
Jogar cartas
    ↓
Campo
    ↓
Combate
    ↓
Debates
    ↓
Keywords principais
    ↓
Popularidade
    ↓
Destaque
    ↓
IA
    ↓
Vitória / Derrota
```

Não implementar sistemas de produto futuro antes de existir esse fluxo.

---

# 18. DIPLOMACIA

Diplomacia é uma regra global de abertura.

Ela não deve ser tratada como uma Keyword permanente de Estudantes.

Durante o primeiro turno de cada jogador:

* seus Estudantes não podem atacar diretamente o Representante adversário;
* isso permanece verdadeiro mesmo que possuam `Impulso`.

Depois que o primeiro turno daquele jogador termina, a restrição desaparece.

`Infiltração` não ignora essa regra.

---

# 19. SUBSTITUIÇÃO

Quando o jogador possuir 6 Estudantes e quiser colocar um novo Estudante:

1. escolher o Estudante que será substituído;
2. remover o antigo;
3. resolver efeitos de saída;
4. colocar o novo;
5. resolver efeitos de entrada.

Substituição é uma regra do sistema de campo e não uma Keyword normal de carta.

---

# 20. COMBATE

O combate deve ser implementado de forma independente da UI.

O sistema deve respeitar as regras documentadas para:

* ataque;
* bloqueio;
* Influence;
* Moral;
* derrota;
* Provocação;
* Guarda;
* Infiltração;
* Inércia;
* Impulso;
* Diplomacia.

Decisões marcadas como `PROVISIONAL` devem permanecer fáceis de alterar.

---

# 21. REPRESENTANTES

Representantes:

* possuem Moral;
* não possuem Influence;
* não atacam;
* não bloqueiam;
* não causam dano de combate.

Popularidade e Destaque devem ser implementados de forma orientada a dados.

Evitar regras específicas baseadas somente no nome do Representante.

---

# 22. DEBATES

O sistema de Debate deve ser independente da UI.

A estrutura Alpha atual é:

```text
Ação Inicial
→ Réplica
→ Tréplica
→ Contrarréplica
→ Resolução
```

A resolução definida para o Alpha é LIFO:

```text
Contrarréplica
→ Tréplica
→ Réplica
→ Ação Inicial
```

Limite:

* máximo de quatro ações.

O jogador ativo inicia o Debate.

Se um alvo se tornar inválido antes da resolução:

* o efeito dependente daquele alvo não resolve;
* efeitos independentes da mesma ação não devem ser automaticamente cancelados.

Se alguma dessas regras estiver marcada como provisória em documentação mais recente, respeitar o estado mais atual documentado.

---

# 23. IA

A IA deve utilizar a mesma engine utilizada pelo jogador.

Nunca permitir:

```text
AI → modifica GameState diretamente
```

O fluxo deve ser:

```text
GameState
→ gerar Actions
→ avaliar Actions
→ escolher Action
→ Validation
→ Engine
→ novo GameState
```

A IA Alpha não precisa ser competitivamente inteligente.

Ela precisa ser:

* legal;
* estável;
* capaz de jogar;
* capaz de terminar partidas;
* previsível o suficiente para testes.

---

# 24. TESTES

Toda mecânica relevante deve possuir testes.

Priorizar:

### Unit Tests

Para regras isoladas.

### Integration Tests

Para interação entre sistemas.

### Simulation Tests

Para partidas completas.

### Regression Tests

Para impedir que correções quebrem sistemas existentes.

---

# 25. TESTES NÃO SÃO DECISÕES DE DESIGN

Não modificar uma regra apenas para fazer um teste passar.

Se o teste estiver incorreto:

corrigir o teste.

Se a regra estiver incorreta:

corrigir a implementação conforme a documentação.

Se a documentação estiver indefinida:

não inventar uma regra silenciosamente.

---

# 26. DETERMINISMO

Sempre que possível, sistemas de gameplay devem ser determinísticos.

Randomização relevante deve permitir controle por seed em testes.

Isso facilita:

* reprodução de bugs;
* testes;
* simulações;
* debugging;
* balanceamento.

---

# 27. ERROR HANDLING

Erros de gameplay devem ser estruturados.

Evitar depender exclusivamente de:

```typescript
throw new Error("something went wrong")
```

para decisões normais de gameplay.

A engine deve distinguir:

* ação inválida;
* erro de programação;
* estado impossível;
* falha inesperada.

---

# 28. DEBUGGING

Quando ocorrer um bug:

Não faça somente um patch superficial.

Investigue:

1. estado inicial;
2. Action;
3. validação;
4. resolução;
5. eventos;
6. efeitos;
7. estado final.

Determine onde o comportamento divergiu da regra.

Corrija a causa sempre que possível.

---

# 29. REGRESSÃO

Depois de qualquer alteração significativa:

1. executar testes relacionados;
2. executar testes gerais;
3. executar build;
4. verificar integração;
5. verificar regressões.

Uma tarefa não está concluída apenas porque o novo teste passa.

---

# 30. DEPENDÊNCIAS

Não adicionar bibliotecas sem necessidade.

Antes de instalar uma dependência:

1. verificar se o projeto já possui solução equivalente;
2. avaliar necessidade real;
3. verificar impacto;
4. considerar manutenção futura.

Evitar dependências que resolvam problemas triviais.

---

# 31. TECNOLOGIAS

Direção técnica atual:

* React;
* TypeScript;
* Vite;
* HTML;
* CSS.

Futuro:

* Node.js;
* PostgreSQL;
* WebSocket ou equivalente;
* multiplayer;
* persistência;
* contas;
* matchmaking.

Tecnologias futuras não devem ser implementadas no Alpha sem necessidade.

---

# 32. UI

A UI deve:

* representar o GameState;
* permitir ações válidas;
* bloquear ou sinalizar ações inválidas;
* mostrar feedback;
* funcionar em desktop;
* possuir adaptação para mobile.

Não duplicar regras da engine dentro dos componentes.

---

# 33. VISUAL

A direção visual deve respeitar o GDD.

SCB possui identidade própria.

Referências externas servem como inspiração, não como instrução para copiar:

* Legends of Runeterra;
* Riftbound;
* Lorcana;
* Persona;
* Blue Archive;
* Shadowverse.

Não copiar identidade visual, assets ou layouts proprietários.

---

# 34. TERMINOLOGIA

Respeitar a terminologia do projeto.

Preferir:

* `derrotado`;
* `removido do campo`.

Evitar utilizar:

* `morto`;
* `morrer`;
* `eliminado`.

Quando se referir a sistemas, manter os nomes oficiais:

* Representante;
* Estudante;
* Debate;
* Equipamento;
* Ambiente;
* Energy;
* Influence;
* Moral;
* Popularidade;
* Destaque.

---

# 35. AGENTES

Se você for um agente especializado:

* respeite seu escopo;
* leia a documentação relevante;
* não altere sistemas não relacionados;
* produza testes;
* documente alterações;
* informe problemas encontrados.

Se você for o Orchestrator:

* delegue;
* revise;
* teste;
* valide;
* controle avanço.

---

# 36. COMUNICAÇÃO ENTRE AGENTES

Ao terminar uma missão, informe:

```text
MISSION
Objetivo.

STATUS
SUCCESS / PARTIAL / BLOCKED / FAILED

CHANGES
Alterações realizadas.

TESTS
Testes executados.

RESULT
Resultado.

ISSUES
Problemas encontrados.

DOCUMENTATION
Documentos afetados.

NEXT STEP
Próxima ação recomendada.
```

Não declare uma tarefa como concluída se houver bloqueadores relevantes.

---

# 37. CRITÉRIOS DE QUALIDADE

Código deve ser:

* legível;
* tipado;
* modular;
* testável;
* determinístico quando possível;
* pouco acoplado;
* orientado a dados;
* coerente com a arquitetura.

Evitar:

* funções gigantes;
* duplicação;
* estado global desnecessário;
* lógica de gameplay na UI;
* hardcode de nomes de cartas;
* dependências desnecessárias;
* abstrações prematuras.

---

# 38. NÃO OVERENGINEER

Não implementar futuro sem necessidade.

Pergunta obrigatória:

> Isso é necessário para o objetivo atual?

Se não:

marcar como `FUTURE`.

---

# 39. NÃO UNDERENGINEER

Também não criar soluções descartáveis quando a abstração correta for simples.

Exemplo:

Se uma mecânica será utilizada por muitas cartas, crie uma implementação reutilizável.

Não crie uma exceção exclusiva para uma carta apenas para acelerar a primeira implementação.

---

# 40. CRITÉRIO DE CONCLUSÃO

Uma tarefa está concluída somente quando:

* implementação existe;
* código compila;
* testes relevantes existem;
* testes passam;
* comportamento está de acordo com documentação;
* integração foi verificada;
* não existem bloqueadores conhecidos.

---

# 41. REGRA DE PRIORIDADE

Quando houver conflito entre:

* velocidade;
* qualidade;
* estabilidade;

priorize:

```text
correção
→ estabilidade
→ testabilidade
→ velocidade
```

Durante o Alpha, um sistema pequeno e confiável é preferível a um sistema grande e instável.

---

# 42. OBJETIVO FINAL

O objetivo atual do projeto é construir um Alpha jogável do School Card Battle.

Não é necessário possuir ainda:

* multiplayer;
* matchmaking;
* contas;
* loja;
* ranking;
* economia;
* coleção online;
* monetização;
* servidores de produção;
* arte final;
* animações completas.

Primeiro:

```text
PARTIDA FUNCIONAL
```

Depois:

```text
ALPHA ESTÁVEL
```

Depois:

```text
BETA
```

Depois:

```text
PRODUÇÃO
```

---

# 43. PRINCÍPIO FINAL

Não maximize quantidade de código.

Maximize:

**progresso validado.**

Preferir:

```text
pequeno
→ correto
→ testado
→ integrado
→ validado
```

a:

```text
grande
→ rápido
→ parcialmente funcional
→ difícil de testar
→ difícil de corrigir
```

Toda contribuição deve aproximar o SCB de uma partida completa, estável, compreensível e extensível.

Se houver dúvida:

**não invente.**

Leia a documentação.

Se continuar indefinido:

**pare, registre e solicite decisão.**

```
