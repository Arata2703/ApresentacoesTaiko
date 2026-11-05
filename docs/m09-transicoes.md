# M09 — Transições e edição direta de texto

Validada e registrada em `937d2be`. A M08 e a cópia local foram aprovadas e registradas em `cc605e7`, `e48cda0` e `6169fcc`.

## Disponível na interface

- Os ícones **Adicionar mapa** e **Adicionar transição** ficam no topo da lateral. O novo slide entra após o selecionado ou no fim da sequência se nenhum slide estiver selecionado. Para criar uma entrada, abra **Ordem da apresentação** e clique em **Adicionar transição de entrada**.
- A lateral intercala as transições e mapas. O editor permite nomear o tsunagi e consultar os mapas anterior/próximo automaticamente, incluindo instrumentos e tocadores.
- Editar mapas atualiza as referências. Reordenar ou remover músicas mantém as instruções e sinaliza revisão; o usuário pode marcar a transição como revisada.
- Uma única caixa de texto oferece negrito, itálico, lista com marcadores e lista numerada convencional. A formatação aparece diretamente durante a escrita, sem marcações Markdown nem botão de prévia.
- Ctrl/Cmd+B alterna negrito; Ctrl/Cmd+I alterna itálico. Com seleção, formata o trecho; sem seleção, alterna a escrita seguinte. O editor não intercepta Ctrl+N, reservado pelo Chrome. A caixa mantém a borda normal durante a edição; o texto e o botão de itálico exibem a inclinação.
- As ferramentas mantêm a seleção e devolvem o foco à caixa. O estado dos botões acompanha a seleção. Colagem mantém somente texto e elementos de formatação permitidos; imagens, scripts, links ativos e atributos externos não são inseridos. Arrastar conteúdo externo para a caixa é bloqueado; use colagem.
- Nome, instruções e revisão ficam no arquivo editável e na cópia automática local. Remover uma transição exige confirmação e preserva os mapas.

## Organização e compatibilidade

`useTransitions` conecta os componentes às regras do domínio. Criação, navegação, editor e prévias são módulos separados. O domínio não depende do DOM ou da formatação visual.

`InstructionEditor` usa a edição nativa `contentEditable` e os comandos do navegador, preservando digitação, seleção e histórico nativo de desfazer. `instructionContent` isola conversão de texto anterior e limpeza do conteúdo. `execCommand` e `queryCommandState` são APIs antigas/depreciadas, ainda disponíveis no navegador verificado; suporte em outros navegadores deve ser conferido. Uma futura substituição deve manter seleção, digitação formatada e desfazer. Não foram adicionadas dependências. O download da biblioteca considerada falhou por validação do certificado do registro npm; a validação TLS não foi desativada.

As instruções novas usam `instructionsFormat: 'html'` e HTML restrito em `instructions`. Arquivos anteriores sem esse campo continuam aceitos: texto e marcações simples de negrito, itálico e listas são convertidos na abertura do editor. HTML só entra na superfície após limpeza explícita dos elementos e atributos.

O protótipo de etapas simultâneas foi removido por solicitação do usuário. Sua interface, regras de numeração e modelo de domínio não fazem parte da versão atual. Somente a importação conserva uma compatibilidade de recuperação: textos do campo experimental `actionPlan`, se encontrados no arquivo ou cache, são reunidos às instruções sem números, para não perder o que foi escrito. O campo experimental não é reexportado.

## Verificação

`npm run check` aprovado: lint, formatação, 289 testes com cobertura e build. Cobertura de 100% de linhas/funções, 99,73% de instruções e 99,46% de ramificações; domínio em 100%. Limites preservados; o aviso conhecido do tamanho do módulo de PDF continua.

Testes cobrem criação/revisão/remoção, mapas automáticos, reordenação, conteúdo vazio, nomes, preservação de texto, importação/cópia local, recuperação do protótipo, HTML identificado e inválido, limpeza de conteúdo, atalhos com seleção/foco e colagem. O jsdom não tem motor nativo de formatação: os testes da barra verificam essa fronteira com um substituto apenas da API de comandos. Aplicação visual, digitação formatada, seleção, listas, desfazer e restauração precisam da conferência complementar no navegador.

Conferência no navegador integrado: ações abaixo do mapa selecionado, inserção da transição entre os mapas esperados, itálico na digitação com Ctrl+I e no botão, e caixa sem borda extra ao receber foco. A seleção atual tem prioridade sobre a seleção lembrada pela barra; um teste de regressão cobre a atualização antes do evento `selectionchange`.

## Roteiro de validação

1. Selecione um slide e use **Adicionar transição** na lateral. Nomeie o tsunagi e confira os mapas. Use **Adicionar mapa** para testar a inserção de um mapa após o slide selecionado.
2. Selecione um trecho e use N/I ou os atalhos; confira o resultado na própria caixa.
3. Sem seleção, ative negrito/itálico e continue escrevendo. Desative para voltar à escrita normal.
4. Aplique lista com marcadores ou numerada. Teste Enter para inserir itens e o desfazer do navegador.
5. Atualize a página, reabra a transição e confira o conteúdo formatado.
6. Edite/reordene/remova mapas, confira referências e aviso de revisão sem perder as instruções.

## Limites e próxima atividade

Não há vínculos ou inventário estruturado do tsunagi; permanecem na R3. O PDF completo, com transições e continuação de textos, permanece na M12 e deverá renderizar o HTML restrito, sem imprimir tags. Enquanto a transição está aberta, Exportar PDF deste mapa fica desabilitado. A tela inicial não restaura a última transição selecionada; ela pode ser reaberta na lateral.

O modo de etapas simultâneas foi adiado: ver [planejamento futuro](evolucao-editor-transicoes.md). Após validar a M09 e autorizar seus commits, a próxima atividade do MVP é a M10 — materiais manuais.
