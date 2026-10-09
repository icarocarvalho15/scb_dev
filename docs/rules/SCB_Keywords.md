# School Card Battle — Keywords

**Projeto:** School Card Battle  
**Abreviação:** SCB  
**Documento:** SCB_Keywords.md  
**Versão:** 1.0  
**Status:** Alpha / Prototipagem  

---

## 1. Objetivo

Este documento define as Keywords utilizadas em School Card Battle (SCB), suas funções conceituais e a estrutura de habilidades associada.

As Keywords funcionam como termos padronizados para representar comportamentos, restrições, condições ou efeitos recorrentes do jogo.

Este documento deve servir como referência para:

- Design de cartas;
- Desenvolvimento das regras;
- Implementação do motor de jogo;
- Criação de efeitos e habilidades;
- Balanceamento;
- Desenvolvimento da IA;
- Padronização da linguagem utilizada nas cartas.

As definições apresentadas aqui representam o comportamento conceitual das Keywords. Regras de resolução, prioridade, duração, interação e casos excepcionais devem ser especificadas nas regras gerais do jogo quando necessário.


---

# 2. Keywords Base

| Keyword | Função |
|---|---|
| **Popularidade** | Acúmulo de condições que cada Representante deve alcançar para habilitar sua habilidade de Destaque. |
| **Diplomacia** | Representantes não podem ser atacados no primeiro turno de cada jogador. |
| **Inércia** | Estudantes não podem atacar no turno em que entram no campo. |
| **Impulso** | Permite que Estudantes ataquem no turno em que entram no campo. |
| **Proteção** | Não podem ser alvos de habilidades e/ou Debates. |
| **Provocação** | Devem ser atacados diretamente em vez do Representante. |
| **Guarda** | Podem interceptar ataques direcionados ao Representante. |
| **Inspiração** | Melhorias que podem ser recebidas e/ou concedidas ao entrarem no campo. |
| **Persistência** | A primeira vez que um Estudante seria derrotado, retorna ao campo de batalha com apenas 1 de Moral. |
| **Reconhecimento** | Recebe efeitos enquanto seu Representante possui algum acúmulo de Popularidade. |
| **Rivalidade** | Bônus situacional enquanto enfrenta uma Classe diferente. |
| **Liderança** | Recebe efeitos se compartilhar uma Classe com seu Representante. |
| **Aprendizagem** | Concede efeitos quando não ataca no turno anterior. |
| **Colaboração** | Concede efeitos quando atua junto de Estudantes da mesma Classe. |
| **Infiltração** | Ignora Estudantes com Provocação/Guarda para atacar Representantes diretamente. |
| **Silêncio** | Estudantes não podem atacar e perdem todas as suas habilidades, passivas e/ou ativadas. |
| **Substituição** | Quando um jogador possui 6 Estudantes em campo, caso queira posicionar um novo Estudante, precisa descartar um dos 6 Estudantes. |


---

# 3. Classificação das Keywords

As Keywords podem representar diferentes tipos de comportamento dentro do sistema de regras.

### 3.1 Progressão

Keywords relacionadas ao desenvolvimento de condições ou progressão de um Representante.

- **Popularidade**
- **Reconhecimento**

### 3.2 Restrições

Keywords que limitam ações, alvos ou comportamentos.

- **Diplomacia**
- **Inércia**
- **Proteção**
- **Silêncio**
- **Substituição**

### 3.3 Combate

Keywords relacionadas diretamente à declaração, direcionamento ou resolução de ataques.

- **Impulso**
- **Provocação**
- **Guarda**
- **Infiltração**
- **Rivalidade**

### 3.4 Desenvolvimento de Estudantes

Keywords relacionadas à melhoria ou ao comportamento dos Estudantes.

- **Inspiração**
- **Persistência**
- **Aprendizagem**
- **Colaboração**
- **Liderança**


---

# 4. Descrição das Keywords

## 4.1 Popularidade

**Função:**  
Representa o acúmulo de condições necessárias para que um Representante habilite sua habilidade de **Destaque**.

