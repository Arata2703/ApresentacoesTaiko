# Evolução futura — etapas simultâneas no editor único

Situação: não iniciado, fora da versão atual. Nenhum prazo ou release foi atribuído. [Atividade no Notion](https://app.notion.com/p/40f3004125cd8151a433eb22a41611f3).

O usuário rejeitou o protótipo com uma caixa por ação. O requisito de simultaneidade deve ser planejado novamente e validado antes de implementar. A versão atual mantém uma única caixa com negrito, itálico e listas convencionais.

## Requisitos para o planejamento

- Uma única caixa de texto, sem cartões/editores separados por ação.
- Modo opcional, com números romanos repetidos para ações simultâneas: I, I, II, III, III, IV.
- A próxima etapa só começa depois que todas as ações da anterior terminarem.
- Desligar oculta as marcações, sem perder a organização; religar restaura a estrutura anterior.
- Texto adicionado com o modo desligado não é numerado automaticamente ao ativá-lo. A enumeração começa abaixo do texto livre; o usuário reorganiza o texto.

## O que ainda precisa ser definido

1. Interação para adicionar ação simultânea/nova etapa e reorganizar ações dentro da caixa única.
2. Como rastrear grupos ao editar texto com o modo desligado, incluindo cortes, colagens, remoções, desfazer/refazer e novas linhas.
3. Distinção visual entre observações livres e ações, sem multiplicar caixas.
4. Persistência, migração do arquivo editável e renderização no PDF.

Validar um esboço com o usuário antes de escrever a implementação. Só então detalhar atividades e testes de simultaneidade, alternância e prevenção de perda de conteúdo. Não restaurar automaticamente o protótipo rejeitado.
