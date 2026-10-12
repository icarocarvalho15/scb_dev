# School Card Battle — Game Design Document

**Projeto:** School Card Battle  
**Abreviação:** SCB
**Documento:** SCB_GDD.md  
**Versão:** 1.0  
**Status:** Alpha / Prototipagem  

---

# 1. Visão Geral

School Card Battle (SCB) é um Trading Card Game digital competitivo com temática de escola/anime.

Cada jogador representa uma turma escolar através de um **Representante** e utiliza **Estudantes**, **Debates**, **Equipamentos** e **Ambientes** para superar o Representante adversário.

O jogo combina:

- construção de decks;
- gerenciamento de Energia;
- desenvolvimento de campo;
- combate entre Estudantes;
- interação através de Debates;
- habilidades e palavras-chave;
- sinergia entre Representante e Estudantes;
- progressão de Popularidade;
- habilidades especiais de Representantes.

O objetivo é criar um TCG estratégico, acessível e visualmente marcante, com identidade própria e potencial para partidas competitivas.

---

# 2. Plataforma

SCB será desenvolvido como um jogo **100% web**, executado diretamente no navegador.

Plataformas-alvo:

- PC;
- Mobile.

O desenvolvimento inicial prioriza:

- protótipo local;
- partidas contra IA;
- validação das regras;
- testes de balanceamento.

O multiplayer online será desenvolvido posteriormente.

---

# 3. Filosofia de Design

## 3.1 Identidade própria

SCB pode utilizar outros TCGs como referência conceitual, mas não deve copiar diretamente seus sistemas, cartas, personagens, textos ou identidade visual.

Referências de design incluem jogos como:

- Pokémon TCG;
- Magic: The Gathering;
- Legends of Runeterra;
- Hearthstone;
- Shadowverse;
- Riftbound;
- Lorcana.

Essas referências servem para análise de padrões e comparação de design, não para reprodução.

---

## 3.2 Acessibilidade com profundidade

O jogo deve ser fácil de entender inicialmente, mas possuir profundidade suficiente para recompensar:

- planejamento;
- gerenciamento de recursos;
- construção de deck;
- posicionamento;
- leitura do adversário;
- timing;
- interação;
- conhecimento do próprio arquétipo.

---

## 3.3 Sem Pay-to-Win

A monetização planejada não deve conceder vantagem competitiva direta.

A monetização deve priorizar elementos cosméticos, como:

- skins de cartas;
- artes alternativas;
- protetores/sleeves/card backs;
- campos/playmats;
- avatares;
- elementos visuais;
- outras personalizações.

---

# 4. Estrutura Básica da Partida

Cada jogador possui:

- 1 Representante;
- 1 deck;
- mão;
- campo de Estudantes;
- Ambiente ativo;
- descarte;
- Detenção.

O objetivo principal é reduzir a **Moral do Representante adversário a 0**.

Existe também uma condição de derrota por deck vazio (deckout).

---

# 5. Tipos de Carta

SCB possui cinco tipos principais:

1. Representante
2. Estudante
3. Debate
4. Equipamento
5. Ambiente

---

# 6. Representante

O Representante representa a identidade da turma.

Cada jogador possui um Representante por partida.

Representantes possuem:

- Nome;
- Moral;
- Traços;
- Popularidade;
- condição de Popularidade;
- habilidade de Destaque.

Representantes não possuem Influência.

Representantes:

- não atacam;
- não bloqueiam;
- não causam dano de combate.

---

## 6.1 Moral do Representante

A Moral funciona como a vida do jogador.

Quando a Moral do Representante chega a 0:

> o jogador perde a partida.

Atualmente a Moral inicial do Representante é 20.

---

## 6.2 Popularidade

Popularidade é um sistema de progressão associado ao Representante.

Ela não funciona como um recurso convencional como Energia.

Cada Representante possui uma condição específica que permite ganhar Popularidade.

Exemplo:

> Daichi ganha Popularidade quando um Estudante aliado declara um ataque.

A Popularidade pode ser acumulada novamente após a utilização da habilidade de Destaque.

---

## 6.3 Destaque

Destaque é a habilidade especial do Representante.

Quando a Popularidade necessária é atingida, o Destaque fica disponível.

O Destaque do Representante NÃO custa Energia. O único requisito e custo para ativar o Destaque é possuir a Popularidade exigida.

O Destaque pode ser utilizado conforme as regras específicas do Representante.

Após sua utilização, a Popularidade pode voltar a ser acumulada para permitir futuras ativações.

---

# 7. Estudantes

Estudantes são as principais unidades utilizadas no campo.

Cada Estudante possui:

- custo de Energia;
- Influência;
- Moral;
- Traços;
- palavras-chave;
- efeitos e habilidades.

---

## 7.1 Limite de Estudantes

Cada jogador pode controlar no máximo:

> 6 Estudantes.

Caso o jogador precise colocar um novo Estudante em um campo que já possui 6 Estudantes, a regra de substituição deverá ser aplicada conforme a implementação vigente.

O comportamento exato de interação dessa substituição com Debates permanece sujeito à definição final do sistema.

---

# 8. Influência

Influência representa o poder ofensivo de um Estudante.

Durante o combate, a Influência é utilizada para determinar o dano causado.

---

# 9. Moral do Estudante

Moral representa a resistência de um Estudante.

Quando a Moral de um Estudante chega a 0:

> o Estudante é derrotado e removido do campo.

O jogo não utiliza terminologia de morte para Estudantes.

Preferir:

- derrotado;
- removido do campo.

---

# 10. Energia

Energia é o principal recurso do SCB.

Cada jogador:

- começa com 1 Energia;
- recupera Energia no início do turno;
- aumenta seu limite máximo de Energia em +1 por turno;
- possui limite máximo de 10 Energia.

A Energia é utilizada para jogar cartas e, quando definido pela carta, executar habilidades.

Não existem cartas de recurso equivalentes a terrenos como no Magic.

Não existe sacrifício de cartas da mão como sistema principal de recurso.

---

# 11. Deck

O formato principal utiliza deck singleton.

Configuração planejada:

- 1 Representante;
- 40 cartas;
- cada carta pode aparecer apenas uma vez no deck.

Durante prototipagem, decks menores podem ser utilizados para testar mecânicas específicas.

Exemplo:

- 1 Representante;
- 15 ou 20 cartas para testes de mecânicas.

Esses decks reduzidos são apenas ferramentas de prototipagem e não representam necessariamente o tamanho final do deck.

---

# 12. Mão Inicial

Cada jogador começa a partida com:

> 4 cartas.

---

# 13. Mulligan

Cada jogador possui um mulligan inicial parcial.

O jogador pode:

- escolher qualquer quantidade de cartas da mão inicial;
- substituir essas cartas;
- comprar a mesma quantidade de cartas.

O mulligan pode ser realizado:

> uma única vez.

---

# 14. Limite de Mão

O limite de mão é:

> 8 cartas.

No final do turno, caso o jogador possua mais de 8 cartas, deverá descartar cartas até atingir o limite.

---

# 15. Zonas

As principais zonas do jogo são:

- Deck;
- Mão;
- Campo de Estudantes;
- Ambiente;
- Descarte;
- Debate;
- Detenção;
- Representante.

---

## 15.1 Deck

Contém as cartas restantes do jogador.

---

## 15.2 Mão

Contém as cartas disponíveis para serem jogadas.

---

## 15.3 Campo de Estudantes

Área onde os Estudantes permanecem ativos.

Limite:

> 6 Estudantes.

---

## 15.4 Ambiente

Cada jogador pode possuir:

> 1 Ambiente ativo.

Durante o seu turno, cada jogador só pode jogar uma carta de Ambiente por turno.