A Popularidade funciona como um sistema de progressão específico de cada Representante.

Cada Representante possui uma condição própria para acumular Popularidade.

Quando a condição necessária é alcançada, o Representante pode habilitar seu Destaque.

### Conceito

A Popularidade representa o reconhecimento crescente do Representante durante a partida.

Ela não deve ser tratada como uma segunda forma de Energia ou como um recurso genérico para pagamento de custos.

---

## 4.2 Diplomacia

**Função:**  
Impedir ataques direcionados diretamente ao Representante adversário durante o primeiro turno de cada jogador.

A restrição existe apenas durante o primeiro turno daquele jogador.

### Interação com Impulso

Um Estudante com **Impulso** pode atacar no turno em que entra em campo, mas ainda não pode atacar diretamente o Representante adversário durante o primeiro turno daquele jogador.

Após o primeiro turno do jogador, a restrição deixa de existir.

---

## 4.3 Inércia

**Função:**  
Impedir que um Estudante ataque no mesmo turno em que entra em campo.

A Inércia representa a regra padrão de entrada dos Estudantes.

**Impulso** permite que essa restrição seja superada.

---

## 4.4 Impulso

**Função:**  
Permitir que um Estudante ataque no mesmo turno em que entra em campo.

Impulso altera a restrição normalmente estabelecida pela **Inércia**.

O Estudante continua sujeito às demais regras de ataque aplicáveis.

---

## 4.5 Proteção

**Função:**  
Impedir que o portador seja escolhido como alvo de habilidades e/ou Debates.

Proteção está relacionada à interação por meio de efeitos e Debates, e não representa, por si só, imunidade geral a todas as formas de interação do jogo.

Detalhes adicionais de quais efeitos podem ou não afetar uma unidade protegida devem ser definidos pelas regras de resolução de habilidades e Debates.

---

## 4.6 Provocação

**Função:**  
Fazer com que o Estudante seja priorizado como alvo de ataques diretos em vez do Representante.

A Provocação cria uma restrição sobre a escolha do alvo durante o combate.

Sua interação com **Infiltração** é definida pela própria Keyword Infiltração.

---

## 4.7 Guarda

**Função:**  
Estudantes com Guarda não sofrem Inércia de bloqueio e podem interceptar ataques.

Não confunda: qualquer Estudante pode bloquear, Guarda apenas escolhe quando "lutar" (bloquear).

Sua interação com **Infiltração** é definida pela própria Keyword Infiltração.

---

## 4.8 Inspiração

**Função:**  
Representar melhorias que podem ser recebidas e/ou concedidas quando um Estudante entra no campo.

A melhoria pode afetar o próprio Estudante ou outros elementos permitidos pelo efeito.

A forma específica da melhoria deve ser definida pela habilidade da carta.

---

## 4.9 Persistência

**Função:**  
Permitir que um Estudante retorne ao campo de batalha após ser derrotado pela primeira vez.

Quando o Estudante seria derrotado pela primeira vez, ele retorna ao campo de batalha com **1 de Moral**.

A condição de "primeira vez" é específica da ocorrência de derrota daquele Estudante.

---

## 4.10 Reconhecimento

**Função:**  
Conceder efeitos enquanto o Representante associado possuir algum acúmulo de Popularidade.

Reconhecimento cria uma relação entre o progresso do Representante e os efeitos recebidos pelo Estudante.

O efeito concedido é definido pela habilidade da carta.

---

## 4.11 Rivalidade

**Função:**  
Conceder bônus situacionais quando o Estudante enfrenta uma Classe diferente.

A condição está relacionada à diferença entre a Classe do próprio Estudante e a Classe do adversário envolvido na situação.

O bônus específico deve ser definido pela habilidade da carta.

---

## 4.12 Liderança

**Função:**  
Conceder efeitos quando o Estudante compartilha uma Classe com seu Representante.

A condição estabelece uma relação temática e mecânica entre o Representante e os Estudantes de sua mesma Classe.

O efeito concedido deve ser definido pela habilidade da carta.

