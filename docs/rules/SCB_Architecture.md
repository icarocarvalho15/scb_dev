# School Card Battle — Architecture

**Projeto:** School Card Battle  
**Abreviação:** SCB  
**Documento:** SCB_Architecture.md  
**Versão:** 1.0  
**Status:** Alpha / Prototipagem  

---

## 1. Objetivo

Este documento define a arquitetura técnica de School Card Battle (SCB).

O objetivo é estabelecer uma estrutura que permita:

- implementar as regras do jogo de forma determinística;
- separar regras de jogo da interface;
- permitir partidas contra IA;
- facilitar testes automatizados;
- utilizar os mesmos sistemas para jogador e IA;
- permitir futura implementação multiplayer;
- manter cartas e efeitos orientados a dados;
- reduzir acoplamento entre lógica, apresentação e infraestrutura.

A arquitetura deve acompanhar a evolução do projeto sem exigir reconstrução completa do núcleo do jogo.


---

# 2. Princípios Arquiteturais

## 2.1 Web First

O SCB será desenvolvido inicialmente como uma aplicação web.

A aplicação deve funcionar em:

- navegadores desktop;
- navegadores mobile.

A arquitetura não deve depender de recursos exclusivos de um sistema operacional ou de um game engine proprietário.

---

## 2.2 Game Logic First

As regras do jogo devem existir independentemente da interface gráfica.

O núcleo do jogo deve ser capaz de:

- criar uma partida;
- receber ações;
- validar ações;
- modificar o estado;
- gerar eventos;
- resolver efeitos;
- determinar condições de vitória ou derrota.

A interface apenas apresenta o estado e solicita ações.

A interface não deve ser responsável por decidir se uma ação é válida.

---

## 2.3 Estado como Fonte de Verdade

O estado da partida deve ser a principal fonte de verdade do jogo.

A interface deve representar o estado atual e não manter regras paralelas que possam divergir do motor de jogo.

Exemplo:

A interface pode informar que um botão "Atacar" está indisponível, mas a validação definitiva de que o ataque é ilegal deve ocorrer no núcleo das regras.

---

## 2.4 Data Driven

As cartas devem ser representadas por dados sempre que possível.

Informações como:

- nome;
- tipo;
- custo;
- Classe/Traits;
- Influência;
- Moral;
- Keywords;
- efeitos;
- requisitos;
- raridade;

não devem depender de componentes de interface específicos.

Isso permite adicionar ou modificar cartas sem precisar reconstruir a estrutura da aplicação.

---

## 2.5 Determinismo

Dada uma mesma situação inicial e uma mesma sequência de ações válidas, o motor de jogo deve produzir o mesmo resultado.

Isso é importante para:

- testes;
- reprodução de partidas;
- depuração;
- IA;
- replays futuros;
- multiplayer futuro.

Sempre que possível, aleatoriedade deve ser controlada pelo núcleo do jogo.

---

# 3. Stack Tecnológica

## 3.1 Frontend

Stack inicial:

- React
- TypeScript
- Vite
- HTML
- CSS

O frontend será responsável principalmente por:

- renderização da partida;
- interação do jogador;
- apresentação das cartas;
- apresentação do estado;
- animações e feedback visual;
- menus;
- construção e gerenciamento visual de decks;
- comunicação com o núcleo de jogo ou servidor.

---

## 3.2 Backend

O backend não é necessário para a primeira versão local contra IA.

Para etapas futuras, a arquitetura prevê:

- Node.js;
- PostgreSQL;
- WebSocket ou tecnologia equivalente para comunicação em tempo real.

O backend será utilizado posteriormente para recursos como:

- autenticação;
- persistência;
- coleção;
- decks;
- partidas online;
- matchmaking;
- sincronização;
- histórico;
- serviços relacionados à conta.

---

## 3.3 Persistência

PostgreSQL é a tecnologia prevista para persistência de dados no backend.

