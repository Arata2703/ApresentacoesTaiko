# M02 - Prova técnica de palco e PDF

## Resultado

A demonstração permite adicionar instrumentos, arrastar, girar pelo painel, nomear tocadores, baixar um mapa editável, reabri-lo e exportar uma página A4 horizontal. Esta entrega valida a abordagem técnica; não encerra o editor e a persistência do MVP.

## Decisões

- Manter React, TypeScript, Vite e CSS Modules, conforme familiaridade e escolha do projeto.
- Usar elementos HTML e Pointer Events para o arraste da prova. A captura mantém o movimento mesmo fora do ícone; os deslocamentos são convertidos para metros usando o tamanho real do palco na tela. Setas e campos continuam disponíveis. A proporção visual permanece 10:6, sem altura mínima que distorça a escala.
- React Konva permanece uma alternativa para o editor futuro, mas não foi integrado nem submetido a benchmark. O arraste simples funcionou com a base existente, sem nova biblioteca visual. Reavaliar essa decisão ao implementar seleção múltipla, agrupamento Kumi e transformações em conjunto.
- Gerar PDF com pdf-lib e fonte Noto Sans Latin incorporada via fontkit. A saída usa vetores e texto, sem capturar a interface como imagem. O gerador recebe apenas dados e bytes da fonte; não depende de React ou de armazenamento.
- Carregar o gerador PDF somente ao exportar. A fonte acompanha o build; não depende de uma URL de fonte externa durante a exportação. As dependências e a licença SIL Open Font License da fonte estão nos pacotes versionados pelo lockfile.
- Usar JSON identificado por `format: taiko-map` e `version: 1` para o mapa da prova. Títulos, instrumentos, IDs, nomes, posições e rotações são preservados. Seleção e mensagens da interface não são exportadas. A importação valida antes de modificar o editor e pede confirmação para substituir o trabalho aberto.

Referências: [Pointer capture no navegador](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) e [documentação do pdf-lib](https://pdf-lib.js.org/).

## Evidências de validação

- `npm run check`: lint, formatação, 82 testes automatizados com cobertura e build TypeScript/Vite aprovados. Os arquivos de produção medidos atingiram 100% nas quatro métricas, sem alterar limites ou excluir código funcional.
- Testes reais do PDF: geração e reabertura com pdf-lib, uma página de 841,89 x 595,28 pontos, título com acentos, fonte válida, mapa vazio, rejeição de texto sem suporte e nomes que não cabem.
- Testes do arquivo: ciclo de salvamento/abertura, versões desconhecidas, estrutura incorreta, coordenadas/rotações inválidas, IDs duplicados e tamanho excessivo. Testes de interface cobrem confirmação, cancelamento e preservação do mapa em caso de erro.
- No navegador, o arraste de um okedo foi conferido de (2, 2) para (4, 3) metros. Rotação de 90 graus e exportação pela interface também foram verificadas.
- PDF de conferência com quatro instrumentos renderizado em PNG e inspecionado: nomes legíveis, acentos preservados, plateia no topo e fundo embaixo. A extração com pypdf confirmou uma página A4 horizontal e os textos esperados.

## Limitações e riscos para as próximas atividades

- Palco fixo em 10 x 6 metros nesta prova. Medidas configuráveis e dimensões reais dos instrumentos continuam pendentes para o editor do MVP.
- Os símbolos do editor são ilustrativos. No PDF desta prova todos são elipses com identificação textual e traço de orientação; a reprodução do catálogo visual completo fica para a composição final de PDF na M12.
- A fonte desta prova cobre Latin, incluindo os acentos em português. Caracteres ausentes, como kanji, interrompem a exportação com mensagem explícita. Incorporar outras famílias/subconjuntos precisa ser decidido na M12.
- Nomes que exigiriam fonte menor que 8 pontos são recusados, sem corte silencioso. Objetos e nomes sobrepostos no mapa continuam sobrepostos no PDF; não há detecção de colisões.
- O build avisa sobre o módulo PDF grande: aproximadamente 1,13 MB minificado (506 kB gzip). Ele é carregado sob demanda; medir o tempo de exportação em computador modesto e revisar tamanho na M12. Não foi feito teste de desempenho com muitos instrumentos ou em vários navegadores.
- Importação limitada a 1 MB de arquivo e 500 instrumentos. O formato é específico da prova, sem promessa de compatibilidade definitiva. A M04 deverá tratar o formato completo, migrações e limites definitivos. O download desta prova valida a reabertura antes de oferecer o arquivo, recusando dados fora desses limites.
- Sem salvamento automático, histórico, múltiplas músicas ou reabertura de PDF como projeto. O usuário deve guardar o JSON; o PDF serve para visualizar e imprimir.
- Não há deploy, validação remota da CI ou teste de impressão física. Nenhuma dessas etapas foi declarada concluída pela M02.

## Continuidade

M03 define o modelo completo da apresentação; M04 define seu contrato de arquivo. M07 amplia o editor e M12 trata a composição integral do PDF. Preservar adaptadores separados para evoluir essas partes sem misturar regras com a interface.
