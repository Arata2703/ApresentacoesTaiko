# Taiko / Palco

Planejador de apresentações de Taiko com React, TypeScript, Vite e CSS Modules. Etapa atual: M06, com cadastro/lista de integrantes e seleção de vários tocadores por instrumento, integrados ao arquivo completo da apresentação.

## Executar

Use Node 24 (versão usada nesta etapa: 24.13.0) e npm.

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, normalmente http://127.0.0.1:5173.

## Verificar

```sh
npm run check
npm run preview
```

`check` executa lint, formatação, testes com cobertura e build com checagem TypeScript. `preview` serve o build gerado. A configuração em `.github/workflows/check.yml` fará as mesmas verificações quando o repositório for publicado no GitHub; não faz deploy.

## Testes e commits

```sh
npm test
npm run test:watch
npm run test:coverage
```

Vitest executa testes de domínio e testes de hooks/componentes com Testing Library, user-event e jsdom. Os testes de interface verificam comportamentos visíveis, como adicionar instrumentos, editar propriedades, trocar seleção, mover por teclado e remover elementos.

O comando `test:coverage` gera relatório no terminal e em `coverage/index.html`. A configuração inclui todos os arquivos TypeScript/TSX de produção, mesmo que não sejam importados pelos testes. Somente testes, sua preparação e o bootstrap `src/main.tsx` ficam fora da medição; CSS e aparência devem ser verificados visualmente.

Limites **por arquivo**: 90% de linhas, instruções e funções e 85% de ramificações. As regras em `src/domain` exigem 100% nesses indicadores. O comando falha quando um limite não é atingido. Cobertura alta não garante ausência de falhas; os critérios de aceite e a conferência no navegador continuam necessários.

Após `npm ci`, o script `prepare` instala o hook do Husky nesse clone. Todo `git commit` executa `npm run check`; uma falha impede o commit. Os arquivos da configuração estão versionados em `.husky/`. Se o terminal do Git não encontrar Node/npm, corrija o PATH do ambiente; não desative o hook.

O GitHub Actions roda a mesma verificação e guarda o relatório de cobertura como artefato, inclusive quando os testes falham e o relatório está disponível. Isso só pode ser confirmado remotamente após publicar o repositório. Hooks locais não substituem a CI e podem ser contornados tecnicamente pelo Git; as instruções do projeto proíbem esse contorno.

Leia [AGENTS.md](AGENTS.md) antes de modificar o projeto: funcionalidades novas precisam de testes, correções precisam de regressões e os commits devem continuar graduais e verificados. Esse arquivo mantém as instruções no repositório para outros chats/agentes.

## O que está implementado

- Editor com catálogo lateral, mapa e painel de propriedades; navegação pelos mapas existentes no arquivo.
- Instrumentos do catálogo inicial representados por símbolos ilustrativos.
- Adição, seleção e remoção de instrumentos.
- Tabela compacta de integrantes: célula inteira do nome editável por duplo clique e lixeira para remoção.
- Seleção de um ou vários tocadores por instrumento, por identidade, com preservação ao salvar/reabrir.
- Posição em metros e rotação; setas do teclado movem o instrumento selecionado.
- Títulos da apresentação e da música selecionada editáveis.
- Arraste com mouse/toque, mantendo a alternativa de teclado e os limites do palco.
- Download/abertura da apresentação completa, com validação e confirmação, incluindo conversão dos arquivos antigos da M02.
- Criação do primeiro mapa quando a apresentação aberta não tiver mapas.
- Exportação de uma página PDF A4 horizontal do mapa selecionado, com medidas, posições, rotação indicada por traço e nomes em texto vetorial com fonte incorporada.

O navegador ainda não salva automaticamente: use **Baixar apresentação editável** antes de sair e **Abrir apresentação** para retomar. O PDF é para consulta/impressão de um mapa; o JSON guarda a apresentação inteira para continuar editando. Recarregar a página limpa a sessão. Os símbolos são ilustrativos; a base existente é exibida, e a escolha de base chegará na M07.