O banco não deve ser utilizado como fonte de verdade durante a resolução de uma ação de combate.

Durante uma partida, o estado ativo deve permanecer no contexto do motor de jogo.

O banco será responsável principalmente por persistência e serviços relacionados à aplicação.


---

# 4. Camadas da Aplicação

A arquitetura deve ser organizada conceitualmente nas seguintes camadas:

```text
┌─────────────────────────────────────┐
│               UI                    │
│       React / Components            │
├─────────────────────────────────────┤
│        Application Layer             │
│       Actions / Commands            │
├─────────────────────────────────────┤
│          Game Engine                 │
│   Rules / Validation / Resolution   │
├─────────────────────────────────────┤
│          Game State                  │
│ Cards / Players / Board / Turn      │
├─────────────────────────────────────┤
│        Card Definitions              │
│      Static Game Data               │
└─────────────────────────────────────┘
````

Infraestrutura futura:

```text
┌─────────────────────────────────────┐
│          Backend / Services          │
├─────────────────────────────────────┤
│        Persistence / PostgreSQL      │
├─────────────────────────────────────┤
│       Multiplayer / WebSocket        │
└─────────────────────────────────────┘
```

---

# 5. Game State

`GameState` representa o estado completo de uma partida.

Ele deve conter informações necessárias para reproduzir a situação atual do jogo.

Conceitualmente:

```ts
interface GameState {
  turn: number;
  activePlayerId: PlayerId;
  phase: GamePhase;

  players: PlayerState[];

  board: BoardState;

  stack: GameAction[];

  winner?: PlayerId;
  status: GameStatus;
}
```

A estrutura definitiva deve evoluir conforme as regras forem implementadas.

---

# 6. Player State

O estado de cada jogador deve conter informações específicas da partida.

Conceitualmente:

```ts
interface PlayerState {
  id: PlayerId;

  representative: RepresentativeState;

  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  detention: CardInstance[];

  energy: number;
  maxEnergy: number;

  environment?: CardInstance;

  students: CardInstance[];
}
```

Informações adicionais podem ser incluídas conforme novas regras forem implementadas.

---

# 7. Card Definition

Uma carta deve possuir uma definição estática que descreva suas características.

Conceitualmente:

```ts
interface CardDefinition {
  cardId: string;
  name: string;

  type: CardType;

  cost: number;

  traits: Trait[];

  keywords: Keyword[];

  influence?: number;
  morale?: number;
  maxMorale?: number;

  effects?: CardEffect[];
}
```

`CardDefinition` representa o que a carta **é**.

Ela não deve armazenar informações que mudam durante uma partida.

---

# 8. Card Instance

Uma `CardInstance` representa uma cópia específica de uma carta dentro de uma partida.

Ela deve separar características permanentes da carta de seu estado atual.

Conceitualmente:

```ts
interface CardInstance {
  instanceId: string;
  definitionId: string;

  ownerId: PlayerId;

  zone: CardZone;

  currentInfluence?: number;
  currentMorale?: number;

  statuses: Status[];

  temporaryEffects: EffectState[];
}
```

Essa separação é importante porque duas cópias da mesma carta podem possuir estados diferentes durante a partida.

Exemplo:

```text
CardDefinition
    │
    ├── Daichi
    │
    └── características permanentes

CardInstance
    │
    ├── cópia A
    │   └── Moral atual: 7
    │
    └── cópia B
        └── Moral atual: 3
```

---

# 9. Representante

Representantes possuem características próprias e não devem ser tratados simplesmente como Estudantes.

Conceitualmente:

```ts
interface RepresentativeState {
  definitionId: string;

  ownerId: PlayerId;

  currentMorale: number;
  maxMorale: number;

  popularity: number;

