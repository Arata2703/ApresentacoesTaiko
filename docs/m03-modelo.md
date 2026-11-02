# M03 - Modelo e operações do MVP

## Entrega

O núcleo da apresentação está em `src/domain/presentation/`, separado de React, DOM, bibliotecas de PDF e armazenamento. As operações recebem uma apresentação e devolvem um novo estado; não modificam o estado recebido. Entradas inválidas produzem erro antes de qualquer mudança.

A tela atual continua usando o mapa da prova M02. O novo núcleo será conectado ao editor a partir da M05. O contrato de arquivo completo, sua validação de entrada e as migrações pertencem à M04; os tipos TypeScript desta etapa não substituem a validação de arquivos externos.

## Dados e referências

| Estrutura      | Conteúdo e relacionamento                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Presentation   | ID, título, cadastro de pessoas, lista de integrantes, mapas, transições, sequência e materiais manuais |
| Person         | ID e nome; homônimos são permitidos e continuam pessoas diferentes                                      |
| rosterIds      | IDs das pessoas incluídas na lista de integrantes da apresentação                                       |
| MusicMap       | ID, título da música, largura/profundidade do palco em metros e instâncias de instrumentos              |
| MapInstrument  | ID da instância, tipo do catálogo, ID da base ou `null`, IDs de tocadores, posição e rotação            |
| TextTransition | ID, nome do tsunagi, instruções textuais, IDs de participantes e indicador de revisão                   |
| SequenceItem   | Tipo `map` ou `transition` e ID da entidade correspondente; a ordem do array define a apresentação      |
| ManualMaterial | ID, nome e quantidade inteira positiva, sem cálculo automático                                          |

IDs são fornecidos pelo chamador e permanecem estáveis ao renomear, mover ou reordenar. As operações rejeitam IDs vazios, com espaços nas extremidades ou já usados por outra entidade da apresentação, incluindo instrumentos em outros mapas. A geração de UUIDs pertence à integração da aplicação.

Os tipos usam propriedades e coleções `readonly`. A imutabilidade das operações também é verificada com estados congelados nos testes. Nomes de apresentação, pessoa, música e material têm de 1 a 80 caracteres após retirar espaços nas extremidades. O nome do tsunagi pode ficar vazio e tem limite de 80 caracteres; o texto de instruções pode conter várias linhas.

## Regras implementadas

### Pessoas

- `addPerson` cadastra a identidade e permite decidir sua inclusão inicial na lista de integrantes.
- `renamePerson` altera somente o nome; instrumentos e transições continuam apontando para o mesmo ID.
- `setRosterMembership` altera a lista sem apagar identidade ou atribuições. Isso mantém os dados necessários aos futuros avisos de participantes fora da lista.
- `removePerson` apaga uma identidade apenas se ela não estiver atribuída a instrumento ou transição. Se estiver em uso, a operação explica que é necessário retirar as atribuições ou apenas removê-la da lista.
- Atribuições aceitam várias pessoas e eliminam IDs repetidos, preservando a ordem. Uma pessoa inexistente é rejeitada. Atribuições vazias são permitidas.

### Catálogo, bases e instrumentos

O catálogo reaproveita os 12 tipos da M02 e define as oito bases acordadas, com IDs próprios e compatibilidade por tipo. Okedo, shime e nagado P/M/G recebem suwaridai por padrão. As variações são explícitas; bases Nagado atendem aos três tamanhos. Também é possível atribuir `null` para instrumento sem base. Uma base incompatível é rejeitada.

As dimensões reais dos instrumentos continuam desconhecidas e são representadas por `null`, sem inventar medidas. A instância do instrumento não representa um equipamento físico identificado para inventário; esse cálculo está fora do MVP.

`addMapInstrument` cria a instância no centro do palco. `updateMapInstrument` altera posição e/ou rotação; `setInstrumentBase` e `assignInstrumentPlayers` tratam suas referências. `removeMapInstrument` remove apenas a instância selecionada.