Adicione as pessoas em **Integrantes**, na lateral; todos os nomes adicionados pertencem à apresentação. Dê duplo clique no nome para editar: Enter ou sair do campo salva, Esc cancela. Depois selecione um instrumento no mapa e marque seus tocadores. A remoção de alguém em uso pede confirmação e retira suas atribuições, preservando os instrumentos e textos.

Consulte [o que pode ser usado e os limites da M06](docs/m06-integrantes.md) e [o fluxo integrado da M05](docs/m05-fluxo.md). Para testar a navegação entre mapas, abra [o exemplo](examples/presentation-v1.json) pela interface. Criar várias músicas e reordenar são entregas da M08. O PDF de integrantes e os avisos automáticos de participação ainda não estão disponíveis.

## Núcleo lógico da M03

O modelo e as operações da apresentação estão em `src/domain/presentation/`: pessoas com IDs estáveis, lista de integrantes, catálogo/bases, mapas em metros, múltiplos tocadores, sequência, transições textuais e materiais manuais. As regras são independentes da interface e preservam a integridade das referências.

Consulte [o modelo, as operações e os limites da M03](docs/m03-modelo.md).

## Contrato de arquivo da M04

O arquivo completo é JSON `taiko-presentation`, versão 1, com validação de estrutura e referências, diferenciação de erros/versões incompatíveis e conversão dos mapas da M02. A importação devolve um candidato validado que a interface aplica somente após confirmação. A suíte completa tem 239 testes.

Consulte [o contrato e a migração da M04](docs/m04-arquivo.md) e o [arquivo de exemplo](examples/presentation-v1.json). Os controles da página já usam esse formato.

## Próximas entregas

Os tocadores aparecem como `A/B`. No palco, dê duplo clique no nome abaixo do instrumento para editar em um campo compacto com autocomplete. Enter ou sair do campo salva; Esc cancela. Nomes novos são incluídos na lista de integrantes. O instrumento selecionado não recebe uma moldura ao redor.

Editor completo, criação/ordenação de várias músicas, transições, materiais manuais, salvamento automático, PDF completo e deploy. Os próximos marcos devem seguir o planejamento do MVP no Notion. Kumi e contagem automática ficam nas releases posteriores.

## Organização

- `src/domain/stage.ts`: tipos e operações de posição/rotação, sem dependência de React.
- `src/domain/stage.test.ts`: testes das regras de limites, normalização e imutabilidade.
- `src/domain/presentation/`: modelo completo do MVP e operações separadas por apresentação, pessoas, mapas, catálogo, sequência e materiais, com testes do núcleo.
- `src/App.tsx`: entrada que seleciona a página do editor.
- `src/features/editor/EditorPage.tsx`: composição da tela.
- `src/features/editor/useStageEditor.ts`: estado e ações do editor, sem marcação visual.
- `src/features/editor/editorProjection.ts`: conversão do mapa selecionado para os componentes/PDF, preservando o modelo completo como fonte dos dados.
- `src/features/people/`: cadastro/lista de integrantes e atribuição de tocadores, com componentes, ações, estilos e testes próprios.
- `src/features/editor/useInstrumentDrag.ts`: captura do ponteiro e conversão de deslocamento da tela para metros.
- `src/integrations/mapFile.ts`: formato legado da prova M02, usado na conversão e testes de compatibilidade.
- `src/integrations/presentationFile/`: contrato completo, validação, referências e migração do legado M02, integrado aos controles de arquivo.
- `src/integrations/mapPdf.ts`: composição vetorial do PDF, independente dos componentes React.
- `src/integrations/exportMap.ts` e `download.ts`: carregamento sob demanda do gerador/fonte e download no navegador.
- `src/features/editor/components/`: cabeçalho, navegação, catálogo, palco, propriedades e outros componentes visuais, conectados por propriedades e callbacks.
- `src/features/editor/editor.module.css`: estilos compartilhados e restritos à funcionalidade do editor.
- `src/styles.css`: estilos globais e foco.

Os demais adaptadores e camadas serão adicionados quando houver funcionalidade correspondente. Nenhum repositório remoto ou publicação foi criado.