  highlightAvailable: boolean;
}
```

O Representante deve possuir seu próprio sistema de:

* Moral;
* Popularidade;
* Destaque;
* condições de progressão.

Representantes não possuem Influência.

---

# 10. Board State

O campo deve representar as zonas e posições relevantes da partida.

Conceitualmente:

```ts
interface BoardState {
  playerBoards: PlayerBoardState[];
}
```

Cada lado pode conter:

```ts
interface PlayerBoardState {
  students: StudentState[];

  environment?: EnvironmentState;
}
```

O limite atual é:

```text
Máximo de 6 Estudantes por jogador.
Máximo de 1 Ambiente por jogador.
```

A regra de **Substituição** deve ser processada pelo motor de regras quando o jogador tentar posicionar um novo Estudante com o campo cheio.

---

# 11. Zones

As zonas do jogo devem ser representadas explicitamente.

Zonas principais:

* Deck;
* Mão;
* Campo;
* Descarte;
* Detenção;
* Ambiente;
* Zona de Debate.

A implementação pode utilizar estruturas diferentes das representações visuais, desde que o estado consiga determinar inequivocamente onde cada carta se encontra.

---

# 12. Game Phase

O jogo possui fases distintas.

```ts
enum GamePhase {
  START,
  MAIN,
  DEBATE,
  COMBAT,
  END
}
```

Fluxo:

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
  ↓
START
```

A implementação deve impedir ações que não sejam permitidas na fase atual.

---

# 13. Actions

As ações representam intenções do jogador.

Exemplos:

```ts
type GameAction =
  | PlayCardAction
  | AttackAction
  | BlockAction
  | ActivateAbilityAction
  | StartDebateAction
  | EndPhaseAction;
```

Exemplo:

```ts
interface PlayCardAction {
  type: "PLAY_CARD";

  playerId: PlayerId;
  cardInstanceId: string;
}
```

Uma ação representa uma solicitação.

Ela não deve alterar diretamente o estado.

---

# 14. Action Validation

Toda ação deve passar por validação antes de modificar o estado.

Fluxo:

```text
Player / AI
     │
     ▼
  Action
     │
     ▼
Validation
     │
 ┌───┴────┐
 │        │
Válida  Inválida
 │        │
 ▼        ▼
Resolve   Error
 │
 ▼
GameState
```

Exemplos de validação:

* jogador correto;
* fase correta;
* carta pertencente ao jogador;
* custo disponível;
* alvo válido;
* limite de campo;
* condição de Keyword;
* condição de habilidade;
* ação permitida naquele momento.

---

# 15. Game Engine

O Game Engine é responsável por aplicar as regras do jogo.

Conceitualmente:

```ts
function applyAction(
  state: GameState,
  action: GameAction
): GameState
```

O fluxo esperado é:

```text
GameState + Action
        │
        ▼
   Validate Action
        │
        ▼
   Resolve Action
        │
        ▼
     Events
        │
        ▼
   Resolve Effects
        │
        ▼
    New GameState
```

O Game Engine deve ser independente de React.

---

# 16. Rules

As regras devem ser implementadas em módulos especializados sempre que isso melhorar a manutenção.

Exemplos:

```text
rules/
├── turn.ts
├── energy.ts
├── combat.ts
├── debate.ts
├── cards.ts
├── students.ts
├── representatives.ts
├── keywords.ts
├── effects.ts
└── victory.ts
```

A organização final pode mudar conforme o código evoluir.

O princípio principal é evitar um único arquivo responsável por toda a lógica do jogo.

---

# 17. Keywords Engine

As Keywords devem possuir comportamento reconhecível pelo Game Engine.

Exemplo conceitual:

```ts
enum Keyword {
  IMPULSO = "Impulso",
  INERCIA = "Inércia",
  PROVOCACAO = "Provocação",
  GUARDA = "Guarda",
  INFILTRACAO = "Infiltração",
  PROTECAO = "Proteção",
  INSPIRACAO = "Inspiração",
  PERSISTENCIA = "Persistência",
  RECONHECIMENTO = "Reconhecimento",
  RIVALIDADE = "Rivalidade",
  LIDERANCA = "Liderança",
  APRENDIZAGEM = "Aprendizagem",
  COLABORACAO = "Colaboração",
  SILENCIO = "Silêncio"
}
```