---

## 4.13 Aprendizagem

**Função:**  
Conceder efeitos quando o Estudante não atacou no turno anterior.

A condição permite recompensar Estudantes que permaneceram sem atacar durante o turno anterior.

O efeito concedido deve ser definido pela habilidade da carta.

---

## 4.14 Colaboração

**Função:**  
Conceder efeitos quando o Estudante atua junto de Estudantes da mesma Classe.

A condição representa a cooperação entre membros de uma mesma Classe.

O efeito concedido deve ser definido pela habilidade da carta.

---

## 4.15 Infiltração

**Função:**  
Permitir que um Estudante ignore Estudantes com **Provocação** ou **Guarda** para atacar diretamente um Representante.

Infiltração permite superar determinadas formas de defesa durante o combate.

### Interações

- Ignora **Provocação**;
- Ignora **Guarda**;
- Permite direcionar o ataque ao Representante quando essas defesas seriam aplicáveis;
- Não altera outras restrições de ataque.
- Não se sobrepõe a **Diplomacia**.

---

## 4.16 Silêncio

**Função:**  
Impedir que um Estudante ataque e fazer com que ele perca todas as suas habilidades.

Enquanto estiver sob Silêncio, o Estudante:

- Não pode atacar;
- Perde suas habilidades passivas;
- Perde suas habilidades ativadas.

Silêncio representa uma interrupção temporária ou permanente das capacidades do Estudante, dependendo da duração definida pelo efeito que aplicou a condição.

---

## 4.17 Substituição

**Função:**  
Permitir o gerenciamento do limite máximo de Estudantes em campo.

Quando um jogador possui **6 Estudantes** em campo e deseja posicionar um novo Estudante, deve descartar um dos 6 Estudantes existentes para liberar espaço.

A Substituição mantém o limite máximo de 6 Estudantes sem impedir que o jogador altere a composição de seu campo.


---

# 5. Estrutura de Habilidades

As habilidades das cartas são classificadas em quatro tipos principais.

| Tipo | Função |
|---|---|
| **Passiva** | Permanece ativa enquanto suas condições forem atendidas. |
| **Ativada** | É acionada manualmente pelo jogador e pode possuir custos específicos. |
| **Desencadeada** | Reage automaticamente à ocorrência de determinados eventos. |
| **Contínua** | Altera ou modifica regras enquanto sua condição estiver ativa. |

---

# 6. Passiva

Uma habilidade **Passiva** permanece ativa enquanto a carta estiver em uma situação que permita sua aplicação.

### Características

- Não depende de ativação manual;
- Não exige uma ação direta do jogador;
- Normalmente permanece válida enquanto sua condição for satisfeita;
- Não possui custo de ativação por padrão.

### Exemplos conceituais

- Um Estudante recebe um bônus enquanto seu Representante possuir Popularidade.
- Um Estudante recebe um efeito enquanto compartilhar uma Classe com seu Representante.
- Um Estudante possui Proteção enquanto estiver em determinada condição.

---

# 7. Ativada

Uma habilidade **Ativada** depende de uma ação deliberada do jogador.

### Características

- Exige uma ativação manual;
- Possui custos específicos quando definidos;
- Pode exigir alvos;
- Está sujeita às regras de legalidade e resolução de ações.

### Estrutura

Uma habilidade ativada pode ser representada conceitualmente por:

> **Custo → Alvo/Condição → Efeito**

O custo específico deve ser definido individualmente pela carta ou habilidade.

---

# 8. Desencadeada

Uma habilidade **Desencadeada** reage automaticamente à ocorrência de um evento.

### Características

- Não exige ativação manual;
- É vinculada a um evento ou condição;
- É executada quando o evento correspondente ocorre;
- Pode possuir condições adicionais.

### Estrutura

Uma habilidade desencadeada pode ser representada conceitualmente por:

> **Evento → Condição → Efeito**

Exemplo conceitual:

> Quando este Estudante entra em campo, conceda uma melhoria a outro Estudante.

---

# 9. Contínua

