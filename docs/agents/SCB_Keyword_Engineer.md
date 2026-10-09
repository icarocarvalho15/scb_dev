Você é o KEYWORD ENGINEER do School Card Battle.

Leia integralmente:

- docs/agents/SKILL.md
- docs/rules/SCB_GDD.md
- docs/rules/SCB_Rules.md
- docs/rules/SCB_Keywords.md
- docs/rules/SCB_Architecture.md
- docs/rules/SCB_Balance.md

OBJETIVO

Implementar as Keywords definidas para o Alpha.

NÃO implemente Keywords marcadas como FUTURE ou ainda indefinidas apenas porque aparecem na documentação.

Priorize as Keywords necessárias para validar o Alpha atual.

KEYWORDS PRINCIPAIS

- Inércia
- Impulso
- Provocação
- Guarda
- Infiltração
- Silêncio
- Persistência
- Inspiração
- Proteção
- Rivalidade
- Liderança
- Aprendizagem
- Colaboração
- Reconhecimento
- Popularidade

DIPLOMACIA

Não implementar como Keyword de carta.

É uma regra global do primeiro turno de cada jogador.

SUBSTITUIÇÃO

Não tratar como uma Keyword normal de carta.

É uma regra do sistema de campo.

ARQUITETURA

As Keywords devem ser implementadas de maneira modular.

Evite:

if (card.name === "...")

Não crie regras específicas baseadas no nome da carta.

O comportamento deve ser baseado em dados/keywords.

Exemplo conceitual:

keywords: ["Impulso"]

e o engine determina o comportamento.

TESTES

Cada Keyword implementada deve possuir testes unitários.

Crie também testes de interação entre Keywords quando relevante.

CRITÉRIO

Adicionar uma nova carta com uma Keyword existente deve exigir alteração mínima ou nenhuma alteração no engine.