Entretanto, nem toda regra conceitualmente chamada de Keyword precisa necessariamente ser armazenada como uma Keyword de carta.

Por exemplo:

* Diplomacia é uma regra de abertura da partida;
* Popularidade faz parte do sistema do Representante;
* Substituição está relacionada ao limite de campo.

A implementação deve representar cada conceito de acordo com sua função real no motor.

---

# 18. Effects

Efeitos representam modificações produzidas por cartas e habilidades.

Conceitualmente:

```ts
interface Effect {
  type: EffectType;

  sourceId: CardInstanceId;

  targetIds?: CardInstanceId[];

  parameters?: Record<string, unknown>;
}
```

Exemplos conceituais:

```text
Modificar Influência
Modificar Moral
Conceder Keyword
Remover Keyword
Aplicar Silêncio
Comprar carta
Restaurar Energia
Criar Popularidade
Aplicar efeito temporário
```

A lista definitiva de tipos de efeito deve crescer conforme as cartas forem implementadas.

---

# 19. Events

Eventos representam acontecimentos ocorridos durante a partida.

Exemplos:

```text
CardPlayed
StudentEntered
StudentAttacked
StudentDefeated
DebateStarted
DebateResolved
TurnStarted
TurnEnded
RepresentativeDamaged
PopularityGained
HighlightActivated
```

Eventos permitem que habilidades desencadeadas reajam ao que acontece no jogo sem que cada regra precise conhecer todas as outras regras.

---

# 20. Event Flow

Um fluxo conceitual de resolução:

```text
Ação
 ↓
Validação
 ↓
Resolução
 ↓
Evento
 ↓
Habilidades desencadeadas
 ↓
Efeitos
 ↓
Novos eventos
 ↓
Estado final
```

Esse sistema deve ser implementado de forma controlada para evitar loops infinitos ou efeitos impossíveis de resolver.

---

# 21. Temporary Effects

Efeitos temporários devem possuir uma duração explícita.

Exemplos de duração:

```ts
enum EffectDuration {
  THIS_TURN,
  NEXT_TURN,
  UNTIL_END_OF_TURN,
  UNTIL_START_OF_TURN,
  PERMANENT
}
```

A lista final de durações deve ser definida conforme as cartas exigirem.

O motor deve remover automaticamente efeitos expirados no momento apropriado.

---

# 22. Status

Condições temporárias ou persistentes de uma carta podem ser representadas por Status.

Exemplos conceituais:

```text
Silêncio
Proteção
Impulso usado
Persistência disponível
Bônus temporário
Debuff temporário
```

Status devem ser distintos das características permanentes da carta.

---

# 23. Combat System

O sistema de combate deve ser independente da interface.

Fluxo conceitual:

```text
Declare Attackers
      ↓
Validate Attacks
      ↓
Declare Blockers
      ↓
Validate Blocks
      ↓
Resolve Combat
      ↓
Apply Damage
      ↓
Check Defeat
      ↓
Resolve Combat Events
```

O modelo atual de combate é considerado **provisório** e pode evoluir durante o Alpha.

A implementação não deve dificultar alterações futuras no modelo de combate.

---

# 24. Debate System

O Debate possui seu próprio fluxo de resolução.

Modelo atual:

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

O sistema deve possuir uma estrutura capaz de representar:

* ação inicial;
* respostas;
* ordem das ações;
* limite de interações;
* efeitos;
* resolução.

Conceitualmente:

```ts
interface DebateState {
  actions: GameAction[];

  currentStep: number;

  active: boolean;
}
```

O modelo exato poderá evoluir conforme o sistema de Debates for implementado.

---

# 25. AI