Ao jogar um novo Ambiente, o Ambiente anterior deixa de estar ativo.

---

## 15.5 Descarte

Zona para cartas que foram descartadas ou removidas do campo de acordo com suas regras.

---

## 15.6 Debate

Zona lógica/visual associada à resolução da Debate Phase.

A versão atual não utiliza um sistema de "Debate Zone" permanente para restringir quais cartas podem responder.

---

## 15.7 Detenção

Zona destinada a cartas removidas do campo de maneira específica.

A Detenção poderá receber futuramente mecânicas que permitam retornar cartas ao jogo.

Essas mecânicas ainda não estão definidas.

---

# 16. Fluxo do Turno

A estrutura atual do turno é:

1. Start Phase
2. Main Phase
3. Debate Phase
4. Combat Phase
5. End Phase

---

# 17. Start Phase

No início do turno:

1. recuperar Energia;
2. aumentar o limite máximo de Energia em +1, até 10;
3. comprar 1 carta;
4. resolver efeitos de início de turno.

A configuração inicial da partida garante que cada jogador comece com:

> 1 Energia.

---

# 18. Main Phase

Durante a Main Phase, o jogador pode:

- jogar Estudantes;
- jogar Ambiente;
- jogar Equipamentos;
- ativar habilidades permitidas;
- realizar outras ações permitidas pelas cartas.

Limites relevantes:

- máximo de 6 Estudantes;
- máximo de 1 Ambiente.

---

# 19. Debate Phase

A Debate Phase ocorre uma vez por turno:

> antes do combate.

A intenção é criar uma janela controlada de interação entre os jogadores.

A sequência atual é:

1. Ação inicial;
2. Réplica;
3. Tréplica;
4. Contrarréplica;
5. Resolução.

Cada jogador possui uma oportunidade dentro dessa sequência.

A Debate Phase não deve possuir uma cadeia infinita de respostas.

O Debate é resolvido no formato Pilha Reversa (LIFO - Last-In, First-Out). A última ação adicionada à cadeia é a primeira a ser resolvida.

Ordem de resolução completa:

1. Contrarréplica
2. Tréplica
3. Réplica
4. Ação Inicial

---

## 19.1 Iniciativa do Debate

A proposta atual é que:

> o jogador ativo inicia o Debate.

Motivo de design:

- o jogador ativo está se preparando para o combate;
- mantém a iniciativa do turno;
- torna a Debate Phase uma etapa de preparação para a ação ofensiva.

---

# 20. Combat Phase

O modelo de combate está sendo desenvolvido para oferecer interação também em decks que não utilizem Provocação ou Guarda.

A direção atual é utilizar:

1. declaração de atacantes;
2. declaração de bloqueadores;
3. resolução do combate.

A versão inicial deve limitar:

> 1 bloqueador por atacante.

O sistema deve evitar inicialmente a complexidade de múltiplas etapas de prioridade e múltiplos bloqueadores do Magic.

---

# 21. Combate

Estudantes podem:

- atacar;
- bloquear;
- causar dano;
- receber dano.

O dano deve ser resolvido de maneira consistente para todos os participantes do combate.

Quando a Moral de um Estudante chega a 0:

> ele é derrotado e removido do campo.

---

# 22. Ataques ao Representante

Estudantes só podem atacar diretamente o Representante adversário.

Durante o primeiro turno do jogador ativo, seus Estudantes não podem atacar diretamente o Representante adversário.

Essa restrição é causada pela regra de:

> Diplomacia.

A regra permanece válida mesmo quando o Estudante possui Impulso ou Infiltração, salvo futura alteração explícita.

---

# 23. Palavras-chave

Palavras-chave são regras reutilizáveis associadas às cartas.

Cada Keyword deve possuir:

> um único nome.

---

# 24. Inércia

Estudantes normalmente não podem atacar no mesmo turno em que entram em campo.

Essa condição é representada por:

> Inércia.

---

# 25. Impulso

