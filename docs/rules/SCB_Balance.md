# School Card Battle — Balance

**Projeto:** School Card Battle  
**Abreviação:** SCB  
**Documento:** SCB_Balance.md  
**Versão:** 1.0  
**Status:** Alpha / Prototipagem

---

# 1. Objetivo deste Documento

Este documento define os princípios, parâmetros, métricas e processos utilizados para o balanceamento de School Card Battle.

O objetivo é garantir que alterações de:

- custo;
- Influência;
- Moral;
- efeitos;
- Keywords;
- Popularidade;
- Destaque;
- frequência;
- arquétipos;
- curva de Energia;

sejam realizadas de maneira consistente, mensurável e rastreável.

Este documento não substitui:

- `docs/rules/SCB_GDD.md`;
- `docs/rules/SCB_Rules.md`;
- `docs/rules/SCB_Keywords.md`;
- `docs/rules/SCB_Architecture.md`.

Sua função é definir:

> como o poder das cartas e sistemas será avaliado.

---

# 2. Princípio Fundamental de Balanceamento

Uma carta não deve ser considerada balanceada apenas porque:

> possui números semelhantes a outras cartas.

O balanceamento deve considerar:

```text
Custo
+
Estatísticas
+
Efeito
+
Consistência
+
Sinergia
+
Flexibilidade
+
Counterplay
+
Impacto no estado da partida
```

Uma carta aparentemente fraca isoladamente pode ser extremamente poderosa dentro de um arquétipo.

Da mesma forma, uma carta aparentemente forte pode ser necessária para manter um arquétipo funcional.

---

# 3. Filosofia de Balanceamento

SCB deve priorizar:

1. decisões significativas;
2. interação entre jogadores;
3. counterplay;
4. diversidade de decks;
5. identidade dos Representantes;
6. identidade dos Traits;
7. valor das decisões durante a partida;
8. consistência sem eliminar variedade.

O objetivo não é fazer todas as cartas possuírem o mesmo nível de poder.

O objetivo é:

> criar um ambiente em que diferentes estratégias possam competir de maneira saudável.

---

# 4. Princípio de Poder

O poder de uma carta deve ser avaliado considerando:

```text
Valor imediato
+
Valor futuro
+
Flexibilidade
+
Sinergia
+
Pressão
+
Defesa
+
Informação
+
Interação
```

Uma carta que produz pouco valor imediatamente pode ser muito poderosa se:

* possuir alta flexibilidade;
* gerar vantagem futura;
* possuir grande sinergia;
* dificultar respostas do adversário.

---

# 5. Status de Balanceamento

Toda carta ou sistema pode possuir um dos seguintes estados:

### UNTESTED

Ainda não testado.

### EXPERIMENTAL

Está sendo testado e pode sofrer alterações frequentes.

### PROVISIONAL

Possui uma configuração funcional, mas ainda não é definitiva.

### STABLE

Apresenta comportamento consistente em testes.

### LOCKED

Valor considerado suficientemente estabelecido para o estágio atual.

### RETIRED

Configuração ou carta removida do conjunto atual.

---

# 6. Regra de Não Alteração Arbitrária

Nenhum número deve ser alterado simplesmente porque:

> "parece forte".

Antes de alterar uma carta, identificar:

1. qual problema existe;
2. em qual situação ocorre;
3. com que frequência ocorre;
4. qual é a causa;
5. qual alteração pode resolver;
6. qual será o impacto colateral.

---

# 7. Variáveis Fundamentais

As principais variáveis de balanceamento são:

```text
Energia
Custo
Influência
Moral
Popularidade
Efeitos
Keywords
Frequência
Consistência
Flexibilidade
Sinergia
Counterplay
```

---

# 8. Energia

Energia é o principal recurso econômico da partida.

Configuração atual:

```text
Turno 1 = 1 Energia máxima
Turno 2 = 2
Turno 3 = 3
...
Turno 10 = 10
```

A Energia é restaurada no início de cada turno.

O máximo é 10.

---

# 9. Curva de Energia

A distribuição de cartas deve considerar a curva de Energia.

Uma curva saudável deve permitir:

* jogadas relevantes no início;
* desenvolvimento no meio da partida;
* cartas de impacto no final;
* decisões sobre guardar Energia;
* utilização de Debates e habilidades.

Evitar uma curva em que:

```text
Turnos iniciais → pouca ação
Turnos médios → excesso de cartas fortes
Turnos finais → todas as cartas possuem impacto semelhante
```

---

# 10. Custo

O custo de uma carta representa parte importante do seu poder.

Ao avaliar custo, considerar:

```text
Estatísticas
+
Efeito
+
Keyword
+
Tempo de impacto
+
Consistência
+
Sinergia
```

Uma carta de custo menor pode justificar estatísticas inferiores se possuir:

* efeito imediato;
* flexibilidade;
* sinergia;
* utilidade defensiva.

---

# 11. Influência

Influência representa o potencial ofensivo de um Estudante.

