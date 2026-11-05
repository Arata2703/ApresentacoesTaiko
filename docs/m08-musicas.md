# M08 — Músicas e sequência

Etapa aprovada pelo usuário, incluindo arraste por espaços, seleção durante o movimento e salvamento automático. A M07 foi registrada em `54f5f7a` (visual) e `2bea5a6` (editor e ajustes).

## O que pode ser usado

- Adicionar música pela lateral cria um mapa vazio e o abre para edição.
- Renomear pelo campo Nome da música atualiza a lateral e a ordem da apresentação.
- Duplicar mapa insere a cópia após o original, mantendo instrumentos, bases, medidas, posições, rotações e atribuições. O mapa e os instrumentos recebem novas identidades; as pessoas continuam sendo as mesmas da apresentação. Editar a cópia não modifica o original.
- Arrastar um slide na lateral move a música para o espaço de destino, indicado por uma linha azul. A metade superior insere antes e a inferior depois; espaços entre slides usam o limite mais próximo. O indicador pertence ao espaço, mantendo a mesma posição ao passar da base de um slide para o topo do próximo. O slide é selecionado e aberto ao iniciar o arraste. O arraste pode ser cancelado sem alterar a ordem. Pelo teclado, foque o slide e use Alt + ↑/↓; não há mais botões de setas.
- Remover mapa pede confirmação. O próximo mapa é aberto; na ausência dele, abre o anterior. Ao remover o último, a apresentação fica sem mapas e permite criar novamente.
- Ordem da apresentação mostra a sequência atual de músicas e tsunagi, inclusive os importados de arquivos anteriores. Transições afetadas por mudanças de vizinhança ficam sinalizadas para revisão, com os textos e participantes preservados.
- Salvar e abrir o arquivo editável preserva a sequência completa e as identidades. O contrato v1 permanece compatível.

## Organização

`duplicateMap` pertence ao domínio e valida as novas identidades sem depender de React ou geração aleatória. `mapActions` liga as operações à seleção do editor e gera IDs antes de executar os atualizadores de estado. `MusicActions`, `ShowOrder` e `MapSlides` separam confirmação de exclusão, ordem e interação de arraste/teclado.

Ao arrastar uma música, as outras se deslocam para abrir espaço; as posições de transição na sequência são preservadas e alterações nos mapas vizinhos são sinalizadas para revisão. A duplicação não duplica transições nem pessoas.

## Verificação

`npm run check` aprovado: lint, formatação, 269 testes, cobertura e build. Cobertura: 100% de linhas/funções, 99,68% de instruções e 99,35% de ramificações, sem reduzir limites; domínio em 100%. Continua o aviso conhecido de tamanho do módulo de PDF.

Os testes verificam cópia independente, IDs novos e inválidos, extremos da ordenação, remoção do último mapa, cancelamento/confirmação, salvamento/reabertura e preservação dos textos de transição. No navegador foram conferidos criação, renomeação, duplicação, reordenação, exclusão e preservação do instrumento original após excluir o instrumento na cópia.

A revisão de arraste usa eventos de ponteiro com captura e um limiar de movimento para distinguir clique de arraste. Ao começar a mover, o slide de origem é aberto e destacado; soltar não seleciona o slide de destino. Cancelamento e perda de captura interrompem o movimento. Os testes cobrem metades, espaços entre slides, limites, ponteiros diferentes, cancelamento e teclado. No navegador foi confirmado o arraste para o topo do slide seguinte, com inserção imediatamente antes dele e atualização da seleção.

O salvamento automático da apresentação atual foi antecipado a pedido do usuário. Veja [o comportamento e a recuperação da cópia local](salvamento-local.md).

## Roteiro de validação

1. Monte uma formação e clique em Duplicar mapa.
2. Renomeie a cópia e altere seus instrumentos; volte ao original e confira que ele permanece intacto.
3. Adicione outra música e arraste os slides da lateral para ordenar as três. Teste também Alt + ↑/↓ com o slide focado.
4. Abra Ordem da apresentação e confira os títulos e a sequência.
5. Cancele uma remoção e depois confirme outra. Salve e reabra o arquivo editável.

## Próxima etapa e limites

A M09 entregará a tela de transição textual com mapas anterior/próximo automáticos. Esta etapa apenas mostra transições que já existam no arquivo; ainda não oferece sua criação/edição. O PDF continua limitado ao mapa selecionado; a apresentação completa e sua ordem no PDF ficam para M12. O restante da M11 precisa considerar o salvamento automático já antecipado.