Impulso permite que um Estudante ataque no mesmo turno em que entra em campo.

Impulso ignora a restrição normal causada por Inércia.

Impulso não ignora Diplomacia.

---

# 26. Provocação

Provocação altera as regras de escolha de alvo durante o combate.

Um Estudante com Provocação pode obrigar ataques a serem direcionados a ele de acordo com as regras de combate.

Provocação deve ser implementada como uma restrição/validação de alvo, e não como lógica específica de uma carta individual.

---

# 27. Guarda

Guarda permite que um Estudante intercepte ataques direcionados ao Representante.

Guarda é uma mecânica defensiva associada à proteção do Representante.

---

# 28. Infiltração

Infiltração permite ignorar determinadas restrições defensivas.

Na configuração atual, Infiltração pode ignorar:

- Provocação;
- Guarda;

quando essas mecânicas estiverem tentando restringir o alvo ou interceptar o ataque.

---

# 29. Diplomacia

Diplomacia impede que Estudantes ataquem diretamente o Representante adversário no primeiro turno de cada jogador.

É uma regra global atual do jogo.

---

# 30. Keywords Futuras

As seguintes palavras-chave foram consideradas para desenvolvimento futuro:

- Proteção;
- Inspiração;
- Persistência;
- Reconhecimento;
- Debate;
- Rivalidade;
- Liderança;
- Aprendizagem;
- Colaboração.

Essas keywords não devem ser implementadas automaticamente enquanto suas regras não estiverem definidas.

---

# 31. Classes

Classes representam subtipos ou categorias de cartas.

Exemplos:

- Atleta;
- Conselho;
- Idol.

Classes podem ser utilizados para:

- sinergias;
- habilidades;
- construção de arquétipos;
- identidade de Representantes;
- efeitos de cartas.

Classe não é um tipo principal de carta.

---

# 32. Liderança

Liderança foi planejada como uma possível mecânica de sinergia entre um Estudante e o Representante.

A ideia atual é que o Estudante receba um benefício quando compartilha uma determinada Classe com seu Representante.

A regra final ainda não está fechada.

---

# 33. Reconhecimento

Reconhecimento foi planejado como uma possível mecânica relacionada à Popularidade.

A implementação e regra final ainda não estão definidas.

---

# 34. Debates como Mecânica

Debates representam a principal mecânica de interação temática do SCB.

A intenção é criar uma sensação de:

- argumentação;
- resposta;
- contra-argumentação;
- disputa estratégica.

O sistema deve permanecer limitado e compreensível.

A sequência máxima atual é:

> Ação → Réplica → Tréplica → Contrarréplica → Resolução.

O Debate é resolvido no formato Pilha Reversa (LIFO - Last-In, First-Out). A última ação adicionada à cadeia é a primeira a ser resolvida.

Ordem de resolução completa:

1. Contrarréplica
2. Tréplica
3. Réplica
4. Ação Inicial

---

# 35. Equipamentos

Equipamentos são cartas que podem ser anexadas a outras entidades.

Podem ser utilizados para modificar:

- atributos;
- palavras-chave;
- habilidades;
- comportamento.

Equipamentos podem ser associados a Estudantes e Representantes.

Entretanto, efeitos especificamente relacionados a características de Estudantes não devem assumir automaticamente que funcionam da mesma maneira em Representantes.

Exemplo:

Um Equipamento que concede Influência não deve conceder esse atributo a um Representante que não possui Influência.

Um Equipamento que concede Moral pode potencialmente funcionar em ambos.

---

# 36. Ambientes

Ambientes representam condições ou cenários que influenciam a partida.

Cada jogador possui no máximo:

> 1 Ambiente ativo.

Ao jogar um novo Ambiente:

> o anterior é substituído.

Ambientes podem possuir:

- efeitos estáticos;
- efeitos de ativação;
- efeitos únicos.

---

# 37. Condições de Vitória

Atualmente existem duas condições principais de derrota:

## Representante

Se a Moral do Representante chegar a 0:

> o jogador perde.

## Deck

Se um jogador precisar comprar uma carta de um deck vazio:

> o jogador perde.

---

# 38. Representantes Atuais de Referência

## Daichi

**Nome:** Daichi  
**Tema:** Athletic Club  
**Moral:** 20  
**Classe:** Atleta

### Popularidade

Ganha Popularidade quando um Estudante aliado declara um ataque.

### Destaque

Custo atual de referência:

> 5 Popularidade.

Efeito:

> Todos os Estudantes aliados recebem +1 Influência e +1 Moral até o final do turno.

---

## Akira

**Nome:** Akira  
**Tema:** Student Council  
**Moral:** 20  
**Classe:** Conselho

### Popularidade

Ganha Popularidade quando um Debate é resolvido.

### Destaque

Custo atual de referência:

> 5 Popularidade.

Efeito:

> Os Estudantes adversários perdem suas habilidades até o final do próximo turno do oponente.

Esses Representantes são exemplos de referência para o protótipo e podem sofrer balanceamento posteriormente.

---

# 39. Filosofia dos Representantes

Representantes funcionam como identidade central do deck.

Cada Representante deve incentivar uma forma diferente de jogar.

Exemplos:

- Representante focado em ataques;
- Representante focado em Debates;
- Representante focado em determinada Classe;
- Representante focado em defesa;
- Representante focado em determinados tipos de carta.

Representantes não precisam ser necessariamente complexos.

A raridade não determina obrigatoriamente a complexidade de um Representante.

---

# 40. Raridade

O sistema de raridade planejado possui quatro níveis:

1. Regular
2. Destaque
3. Notável
4. Ícone

As raridades se aplicam a todos os tipos de carta, incluindo Representantes.

---

# 41. Versões Cosméticas

Versões cosméticas são classificações independentes da raridade mecânica.

Exemplos planejados:

- Limitada;
- Prestígio;
- Festival;
- Campeão;
- Fundador.

Uma versão cosmética deve manter a mesma identidade mecânica da carta original.

Seu objetivo é personalização, não vantagem competitiva.

---

# 42. Progressão e Coleção

A filosofia de coleção é evitar uma experiência excessivamente baseada em grind e RNG.

O jogador deve conseguir construir sua coleção de maneira razoável.

Possíveis sistemas considerados:

- boosters;
- passe;
- crafting;
- conversão de duplicatas;
- recompensas de progressão.

A implementação final ainda não está definida.

---

# 43. Boosters

Uma estrutura considerada para a coleção é:

### Booster de cartas

Pode conter:

- Estudantes;
- Debates;
- Equipamentos;
- Ambientes;
- Representantes.

A quantidade e distribuição final ainda precisam ser definidas.

---

# 44. Deckbuilding

A filosofia de deckbuilding utiliza singleton.

O objetivo é reduzir:

- necessidade de possuir múltiplas cópias;
- dependência de RNG;
- barreira de entrada para novos jogadores.

Também permite que cada carta tenha maior identidade e função.

---

# 45. Arquétipos

Arquétipos podem ser construídos através de:

- Representante;
- Classes;
- Keywords;
- tipos de carta;
- condições de Popularidade;
- sinergias.

Exemplos iniciais:

### Athletic Club

Foco em:

- Atletas;
- ataques;
- pressão;
- combate.

### Student Council

Foco em:

- Conselho;
- Debates;
- controle;
- interação.

Esses arquétipos servem como exemplos iniciais e não limitam futuras turmas.

---

# 46. Terminologia

SCB possui terminologia temática própria.

Preferir:

- Energia;
- Moral;
- Influência;
- Popularidade;
- Representante;
- Estudante;
- Debate;
- Equipamento;
- Ambiente;
- derrotado;
- removido do campo.

Evitar terminologia de morte quando se referir a Estudantes.

---

# 47. Direção Visual