### Mapas e palco

`addMap`, `renameMap`, `resizeStage` e `removeMap` operam pelo ID. Adicionar um mapa o coloca ao final da sequência; a ordem pode ser alterada depois. Medidas precisam ser positivas e finitas. A posição é o centro do símbolo: x cresce para a direita; y cresce do topo/plateia para o fundo. O centro é limitado ao retângulo de 0 até largura/profundidade. Reduzir o palco traz centros que ficaram de fora para os novos limites.

A rotação é normalizada para o intervalo de 0 até menos de 360 graus. Valores não finitos são rejeitados. Ainda não há limite baseado na dimensão real do instrumento, detecção de sobreposição ou espaço reservado ao tocador.

### Sequência e transições

`reorderSequence` exige uma permutação completa: cada item existente deve aparecer exatamente uma vez. Não é possível introduzir uma referência desconhecida, omitir ou duplicar itens dessa forma.

`transitionMaps` resolve o mapa anterior e o próximo pela posição da transição na sequência. Não armazena cópias nem IDs redundantes dos mapas dentro da transição. Antes da primeira música, o anterior é `null`; após a última, o próximo é `null`. Sem mapas, ambos são `null`. Transições consecutivas são aceitas e usam os mapas mais próximos de cada lado.

Reordenar ou remover mapas preserva as transições e seus textos. Ao mudar algum mapa vizinho, `needsReview` passa para `true`; uma alteração posterior não apaga esse indicador. `reviewTransition` registra que o conteúdo foi revisto. Adicionar um mapa depois da antiga saída também altera seu contexto e a sinaliza.

`addTransition`, `updateTransition`, `assignTransitionParticipants` e `removeTransition` gerenciam o conteúdo textual e a participação de tocadores/apoiadores. Não há mapa próprio, vínculos de instrumentos, contagem de tsunagi ou algoritmo de movimentação nesta etapa. A resolução dos mapas e as operações textuais estão isoladas em `sequence.ts`; a estratégia de tsunagi de releases futuras poderá ser introduzida nessa fronteira, sem acoplar o modelo a uma biblioteca visual. Nenhuma hierarquia Strategy com implementações vazias foi antecipada.

### Materiais

`addMaterial`, `updateMaterial` e `removeMaterial` mantêm itens manuais. Quantidade zero, negativa, fracionária ou não finita é rejeitada. Para tirar um item, use a remoção. Não há consolidação com instrumentos nem contagem automática.

## Verificação

`npm run check` passou com lint, formatação, cobertura e build. A suíte tem 150 testes, incluindo os 82 anteriores e 68 novos. O código de produção medido atingiu 100% em linhas, instruções, funções e ramificações; os limites existentes não foram reduzidos. O arquivo de tipos não contém instruções executáveis.

Os novos testes verificam ciclos de criação/edição/remoção, imutabilidade, homônimos, referências inexistentes, colisões de ID, padrões e compatibilidade de bases, transformação e redimensionamento do palco, materiais inválidos e transições de entrada/meio/saída com reordenação e exclusão de mapas.

Não houve alteração de layout ou interação na tela nesta etapa. O build continua emitindo o aviso conhecido do módulo PDF da M02, que já é carregado sob demanda. Não houve publicação ou validação remota de CI.

## Próximas integrações

- M04: contrato versionado da apresentação, validação de estrutura e referências, migração do arquivo da prova M02 e tratamento seguro de erros.
- M05: conectar um primeiro mapa desse modelo à interface e às saídas de arquivo/PDF.
- M06-M10: conectar cadastro/lista de integrantes, edição, sequência, transições e materiais às telas correspondentes.

Kumi, instrumentos personalizados, ferramentas avançadas, vínculos de tsunagi, avisos automáticos de participação e inventário automático continuam nas releases posteriores.
