# M05 - Primeiro fluxo integrado

## O que foi entregue na tela

O editor agora usa o modelo completo da M03 e os adaptadores de arquivo da M04 como fonte dos dados.

- Inicia uma apresentação com um mapa vazio. É possível editar os títulos, adicionar um instrumento, informar seu tocador, mover por arraste/campos/setas, girar e remover.
- **Baixar apresentação editável** salva todos os dados no formato `taiko-presentation` v1, incluindo conteúdo que ainda não possui tela de edição.
- **Abrir apresentação** aceita o formato completo e converte arquivos antigos da M02. Erros e versões incompatíveis não substituem o trabalho aberto. Um arquivo válido pede confirmação; a conversão mostra os avisos antes dela.
- A lateral lista os mapas existentes na ordem da sequência e permite alternar entre eles. A abertura começa pelo primeiro mapa da sequência; a seleção é estado de interface, não dado do arquivo.
- Se o arquivo estiver sem mapas, aparece **Criar primeiro mapa**. Esse comando não adiciona músicas extras a uma apresentação que já tenha mapa.
- **Exportar PDF deste mapa** gera uma página A4 horizontal do mapa selecionado. As medidas, posições, rotação e nomes são derivados dos mesmos dados que alimentam a tela e o arquivo.

Para experimentar a navegação entre mapas antes da M08, abra `examples/presentation-v1.json` pela interface. Esse exemplo contém duas músicas, pessoas e outros dados para conferir a preservação do projeto.

## Integração e proteção dos dados

`useStageEditor` mantém uma `Presentation` e chama as operações de domínio. `editorProjection.ts` converte somente o mapa selecionado para os componentes e o gerador de PDF, resolvendo os nomes pelos IDs das pessoas e das bases. A projeção não substitui o modelo completo e não é usada como arquivo de backup.

As medidas do palco vêm do mapa selecionado. O arraste converte pixels para essas medidas; a geometria do PDF mantém a proporção do palco dentro da página. A grade é referência de posicionamento, sem prometer divisões de um metro. Novos instrumentos ocupam posições iniciais distribuídas, evitando que os primeiros sejam colocados todos no mesmo ponto.

Mapas não selecionados, pessoas, integrantes, transições, materiais e ordem da sequência são preservados ao salvar. Trocar de mapa limpa somente a seleção do instrumento. Atribuições com vários tocadores são exibidas e mantidas, mas o campo fica somente leitura até a interface de integrantes da M06.

Para uma atribuição individual, editar o nome renomeia sua identidade e reflete o nome nos outros lugares em que ela estiver atribuída. Limpar o campo remove somente aquela atribuição, preservando o cadastro da pessoa. Um nome novo cria uma identidade sem incluí-la automaticamente na lista de integrantes. Campos de título vazios usam nomes alternativos no modelo/arquivo; o campo pode permanecer vazio durante a digitação.

Downloads e abertura são manuais. Durante leitura/exportação de PDF, os controles de arquivo ficam desabilitados. Mesmo um arquivo válido só é aplicado depois da confirmação explícita na interface.

## O que ainda falta

- Criar várias músicas, duplicar e reordenar: M08. Esta entrega permite navegar mapas que já existam no arquivo.
- Cadastro/lista de integrantes e edição das atribuições múltiplas: M06.
- Escolha de bases, configuração das medidas e editor completo: M07. Nesta entrega, as bases existentes são exibidas e os dados importados são respeitados.
- Telas de transição e materiais: M09/M10. Seus dados permanecem no arquivo mesmo sem edição visual.
- Salvamento automático no navegador: M11. Recarregar a página continua limpando a sessão; guarde o arquivo editável.
- PDF da apresentação inteira, catálogo visual completo e páginas adicionais: M12. O PDF atual usa símbolos simplificados, como na prova M02, e contém somente o mapa selecionado. Base e demais dados do projeto ficam preservados no arquivo; nem todos têm representação nessa página de PDF.

Não houve deploy ou validação remota da CI. O aviso conhecido de tamanho do módulo PDF continua; o gerador permanece carregado sob demanda. O suporte de fonte continua limitado a Latin e nomes excessivamente longos podem impedir a exportação, com mensagem explícita.

## Verificação

`npm run check` passou com lint, formatação, 229 testes e build TypeScript/Vite. Cobertura total medida: 100% de linhas/funções, 99,64% de instruções e 99,42% de ramificações, preservando os limites por arquivo e a exigência de 100% no domínio.

Testes da interface verificam edição, download real de um Blob, reabertura, confirmação/cancelamento, conversão do legado, arquivos inválidos/incompatíveis, falha de leitura/download/PDF, projeto vazio, navegação e preservação dos dados não editados. O gerador real de PDF também é testado com uma projeção de apresentação validada e reaberta.

No navegador, foi aberto o arquivo de exemplo, selecionado Ibuki, conferido o palco de 12 x 8 metros e arrastado o okedo. Foram definidos (5, 3) metros e 90 graus, baixado o JSON e reaberta essa cópia pela interface. Os valores, a base Eitetsu e Ana/João foram preservados. A exportação pela interface concluiu; uma página produzida pelo mesmo gerador a partir do JSON efetivamente baixado foi renderizada e inspecionada. A extração confirmou A4 horizontal, títulos, nomes e medidas de 12 x 8 metros.

A automação do navegador teve uma interrupção de sessão durante a escolha de arquivo; a conferência foi retomada em uma aba nova e o ciclo de abertura/reabertura foi concluído.

## Continuidade

A próxima etapa prevista é M06, para conectar a lista/cadastro de integrantes e suas atribuições à interface. A criação e ordenação de várias músicas continua planejada para M08.
