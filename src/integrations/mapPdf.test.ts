// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { createMapPdf } from './mapPdf'
import { createInstrument } from '../domain/stage'
import { presentationFixture } from '../test/presentationFixture'
import { projectMap } from '../features/editor/editorProjection'
import { importPresentation, serializePresentation } from './presentationFile'

const font = new Uint8Array(
  await readFile(
    'node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff',
  ),
)
describe('PDF vetorial real', () => {
  it('gera a página do mesmo mapa validado e reaberto que alimenta o editor', async () => {
    const loaded = importPresentation(
      serializePresentation(presentationFixture()),
    )
    if (loaded.status !== 'valid') throw new Error('Arquivo deveria ser válido')
    const page = projectMap(loaded.presentation, 'a')!
    expect(page.stage).toEqual({ width: 12, depth: 8 })
    expect(page.instruments[0]).toMatchObject({
      x: 3.25,
      y: 1.5,
      rotation: 315,
      player: 'Ana/João',
    })
    const pdf = await PDFDocument.load(await createMapPdf(page, font))
    expect(pdf.getPageCount()).toBe(1)
    expect(pdf.getTitle()).toBe('Mostra Japão - Ibuki')
  })
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
  it('informa quando a fonte não contém um caractere do mapa', async () => {
    await expect(
      createMapPdf({ title: '打', song: '', instruments: [] }, font),
    ).rejects.toThrow('caracteres sem suporte')
  })
  it('exporta um mapa com nome de tocador de 80 caracteres', async () => {
    const bytes = await createMapPdf(
      {
        title: '',
        song: '',
        instruments: [
          { ...createInstrument('okedo', 'a', 0), player: 'W'.repeat(80) },
        ],
      },
      font,
    )
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1)
  })
})
