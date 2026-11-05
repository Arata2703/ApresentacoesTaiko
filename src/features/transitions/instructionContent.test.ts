import { describe, expect, it } from 'vitest'
import { instructionHtml, sanitizeInstructions } from './instructionContent'

describe('conteúdo das instruções', () => {
  it('migra texto e marcações simples sem interpretar HTML como instrução executável', () => {
    const html = instructionHtml(
      'Texto **forte** e *leve* e ***ambos***\n\n- um\n- dois\n3. três\n4. quatro\nFim\n<script>bad()</script> & "texto"',
    )
    expect(html).toContain('<strong>forte</strong>')
    expect(html).toContain('<em>leve</em>')
    expect(html).toContain('<strong><em>ambos</em></strong>')
    expect(html).toContain('<ul><li>um</li><li>dois</li></ul>')
    expect(html).toContain('<ol><li>três</li><li>quatro</li></ol>')
    expect(html).toContain('<p><br></p>')
    expect(html).toContain(
      '&lt;script&gt;bad()&lt;/script&gt; &amp; &quot;texto&quot;',
    )
    expect(instructionHtml('- Último')).toBe('<ul><li>Último</li></ul>')
  })
  it('mantém somente elementos de formatação, sem atributos ou conteúdo ativo', () => {
    expect(
      sanitizeInstructions(
        '<!-- nota --><div class="x"><p onclick="bad()"><b>A</b><i>B</i><span style="color:red">C</span><br></p><ul><li>D</li></ul><ol><li>E</li></ol></div><script>bad()</script><iframe>bad()</iframe><svg><text>bad()</text></svg><img src=x onerror=bad()>',
      ),
    ).toBe(
      '<div><p><strong>A</strong><em>B</em>C<br></p><ul><li>D</li></ul><ol><li>E</li></ol></div>',
    )
    expect(instructionHtml('<p><strong>Seguro</strong></p>', 'html')).toBe(
      '<p><strong>Seguro</strong></p>',
    )
    expect(sanitizeInstructions('<p><br></p>')).toBe('')
  })
})
