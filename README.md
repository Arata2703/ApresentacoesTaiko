# Taiko / Palco

Primeira tela do planejador de apresentações de Taiko, com React, TypeScript, Vite e CSS Modules.

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

`check` executa lint, formatação, testes de regras e build com checagem TypeScript. `preview` serve o build gerado. A configuração em `.github/workflows/check.yml` fará as mesmas verificações quando o repositório for publicado no GitHub; não faz deploy.

## O que está implementado

- Primeira tela com catálogo lateral, um mapa e painel de propriedades.
- Instrumentos do catálogo inicial representados por símbolos ilustrativos.
- Adição, seleção e remoção de instrumentos.
- Nome do tocador, posição em metros e rotação; setas do teclado movem o instrumento selecionado.
- Títulos da apresentação e da primeira música editáveis.

Os nomes e posições existem apenas na memória da sessão. Recarregar a página limpa o mapa. O tamanho dos símbolos é ilustrativo; não representa medidas reais confirmadas dos instrumentos. A base padrão é informativa nesta etapa.

## Ainda não implementado

Arraste/canvas Konva, salvamento automático e arquivo de projeto, PDF, múltiplas músicas, transições, cadastro central de integrantes, troca de bases e deploy. Os próximos marcos devem seguir o planejamento do MVP no Notion. Kumi e contagem automática ficam nas releases posteriores.

## Organização

- `src/domain/stage.ts`: tipos e operações de posição/rotação, sem dependência de React.
- `src/domain/stage.test.ts`: testes das regras de limites, normalização e imutabilidade.
- `src/App.tsx`: composição e estado da primeira tela.
- `src/App.module.css`: estilos da tela.
- `src/styles.css`: estilos globais e foco.

Os demais adaptadores e camadas serão adicionados quando houver funcionalidade correspondente. A prova técnica de palco/PDF ainda não foi encerrada. Nenhum repositório remoto ou publicação foi criado.