A IA deve utilizar o mesmo Game Engine utilizado pelo jogador.

A IA não deve possuir uma implementação paralela das regras.

Fluxo:

```text
GameState
    │
    ▼
AI Decision System
    │
    ▼
GameAction
    │
    ▼
Game Engine
    │
    ▼
New GameState
```

A IA deve decidir **qual ação executar**, enquanto o Game Engine determina se a ação é válida e qual será seu resultado.

---

# 26. AI — Primeira Versão

A primeira versão terá como objetivo uma IA básica para partidas locais.

A IA inicialmente poderá utilizar critérios simples, como:

* ações legais disponíveis;
* custo de Energia;
* presença de ameaças;
* valor de Estudantes;
* possibilidade de ataque;
* proteção do Representante;
* utilização de Destaque;
* vantagem de campo.

A IA deve ser substituível futuramente por sistemas mais sofisticados sem alterar o Game Engine.

---

# 27. UI Layer

React será responsável pela apresentação do estado do jogo.

Exemplos de componentes:

```text
GameBoard
├── OpponentArea
├── OpponentRepresentative
├── OpponentStudents
├── OpponentEnvironment
├── DebateZone
├── PlayerEnvironment
├── PlayerStudents
├── PlayerRepresentative
├── PlayerHand
└── GameControls
```

Os componentes devem:

* receber estado;
* apresentar informações;
* emitir ações do jogador.

Eles não devem implementar regras de jogo complexas.

---

# 28. UI e Game Engine

A comunicação entre UI e Game Engine deve seguir um fluxo previsível:

```text
UI
 │
 │ Action
 ▼
Game Engine
 │
 │ New State
 ▼
UI
```

Exemplo:

```ts
dispatch({
  type: "PLAY_CARD",
  playerId,
  cardInstanceId
});
```

O resultado deve ser produzido pelo Game Engine.

A UI então renderiza o novo estado.

---

# 29. Separação entre Estado e Apresentação

A interface pode possuir estados exclusivamente visuais.

Exemplos:

```text
selectedCard
selectedTarget
hoveredCard
animationState
dragState
modalState
```

Esses estados não devem ser confundidos com o `GameState`.

### GameState

Representa o estado real da partida.

### UI State

Representa apenas o estado da interface.

Essa separação evita que uma animação ou interação visual altere diretamente as regras do jogo.

---

# 30. Card Data

As cartas devem ser armazenadas de forma orientada a dados.

Estrutura conceitual:

```text
cards/
├── representatives/
├── students/
├── debates/
├── equipment/
└── environments/
```

Cada carta deve possuir um identificador único.

Exemplo:

```json
{
  "cardId": "student_velocista_apressado",
  "name": "Velocista Apressado",
  "type": "Estudante",
  "cost": 2,
  "traits": ["Atleta"],
  "keywords": ["Impulso"],
  "influence": 2,
  "morale": 2
}
```

O formato definitivo pode evoluir.

---

# 31. Identidade de Cartas

É importante separar:

```text
CardDefinition
```

de:

```text
CardInstance
```

Uma definição representa a carta.

Uma instância representa uma cópia específica daquela carta em uma partida.

Essa separação é necessária para suportar:

* múltiplas cópias em formatos diferentes;
* singleton;
* estados individuais;
* efeitos temporários;
* histórico;
* futuras coleções;
* versões cosméticas.

---

# 32. Singleton

O formato principal do SCB utiliza uma filosofia de deck Singleton.

A arquitetura não deve assumir que todas as cartas possuem múltiplas cópias.

Deck validation deve ser um sistema independente:

```ts
validateDeck(deck)
```

Responsabilidades:

* quantidade de cartas;
* Representante;
* duplicatas;
* cartas permitidas;
* regras de Classe/Traits;
* formato da partida.

As regras exatas do deck devem permanecer no sistema de regras e não na interface.

---

# 33. Match Lifecycle

