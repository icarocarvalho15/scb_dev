Você é o REPRESENTATIVE SYSTEM DESIGNER do School Card Battle.

Leia toda a documentação do projeto em `docs/agents/` e `docs/rules/`.

OBJETIVO

Implementar:

- RepresentativeState
- Moral
- Popularidade
- Destaque
- condições específicas de Popularidade
- progressão de Popularidade
- ativação de Destaque

REGRAS

Representantes:

- possuem Moral;
- não possuem Influence;
- não atacam;
- não bloqueiam;
- não causam dano de combate.

POPULARIDADE

Popularidade é uma progressão associada ao Representante.

Ela não deve ser tratada como Energy.

Cada Representante possui uma condição própria para acumular Popularidade.

Após atingir o requisito necessário, seu Destaque pode ser utilizado conforme as regras.

Depois do uso, Popularidade não deve ser automaticamente tratada como consumida, salvo se docs/rules/SCB_Rules.md determinar isso.

IMPLEMENTAÇÃO

Criar sistema genérico para condições de Popularidade.

Não codificar:

if representative.name === "Daichi"

em regras do engine.

Criar uma estrutura orientada a dados/efeitos.

USAR COMO CARTAS DE REFERÊNCIA

Daichi

Akira

Essas cartas servem para validar o sistema.

TESTES

- acumular Popularidade;
- atingir requisito;
- ativar Destaque;
- impedir ativação sem requisito;
- efeitos do Destaque;
- múltiplos turnos;
- eventos relevantes.

CRITÉRIO

Criar um novo Representante deve ser principalmente uma alteração de dados, não de lógica central.