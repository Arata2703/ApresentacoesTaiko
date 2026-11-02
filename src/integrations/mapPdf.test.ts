// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { createMapPdf } from './mapPdf'
import { createInstrument } from '../domain/stage'

const font = new Uint8Array(
  await readFile(
    'node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff',
  ),
)
describe('PDF vetorial real', () => {
  it('gera uma página A4 horizontal com fonte incorporada e acentos', async () => {
    const bytes = await createMapPdf(
      {
        title: 'Mostra Japão',
        song: 'Ibuki',
        instruments: [
          {
            ...createInstrument('okedo', 'a', 0),
            player: 'João',
            rotation: 90,
          },
          createInstrument('fue', 'b', 1),
        ],
      },
      font,
    )
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPages()).toHaveLength(1)
    expect(pdf.getPage(0).getSize()).toEqual({ width: 841.89, height: 595.28 })
    expect(pdf.getTitle()).toBe('Mostra Japão - Ibuki')
    expect(bytes.length).toBeGreaterThan(1000)
  })
  it('aceita mapa vazio e títulos vazios com nomes alternativos', async () => {
    const pdf = await PDFDocument.load(
      await createMapPdf({ title: '', song: '', instruments: [] }, font),
    )
    expect(pdf.getTitle()).toBe('Apresentação sem título - Música sem título')
  })
  it('recusa nomes que não cabem ou glifos sem suporte em vez de perder conteúdo', async () => {
    await expect(
      createMapPdf({ title: '打', song: '', instruments: [] }, font),
    ).rejects.toThrow('caracteres sem suporte')
    await expect(
      createMapPdf(
        {
          title: '',
          song: '',
          instruments: [
            { ...createInstrument('okedo', 'a', 0), player: 'W'.repeat(80) },
          ],
        },
        font,
      ),
    ).rejects.toThrow('longo demais')
  })
})