Influência deve ser analisada considerando:

* Moral;
* custo;
* Keywords;
* facilidade de atacar;
* capacidade de atingir o Representante;
* capacidade de derrotar outros Estudantes;
* efeitos de entrada;
* buffs.

Influência não deve ser analisada isoladamente.

---

# 12. Moral

Moral representa a resistência de um Estudante.

Moral deve ser analisada considerando:

* Influência;
* custo;
* efeitos;
* capacidade de bloquear;
* Persistência;
* cura ou recuperação futura;
* buffs;
* sinergias.

Alta Moral possui valor defensivo e pode aumentar o valor de efeitos que dependem da permanência do Estudante no campo.

---

# 13. Relação Influência / Moral

Como princípio inicial:

```text
Poder Estatístico ≈ Influência + Moral
```

Essa fórmula não deve ser utilizada como cálculo absoluto.

Ela serve apenas como referência inicial.

Uma carta pode possuir:

```text
Alta Influência + baixa Moral
```

para representar um atacante agressivo.

Ou:

```text
Baixa Influência + alta Moral
```

para representar um defensor.

---

# 14. Estatísticas vs Efeito

Uma carta com efeito poderoso pode possuir estatísticas inferiores.

Uma carta sem efeito relevante pode possuir estatísticas superiores.

Exemplo conceitual:

```text
Carta A
Custo 3
3 Influência
3 Moral
Sem efeito

Carta B
Custo 3
2 Influência
2 Moral
Efeito relevante
```

A Carta B não deve necessariamente possuir os mesmos atributos da Carta A.

O efeito representa parte de seu orçamento de poder.

---

# 15. Orçamento de Poder

Cada carta possui um orçamento implícito de poder.

Esse orçamento pode ser distribuído entre:

```text
Estatísticas
Efeito
Keyword
Flexibilidade
Consistência
Sinergia
```

Exemplo:

```text
Mais estatísticas
→ menos efeito

Mais efeito
→ estatísticas menores

Maior flexibilidade
→ custo potencialmente maior

Alta sinergia
→ poder condicionado
```

Esse modelo serve como ferramenta de análise, não como fórmula matemática obrigatória.

---

# 16. Valor Imediato

Avaliar quanto impacto uma carta gera no momento em que é utilizada.

Exemplos:

* causar dano;
* remover Estudante;
* gerar Energia;
* comprar cartas;
* criar vantagem de campo;
* aplicar buff;
* impedir uma ação.

Quanto maior o valor imediato, maior deve ser a atenção ao custo.

---

# 17. Valor Futuro

Algumas cartas geram pouco impacto imediato, mas podem produzir grande vantagem posteriormente.

Exemplos:

* efeitos recorrentes;
* geração de recursos;
* sinergias;
* Popularidade;
* buffs permanentes;
* geração de cartas.

Cartas com alto valor futuro devem ser avaliadas também pelo risco de permanecerem em campo.

---

# 18. Flexibilidade

Flexibilidade é a capacidade de uma carta ser útil em diferentes situações.

Uma carta que pode:

```text
atacar
defender
remover
gerar valor
```

possui maior flexibilidade do que uma carta que possui apenas uma função.

Flexibilidade deve ser considerada parte do poder da carta.

---

# 19. Counterplay

Toda mecânica poderosa deve possuir formas razoáveis de resposta.

Ao analisar uma carta, perguntar:

```text
Como o adversário pode responder?
```

Possíveis respostas:

* remoção;
* bloqueio;
* Debate;
* Proteção;
* pressão;
* disputa de campo;
* gerenciamento de Energia;
* prevenção;
* mudança de alvo.

Evitar efeitos que eliminem completamente as possibilidades de interação.

---

# 20. Tempo de Impacto

Uma carta pode possuir:

### Impacto imediato

Produz valor ao entrar.

### Impacto condicional

Precisa de determinada situação.

### Impacto recorrente

Produz valor ao longo de vários turnos.

### Impacto tardio

Precisa de preparação.

Quanto mais cedo uma carta produzir valor significativo, maior deve ser o cuidado com seu custo.

---

# 21. Efeitos de Entrada

Efeitos de entrada possuem valor adicional porque podem gerar impacto mesmo se o Estudante for removido imediatamente depois.

Portanto:

```text
Estatísticas
+
Efeito de entrada
```

deve ser avaliado como um pacote.

Uma carta com efeito de entrada extremamente forte não deve necessariamente possuir estatísticas completas pelo mesmo custo.

---

# 22. Permanência no Campo

Cartas que permanecem vivas por vários turnos podem gerar valor repetidamente.

Ao avaliar uma carta, considerar:

```text
Valor ao entrar
+
Valor por turno
+
Valor potencial
```

Uma carta que parece equilibrada no turno em que entra pode se tornar excessivamente eficiente se sobreviver vários turnos.

---

# 23. Keywords

Keywords possuem valor próprio.

O valor de uma Keyword depende de:

* frequência de ativação;
* facilidade de ativação;
* impacto;
* sinergia;
* counterplay.