Uma partida deve seguir um ciclo previsível:

```text
Create Match
    ↓
Build Initial State
    ↓
Shuffle Decks
    ↓
Draw Initial Hands
    ↓
Mulligan
    ↓
Start Match
    ↓
Turns
    ↓
Victory Condition
    ↓
Match End
```

O ciclo deve ser reproduzível para testes.

---

# 34. Randomness

Operações aleatórias devem ser controláveis.

Exemplos:

* embaralhamento;
* compra;
* efeitos aleatórios;
* seleção aleatória;
* geração de resultados aleatórios.

Para testes, o sistema deve permitir o uso de uma fonte de aleatoriedade controlada ou uma seed.

Exemplo conceitual:

```ts
const rng = createRng(seed);
```

Isso permite reproduzir situações específicas durante desenvolvimento e testes.

---

# 35. Error Handling

Ações inválidas devem produzir erros estruturados.

Exemplo:

```ts
interface ActionError {
  code: string;
  message: string;
}
```

Exemplos conceituais:

```text
NOT_ENOUGH_ENERGY
INVALID_TARGET
INVALID_PHASE
CARD_NOT_IN_HAND
BOARD_FULL
INVALID_ATTACK
ABILITY_NOT_AVAILABLE
```

A UI pode transformar esses códigos em mensagens adequadas para o jogador.

O Game Engine não deve depender do texto apresentado pela interface.

---

# 36. Testing

O Game Engine deve ser testável sem necessidade de renderizar a interface.

Os testes devem verificar:

### Regras

* Energia;
* turnos;
* compra;
* limite de mão;
* limite de Estudantes;
* Ambiente;
* combate;
* Debates;
* Popularidade;
* Destaque;
* vitória/derrota.

### Keywords

* Impulso;
* Inércia;
* Provocação;
* Guarda;
* Infiltração;
* demais Keywords conforme forem implementadas.

### Ações

* ações válidas;
* ações inválidas;
* custos;
* alvos;
* fases.

---

# 37. Testes Determinísticos

Sempre que possível, testes devem possuir:

```text
Estado inicial conhecido
        +
Ações conhecidas
        =
Estado esperado
```

Exemplo conceitual:

```ts
const initialState = createTestState();

const state = applyAction(initialState, {
  type: "PLAY_CARD",
  playerId: "player1",
  cardInstanceId: "student_01"
});

expect(state.players[0].energy).toBe(3);
```

A estrutura definitiva dos testes deve acompanhar a implementação do motor.

---

# 38. Multiplayer — Futuro

O multiplayer não faz parte da primeira versão.

Entretanto, a arquitetura deve evitar decisões que inviabilizem sua implementação futura.

Modelo previsto:

```text
Client A
   │
   ▼
Server
   │
   ├── Game Engine
   │
   ├── Match State
   │
   └── Validation
   │
   ▼
Client B
```

O servidor deverá ser a autoridade sobre o estado da partida.

Clientes não devem possuir autoridade para determinar unilateralmente resultados de ações.

---

# 39. Multiplayer e Autoridade

Quando o multiplayer for implementado:

```text
Client
  │
  │ Action
  ▼
Server
  │
  ├── Validate
  ├── Resolve
  └── Update State
  │
  ▼
Clients
```

Isso reduz riscos de:

* estados divergentes;
* manipulação do cliente;
* resultados diferentes entre jogadores;
* inconsistências de partida.

---

# 40. Persistência — Futuro

A persistência deverá ser separada da lógica principal da partida.

O sistema poderá armazenar posteriormente:

* contas;
* coleção;
* decks;
* cosméticos;
* progresso;
* histórico;
* partidas;
* configurações.

O Game Engine não deve depender diretamente de PostgreSQL.

A comunicação deve ocorrer por meio de uma camada de serviço.

---

# 41. Estrutura de Projeto

Uma estrutura inicial possível:

```text
src/
├── app/
│
├── components/
│
├── game/
│   ├── engine/
│   ├── rules/
│   ├── actions/
│   ├── events/
│   ├── effects/
│   ├── keywords/
│   ├── combat/
│   ├── debate/
│   ├── ai/
│   └── state/
│
├── cards/
│   ├── definitions/
│   ├── representatives/
│   ├── students/
│   ├── debates/
│   ├── equipment/
│   └── environments/
│
├── data/
│
├── services/
│
├── tests/
│
└── main.tsx
```

Essa estrutura é inicial e pode ser reorganizada conforme o projeto crescer.

O princípio mais importante é manter o núcleo de regras separado da apresentação.

---

# 42. Dependências entre Camadas

A direção preferencial das dependências é:

```text
UI
 ↓
Application
 ↓
Game Engine
 ↓
Game Rules / State
 ↓
Card Definitions
```

O fluxo inverso deve ser evitado.

Por exemplo:

```text
Game Engine
   X
   ↓
React Component
```

O Game Engine não deve importar componentes React.

Da mesma forma:

```text
Game Rules
   X
   ↓
CSS / DOM
```

As regras não devem depender da apresentação.

---

# 43. Regra de Ouro da Arquitetura

O princípio central da arquitetura do SCB é:

> **A interface apresenta o jogo. O Game Engine executa o jogo.**

A UI não deve decidir:

* se uma carta pode ser jogada;
* se um ataque é válido;
* se um alvo é válido;
* se uma habilidade pode ser ativada;
* se um Estudante pode atacar;
* se um efeito deve ser aplicado;
* quem venceu a partida.

Essas decisões pertencem ao núcleo de regras.

---

# 44. Evolução da Arquitetura

A arquitetura deve permitir evolução incremental.

Ordem prevista:

```text
Fase 1
Web
+
Game Engine
+
Partida Local
+
IA Básica

        ↓

Fase 2
UI/UX Refinada
+
Mais Cartas
+
Balanceamento
+
Testes

        ↓

Fase 3
Persistência
+
Conta
+
Coleção
+
Deck Builder

        ↓

Fase 4
Backend
+
Servidor de Partidas
+
WebSocket

        ↓

Fase 5
Multiplayer
+
Matchmaking
+
Histórico
+
Sistemas Online
```

Essa ordem não é necessariamente definitiva, mas representa a direção técnica atual do projeto.

---

# 45. Status Arquitetural

As decisões deste documento devem ser interpretadas da seguinte forma:

### LOCKED

Decisões que representam a direção técnica estabelecida.

* Aplicação web;
* React;
* TypeScript;
* Vite;
* Game Engine separado da UI;
* Estado da partida como fonte de verdade;
* arquitetura orientada a dados para cartas;
* IA utilizando o mesmo motor de regras;
* desenvolvimento inicial local contra IA.

### PROVISIONAL

Decisões sujeitas a ajustes durante o desenvolvimento.

* estrutura exata dos diretórios;
* formato definitivo de `GameState`;
* formato definitivo de `CardDefinition`;
* sistema de eventos;
* sistema de efeitos;
* estrutura interna do Debate;
* estrutura interna do combate.

### FUTURE

Itens previstos para etapas posteriores.

* Node.js;
* PostgreSQL;
* WebSocket;
* persistência online;
* contas;
* coleção online;
* multiplayer;
* matchmaking;
* histórico de partidas.

---

# 46. Regra de Evolução

Alterações na arquitetura devem preservar, sempre que possível:

1. separação entre regras e interface;
2. determinismo do Game Engine;
3. reutilização das regras pela IA;
4. estrutura orientada a dados;
5. testabilidade;
6. possibilidade de evolução para multiplayer.

Uma decisão técnica nova não deve ser adotada apenas por conveniência local se criar dependência que dificulte essas características.

Quando uma mudança arquitetural for necessária, ela deve ser registrada neste documento.

```