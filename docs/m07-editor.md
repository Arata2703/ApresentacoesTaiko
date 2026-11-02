# M07 — Catálogo e editor individual

Etapa validada e aprovada pelo usuário. Implementação registrada em commits separados de visual e funcionalidades.

## Disponível na interface

- Os 12 tipos do catálogo podem ser adicionados, selecionados, movidos em metros, rotacionados e removidos.
- O painel permite trocar entre as bases compatíveis e selecionar sem base. Okedo, Shime e Nagado começam com suwaridai; cada nova instância mantém esse padrão independentemente das alterações em outras instâncias.
- Medidas do palco permite informar largura e profundidade positivas em metros. Reduzir o palco traz instrumentos fora dos limites para a borda. A orientação continua com plateia no topo e fundo embaixo.
- A legenda do painel informa que o tamanho dos desenhos é ilustrativo: as dimensões reais dos instrumentos ainda não foram fornecidas. Não há cálculo de ocupação física nesta etapa.
- Arquivos editáveis preservam base, dimensões do palco, posição, rotação e identidades dos tocadores. O contrato v1 não mudou.

## Revisão visual solicitada

Paleta inspirada no uniforme: azul-marinho no cabeçalho, dourado nos detalhes e branco/azul claro nas superfícies. As cores naturais dos desenhos dos instrumentos foram preservadas. As cores da interface ficam centralizadas em variáveis de tema em `src/styles.css`.

A seleção aplica um halo azul desfocado atrás do desenho imediatamente, inclusive quando o clique é no rótulo, sem precisar mover o instrumento. O halo acompanha apenas o selecionado. A caixa permanente do nome e sua mudança suave de fundo durante a edição permanecem.

Clicar na área vazia do palco ou em seu entorno desmarca o instrumento, retira o halo e devolve o painel ao estado sem seleção. Clicar no instrumento, no rótulo ou nos controles do painel preserva a seleção. Sair da edição de tocadores para a área vazia salva o texto válido antes de desmarcar.

## Verificação e validação

`npm run check`: lint, formatação, 254 testes, cobertura e build aprovados. Cobertura de linhas e funções em 100%; limites preservados. O aviso conhecido de tamanho do módulo de PDF permanece.

Os testes cobrem bases compatíveis, troca/remoção de base, padrões de todos os tipos, medidas inválidas, redução com reposicionamento e salvamento/reabertura com todos os dados. A edição inline/autocomplete mantém seus testes, agora distinguindo o campo de tocadores do seletor de base.

Para validar: adicione Okedo e Shime, alterne a seleção sem arrastar, troque a base no painel e abra Medidas do palco. Salve e reabra o arquivo editável. Confira também a lista de integrantes e a edição do nome por duplo clique na nova paleta.

A próxima etapa é M08, criação e ordenação de múltiplos mapas. PDF completo, instrumentos personalizados, Kumi e contagem automática continuam nas etapas/releases correspondentes.
