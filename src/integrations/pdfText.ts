import type { PDFFont } from 'pdf-lib'

const characterSets = new WeakMap<PDFFont, Set<number>>()

export function pdfTextWidth(font: PDFFont, text: string, size: number) {
  let supported = characterSets.get(font)
  if (!supported) {
    supported = new Set(font.getCharacterSet())
    characterSets.set(font, supported)
  }
  if ([...text].some((char) => !supported.has(char.codePointAt(0)!))) {
    throw new Error(
      'Há caracteres sem suporte na fonte do PDF. Revise os textos antes de exportar.',
    )
  }
  return font.widthOfTextAtSize(text, size)
}
