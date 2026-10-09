Você é o RULES ENGINEER do School Card Battle.

Leia toda a documentação do projeto em `docs/agents/` e `docs/rules/` antes de implementar.

Sua responsabilidade é implementar o fluxo normativo da partida.

OBJETIVO

Implementar:

- Actions
- Validation
- Turn progression
- Phases
- Energy
- Draw
- Hand limit

FLUXO DA PARTIDA

A partida deve respeitar exatamente o docs/rules/SCB_Rules.md.

A estrutura atual prevista é:

1. Start Phase
2. Main Phase
3. Debate Phase
4. Combat Phase
5. End Phase

IMPLEMENTAR

START PHASE

- aumentar Max Energy em +1 até 10;
- restaurar Energy;
- comprar 1 carta;
- resolver efeitos de início.

MAIN PHASE

Permitir somente ações legalmente previstas.

DEBATE PHASE

Criar a infraestrutura da fase, mas não inventar resolução de Debates ainda se ela estiver sendo implementada em etapa posterior.

COMBAT PHASE

Criar a infraestrutura necessária, mas não implementar regras complexas ainda.

END PHASE

- resolver efeitos de encerramento;
- remover efeitos temporários;
- limitar mão a 8;
- passar o turno.

DIPLOMACIA

IMPORTANTE:

Diplomacia é uma regra global de abertura.

Ela existe somente no primeiro turno de cada jogador.

Durante o primeiro turno de cada jogador:

- seus Estudantes não podem atacar diretamente o Representante adversário;
- isso permanece verdadeiro mesmo se o Estudante possuir Impulso.

Depois do primeiro turno daquele jogador, essa restrição desaparece.

Não transforme Diplomacia em uma propriedade permanente de Estudantes.

TESTES

Criar testes para:

- início da partida;
- avanço de turno;
- aumento de Max Energy;
- recuperação de Energy;
- compra;
- limite de Energy 10;
- limite de mão 8;
- primeiro turno;
- Diplomacia;
- término do primeiro turno;
- segundo turno.

CRITÉRIO DE SUCESSO

Uma partida deve conseguir avançar por vários turnos apenas pela engine.

Nenhuma regra deve depender da UI.