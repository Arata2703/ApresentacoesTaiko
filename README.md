# Taiko / Palco

Planejador de apresentações de Taiko com React, TypeScript, Vite e CSS Modules. Etapa atual: prova técnica M02 de um mapa editável e exportação PDF.

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

- Primeira tela com catálogo lateral, um mapa e painel de propriedades.
- Instrumentos do catálogo inicial representados por símbolos ilustrativos.
- Adição, seleção e remoção de instrumentos.
- Nome do tocador, posição em metros e rotação; setas do teclado movem o instrumento selecionado.
- Títulos da apresentação e da primeira música editáveis.
- Arraste com mouse/toque, mantendo a alternativa de teclado e os limites do palco.
- Download e abertura manual de um mapa JSON versão 1, com validação e confirmação antes de substituir o trabalho atual.
- Exportação de uma página PDF A4 horizontal com posições, rotação indicada por traço e nomes em texto vetorial com fonte incorporada.

O navegador ainda não salva automaticamente: baixe o mapa editável antes de sair e use **Abrir mapa** para retomá-lo. O PDF é para consulta/impressão; o JSON é para continuar editando. Recarregar a página limpa a sessão. O tamanho dos símbolos é ilustrativo; não representa medidas reais confirmadas dos instrumentos. A base padrão é informativa nesta etapa.

Consulte [as decisões e limitações da M02](docs/m02-decisoes.md). O formato desta prova contém um único mapa; o arquivo de apresentação completo será tratado na M04.

## Ainda não implementado

Salvamento automático, arquivo de apresentação completo, múltiplas músicas, transições, cadastro central de integrantes, troca de bases e deploy. Os próximos marcos devem seguir o planejamento do MVP no Notion. Kumi e contagem automática ficam nas releases posteriores.

## Organização

- `src/domain/stage.ts`: tipos e operações de posição/rotação, sem dependência de React.
- `src/domain/stage.test.ts`: testes das regras de limites, normalização e imutabilidade.
- `src/App.tsx`: entrada que seleciona a página do editor.
- `src/features/editor/EditorPage.tsx`: composição da tela.
- `src/features/editor/useStageEditor.ts`: estado e ações do editor, sem marcação visual.
- `src/features/editor/useInstrumentDrag.ts`: captura do ponteiro e conversão de deslocamento da tela para metros.
- `src/integrations/mapFile.ts`: formato versionado da prova e validação antes da abertura.
- `src/integrations/mapPdf.ts`: composição vetorial do PDF, independente dos componentes React.
- `src/integrations/exportMap.ts` e `download.ts`: carregamento sob demanda do gerador/fonte e download no navegador.
- `src/features/editor/components/`: cabeçalho, navegação, catálogo, palco, propriedades e outros componentes visuais, conectados por propriedades e callbacks.
- `src/features/editor/editor.module.css`: estilos compartilhados e restritos à funcionalidade do editor.
- `src/styles.css`: estilos globais e foco.

Os demais adaptadores e camadas serão adicionados quando houver funcionalidade correspondente. Nenhum repositório remoto ou publicação foi criado.