Keywords não devem receber um "valor fixo" universal.

O valor depende do contexto da carta.

---

# 24. Inércia

Inércia representa uma restrição de tempo.

Ela reduz o valor ofensivo imediato de um Estudante.

Cartas com estatísticas muito altas e Inércia podem compensar parte desse poder por não atacarem imediatamente.

---

# 25. Impulso

Impulso possui valor elevado porque remove a principal restrição de entrada ofensiva.

Seu valor aumenta quando:

* Influência é alta;
* efeitos de entrada são fortes;
* existem buffs;
* atacar o Representante é permitido;
* o Estudante possui alta sinergia.

Impulso não ignora Diplomacia.

---

# 26. Provocação

Provocação possui valor defensivo e de controle.

Seu valor depende de:

* Moral do Estudante;
* número de atacantes adversários;
* importância do Representante;
* capacidade de proteger outras unidades;
* possibilidade de ser removido antes do combate.

---

# 27. Guarda

Guarda protege diretamente o Representante.

Por isso, seu valor pode ser maior do que uma estatística defensiva equivalente.

Ao balancear Guarda, considerar:

```text
Moral
+
Influência
+
capacidade de interceptar
+
frequência de ataques ao Representante
```

---

# 28. Infiltração

Infiltração aumenta o potencial de pressão contra o Representante.

Seu valor aumenta quando o ambiente de jogo possui:

* muitos Estudantes defensivos;
* Provocação;
* Guarda;
* campos largos.

Não deve ignorar Diplomacia.

---

# 29. Proteção

Proteção reduz as opções do adversário.

Por isso, deve possuir cuidado especial de balanceamento.

Quanto mais tipos de interação forem bloqueados, maior deve ser o custo ou a limitação da proteção.

---

# 30. Persistência

Persistência possui valor elevado porque aumenta a quantidade efetiva de recursos que o Estudante representa.

Ao balancear, considerar:

```text
Moral inicial
+
Moral após Persistência
+
efeitos de entrada
+
efeitos de saída
```

Persistência pode gerar interações complexas com:

* buffs;
* equipamentos;
* efeitos de entrada;
* efeitos de saída.

---

# 31. Silêncio

Silêncio possui valor potencialmente elevado porque remove funcionalidades de um Estudante.

Ao balancear, considerar:

```text
habilidades removidas
+
tempo de duração
+
possibilidade de resposta
+
impacto sobre Keywords
```

Silêncio não deve ser avaliado apenas como redução de poder numérico.

---

# 32. Rivalidade

Rivalidade cria poder condicional.

Seu valor deve depender da frequência esperada da condição.

Uma condição muito fácil de cumprir:

```text
≈ efeito quase permanente
```

Uma condição rara:

```text
≈ efeito altamente situacional
```

---

# 33. Liderança

Liderança recompensa sinergia com o Representante.

Seu valor aumenta quando:

* o Representante possui o mesmo Trait;
* o arquétipo possui muitas cartas compatíveis;
* o efeito possui grande impacto.

O poder deve ser avaliado considerando a consistência com que a condição ocorre.

---

# 34. Aprendizagem

Aprendizagem recompensa não atacar no turno anterior.

Isso cria uma decisão entre:

```text
Atacar agora
```

ou:

```text
Preservar condição para obter valor depois.
```

Essa tensão deve ser preservada.

Não balancear Aprendizagem apenas como um bônus gratuito.

---

# 35. Colaboração

Colaboração recompensa múltiplos Estudantes com o mesmo Trait.

O valor depende de:

* facilidade de reunir o grupo;
* quantidade de cartas compatíveis;
* efeito;
* quantidade de Estudantes necessários.

---

# 36. Popularidade e Destaque

Popularidade deve ser tratada como um eixo de progressão do Representante.

O balanceamento deve considerar:

```text
Velocidade de ganho
+
Dificuldade da condição
+
Impacto do Destaque
+
Custo do Destaque
+
Frequência de reutilização
```

Um Destaque extremamente poderoso pode ser equilibrado por:

* requisito alto;
* condição difícil;
* custo de Energia;
* menor frequência de ativação.

---

# 37. Representantes

Representantes são componentes centrais do arquétipo.

Cada Representante deve possuir:

```text
Identidade
+
Condição de Popularidade
+
Destaque
+
Trait
```

O Representante não deve ser simplesmente:

> uma carta mais forte.

Ele deve direcionar decisões de construção e jogo.

---

# 38. Identidade do Representante

Ao criar ou balancear um Representante, perguntar:

```text
Que tipo de deck este Representante quer construir?
```

Exemplos:

```text
Atleta
→ pressão e combate

Conselho
→ Debates e controle

Idol
→ buffs, presença e Popularidade
```

Esses são exemplos de identidade, não limitações obrigatórias.

---

# 39. Condição de Popularidade

A condição deve ser:

* compreensível;
* relacionada à identidade;
* alcançável;
* não excessivamente automática.