A direção visual desejada combina:

- anime;
- ambiente escolar;
- TCG moderno;
- identidade limpa;
- leitura rápida;
- ilustrações de destaque.

A intenção é utilizar cartas com grande área de arte.

---

# 48. Molduras de Cartas

A direção atual é utilizar molduras com bastante espaço visual e arte em destaque.

As cartas não devem depender de placeholders visuais permanentes para texto.

Textos, números e ícones devem poder ser inseridos pelo sistema.

---

# 49. Representante — Direção Visual

A carta de Representante deve possuir:

- arte de destaque;
- Classe no topo;
- Energia quando aplicável;
- nome;
- caixa de texto;
- Moral;
- Popularidade.

Representante não deve apresentar ou possuir Influência.

---

# 50. Estudante — Direção Visual

A carta de Estudante deve possuir:

- Classe;
- Energia;
- nome;
- texto;
- Influência;
- Moral.

A apresentação deve diferenciar claramente Estudantes de Representantes.

---

# 51. Debate — Direção Visual

Debates podem utilizar uma composição com:

- grande área de arte;
- espaço maior para texto;
- elementos visuais que transmitam interação.

Não possuem Influência ou Moral.

---

# 52. Equipamento — Direção Visual

Equipamentos devem possuir identidade visual relacionada a objetos escolares.

Não possuem Influência ou Moral próprios.

---

# 53. Ambiente — Direção Visual

Ambientes utilizam arte horizontal/landscape.

A carta deve dar maior destaque ao cenário.

Existe uma intenção futura de utilizar a arte do Ambiente também visualmente no campo, potencialmente através de um efeito de transição/fade.

---

# 54. Campo de Jogo

A interface deve possuir uma estrutura inspirada em TCGs digitais, mas com identidade própria.

Estrutura conceitual:

```text
OPONENTE

Representante / Informações
Deck / Mão (apenas as costas das cartas) / Descarte / Detenção

[ Estudante ][ Estudante ][ Estudante ]
[ Estudante ][ Estudante ][ Estudante ]

Ambiente

========================
      DEBATE ZONE (aparece quando inicia a Debate Phase)
========================

Ambiente

[ Estudante ][ Estudante ][ Estudante ]
[ Estudante ][ Estudante ][ Estudante ]

Representante / Informações
Deck / Mão / Descarte / Detenção

JOGADOR
```

A Debate Zone deve possuir destaque visual.

---

# 55. Plataforma e Interface

O jogo será desenvolvido para navegador.

A interface deve ser responsiva para:

* desktop;
* mobile.

A prioridade é garantir que:

* cartas sejam legíveis;
* ações sejam claras;
* estado do turno seja evidente;
* Energia seja facilmente identificável;
* Popularidade seja compreensível;
* Debate seja visualmente intuitivo.

---

# 56. Arquitetura Técnica — Diretriz de Design

A lógica do jogo deve ser separada da apresentação.

A arquitetura deve permitir:

```text
Game Rules
    ↓
Game State
    ↓
Actions
    ↓
Events
    ↓
UI
```

A UI não deve ser responsável por decidir se uma ação é válida.

A mesma lógica deve futuramente poder ser utilizada por:

* jogador;
* IA;
* testes;
* servidor multiplayer.

---

# 57. Tecnologia

Stack preferencial:

* React;
* TypeScript;
* Vite;
* HTML/CSS;
* Node.js;
* PostgreSQL;
* WebSocket ou solução equivalente para multiplayer futuro.

O primeiro protótipo deve permanecer o mais simples possível.

---

# 58. IA

A primeira versão do jogo deve permitir partidas contra uma IA básica.

A IA deve utilizar as mesmas regras disponíveis ao jogador.

A IA não deve possuir acesso privilegiado a informações que o jogador não possuiria.

O objetivo inicial é:

> testar e validar o jogo.

Uma IA competitiva avançada é uma etapa posterior.

---

