import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { Presentation } from '../domain/presentation/model'
import { transitionMaps } from '../domain/presentation/sequence'
import { byId } from '../domain/presentation/rules'
import {
  drawInstructions,
  instructionPages,
  type Fonts,
} from './pdfInstructions'
import { drawLabel, drawStage, muted, navy, rule, soft } from './pdfStage'

const width = 841.89
const height = 595.28
const margin = 42
const bodyWidth = width - margin * 2
type FontBytes = readonly [Uint8Array, Uint8Array, Uint8Array, Uint8Array]

export async function createPresentationPdf(
  presentation: Presentation,
  bytes: FontBytes,
) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const embed = (source: Uint8Array) => pdf.embedFont(source, { subset: true })
  const fonts: Fonts = await Promise.all([
    embed(bytes[0]),
    embed(bytes[1]),
    embed(bytes[2]),
    embed(bytes[3]),
  ])
  const title = presentation.title || 'Apresentação sem título'
  pdf.setTitle(title)

  function addPage(section: string, heading: string, subtitle: string) {
    const page = pdf.addPage([width, height])
    page.drawRectangle({ x: 0, y: 540, width, height: 55.28, color: navy })
    page.drawRectangle({
      x: 0,
      y: 538,
      width,
      height: 2,
      color: rgb(0.9, 0.73, 0.29),
    })
    drawLabel(
      page,
      fonts,
      'TAIKO / PALCO',
      margin,
      562,
      200,
      12,
      true,
      rgb(1, 1, 1),
    )
    drawLabel(
      page,
      fonts,
      title,
      530,
      562,
      width - 530 - margin,
      11,
      true,
      rgb(1, 1, 1),
    )
    drawLabel(page, fonts, section, margin, 508, bodyWidth, 10, true, muted)
    drawLabel(page, fonts, heading, margin, 475, bodyWidth, 28, true)
    drawLabel(page, fonts, subtitle, margin, 452, bodyWidth, 12, false, muted)
    return page
  }

  function table(
    heading: string,
    subtitle: string,
    columns: { title: string; width: number }[],
    rows: string[][],
    empty: string,
  ) {
    const rowCount = 9
    for (let start = 0; start < Math.max(1, rows.length); start += rowCount) {
      const page = addPage(
        heading.toUpperCase(),
        heading,
        start ? `${subtitle} / Continuação` : subtitle,
      )
      function drawRow(values: string[], y: number, header = false) {
        page.drawRectangle({
          x: margin,
          y,
          width: bodyWidth,
          height: 36,
          borderColor: rule,
          borderWidth: 0.5,
          color: header ? soft : rgb(1, 1, 1),
        })
        let x = margin + 12
        values.forEach((value, index) => {
          const span = columns[index]!.width
          drawLabel(
            page,
            fonts,
            value,
            x,
            y + 12,
            span - 24,
            header ? 11 : 13,
            header,
          )
          x += span
        })
      }
      drawRow(
        columns.map((column) => column.title),
        397,
        true,
      )
      rows
        .slice(start, start + rowCount)
        .forEach((row, index) => drawRow(row, 361 - index * 36))
      if (!rows.length)
        drawLabel(
          page,
          fonts,
          empty,
          margin + 12,
          374,
          bodyWidth - 24,
          12,
          false,
          muted,
        )
    }
  }

  const slides = presentation.sequence.map((entry) => {
    if (entry.kind === 'map') {
      const map = byId(presentation.maps, entry.id)
      return { kind: entry.kind, map, title: map.title || 'Música sem título' }
    }
    const transition = byId(presentation.transitions, entry.id)
    return {
      kind: entry.kind,
      transition,
      title: transition.tsunagiName || 'Tsunagi sem nome',
    }
  })
  table(
    'Integrantes',
    'Lista da apresentação',
    [{ title: 'Nome do integrante', width: bodyWidth }],
    presentation.people.map((person) => [person.name]),
    'Nenhum integrante cadastrado.',
  )
  table(
    'Ordem da apresentação',
    'Sequência de músicas e tsunagis',
    [
      { title: 'Ordem', width: 80 },
      { title: 'Tipo', width: 155 },
      { title: 'Nome', width: bodyWidth - 235 },
    ],
    slides.map((slide, index) => [
      String(index + 1).padStart(2, '0'),
      slide.kind === 'map' ? 'Música' : 'Tsunagi',
      slide.title,
    ]),
    'Nenhum slide cadastrado.',
  )

  slides.forEach((slide, index) => {
    const order = String(index + 1).padStart(2, '0')
    if (slide.kind === 'map') {
      const { map } = slide
      const page = addPage(
        `${order} / MAPA DE PALCO`,
        slide.title,
        `Palco de ${map.stage.width} × ${map.stage.depth} m`,
      )
      drawStage(
        page,
        fonts,
        map,
        presentation.people,
        { x: margin, y: 87, width: bodyWidth, height: 321 },
        '',
      )
      drawLabel(
        page,
        fonts,
        'Símbolos ilustrativos · Retângulo: Shime · Círculo: demais instrumentos',
        margin,
        65,
        bodyWidth,
        10,
        false,
        muted,
      )
      return
    }
    const { previous, next } = transitionMaps(presentation, slide.transition.id)
    const subtitle = `${previous?.title || (previous ? 'Música sem título' : 'Entrada')} para ${next?.title || (next ? 'Música sem título' : 'Saída')}`
    const lines = instructionPages(slide.transition, fonts, 466, 333)
    lines.forEach((content, part) => {
      const page = addPage(
        `${order} / TSUNAGI`,
        slide.title,
        part ? `${subtitle} / Continuação` : subtitle,
      )
      drawStage(
        page,
        fonts,
        previous,
        presentation.people,
        { x: margin, y: 246, width: 255, height: 170 },
        'Sem mapa anterior',
      )
      drawStage(
        page,
        fonts,
        next,
        presentation.people,
        { x: margin, y: 51, width: 255, height: 170 },
        'Sem próximo mapa',
      )
      page.drawLine({
        start: { x: 307, y: 51 },
        end: { x: 307, y: 425 },
        color: rule,
        thickness: 0.65,
      })
      drawLabel(
        page,
        fonts,
        part ? 'Instruções · continuação' : 'Instruções',
        319,
        420,
        466,
        13,
        true,
      )
      drawInstructions(page, content, fonts, 319, 402)
    })
  })

  table(
    'Materiais manuais',
    'Itens registrados manualmente para a apresentação',
    [
      { title: 'Material', width: bodyWidth - 130 },
      { title: 'Quantidade', width: 130 },
    ],
    presentation.materials.map((item) => [item.name, String(item.quantity)]),
    'Nenhum material cadastrado.',
  )

  const pages = pdf.getPages()
  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: margin, y: 40 },
      end: { x: width - margin, y: 40 },
      color: rule,
      thickness: 0.6,
    })
    drawLabel(page, fonts, title, margin, 22, bodyWidth - 80, 10, false, muted)
    drawLabel(
      page,
      fonts,
      `${index + 1} / ${pages.length}`,
      width - 85,
      22,
      43,
      10,
      false,
      muted,
    )
  })
  return new Uint8Array(await pdf.save())
}
