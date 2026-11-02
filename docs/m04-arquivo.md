# M04 - Arquivo editável versionado

## Entrega e uso atual

A M04 define o contrato de arquivo da apresentação completa e suas funções de importação/exportação em `src/integrations/presentationFile/`. Para utilizar esse formato pelos controles da aplicação, falta a integração da M05. O botão atual de arquivo ainda pertence à prova de um mapa da M02.

Não foram adicionados controles para criar mapas, ordenar músicas ou editar transições nesta etapa. Essas telas seguem o planejamento do MVP. Também não houve alteração no PDF.

## Contrato versão 1

O arquivo é JSON UTF-8 com esta identificação externa:

```json
{
  "format": "taiko-presentation",
  "version": 1,
  "presentation": {}
}
```

O objeto vazio acima apenas indica onde ficam os dados; não é uma apresentação válida. Consulte o [exemplo completo validado pelos testes](../examples/presentation-v1.json).

O campo `presentation` contém todos os campos da [M03](m03-modelo.md): ID, título, cadastro de pessoas, lista de integrantes, mapas/instrumentos/bases, sequência, transições com participação e revisão, e materiais manuais. Coleções vazias são permitidas; campos obrigatórios não são preenchidos implicitamente. Medidas são em metros e rotação em graus.

O catálogo é referenciado por identificadores do MVP. Objetos React, DOM, canvas, URLs temporárias e estado de seleção não fazem parte do contrato. O validador constrói objetos novos com os campos conhecidos; propriedades extras são ignoradas e não são reexportadas. Extensões que precisem ser preservadas devem ganhar uma versão de contrato apropriada, em vez de depender de campos desconhecidos.

## API e segurança da abertura

- `serializePresentation(presentation)` valida estrutura e referências, monta o envelope versão 1 e devolve o texto JSON padronizado. Um estado inválido lança erro, sem produzir backup inválido.
- `importPresentation(source)` recebe texto e devolve um resultado discriminado. Não recebe o estado do editor, não salva em armazenamento e não aplica a importação na tela.

| Resultado                               | Significado                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `status: valid`                         | Candidato validado, com `presentation`, indicador `migrated` e lista de `warnings`                |
| `status: unsupported-version`           | Formato reconhecido, mas versão ainda não suportada; sem tentar adivinhar ou converter o conteúdo |
| `status: error`, `code: invalid-json`   | Texto que não pode ser analisado como JSON                                                        |
| `status: error`, `code: unknown-format` | Identificação de formato desconhecida                                                             |
| `status: error`, `code: invalid-data`   | Estrutura, campos ou referências inválidos                                                        |
| `status: error`, `code: too-large`      | Arquivo ou sua representação padronizada ultrapassa o limite                                      |

Versões ausentes, fracionárias, negativas, zero ou de tipo incorreto são dados inválidos. Uma versão inteira positiva desconhecida tem resultado próprio de incompatibilidade. As versões dos formatos `taiko-map` e `taiko-presentation` são verificadas separadamente, permitindo evoluir o novo contrato sem alterar implicitamente o suporte ao legado.

A integração da M05 deverá apresentar erros/avisos, permitir cancelar e pedir confirmação antes de substituir o projeto aberto. Somente um resultado `valid` pode ser oferecido para essa confirmação. Validar um arquivo não equivale a abri-lo no editor.

## Validações

- Tipos corretos de objetos, listas, textos, números finitos e indicador booleano de revisão.
- IDs não vazios, sem espaços nas extremidades e únicos entre todas as entidades da apresentação, incluindo instrumentos de mapas distintos.
- Nomes conforme os limites da M03, catálogo conhecido e base compatível com o instrumento; `null` representa ausência de base.
- Palco com medidas positivas, centro do instrumento dentro do palco e rotação no intervalo de 0 até menos de 360 graus. Valores inválidos são recusados, sem reposicionar ou arredondar dados durante a abertura.
- Pessoas referenciadas por integrantes, instrumentos ou transições precisam existir no cadastro. Uma pessoa fora da lista de integrantes é válida estruturalmente; os avisos de participação continuam fora do MVP.
- Referências de pessoas sem repetições dentro da mesma lista. Cada mapa e transição precisa aparecer exatamente uma vez na sequência, com seu tipo correto.
- Quantidade inteira positiva para materiais manuais.

O limite é de **5.000.000 bytes UTF-8**, tanto para o texto recebido quanto para a representação padronizada que será reexportada. Isso evita aceitar um arquivo compacto que não possa ser salvo novamente. O limite também é verificado ao exportar. Não há a restrição antiga de 500 instrumentos para o novo formato; todos os dados precisam caber no limite total.

## Conversão de arquivos da M02

`taiko-map`, versão 1, é reconhecido como legado e convertido explicitamente para uma apresentação com um mapa. A validação original do legado continua aplicada, incluindo seus limites de 1 MB/500 instrumentos.

- Preserva os tipos de instrumentos, coordenadas, rotação e nomes de tocadores, retirando espaços nas extremidades dos nomes.
- Aplica palco de 10 x 6 metros e bases padrão, pois eram os dados disponíveis na prova.
- Usa títulos alternativos quando os nomes da apresentação/música estão vazios.
- Atribui IDs novos e determinísticos às entidades convertidas. O mapa antigo não tinha referências estruturadas entre pessoas e instrumentos.
- Cada rótulo não vazio de tocador vira uma identidade independente; nomes iguais não são unidos automaticamente. Rótulos vazios ou só com espaços não criam pessoas.
- A lista de integrantes começa vazia, pois não existia no arquivo anterior. O resultado inclui aviso para revisar a lista e as atribuições. Não inventa transições ou materiais.

Uma apresentação convertida pode ser reexportada no contrato novo e reaberta preservando seus IDs. A migração não modifica o texto original nem grava por cima do arquivo de origem. Quando surgirem versões novas, será necessário implementar e testar sua migração antes de aceitá-las.

## Organização e verificação

- `index.ts`: envelope, tamanho, resultado de importação e seleção da versão/migração.
- `validation.ts`: leitura dos campos e construção de dados conhecidos.
- `references.ts`: integridade de IDs e vínculos entre entidades.
- `legacy.ts`: transformação do mapa da prova M02.
- `examples/presentation-v1.json`: exemplo de duas músicas, transições de entrada/meio/saída, pessoas, bases e material manual.

`npm run check` passou: lint, formatação, 220 testes (70 novos), cobertura e build TypeScript/Vite. O código medido atingiu 100% nas quatro métricas, sem reduzir limites ou excluir lógica funcional. Os testes cobrem o ciclo completo, o exemplo, migração, estados inválidos, referências quebradas, versões incompatíveis, bytes multibyte e arquivo compacto que cresceria além do limite ao reexportar.

Não houve alteração de interface nesta etapa nem publicação. O aviso anterior de tamanho do módulo PDF continua registrado na M02. A próxima entrega é a M05, conectando o modelo e o novo formato a um primeiro fluxo visual.
