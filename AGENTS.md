# Instruções para trabalhar neste repositório

Estas regras valem para qualquer chat ou agente que modificar o projeto.

## Testes e verificação obrigatória

- Antes de cada commit, execute `npm run check` e só faça o commit se todos os passos passarem. O hook pre-commit também executa esse comando.
- Cada funcionalidade nova deve incluir testes automatizados dos comportamentos entregues. Correções de bugs devem ter um teste de regressão que reproduza o problema.
- Atualize os testes quando um requisito mudar; preserve a verificação dos comportamentos que continuam válidos.
- Teste regras de domínio isoladas e os fluxos de interface do ponto de vista do usuário, incluindo entradas inválidas, limites, erros e prevenção de perda de dados quando aplicável.
- Use Vitest, Testing Library e user-event. Evite testar detalhes internos, classes CSS, snapshots extensos e mocks excessivos. Não escreva testes que apenas repitam a implementação.
- Mantenha os limites de cobertura configurados em `vitest.config.ts`. Arquivos novos em `src` devem entrar no relatório, mesmo sem teste. Não reduza limites ou exclua código funcional apenas para fazer a verificação passar.
- Cobertura não prova ausência de bugs nem qualidade visual. Confira no navegador quando a alteração afetar layout ou interações; não trate a cobertura como substituta dos critérios de aceite.
- Se uma verificação falhar ou não puder ser executada, corrija a causa ou relate o bloqueio. Não declare verificação concluída sem evidência.
- Não contorne os hooks com `--no-verify`, `HUSKY=0`, `core.hooksPath` alternativo ou outro mecanismo para fazer commit de mudanças não verificadas.

## Modularização

- `src/domain/`: tipos e regras de negócio, independentes de React, DOM, armazenamento e bibliotecas visuais.
- `src/features/`: componentes, hooks e composição organizados por funcionalidade.
- Mantenha `App.tsx` como ponto de composição. Extraia componentes com responsabilidade clara antes de ampliar uma tela grande.
- Integrações futuras de salvamento, importação/exportação e PDF devem ter módulos próprios. Não misture seus detalhes com regras de domínio.
- Use TypeScript estrito e CSS Modules. Adicione dependências e camadas apenas quando houver necessidade concreta.

## Commits e escopo

- Faça commits graduais, com uma etapa coerente por commit, incluindo os testes correspondentes.
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
