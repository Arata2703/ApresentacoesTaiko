import { PDFDocument, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { getInstrumentType, stageSize } from '../domain/stage'
import type { MapDraft } from './mapFile'

function fittedSize(font: PDFFont, text: string, width: number, size: number) {
  const supported = new Set(font.getCharacterSet())
  if ([...text].some((char) => !supported.has(char.codePointAt(0)!))) {
    throw new Error(
      'Há caracteres sem suporte na fonte desta demonstração. Revise os nomes antes de exportar.',
    )
  }
  const result = Math.min(
    size,
    (width / Math.max(1, font.widthOfTextAtSize(text, size))) * size,
  )
  if (result < 8)
    throw new Error(
      'Um nome é longo demais para o PDF de demonstração. Abrevie-o antes de exportar.',
    )
  return result
}

/** Vector output: stage geometry and labels remain sharp when printed. */
export async function createMapPdf(
  map: MapDraft,
  fontBytes: Uint8Array,
): Promise<Uint8Array<ArrayBuffer>> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes, { subset: true })
  const page = pdf.addPage([841.89, 595.28])
  const ink = rgb(0.2, 0.28, 0.18)
  const title = map.title || 'Apresentação sem título'
  const song = map.song || 'Música sem título'
  pdf.setTitle(`${title} - ${song}`)
  page.drawText(title, {
    x: 35,
    y: 555,
    font,
    size: fittedSize(font, title, 770, 20),
    color: ink,
  })
  page.drawText(song, {
    x: 35,
    y: 530,
    font,
    size: fittedSize(font, song, 770, 14),
    color: ink,
  })
  const x = 95,
    y = 62,
    width = 650,
    height = 390
  page.drawText('PLATEIA', { x: 392, y: 470, font, size: 11, color: ink })
  page.drawRectangle({ x, y, width, height, borderColor: ink, borderWidth: 1 })
  for (let column = 1; column < 10; column++) {
    page.drawLine({
      start: { x: x + column * 65, y },
      end: { x: x + column * 65, y: y + height },
      color: rgb(0.88, 0.91, 0.86),
      thickness: 0.5,
    })
  }
  for (let row = 1; row < 6; row++) {
    page.drawLine({
      start: { x, y: y + row * 65 },
      end: { x: x + width, y: y + row * 65 },
      color: rgb(0.88, 0.91, 0.86),
      thickness: 0.5,
    })
  }
  for (const item of map.instruments) {
    const type = getInstrumentType(item.kind)
    const cx = x + (item.x / stageSize.width) * width
    const cy = y + height - (item.y / stageSize.depth) * height
    const radians = (item.rotation * Math.PI) / 180
    page.drawEllipse({
      x: cx,
      y: cy,
      xScale: 16,
      yScale: 12,
      color: rgb(0.9, 0.78, 0.55),
      borderColor: ink,
      borderWidth: 1,
    })
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + Math.sin(radians) * 16, y: cy + Math.cos(radians) * 16 },
      color: ink,
      thickness: 2,
    })
    const label = `${type.name}${item.player ? ` - ${item.player}` : ''}`
    const size = fittedSize(font, label, 120, 10)
    const labelWidth = font.widthOfTextAtSize(label, size)
    const labelX = Math.max(36, Math.min(805 - labelWidth, cx - labelWidth / 2))
    page.drawRectangle({
      x: labelX - 2,
      y: cy - 29,
      width: labelWidth + 4,
      height: 14,
      color: rgb(1, 1, 1),
    })
    page.drawText(label, { x: labelX, y: cy - 26, font, size, color: ink })
  }
  page.drawText('FUNDO DO PALCO | 10 x 6 m | Ícones ilustrativos', {
    x: 275,
    y: 36,
    font,
    size: 9,
    color: ink,
  })
  return new Uint8Array(await pdf.save())
}