Evitar condições que sejam cumpridas simplesmente por jogar normalmente, a menos que isso seja intencional.

---

# 40. Destaque

Destaque deve representar um momento significativo da partida.

Um Destaque muito forte deve exigir uma condição proporcional.

O custo de Energia também deve ser considerado.

Não assumir que todo Destaque precisa possuir o mesmo poder.

---

# 41. Debates

Debates adicionam valor por permitirem interação.

Ao balancear cartas que interagem com Debates, considerar:

```text
Custo da carta
+
Custo da resposta
+
Valor da informação
+
Flexibilidade
+
Timing
```

Uma carta que pode responder a várias situações possui valor adicional.

---

# 42. Valor da Informação

Em um jogo digital competitivo, informação pode possuir valor.

Exemplos:

* revelar cartas;
* prever ações;
* conhecer o topo do Deck;
* forçar escolhas;
* restringir opções.

Efeitos de informação devem ser avaliados mesmo quando não alteram diretamente Moral ou Influência.

---

# 43. Vantagem de Cartas

Uma carta pode gerar:

### Card Advantage

O jogador termina com mais recursos de cartas.

### Card Neutral

A carta troca aproximadamente um recurso por outro.

### Card Disadvantage

A carta exige mais recursos do jogador do que gera.

Não considerar apenas quantidade de cartas.

A qualidade e o timing também importam.

---

# 44. Vantagem de Campo

Field Advantage representa:

* quantidade de Estudantes;
* qualidade dos Estudantes;
* posições;
* efeitos ativos;
* capacidade de atacar;
* capacidade de defender.

O limite de 6 Estudantes cria valor adicional para efeitos que aumentam eficiência do campo.

---

# 45. Vantagem de Tempo

Tempo representa quem está convertendo recursos em pressão primeiro.

Exemplos:

```text
Estudante barato
→ pressão rápida

Estudante caro
→ impacto tardio
```

O balanceamento deve evitar que uma única estratégia domine simultaneamente:

* tempo;
* card advantage;
* field advantage.

---

# 46. Curva de Poder por Custo

Durante o Alpha, registrar estatísticas observadas.

Modelo:

| Custo | Influência média | Moral média | Observação |
| ----- | ---------------: | ----------: | ---------- |
| 1     |              TBD |         TBD | Alpha      |
| 2     |              TBD |         TBD | Alpha      |
| 3     |              TBD |         TBD | Alpha      |
| 4     |              TBD |         TBD | Alpha      |
| 5     |              TBD |         TBD | Alpha      |
| 6     |              TBD |         TBD | Alpha      |
| 7+    |              TBD |         TBD | Alpha      |

Esses valores não devem ser tratados como regras permanentes.

Devem ser derivados dos testes.

---

# 47. Curva de Deck

Cada deck deve possuir uma distribuição de custos.

Exemplo:

```text
Custo 1
Custo 2
Custo 3
Custo 4
Custo 5
Custo 6+
```

A curva deve ser analisada considerando:

* Representante;
* estratégia;
* quantidade de cartas;
* velocidade desejada;
* acesso a Energy;
* necessidade de respostas.

Não existe uma curva universalmente correta.

---

# 48. Arquétipos

Os decks podem ser avaliados por identidade estratégica.

Exemplos iniciais:

### Aggro

Objetivo:

* pressão;
* ataques frequentes;
* baixo/médio custo;
* finalização rápida.

### Midrange

Objetivo:

* eficiência;
* presença de campo;
* troca favorável;
* pressão progressiva.

### Control

Objetivo:

* interação;
* vantagem incremental;
* remoção;
* Debates;
* vitória tardia.

### Combo / Synergy

Objetivo:

* combinação de cartas;
* condições específicas;
* grande retorno quando a sinergia é ativada.

Essas classificações são ferramentas analíticas, não categorias obrigatórias do jogo.

---

# 49. Diversidade de Estratégias

Um ambiente saudável deve permitir diferentes formas de jogar.

Monitorar:

```text
Taxa de vitória por arquétipo
Taxa de presença
Matchups
Taxa de abandono
Duração média
```

Não buscar necessariamente:

```text
50% de win rate para tudo
```

O objetivo é identificar estratégias excessivamente dominantes ou inviáveis.

---

# 50. Win Rate

Win rate é uma métrica importante, mas não deve ser utilizada isoladamente.

Exemplo:

```text
Deck A
52% win rate
```

não significa automaticamente que está balanceado.

É necessário observar:

* quantidade de partidas;
* adversários;
* nível dos jogadores;
* matchup;
* frequência;
* duração;
* taxa de abandono;
* versão das cartas.

---

# 51. Amostra

Não tirar conclusões fortes com poucas partidas.

Como referência inicial:

```text
< 50 partidas
→ sinal fraco

50–200
→ tendência inicial

200–1000
→ evidência relevante

1000+
→ evidência mais confiável
```

Esses valores são referências de análise, não regras absolutas.

---

# 52. Duração das Partidas

