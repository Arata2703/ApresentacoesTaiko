# M06 - Integrantes e atribuições

## O que pode ser usado na tela

1. Abra **Integrantes** na lateral e cadastre uma pessoa. Ela entra inicialmente na lista desta apresentação.
2. Use **Renomear** para alterar seu nome e **Salvar nome** para confirmar; a identidade e as atribuições são preservadas. É possível cancelar a edição.
3. Marque ou desmarque **Na lista de integrantes** para definir sua participação na lista, sem apagar cadastro ou atribuições.
4. Use **Voltar aos mapas** ou selecione um mapa na lateral. No painel **Tocadores** de um instrumento, marque uma ou várias pessoas do cadastro. Desmarcar retira somente a atribuição naquele instrumento. O retorno também funciona quando a apresentação ainda está sem mapas, permitindo criar o primeiro.
5. Use **Baixar apresentação editável** para guardar o estado e **Abrir apresentação** para retomá-lo.

O campo livre de nome por instrumento da M05 foi substituído pela seleção do cadastro. A renomeação agora é uma ação explícita na página de integrantes; limpar um texto durante a edição não cria outra identidade acidentalmente. **Gerenciar integrantes** no painel do instrumento abre o cadastro.

Homônimos são permitidos e não são unidos automaticamente. Os rótulos Pessoa 1, Pessoa 2 etc. distinguem os itens na interface; são posições na lista, não identificadores permanentes. Os IDs internos permanecem estáveis ao salvar, reabrir e renomear.

## Exclusão e integridade

Um cadastro sem atribuições pode ser excluído. Sua entrada na lista de integrantes também é removida.

Se uma pessoa estiver atribuída a qualquer instrumento ou transição, **Excluir cadastro** fica desabilitado e a tela explica o motivo. Nesse caso, é possível retirá-la da lista sem apagar seu trabalho. A proteção também considera transições já existentes em arquivos importados; a edição dessas transições pertence à M09.

Renomear uma pessoa atualiza seus rótulos em todos os mapas que a utilizam, mantendo os mesmos IDs nas atribuições. Retirar da lista não remove os tocadores dos mapas. Essas operações preservam as demais pessoas, mapas, sequência, transições e materiais da apresentação.

## Organização do código

- `src/features/people/PeoplePage.tsx`: página, formulário de cadastro e contagem da lista/cadastro.
- `PersonRow.tsx`: edição de uma pessoa, inclusão na lista e estado de exclusão.
- `PlayerAssignments.tsx`: seleção de várias pessoas para um instrumento, com lista rolável.
- `peopleActions.ts`: ações do cadastro ligadas às operações de domínio, com validação do nome antes da atualização React e geração de IDs fora do atualizador.
- `people.module.css`: estilos da funcionalidade.
- `src/domain/presentation/people.ts`: consulta compartilhada de uso da pessoa e regras de identidade/lista/exclusão. Continua independente de React e DOM.
- `useStageEditor`: atualização funcional da apresentação e atribuição de IDs ao instrumento selecionado. Alterações de posição/rotação ficam separadas da atribuição de pessoas.

O formato de arquivo continua `taiko-presentation` versão 1: os campos de pessoas, integrantes e atribuições já existiam no contrato. Não foi necessária migração adicional.

## Verificação

`npm run check` passou com lint, formatação, 236 testes e build TypeScript/Vite. Cobertura medida: 100% de linhas/funções, 99,66% de instruções e 99,44% de ramificações. Os limites por arquivo foram preservados e o domínio mantém a exigência de 100%.

Há sete novos testes, além da adaptação dos testes existentes ao fluxo de cadastro/seleção. Foram verificados nomes vazios, homônimos, cancelamento/validação de renomeação, exclusão sem uso, proteção de pessoa em uso, inclusão/retirada da lista, seleção múltipla e reabertura do arquivo com as atribuições preservadas. A renomeação compartilhada é verificada em dois mapas, sem duplicação da identidade. A exclusão considera também uso somente em transição. Um teste de regressão cobre o retorno do cadastro à área de mapas em uma apresentação vazia.

No navegador foram cadastrados Ana e João, atribuídos ambos ao mesmo okedo, renomeada Ana para Ana Silva e retirado João da lista. O mapa continuou exibindo os dois tocadores e os cadastros em uso ficaram protegidos contra exclusão. A página e o painel de atribuições foram inspecionados visualmente.

## Limites e próximo passo

- Não foram adicionados os avisos automáticos de cobertura de participantes da visão completa.
- O PDF da página de integrantes continua para a M12. Na página Integrantes, a exportação do PDF de mapa fica desabilitada; para exportar um mapa, selecione-o na lateral.
- Participantes de transições poderão ser editados na M09. Cadastros referenciados por essas transições continuam protegidos desde já.
- Não há salvamento automático ainda; é necessário baixar o arquivo editável antes de sair.
- A criação de várias músicas e a reordenação continuam na M08.

A próxima etapa é M07: completar o editor individual, incluindo escolha de bases e configuração das medidas. Não houve deploy, validação remota da CI ou alteração do gerador de PDF nesta etapa. O aviso já conhecido de tamanho do módulo PDF permanece.
