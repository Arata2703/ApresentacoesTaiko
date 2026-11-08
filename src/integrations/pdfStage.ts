import { rgb, type PDFPage } from 'pdf-lib'
import type { MusicMap, Person } from '../domain/presentation/model'
import { getInstrumentType } from '../domain/stage'
import type { Fonts } from './pdfInstructions'
import { pdfTextWidth } from './pdfText'

export const navy = rgb(0.063, 0.09, 0.275)
export const muted = rgb(0.28, 0.34, 0.46)
export const rule = rgb(0.79, 0.83, 0.9)
export const soft = rgb(0.93, 0.95, 0.98)

export function drawLabel(
  page: PDFPage,
  fonts: Fonts,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  bold = false,
  color = navy,
) {
  const font = fonts[bold ? 1 : 0]
  const label = text.replace(/\s+/g, ' ').trim()
  const measured = pdfTextWidth(font, label, size)
  page.drawText(label, {
    x,
    y,
    font,
    size: Math.min(size, (width * size) / Math.max(1, measured)),
    color,
  })
}

export function drawStage(
  page: PDFPage,
  fonts: Fonts,
  map: MusicMap | null,
  people: readonly Person[],
  box: { x: number; y: number; width: number; height: number },
  missing: string,
) {
  if (!map) {
    drawLabel(
      page,
      fonts,
      missing,
      box.x,
      box.y + box.height / 2,
      box.width,
      11,
      false,
      muted,
    )
    return
  }
  const scale = Math.min(
    box.width / map.stage.width,
    box.height / map.stage.depth,
  )
  const width = map.stage.width * scale,
    height = map.stage.depth * scale
  const x = box.x + (box.width - width) / 2,
    y = box.y + (box.height - height) / 2
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: soft,
    borderColor: rule,
    borderWidth: 1,
  })
  for (let i = 1; i < 6; i++) {
    const xx = x + (width * i) / 6
    page.drawLine({
      start: { x: xx, y },
      end: { x: xx, y: y + height },
      color: rule,
      thickness: 0.5,
    })
  }
  for (let i = 1; i < 4; i++) {
    const yy = y + (height * i) / 4
    page.drawLine({
      start: { x, y: yy },
      end: { x: x + width, y: yy },
      color: rule,
      thickness: 0.5,
    })
  }
  const compact = box.width < 300
  const r = Math.min(compact ? 7 : 12, width / 9, height / 12)
  const names = new Map(people.map((person) => [person.id, person.name]))
  for (const item of map.instruments) {
    const cx = Math.max(
      x + r,
      Math.min(x + width - r, x + item.position.x * scale),
    )
    const cy = Math.max(
      y + r,
      Math.min(y + height - r, y + height - item.position.y * scale),
    )
    const color =
      item.kind === 'shime' ? rgb(0.76, 0.8, 0.9) : rgb(0.91, 0.76, 0.62)
    if (item.kind === 'shime')
      page.drawRectangle({
        x: cx - r,
        y: cy - r * 0.68,
        width: 2 * r,
        height: 1.36 * r,
        color,
        borderColor: navy,
        borderWidth: 0.7,
      })
    else
      page.drawCircle({
        x: cx,
        y: cy,
        size: r,
        color,
        borderColor: navy,
        borderWidth: 0.7,
      })
    const angle = (item.rotation * Math.PI) / 180
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + Math.sin(angle) * r, y: cy + Math.cos(angle) * r },
      color: navy,
      thickness: 0.7,
    })
  }
  for (const item of map.instruments) {
    const cx = x + item.position.x * scale
    const cy = y + height - item.position.y * scale
    const players = item.playerIds
      .map((id) => names.get(id))
      .filter(Boolean)
      .join('/')
    const label = players || getInstrumentType(item.kind).name
    const size = compact ? 8 : 10
    const span = Math.min(width, compact ? 120 : 220)
    const labelWidth = Math.min(span, pdfTextWidth(fonts[1], label, size))
    const left = Math.max(
      x,
      Math.min(x + width - labelWidth, cx - labelWidth / 2),
    )
    const baseline = Math.max(
      y + 12,
      Math.min(y + height - 17, cy - r - size - 2),
    )
    drawLabel(page, fonts, label, left, baseline, span, size, true)
  }
  drawLabel(
    page,
    fonts,
    'PLATEIA',
    x + 5,
    y + height - 10,
    width - 5,
    7,
    true,
    muted,
  )
  drawLabel(
    page,
    fonts,
    'FUNDO DO PALCO',
    x + 5,
    y + 3,
    width - 5,
    7,
    true,
    muted,
  )
}