Monitorar:

```text
Duração média
Mediana
Percentil 25
Percentil 75
Partidas extremamente longas
Partidas extremamente curtas
```

Uma média isolada pode esconder problemas.

---

# 53. Taxa de Vitória por Turno

Registrar quando a partida termina.

Exemplo:

```text
Turno 3
Turno 4
Turno 5
Turno 6
...
Turno 15+
```

Isso ajuda a identificar:

* estratégias explosivas;
* partidas excessivamente longas;
* condições de vitória muito lentas;
* snowball precoce.

---

# 54. First Player Advantage

Como SCB possui turnos alternados e ambos começam com Energia, monitorar:

```text
Win Rate do primeiro jogador
Win Rate do segundo jogador
```

A Diplomacia deve ser considerada nessa análise.

Se houver vantagem excessiva do primeiro jogador, investigar:

* pressão inicial;
* acesso a cartas;
* combate;
* Energia;
* Popularidade;
* Diplomacia.

Não corrigir automaticamente sem dados.

---

# 55. Snowball

Snowball ocorre quando uma pequena vantagem inicial cresce continuamente.

Sinais:

```text
Jogador na frente
→ mais recursos
→ mais campo
→ mais pressão
→ adversário perde capacidade de resposta
```

Monitorar mecanismos que amplificam esse efeito.

---

# 56. Comeback

Um jogo saudável deve possuir alguma capacidade de recuperação.

Não significa que toda partida precisa permitir comeback.

Significa que:

> estar atrás não deve significar derrota automática.

Ferramentas de comeback podem incluir:

* remoções;
* Debates;
* efeitos defensivos;
* respostas eficientes;
* gestão de campo;
* cartas de maior custo.

---

# 57. Remoção

Remoção eficiente deve ser balanceada pelo:

```text
Custo
+
Timing
+
Flexibilidade
+
Tipo de alvo
+
Counterplay
```

Remoções universais possuem maior valor do que remoções altamente condicionais.

---

# 58. Buffs

Buffs devem considerar:

* duração;
* quantidade de alvos;
* Influência;
* Moral;
* permanência;
* sinergia;
* capacidade de criar letalidade.

Buffs permanentes possuem valor significativamente maior do que buffs temporários equivalentes.

---

# 59. Draw

Compra de cartas possui valor elevado porque aumenta opções.

Ao balancear compra:

considerar:

```text
Quantidade
+
Custo
+
Timing
+
Condição
+
Card Advantage
```

Evitar efeitos de compra muito eficientes em cartas que já possuem estatísticas elevadas.

---

# 60. Geração de Recursos

Efeitos que geram Energia devem ser avaliados com cuidado porque podem quebrar a curva normal.

Uma carta que gera Energia possui potencial para:

```text
acelerar a curva
+
jogar cartas antes do esperado
+
criar vantagem acumulativa
```

---

# 61. Eficiência de Mana

Uma ferramenta analítica possível:

```text
Eficiência =
Valor produzido / Energia gasta
```

Essa métrica é aproximada.

Não deve ser usada como única forma de balanceamento.

Uma carta pode possuir eficiência baixa e ainda ser excelente devido a:

* timing;
* flexibilidade;
* sinergia;
* counterplay.

---

# 62. Sinergia

Sinergia representa valor adicional produzido pela combinação entre cartas.

Exemplo:

```text
Carta A
sozinha = valor 5

Carta B
sozinha = valor 5

A + B
= valor 15
```

Sinergias são desejáveis, mas devem possuir counterplay.

---

# 63. Consistência

Uma estratégia muito poderosa pode ser balanceada naturalmente se sua execução for inconsistente.

Entretanto, não utilizar inconsistência como única ferramenta de balanceamento.

Uma estratégia forte e extremamente consistente possui risco maior de dominar o ambiente.

---

# 64. Singleton

Como SCB utiliza singleton:

> consistência não pode ser analisada da mesma forma que em jogos com múltiplas cópias.

A disponibilidade de cartas deve considerar:

* tamanho do deck;
* compra;
* efeitos de busca;
* geração de cartas;
* Representante;
* sinergias.

Singleton naturalmente reduz repetição, mas não impede combos consistentes se houver muitos efeitos redundantes.

---

# 65. Busca de Cartas

Efeitos de busca possuem valor alto em decks singleton.

Quanto mais específica e eficiente for a busca:

> maior o aumento de consistência do deck.

Ao balancear busca, considerar:

* custo;
* restrições;
* tipo de carta;
* quantidade;
* timing.

---

# 66. Raridade

Raridade não deve determinar poder.

Um card raro pode ser:

* mais complexo;
* mais específico;
* mais chamativo;
* mais interessante visualmente.

Mas não deve existir:

```text
Raridade maior
=
Poder maior
```

---

# 67. Cosméticos

Itens cosméticos não devem alterar balanceamento.

Exemplos:

* skins;
* sleeves;
* playmats;
* avatares;
* efeitos visuais.