Uma habilidade **Contínua** modifica uma regra ou condição enquanto estiver ativa.

### Características

- Não depende de uma ativação manual;
- Seu efeito permanece enquanto suas condições forem satisfeitas;
- Pode modificar regras gerais ou o comportamento de determinadas cartas;
- Deve ser reavaliada sempre que o estado relevante do jogo mudar.

As habilidades contínuas devem ser utilizadas com cuidado, pois podem alterar diretamente o funcionamento normal das regras.

---

# 10. Estrutura Oficial de Uso

A estrutura padrão para utilização das habilidades é:

| Sistema | Recomendação |
|---|---|
| **Passiva** | Sem custo. |
| **Ativada** | Com custos específicos. |
| **Desencadeada** | Ativada automaticamente por eventos. |
| **Contínua** | Mantém uma alteração enquanto sua condição estiver válida. |

Os custos e condições não são padronizados globalmente. Cada habilidade deve declarar claramente o que precisa acontecer para que seu efeito seja aplicado.

---

# 11. Relação entre Keyword e Habilidade

Uma Keyword representa um comportamento padronizado do sistema.

Uma carta pode utilizar uma Keyword diretamente ou combiná-la com uma habilidade específica.

Exemplo conceitual:

> **Liderança —** Sempre que este Estudante atacar, conceda +1 de Moral a outro Estudante.

Nesse caso:

- **Liderança** representa a condição/comportamento padronizado;
- A habilidade define o efeito específico da carta;
- O motor de jogo deve interpretar a condição de acordo com as regras da Keyword.

As Keywords não devem ser utilizadas para substituir completamente o texto necessário para explicar um efeito exclusivo de uma carta.

---

# 12. Interações entre Keywords

Quando duas ou mais Keywords interagem, a regra específica de interação deve prevalecer sobre uma interpretação genérica da Keyword.

Exemplos já definidos:

### Inércia + Impulso

**Impulso** permite que o Estudante ataque no mesmo turno em que entra no campo, superando a restrição de **Inércia**.

### Provocação + Infiltração

**Infiltração** permite que o Estudante ignore **Provocação** ao atacar o Representante.

### Guarda + Infiltração

**Infiltração** permite que o Estudante ignore **Guarda** ao atacar o Representante.

### Diplomacia + Impulso

Durante o primeiro turno de cada jogador, **Diplomacia** impede ataques diretos ao Representante adversário.

Portanto, **Impulso não permite ignorar Diplomacia**.

---

# 13. Princípios de Design

As Keywords devem seguir os seguintes princípios:

### Clareza

Cada Keyword deve representar uma função identificável e consistente.

### Reutilização

Keywords devem ser utilizadas para comportamentos que possam aparecer em múltiplas cartas.

### Previsibilidade

Uma mesma Keyword deve possuir o mesmo significado sempre que aparecer no jogo.

### Composição

Keywords podem interagir com habilidades, Classes, Representantes e outras Keywords sem perder seu significado original.

### Legibilidade

O uso de Keywords deve reduzir a quantidade de texto repetitivo nas cartas sem esconder informações necessárias para compreender o efeito.

### Implementação

Cada Keyword deve possuir uma representação clara no motor de regras, permitindo que:

- o jogador possa utilizá-la;
- a IA possa avaliá-la;
- os testes automatizados possam verificá-la;
- o estado do jogo possa registrá-la;
- futuras partidas multiplayer possam reproduzir sua resolução de forma determinística.


---

# 14. Estado Atual

As Keywords deste documento fazem parte da base de design do SCB.

Nem todas possuem, neste momento, sua especificação técnica completa.

Uma Keyword pode possuir sua função conceitual definida enquanto ainda estiver pendente de definição quanto a:

- duração;
- prioridade;
- momento de verificação;
- interação com outras Keywords;
- condições de ativação;
- custos;
- resolução;
- casos extremos;
- representação no motor de regras.

Esses detalhes devem ser definidos antes que uma Keyword seja considerada completamente especificada para implementação definitiva.

```