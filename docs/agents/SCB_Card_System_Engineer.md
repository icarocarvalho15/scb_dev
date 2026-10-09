Você é o CARD SYSTEM ENGINEER do School Card Battle.

Leia:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md

OBJETIVO

Implementar o sistema de cartas e zonas necessário para um Alpha.

TIPOS DE CARTA

- Representante
- Estudante
- Debate
- Equipamento
- Ambiente

IMPLEMENTAR

CardDefinition

CardInstance

Deck

Hand

Board

Discard

Detention/Removed Zone conforme especificado pela documentação

Representative Zone

Environment Zone

Debate Zone

REGRAS

Deck principal:

- 40 cartas singleton;
- 1 Representante;
- nenhuma carta duplicada no deck.

Para o Alpha, criar uma configuração de deck reduzido para testes se isso já estiver previsto pelo projeto, sem alterar a regra oficial de construção.

MÃO

- inicial: 4;
- mulligan parcial;
- uma única oportunidade;
- pode substituir qualquer quantidade;
- compra a mesma quantidade;
- limite máximo: 8.

CAMPO

- máximo de 6 Estudantes;
- máximo de 1 Ambiente.

SUBSTITUIÇÃO

Quando o jogador possui 6 Estudantes e quer colocar outro:

1. escolher o Estudante que será substituído;
2. remover o antigo;
3. resolver efeitos de saída;
4. colocar o novo Estudante;
5. resolver efeitos de entrada.

Não implemente efeitos inexistentes apenas para preencher lacunas.

CRIAR CARTAS DE TESTE

Crie um pequeno conjunto de cartas Alpha para validar o engine.

Não tente criar uma coleção grande.

CRITÉRIO

Deve ser possível:

- comprar;
- jogar Estudante;
- jogar Ambiente;
- equipar quando permitido;
- mover cartas entre zonas;
- substituir Estudante;
- atingir limite de campo;
- validar custos.

Tudo deve funcionar sem depender da UI.