Nenhuma versão cosmética deve possuir vantagem mecânica.

---

# 68. Pay-to-Win

O sistema de coleção não deve permitir que gasto financeiro determine vantagem competitiva direta.

Balanceamento não deve ser utilizado para incentivar monetização através de poder.

---

# 69. Power Creep

Novas cartas não devem ser criadas simplesmente para superar cartas antigas.

Evitar:

```text
Carta antiga:
3/3 por 3

Nova carta:
4/4 por 3
+ efeito
```

sem uma justificativa clara.

Power creep deve ser monitorado continuamente.

---

# 70. Outliers

Durante testes, procurar:

### Overperformers

Cartas ou estratégias com desempenho excessivamente alto.

### Underperformers

Cartas ou estratégias com desempenho excessivamente baixo.

### Polarizers

Cartas que criam matchups extremamente favoráveis ou desfavoráveis.

### Enablers

Cartas que parecem normais individualmente, mas habilitam estratégias excessivamente fortes.

---

# 71. Métricas de Carta

Quando houver dados suficientes, registrar:

```text
Pick Rate
Play Rate
Win Rate
Mulligan Rate
Draw Rate
Play Turn
Average Value
Synergy Rate
Removal Rate
Survival Rate
```

Essas métricas são futuras e não precisam existir no primeiro Alpha.

---

# 72. Métricas de Partida

Registrar futuramente:

```text
Duração
Turno da vitória
Primeiro jogador
Segundo jogador
Representante
Deck
Arquétipo
Moral final
Estudantes derrotados
Debates utilizados
Popularidade obtida
Destaques utilizados
```

---

# 73. Métricas de Representante

Para cada Representante:

```text
Win Rate
Popularidade média
Turno médio do Destaque
Quantidade média de Destaques
Taxa de uso do Destaque
```

Isso ajuda a determinar se o Representante está realmente cumprindo sua função.

---

# 74. Métricas de Keyword

Quando houver dados suficientes:

```text
Quantidade de ativações
Valor médio por ativação
Taxa de vitória quando presente
Taxa de sobrevivência
Frequência de condição
```

Não utilizar somente win rate.

---

# 75. Processo de Balanceamento

Sempre seguir:

```text
1. Identificar problema
2. Coletar evidências
3. Formular hipótese
4. Propor alteração
5. Implementar alteração
6. Testar
7. Comparar resultados
8. Registrar conclusão
```

---

# 76. Hipótese de Balanceamento

Toda alteração significativa deve possuir uma hipótese.

Exemplo:

> "O Estudante X possui win rate elevado porque combina estatísticas eficientes com Impulso. Reduzir sua Influência em 1 deve diminuir sua pressão inicial sem remover sua identidade."

A alteração deve ser testada contra essa hipótese.

---

# 77. Alterações Pequenas

Preferir pequenas alterações.

Exemplo:

```text
3 Influência → 2 Influência
```

antes de:

```text
3 Influência → 1 Influência
```

quando não houver evidência para uma alteração maior.

---

# 78. Alterações de Custo

Aumentar custo geralmente:

* atrasa impacto;
* reduz flexibilidade;
* diminui consistência;
* pode alterar o arquétipo.

Reduzir custo geralmente:

* aumenta pressão;
* melhora curva;
* aumenta flexibilidade;
* aumenta frequência de utilização.

Custo deve ser alterado conscientemente.

---

# 79. Alterações de Influência

Reduzir Influência:

* reduz pressão;
* reduz capacidade de troca;
* pode alterar matchups.

Aumentar Influência:

* aumenta pressão;
* acelera vitória;
* melhora combate.

---

# 80. Alterações de Moral

Reduzir Moral:

* aumenta vulnerabilidade;
* reduz permanência;
* reduz valor defensivo.

Aumentar Moral:

* aumenta permanência;
* melhora bloqueio;
* aumenta valor de buffs e efeitos recorrentes.

---

# 81. Alterações de Efeito

Alterar efeito pode ser mais preciso do que alterar estatísticas.

Exemplos:

```text
efeito permanente
→ efeito temporário

todos os Estudantes
→ Estudantes de um Trait

comprar 2
→ comprar 1

qualquer alvo
→ alvo específico
```

Sempre considerar se a alteração preserva a identidade da carta.

---

# 82. Nerf

Um nerf deve tentar preservar a identidade da carta.

Prioridade:

```text
reduzir eficiência
sem destruir função.
```

---

# 83. Buff

Um buff deve tentar corrigir a função da carta.

Evitar aumentar números automaticamente.

Às vezes é melhor:

```text
melhorar condição
```

do que:

```text
aumentar Influência.
```

---

# 84. Rework

Quando uma carta não possui função clara, considerar rework.

Rework significa:

> alterar substancialmente a identidade ou funcionamento.

Reworks devem ser documentados.

---

# 85. Balanceamento por Arquétipo

Não avaliar apenas cartas individualmente.

Uma carta pode ser equilibrada isoladamente e problemática em conjunto.

Avaliar:

```text
Carta
↓
Pacote de cartas
↓
Arquétipo
↓
Matchup
↓
Metagame
```

---

# 86. Matchups

Quando houver dados:

registrar:

| Arquétipo A | Arquétipo B | Win Rate A | Win Rate B |
| ----------- | ----------- | ---------: | ---------: |
| TBD         | TBD         |        TBD |        TBD |

Matchups extremamente polarizados devem ser investigados.

---

# 87. Metagame

O metagame deve ser analisado por:

```text
Popularidade
+
Win Rate
+
Diversidade
+
Matchups
+
Evolução ao longo do tempo
```

Uma estratégia com alta popularidade e win rate moderado pode ser saudável.

Uma estratégia com baixa popularidade e win rate extremamente alto pode indicar um problema de descoberta ou dificuldade de pilotagem.

---

# 88. Diversidade

Não existe uma quantidade fixa obrigatória de arquétipos.

O objetivo é evitar:

```text
um único deck claramente superior
```

e também evitar:

```text
todos os decks sendo funcionalmente iguais.
```

---

# 89. Balanceamento e Skill

Uma estratégia pode possuir win rate alto porque é utilizada por jogadores mais experientes.

Sempre que possível, separar:

```text
Power
```

de:

```text
Player Skill
```

Dados futuros devem considerar nível do jogador.

---

# 90. AI e Balanceamento

A IA não deve ser utilizada como única fonte de balanceamento.

Uma IA ruim pode produzir dados enganosos.

Antes de utilizar resultados da IA para balanceamento:

* validar comportamento;
* verificar decisões;
* verificar se utiliza corretamente o Engine;
* garantir que não possui informações indevidas.

---

# 91. Simulação

No futuro, o Engine poderá permitir simulação automática.

Exemplo:

```text
1000 partidas
Representante A vs Representante B
```

Registrar:

```text
Win Rate
Turno médio
Duração
Popularidade
Destaques
```

Simulação deve complementar testes humanos.

Não substituí-los.

---

# 92. Testes Humanos

Playtests são essenciais para avaliar:

* diversão;
* clareza;
* sensação de poder;
* frustração;
* decisões;
* ritmo;
* agência;
* repetição.

Uma carta pode ser matematicamente equilibrada e ainda assim ser ruim para o jogo.

---

# 93. Fun

Balanceamento não deve reduzir tudo a matemática.

Avaliar também:

```text
É divertido?
É compreensível?
Cria decisões?
Permite resposta?
Tem identidade?
É memorável?
```

---

# 94. Frustração

Monitorar efeitos que causam:

* perda de agência;
* impossibilidade de responder;
* bloqueio prolongado;
* loops;
* vitórias inevitáveis;
* punições excessivas.

Não eliminar automaticamente essas mecânicas.

Mas avaliar cuidadosamente sua frequência.

---

# 95. Complexidade

Cartas mais complexas devem justificar sua complexidade.

Evitar adicionar:

```text
+1 regra
+1 exceção
+1 condição
+1 interação
```

sem necessidade.

Complexidade também possui custo de design.

---

# 96. Curva de Complexidade

O jogo deve introduzir complexidade gradualmente.

Cartas iniciais podem ser:

* simples;
* eficientes;
* fáceis de entender.

Cartas avançadas podem possuir:

* Debates;
* condições;
* sinergias;
* múltiplas etapas.

---

# 97. Balanceamento de Ambientes

Ambientes possuem impacto global.

Ao balancear:

considerar:

```text
Duração
+
Frequência
+
Quantidade de efeitos afetados
+
Benefício próprio
+
Penalidade adversária
```

Ambientes muito universais podem possuir impacto elevado.

---

# 98. Balanceamento de Equipamentos

Equipamentos devem considerar:

```text
Custo
+
Estatísticas concedidas
+
Efeito
+
Permanência
+
Risco de remoção do alvo
```

Equipamentos possuem risco adicional:

> perder valor quando o Estudante equipado sai do campo.

Esse risco pode justificar maior eficiência.

---

# 99. Equipamentos em Representantes

Qualquer regra que permita Equipamentos em Representantes deve ser avaliada separadamente.

Não assumir que um Equipamento destinado a Estudantes possui o mesmo valor quando anexado ao Representante.

---

# 100. Detenção

A zona de Detenção pode futuramente representar uma forma distinta de remoção.

Seu impacto de balanceamento dependerá de:

* possibilidade de retorno;
* interação com cartas;
* permanência;
* frequência.

Não definir valor fixo enquanto as regras da Detenção não estiverem fechadas.

---

# 101. Risco de Combos

Qualquer nova carta deve ser analisada quanto a:

```text
Loops
OTK
Lock
Infinite Value
Infinite Energy
Infinite Draw
Infinite Recursion
```

Antes de ser considerada estável.

---

# 102. Combos

Combos fortes são permitidos quando:

* possuem condições;
* exigem preparação;
* possuem counterplay;
* são compreensíveis;
* não tornam todas as outras estratégias irrelevantes.

