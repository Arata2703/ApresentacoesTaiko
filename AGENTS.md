# Instruções para trabalhar neste repositório

Estas regras valem para qualquer chat ou agente que modificar o projeto.

## Testes e verificação obrigatória

- Antes de cada commit, execute `npm run check` e só faça o commit se todos os passos passarem. O hook pre-commit também executa esse comando.
- Cada funcionalidade nova deve incluir testes automatizados dos comportamentos entregues. Correções de bugs devem ter um teste de regressão que reproduza o problema.
- Atualize os testes quando um requisito mudar; preserve a verificação dos comportamentos que continuam válidos.
- Sempre que implementar ou atualizar testes, inclua na resposta final uma tabela agrupada por categoria, com uma linha para cada teste criado ou alterado durante o turno. Informe a categoria, o arquivo, o nome do teste, o cenário exercitado e o comportamento esperado. Nos testes parametrizados, descreva os casos cobertos. A tabela deve permitir que o usuário avalie a relevância de cada teste e identifique cenários que ainda precisam de cobertura.
- Teste regras de domínio isoladas e os fluxos de interface do ponto de vista do usuário, incluindo entradas inválidas, limites, erros e prevenção de perda de dados quando aplicável.
- Use Vitest, Testing Library e user-event. Evite testar detalhes internos, classes CSS, snapshots extensos e mocks excessivos. Não escreva testes que apenas repitam a implementação.
- Mantenha os limites de cobertura configurados em `vitest.config.ts`. Arquivos novos em `src` devem entrar no relatório, mesmo sem teste. Não reduza limites ou exclua código funcional apenas para fazer a verificação passar.
- Cobertura não prova ausência de bugs nem qualidade visual. Confira no navegador quando a alteração afetar layout ou interações; não trate a cobertura como substituta dos critérios de aceite.
- Se uma verificação falhar ou não puder ser executada, corrija a causa ou relate o bloqueio. Não declare verificação concluída sem evidência.
- Não contorne os hooks com `--no-verify`, `HUSKY=0`, `core.hooksPath` alternativo ou outro mecanismo para fazer commit de mudanças não verificadas.

## Categorias e relevância dos testes

- **Lógica.** Verifique regras e resultados sobre os dados, incluindo validação, limites e preservação de estado. Exemplo de comportamento esperado: adicionar um integrante cria um novo registro com identidade própria.
- **Interação do usuário.** Verifique como a aplicação responde a ações como clique, teclado e arraste. Exemplo de comportamento esperado: o duplo clique no nome permite editá-lo.
- **Interface.** Verifique o que o usuário consegue ver ou perceber, como a lista exibir o integrante recém-adicionado. Teste geometria visual, como a centralização de um elemento, quando ela for um requisito e use um navegador que calcule o layout para verificá-la.
- Classifique cada teste pelo comportamento principal que ele protege. Uma interação pode preparar o cenário de um teste de interface quando o resultado visível for o foco. Consulte o usuário antes de adotar uma categoria adicional.
- Antes de escrever um teste, identifique qual requisito ou regressão concreta ele protege. Evite fixar escolhas de implementação ou de layout que podem mudar sem quebrar um requisito. Por exemplo, exigir que dois componentes ocupem a mesma célula de uma tabela só faz sentido se essa disposição for um requisito explícito.
- Se houver dúvida sobre a necessidade de um teste, apresente o cenário e o que ele protegeria. Pergunte ao usuário antes de implementá-lo.

## Planejamento e validação da interface

- Antes de implementar uma decisão que altere o visual ou a experiência de uso, apresente ao usuário um modelo da proposta e aguarde sua validação. Isso vale para telas novas e mudanças em telas existentes.
- Escolha o formato conforme a decisão a validar. Use um esboço ou uma maquete para layout e hierarquia visual, e um fluxo de telas ou protótipo interativo para navegação e interações. Inclua os estados relevantes, como lista vazia, edição, erro e confirmação, quando fizerem parte da experiência.
- Quando houver alternativas que afetem a experiência de formas diferentes, mostre as diferenças no modelo e explique seus impactos para o usuário. Incorpore o retorno ao modelo antes de implementar a interface e volte a validá-lo se a proposta mudar de forma relevante.

## Revisão de código antes de cada commit

