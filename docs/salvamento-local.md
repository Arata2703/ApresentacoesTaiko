# Salvamento automático da apresentação atual

Antecipado a pedido do usuário durante a validação da M08 e aprovado junto com essa etapa.

A apresentação inteira é salva no armazenamento local do navegador, incluindo integrantes, mapas, instrumentos, bases, tocadores, medidas, sequência, transições e materiais. O mapa aberto também é restaurado. O arquivo editável usa o mesmo validador da importação, sem mudança de contrato.

As gravações são agendadas após alterações, com gravação adicional ao sair da página. Atualizar a página restaura a última apresentação local válida. Campos de edição que dependem de Enter ou de sair do campo continuam exigindo essa confirmação antes de fazer parte do documento.

## Falhas e preservação de dados

- Armazenamento indisponível ou cheio gera aviso para baixar o arquivo editável; a sessão em memória continua utilizável.
- Uma cópia inválida não é sobrescrita silenciosamente. O usuário pode abrir um arquivo válido ou clicar em Substituir cópia local pelos dados atuais.
- O ID do mapa aberto é conferido ao restaurar. Se ele não existir mais, abre o primeiro mapa da sequência; apresentações sem mapas também são restauradas.
- O salvamento é local ao navegador e ao endereço da aplicação. Limpar os dados do site remove essa cópia. O arquivo editável continua sendo o backup para transferência ou recuperação.

## Organização e validação

`presentationCache` isola o acesso ao armazenamento e a validação do documento. `usePresentationCache` controla o agendamento, a mensagem ao usuário e a substituição explícita de uma cópia inválida. O domínio continua independente do navegador.

Os testes cobrem restauração do documento completo, mapa aberto, dados inválidos, quota, gravação ao sair e substituição explícita. No navegador, uma apresentação com três músicas, um integrante e um instrumento atribuído foi restaurada após atualizar a página, com ordem e mapa aberto preservados.

Este incremento salva a apresentação atual. Gestão de múltiplas apresentações e histórico continuam fora deste incremento. O restante da M11 deve ser revisto contra o planejamento antes da execução, para evitar repetir o que já foi antecipado.
