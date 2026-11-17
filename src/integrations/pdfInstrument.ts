import { degrees, rgb, type PDFImage, type PDFPage } from 'pdf-lib'
import type { InstrumentKind } from '../domain/stage'
import { instrumentIconPath } from '../visuals/instrumentIcon'

const iconSources = import.meta.glob<string>('./instruments/*.svg', {
  base: '../visuals',
  query: '?raw',
  import: 'default',
  eager: true,
})

// Our SVG assets use a centered viewBox and flat paths. Read their geometry
// once so PDF export stays vector-based and independent of the browser DOM.
const iconPaths = Object.fromEntries(
  Object.entries(iconSources).map(([file, svg]) => [
    file,
    Array.from(svg.matchAll(/<path\s+([^>]+)\/>/g), ([, attributes]) =>
      Object.fromEntries(
        Array.from(
          attributes.matchAll(/([\w-]+)="([^"]*)"/g),
          ([, name, value]) => [name, value],
        ),
      ),
    ),
  ]),
)

function pdfColor(hex: string) {
  const color = Number.parseInt(hex.slice(1), 16)
  return rgb(
    (color >>> 16) / 255,
    ((color >>> 8) & 255) / 255,
    (color & 255) / 255,
  )
}

export function drawPdfInstrument(
  page: PDFPage,
  instrument: { kind: InstrumentKind; rotation: number },
  x: number,
  y: number,
  radius: number,
  singleMap = false,
) {
  const drawing = iconPaths[instrumentIconPath(instrument.kind)]
  if (!drawing) {
    // The Take artwork is deferred. Retain its original generic stage marker.
    const ink = singleMap ? rgb(0.2, 0.28, 0.18) : rgb(0.063, 0.09, 0.275)
    const angle = (instrument.rotation * Math.PI) / 180
    page.drawEllipse({
      x,
      y,
      xScale: radius,
      yScale: singleMap ? radius * 0.75 : radius,
      color: singleMap ? rgb(0.9, 0.78, 0.55) : rgb(0.91, 0.76, 0.62),
      borderColor: ink,
      borderWidth: singleMap ? 1 : 0.7,
    })
    page.drawLine({
      start: { x, y },
      end: { x: x + Math.sin(angle) * radius, y: y + Math.cos(angle) * radius },
      color: ink,
      thickness: singleMap ? 2 : 0.7,
    })
    return
  }
  for (const { d, fill, stroke, 'stroke-width': width } of drawing) {
    page.drawSvgPath(d, {
      x,
      y,
      scale: radius / 50,
      rotate: degrees(-instrument.rotation),
      color: fill !== 'none' ? pdfColor(fill) : undefined,
      borderColor: stroke ? pdfColor(stroke) : undefined,
      borderWidth: width ? Number(width) : undefined,
    })
  }
}

export function drawPdfInstrumentImage(
  page: PDFPage,
  image: PDFImage,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
) {
  const angle = (-rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  page.drawImage(image, {
    x: cx - radius * cos + radius * sin,
    y: cy - radius * sin - radius * cos,
    width: 2 * radius,
    height: 2 * radius,
    rotate: degrees(-rotation),
  })
}