- Revise todas as alterações que entrarão no commit. Identifique lógica duplicada e código sem uso, e verifique se as mudanças respeitam a arquitetura e as regras de modularização do projeto.
- Avalie se os princípios de programação orientada a objetos (POO) e os padrões de projeto cabíveis estão sendo aplicados. Use-os quando ajudarem a resolver um problema concreto e mantiverem o código simples.
- Corrija os problemas identificados antes do commit. Se a refatoração exigir uma decisão do usuário, explique o problema, as opções e seus impactos, e aguarde a orientação antes de prosseguir com a parte afetada.

## Modularização

- `src/domain/`: tipos e regras de negócio, independentes de React, DOM, armazenamento e bibliotecas visuais.
- `src/features/`: componentes, hooks e composição organizados por funcionalidade.
- Mantenha `App.tsx` como ponto de composição. Extraia componentes com responsabilidade clara antes de ampliar uma tela grande.
- Integrações futuras de salvamento, importação/exportação e PDF devem ter módulos próprios. Não misture seus detalhes com regras de domínio.
- Use TypeScript estrito e CSS Modules. Adicione dependências e camadas apenas quando houver necessidade concreta.

## Commits e escopo

- Todo novo trabalho de implementação (funcionalidade, melhoria, correção, refatoração ou configuração) deve ser realizado em uma branch própria, criada a partir da `main` atualizada. Use o prefixo `codex/` e um nome que identifique a entrega. Não implemente, faça commits ou envie alterações diretamente à `main`.
- Antes de criar ou trocar de branch, confira o estado do repositório e preserve alterações locais existentes. Não descarte, inclua em commits ou mova trabalho de outro escopo silenciosamente. Uma branch por entrega coerente; não agrupe atividades independentes só por pertencerem à mesma sprint.
- Primeiro implemente a etapa, acrescente os testes e execute as verificações. Apresente o resultado utilizável e explique como validá-lo, deixando as alterações sem commit para a validação do usuário.
- Aguarde a aprovação explícita do usuário antes de fazer commits. Solicitações de implementar ou continuar uma etapa não autorizam commits automaticamente. Incorpore os ajustes pedidos e apresente novamente o resultado até a aprovação.
- Após a aprovação, faça commits graduais, com uma parte coerente por commit e os testes correspondentes. Execute as verificações obrigatórias em cada commit; não inclua alterações fora do escopo aprovado. Se o usuário pedir novos ajustes antes de terminar os commits, conclua os ajustes e aguarde sua validação antes de commitar essa parte.
- Após concluir e validar a entrega com o usuário, envie a branch e abra uma pull request para a `main`, com o problema resolvido, mudanças, verificações e limitações relevantes. Isso não autoriza merge automático: aguarde autorização explícita para incorporar a PR à `main`, pois esse merge pode disparar a publicação em produção. Verificações obrigatórias da PR devem passar antes do merge; documentar esta regra não substitui configurar a proteção da branch no GitHub.
- Acompanhe o fluxo de publicação existente: testes e build no GitHub Actions, publicação na Cloudflare somente após sucesso e para a `main`. Não crie uma segunda publicação automática em paralelo. Em rollback emergencial, confira publicações em andamento e depois alinhe o código por uma PR de reversão/correção, preservando o histórico e a compatibilidade dos arquivos e dados locais.
- Respeite o MVP e o roadmap. Não implemente funcionalidades futuras sem solicitação.
- Não publique, crie repositório remoto ou altere dados externos sem autorização aplicável.
- Antes de editar, leia as instruções adicionais e confira alterações existentes. Não sobrescreva trabalho do usuário.
- Ao entregar, informe mudanças, resultado das verificações, limitações e hash do commit quando houver.
- Em cada etapa, explique o que foi feito, o que já pode ser usado na tela, como foi verificado e qual é a próxima etapa. Distinga lógica interna de funcionalidade disponível na interface; não apresente regras ainda desconectadas como recursos utilizáveis.

## Comandos

- `npm ci`: instala versões do lockfile e prepara o hook local.
- `npm test`: executa a suíte uma vez.
- `npm run test:watch`: executa em modo contínuo durante desenvolvimento.
- `npm run test:coverage`: executa a suíte, mede cobertura e verifica limites.
- `npm run check`: lint, formatação, cobertura/testes e build com TypeScript.

O hook é instalado por clone após `npm ci`; não depende da memória deste chat. O GitHub Actions executa a mesma verificação em push e pull request. A execução no GitHub só pode ser confirmada depois que existir um remoto e o workflow rodar.
