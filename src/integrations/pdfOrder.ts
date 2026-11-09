import { breakTextIntoLines, type PDFPage } from 'pdf-lib'
import type { Fonts } from './pdfInstructions'
import { drawLabel, muted, navy, rule, soft } from './pdfStage'
import { pdfTextWidth } from './pdfText'

interface OrderSlide {
  kind: 'map' | 'transition'
  title: string
}

export function drawPdfOrder(
  fonts: Fonts,
  slides: readonly OrderSlide[],
  addPage: (section: string, title: string, subtitle: string) => PDFPage,
) {
  for (let start = 0; start < Math.max(1, slides.length); start += 20) {
    const page = addPage(
      'REPERTÓRIO',
      'Ordem da apresentação',
      'Sequência de músicas e tsunagis' + (start ? ' / Continuação' : ''),
    )
    const items = slides.slice(start, start + 20)
    if (!items.length) {
      drawLabel(
        page,
        fonts,
        'Nenhum slide cadastrado.',
        42,
        397,
        757,
        12,
        false,
        muted,
      )
    }
    for (const [index, slide] of items.entries()) {
      const column = index % 5
      const row = Math.floor(index / 5)
      const x = 42 + column * 152
      const y = 344 - row * 92
      page.drawSvgPath(
        'M4 0 H128 Q132 0 132 4 V72 Q132 76 128 76 H4 Q0 76 0 72 V4 Q0 0 4 0 Z',
        {
          x,
          y: y + 76,
          color: slide.kind === 'transition' ? soft : undefined,
          borderColor: rule,
          borderWidth: 0.8,
        },
      )
      drawLabel(
        page,
        fonts,
        `${String(start + index + 1).padStart(2, '0')} · ${slide.kind === 'map' ? 'MAPA DE PALCO' : 'TSUNAGI'}`,
        x + 10,
        y + 59,
        112,
        8,
        false,
        muted,
      )
      const title = slide.title.replace(/\s+/g, ' ').trim()
      let size = 11.5
      const wrap = () => {
        const measure = (text: string) => pdfTextWidth(fonts[1], text, size)
        const breaks = title.split(' ').some((word) => measure(word) > 112)
          ? ['']
          : [' ']
        return breakTextIntoLines(title, breaks, 112, measure)
      }
      let lines = wrap()
      while (lines.length * size * 1.22 > 43) {
        size -= 0.5
        lines = wrap()
      }
      page.drawText(lines.join('\n'), {
        x: x + 10,
        y: y + 47 - size,
        font: fonts[1],
        size,
        lineHeight: size * 1.22,
        color: navy,
      })
      if (index === items.length - 1) continue
      const points =
        column < 4
          ? [
              { x: x + 136, y: y + 38 },
              { x: x + 148, y: y + 38 },
            ]
          : [
              { x: x + 132, y: y + 38 },
              { x: 795, y: y + 38 },
              { x: 795, y: y - 8 },
              { x: 108, y: y - 8 },
              { x: 108, y: y - 16 },
            ]
      for (let point = 1; point < points.length; point++) {
        page.drawLine({
          start: points[point - 1]!,
          end: points[point]!,
          color: muted,
          thickness: 0.8,
        })
      }
      const end = points.at(-1)!
      const head =
        column < 4
          ? [
              { x: end.x - 5, y: end.y - 3 },
              { x: end.x - 5, y: end.y + 3 },
            ]
          : [
              { x: end.x - 3, y: end.y + 5 },
              { x: end.x + 3, y: end.y + 5 },
            ]
      for (const start of head)
        page.drawLine({ start, end, color: muted, thickness: 0.8 })
    }
  }
}