# 59. Multiplayer

Multiplayer 1v1 online é uma meta futura.

Não deve ser prioridade durante a primeira validação do gameplay.

A arquitetura deve evitar dependências que impeçam posteriormente:

* sincronização de estado;
* validação no servidor;
* reconexão;
* partidas online;
* matchmaking.

---

# 60. Estado do Projeto

## DEFINIDO / ESTABELECIDO

* jogo digital de cartas;
* temática escolar/anime;
* plataforma web;
* Energia como recurso;
* máximo de 10 Energia;
* mão inicial de 4;
* mulligan único parcial;
* limite de mão 8;
* deck singleton;
* Representante;
* Estudantes;
* Debates;
* Equipamentos;
* Ambientes;
* máximo de 6 Estudantes;
* máximo de 1 Ambiente;
* Moral;
* Influência;
* Popularidade;
* Destaque;
* Inércia;
* Impulso;
* Provocação;
* Guarda;
* Infiltração;
* Diplomacia;
* Debate Phase antes do combate;
* Réplica / Tréplica / Contrarréplica;
* vitória por Moral do Representante;
* derrota por tentativa de compra em deck vazio;
* quatro raridades;
* cosméticos separados da raridade mecânica;
* monetização sem Pay-to-Win.

---

# 61. DECISÕES PROVISÓRIAS

As seguintes decisões ainda devem ser consideradas sujeitas a testes:

* modelo exato de bloqueadores;
* interação detalhada entre Provocação, Guarda e Infiltração;
* comportamento de substituição quando o campo possui 6 Estudantes;
* interação da substituição com a Debate Phase;
* detalhes de ativação de algumas habilidades;
* custo e balanceamento de Destaques;
* iniciativa exata dentro de determinadas situações de Debate;
* sistema final de coleção;
* distribuição de boosters;
* crafting;
* progressão;
* tamanho final da coleção;
* estrutura final do multiplayer.

---

# 62. PRINCÍPIO DE EVOLUÇÃO DO DESIGN

SCB está em Alpha.

Portanto, uma regra experimental pode ser alterada se os testes demonstrarem que:

* não gera decisões interessantes;
* cria complexidade desnecessária;
* prejudica a clareza;
* cria padrões dominantes;
* reduz a diversidade de decks;
* gera experiências frustrantes;
* cria problemas de balanceamento.

Alterações devem ser registradas no documento.

---

# 63. Regra para IA e Desenvolvimento

A IA que trabalhar no projeto deve:

1. respeitar as decisões estabelecidas neste documento;
2. distinguir regras definitivas de regras provisórias;
3. não inventar mecânicas silenciosamente;
4. não assumir que uma referência de outro TCG deve ser reproduzida;
5. propor mudanças quando identificar problemas;
6. explicar consequências de mudanças de design;
7. manter consistência entre regras, cartas e implementação.

Quando houver conflito entre uma implementação existente e este GDD, o conflito deve ser identificado explicitamente.

---

# 64. Objetivo do Alpha

O objetivo do Alpha é responder:

> **"O SCB é divertido quando suas regras fundamentais são colocadas em prática?"**

A prioridade é validar:

* ritmo das partidas;
* Energia;
* curva de desenvolvimento;
* combate;
* bloqueios;
* Debates;
* Popularidade;
* Representantes;
* interação;
* arquétipos;
* tomada de decisão.

Arte, monetização e infraestrutura online não devem atrasar essa validação.

---

# 65. Objetivo de Longo Prazo

SCB pretende evoluir para um TCG digital completo com:

* múltiplos arquétipos;
* grande conjunto de cartas;
* Representantes distintos;
* partidas PvP;
* IA;
* coleção;
* cosméticos;
* progressão;
* eventos;
* temporadas;
* multiplayer online;
* identidade visual própria.

O projeto deve preservar como princípios:

> **estratégia, identidade, acessibilidade, interação e ausência de Pay-to-Win.**

```