---

# 103. Win Condition

O principal objetivo continua sendo:

```text
reduzir a Moral do Representante a 0
```

ou provocar derrota por Deck vazio.

Balanceamento não deve criar condições alternativas de vitória sem decisão explícita de design.

---

# 104. Registro de Alterações

Toda alteração importante deve ser registrada.

Modelo:

```markdown
## [DATA] — Carta / Sistema

### Problema

Descrição.

### Evidência

Dados / playtest / teste.

### Hipótese

Por que o problema acontece.

### Alteração

O que foi alterado.

### Resultado

Resultado após teste.

### Status

PROVISIONAL / STABLE / LOCKED
```

---

# 105. Exemplo de Alteração

```markdown
## Exemplo — Estudante X

### Problema

Win rate acima do esperado em decks agressivos.

### Evidência

300 partidas.
Win rate: 58%.

### Hipótese

A combinação de baixo custo + Impulso + alta Influência gera pressão excessiva.

### Alteração

Influência:
4 → 3

### Resultado

Aguardando novo conjunto de testes.

### Status

PROVISIONAL
```

---

# 106. Não Balancear Isoladamente

Nunca alterar uma carta sem verificar:

```text
Representante
Traits
Keywords
outras cartas do arquétipo
matchups
curva
```

Uma alteração aparentemente pequena pode causar grandes efeitos sistêmicos.

---

# 107. Ordem de Investigação

Quando um problema de balanceamento surgir:

```text
1. Regra
2. Carta
3. Keyword
4. Sinergia
5. Arquétipo
6. Matchup
7. Metagame
```

Não assumir imediatamente que a carta é o problema.

---

# 108. Regra de Preservação da Identidade

Ao balancear:

> preservar o que torna a carta interessante.

Se a carta é um atacante agressivo:

não resolver seu problema transformando-a em um defensor.

Se a carta é uma carta de Debate:

não resolver seu problema removendo completamente sua interação.

---

# 109. Critério de Sucesso

Uma alteração de balanceamento é considerada bem-sucedida quando:

```text
O problema original diminuiu
+
A identidade foi preservada
+
Nenhum novo problema grave foi criado
+
Os testes continuam saudáveis
```

---

# 110. Prioridade de Balanceamento no Alpha

Durante o Alpha, priorizar:

```text
P0
Partida funcional

P1
Regras coerentes

P1
Curva de Energia

P1
Combate

P1
Debate

P2
Representantes

P2
Keywords

P2
Arquétipos

P3
Microbalanceamento de cartas

P3
Raridade

P4
Metagame avançado
```

Não tentar resolver o metagame antes de possuir uma quantidade significativa de partidas.

---

# 111. O que NÃO Fazer no Alpha

Não realizar prematuramente:

* balanceamento baseado em poucas partidas;
* ajustes de cartas por preferência pessoal;
* criação de dezenas de arquétipos;
* power creep;
* cálculos excessivamente complexos;
* otimização para win rate perfeito;
* mudanças constantes sem registrar hipóteses.

---

# 112. Alpha: Objetivo Principal

O Alpha deve responder:

```text
O jogo funciona?
```

Depois:

```text
O jogo é divertido?
```

Depois:

```text
O jogo está balanceado?
```

Essa ordem é importante.

Não adianta balancear profundamente uma mecânica que posteriormente será removida.

---

# 113. Beta: Objetivo Principal

No Beta:

```text
O jogo possui diversidade estratégica?
```

Avaliar:

* arquétipos;
* Representantes;
* matchups;
* cartas;
* curva;
* Keywords;
* consistência.

---

# 114. Release: Objetivo Principal

Antes de uma versão pública estável:

```text
Nenhuma estratégia dominante sem counterplay conhecido
+
Nenhuma estratégia inviável sem justificativa
+
Curva consistente
+
Cartas com função clara
+
Dados suficientes
```

---

# 115. Regra Final

Balanceamento não significa:

> tornar tudo igual.

Balanceamento significa:

> criar um ambiente em que diferentes decisões estratégicas sejam viáveis, significativas e interativas.

SCB deve buscar:

```text
Diversidade
+
Interação
+
Counterplay
+
Identidade
+
Clareza
+
Decisões significativas
```

---

# 116. Estado Atual

Este documento está em:

> **Alpha / Prototipagem**

Grande parte dos valores numéricos ainda deve ser considerada:

> `EXPERIMENTAL` ou `PROVISIONAL`

até que existam dados suficientes de testes.

Nenhum valor numérico presente neste documento deve ser tratado como definitivo sem um status explícito.

---

# 117. Princípio Fundamental

Antes de perguntar:

> "Esta carta é forte demais?"

perguntar:

> "Qual comportamento queremos que esta carta produza?"

Depois:

> "Ela produz esse comportamento de maneira saudável?"

E finalmente:

> "Existe uma resposta razoável para o adversário?"

Essa sequência deve orientar todo o processo de balanceamento do SCB.

```