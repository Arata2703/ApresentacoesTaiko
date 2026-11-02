# M06 - Lista única de integrantes

## Revisão solicitada pelo usuário

Os cards e a distinção entre cadastro e lista da apresentação foram substituídos por uma tabela compacta. A coluna do nome ocupa cerca de 50% da largura e a ação é uma lixeira. Toda pessoa adicionada pertence à apresentação. IDs continuam internos e estáveis; homônimos continuam pessoas diferentes.

Não existe mais o botão Renomear. Um duplo clique em qualquer ponto da célula do nome, inclusive no padding, inicia a edição. Não há caixa separada ou contorno verde: a célula apenas muda de fundo ao receber foco. Enter salva, Esc cancela e sair do campo salva um nome válido. Enter, F2 ou Espaço sobre o nome também iniciam a edição pelo teclado. Nomes vazios ou acima do limite de 80 caracteres não são aceitos. A lixeira mantém nome acessível e descrição ao passar o mouse; a confirmação de remoção aparece em uma linha de largura completa.

Essa revisão substitui a separação e o comportamento de exclusão da entrega inicial da M06. O histórico anterior permanece nos commits e no acompanhamento do Notion.

## Como usar

1. Abra **Integrantes** na lateral e adicione as pessoas.
2. Dê duplo clique no nome para editar diretamente a célula.
3. Use **Voltar aos mapas**, selecione um instrumento e marque um ou vários tocadores. Desmarcar nesse painel retira somente a atribuição naquele instrumento.
4. Para tirar alguém da apresentação inteira, use **Remover** na sua linha.
5. Guarde as alterações em **Baixar apresentação editável** e retome com **Abrir apresentação**.

Ao remover uma pessoa sem atribuições, a linha é retirada imediatamente. Se ela já estiver em instrumentos ou transições, a interface pede confirmação e explica que suas atribuições também serão retiradas. Cancelar preserva todos os dados. A remoção confirmada não apaga instrumentos, posições, bases, músicas, materiais ou textos de transição. Transições que perdem um participante ficam marcadas para revisão.

Renomear preserva a identidade e atualiza os rótulos de todos os mapas. Homônimos não são unidos automaticamente; rótulos acessíveis e opções de atribuição distinguem suas posições na lista sem expor IDs técnicos.

## Arquivos antigos e referências

O contrato `taiko-presentation` v1 continua legível. Seu campo legado `rosterIds` permanece por compatibilidade, mas a interface deriva a lista de todas as pessoas presentes. Ao abrir arquivos antigos, todas as pessoas são incluídas; ao salvar pela interface, esse campo fica alinhado à lista única. Nenhuma pessoa antiga é descartada por estar fora do campo legado.

O leitor genérico de arquivos continua capaz de validar e preservar os registros v1; a adaptação da lista única fica na fronteira do editor. A remoção usa uma operação atômica que limpa referências em todos os mapas e transições, evitando IDs órfãos. As operações estritas antigas do domínio continuam disponíveis para compatibilidade, sem controles correspondentes na interface atual.

## Organização

- `PeoplePage.tsx`: tabela, formulário de adição e retorno aos mapas, inclusive em apresentações vazias.
- `PersonRow.tsx`: edição inline e confirmação de remoção quando há atribuições.
- `PlayerAssignments.tsx`: seleção de tocadores por identidade.
- `peopleActions.ts`: ligação com as operações de domínio e criação de IDs fora do atualizador React.
- `people.module.css`: estilos da tabela e das atribuições.
- `removePresentationPerson`: remoção completa de uma identidade e limpeza das referências, com preservação dos demais dados.

## Verificação

`npm run check` passou com lint, formatação, 239 testes e build TypeScript/Vite. Cobertura medida: 100% de linhas/funções, 99,52% de instruções e 99,20% de ramificações. Limites preservados; domínio mantém 100%.

Os testes verificam tabela, nomes inválidos, homônimos, edição com duplo clique/teclado, gravação ao sair do campo, cancelamento com Esc, renomeação sem duplicação de identidade, remoção/cancelamento, limpeza de referências e reabertura. Também verificam que pessoas de arquivos antigos fora de `rosterIds` passam a integrar a lista única na interface.

No navegador, Ana e João foram adicionados à tabela e Ana foi alterada para Ana Silva por duplo clique e Enter. A tabela compacta foi inspecionada com lixeiras e edição sem contorno. Também foi confirmado que o duplo clique na parte vazia da célula ativa a edição e que Esc cancela sem mudar o nome.

## Limites e continuidade

O PDF de integrantes continua para M12, avisos automáticos ficam para releases posteriores, e o salvamento continua manual. A criação/reordenação de músicas permanece na M08. O próximo marco é M07, completar o catálogo/editor individual. Esta revisão não altera o gerador PDF nem realiza deploy ou validação remota de CI; seu aviso conhecido de tamanho continua.
