import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { ManualMaterial } from '../domain/presentation/model'

const rowsPerPage = 18

export async function createMaterialsPdf(
  title: string,
  materials: readonly ManualMaterial[],
  fontBytes: Uint8Array,
) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes, { subset: true })
  const supported = new Set(font.getCharacterSet())
  const ink = rgb(0.13, 0.18, 0.31)
  const pageCount = Math.max(1, Math.ceil(materials.length / rowsPerPage))
  pdf.setTitle(`${title} - Materiais manuais`)

  for (let index = 0; index < pageCount; index++) {
    const page = pdf.addPage([841.89, 595.28])
    function draw(
      text: string,
      x: number,
      y: number,
      size: number,
      width: number,
    ) {
      const label = text.replace(/\s+/g, ' ').trim()
      if ([...label].some((char) => !supported.has(char.codePointAt(0)!))) {
        throw new Error(
          'Há caracteres sem suporte na fonte do PDF. Revise os nomes antes de exportar.',
        )
      }
      const measured = font.widthOfTextAtSize(label, size)
      page.drawText(label, {
        x,
        y,
        size: Math.min(size, (width * size) / Math.max(1, measured)),
        font,
        color: ink,
      })
    }
    draw(title, 35, 550, 20, 770)
    draw('Materiais manuais', 35, 518, 16, 770)
    page.drawRectangle({
      x: 35,
      y: 465,
      width: 772,
      height: 27,
      color: rgb(0.92, 0.94, 0.98),
    })
    draw('Material', 46, 474, 12, 600)
    draw('Quantidade', 676, 474, 12, 120)
    const start = index * rowsPerPage
    materials.slice(start, start + rowsPerPage).forEach((material, row) => {
      const y = 448 - row * 22
      draw(material.name, 46, y, 12, 605)
      draw(String(material.quantity), 676, y, 12, 120)
      page.drawLine({
        start: { x: 35, y: y - 7 },
        end: { x: 807, y: y - 7 },
        thickness: 0.4,
        color: rgb(0.83, 0.87, 0.93),
      })
    })
    draw(`Página ${index + 1} de ${pageCount}`, 35, 35, 10, 770)
  }
  return new Uint8Array(await pdf.save())
}
