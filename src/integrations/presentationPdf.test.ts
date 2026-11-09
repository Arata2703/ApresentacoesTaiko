import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { expect, it } from 'vitest'
import { addMap } from '../domain/presentation/maps'
import { presentationFixture } from '../test/presentationFixture'
import { createPresentation } from '../domain/presentation/presentation'
import { createPresentationPdf } from './presentationPdf'
import { instructionBlocks, paginateInstructions } from './pdfInstructions'

const fonts = (await Promise.all(
  (['400-normal', '700-normal', '400-italic', '700-italic'] as const).map(
    async (variant) =>
      new Uint8Array(
        await readFile(
          `node_modules/@fontsource/noto-sans/files/noto-sans-latin-${variant}.woff`,
        ),
      ),
  ),
)) as [Uint8Array, Uint8Array, Uint8Array, Uint8Array]

it('gera PDF A4 horizontal com páginas para listas, mapas e tsunagis', async () => {
  const pdf = await PDFDocument.load(
    await createPresentationPdf(presentationFixture(), fonts),
  )
  expect(pdf.getTitle()).toBe('Mostra Japão')
  expect(pdf.getPages().map((page) => page.getSize())).toEqual(
    Array.from({ length: 8 }, () => ({ width: 841.89, height: 595.28 })),
  )
})

it('pagina listas e textos longos e exporta uma apresentação sem slides', async () => {
  const p = presentationFixture()
  const dense = {
    ...p,
    people: Array.from({ length: 10 }, (_, i) => ({
      id: `person-${i}`,
      name: `Pessoa ${i + 1}`,
    })),
    transitions: p.transitions.map((item) =>
      item.id === 'middle'
        ? {
            ...item,
            instructions: 'Mover o okedo e liberar a passagem.\n'.repeat(18),
          }
        : item,
    ),
  }
  const pdf = await PDFDocument.load(await createPresentationPdf(dense, fonts))
  expect(pdf.getPageCount()).toBe(10)
  const empty = await PDFDocument.load(
    await createPresentationPdf(createPresentation('empty', 'Ensaio'), fonts),
  )
  expect(empty.getPageCount()).toBe(3)
})

it('informa quando há caracteres sem suporte no PDF', async () => {
  await expect(
    createPresentationPdf({ ...presentationFixture(), title: '太鼓' }, fonts),
  ).rejects.toThrow('Há caracteres sem suporte na fonte do PDF')
})

it('preserva listas e ênfase e só continua quando o próximo item não cabe', () => {
  const transition = {
    ...presentationFixture().transitions[0]!,
    instructionsFormat: 'html' as const,
    instructions:
      '<ol><li><strong>Um</strong></li><li><em>Dois</em></li><li><strong><em>Três</em></strong></li></ol><ul><li>Quatro</li></ul>',
  }
  const blocks = instructionBlocks(transition)
  expect(blocks.map((block) => block.map((run) => run.text).join(''))).toEqual([
    '1. Um',
    '2. Dois',
    '3. Três',
    '• Quatro',
  ])
  expect(blocks.map((block) => block.at(-1)?.style)).toEqual([1, 2, 3, 0])
  const pages = paginateInstructions(blocks, 40, 42, (text) => text.length)
  expect(pages.map((page) => page.length)).toEqual([2, 2])
  expect(
    paginateInstructions(blocks.slice(0, 2), 40, 41, (text) => text.length).map(
      (page) => page.length,
    ),
  ).toEqual([1, 1])
})

it('quebra palavras longas e continua um parágrafo maior que a coluna sem perder caracteres', () => {
  const block = [{ text: 'abcdefghij', style: 0 as const }]
  const pages = paginateInstructions([block], 3, 38, (text) => text.length)
  expect(
    pages.map((page) =>
      page.map(({ line }) => line.map((run) => run.text).join('')),
    ),
  ).toEqual([
    ['abc', 'def'],
    ['ghi', 'j'],
  ])
})

it.each([0, 1, 20, 21, 40])(
  'exporta %i itens em diagramas com até vinte blocos por página, sem duplicar mapas',
  async (count) => {
    let p = createPresentation('diagram', 'Ordem')
    for (let i = 0; i < count; i++) {
      p = addMap(p, `map-${i}`, i === 0 ? 'W'.repeat(80) : `Música ${i + 1}`, {
        width: 12,
        depth: 8,
      })
    }
    const pdf = await PDFDocument.load(await createPresentationPdf(p, fonts))
    expect(pdf.getPageCount()).toBe(
      2 + Math.max(1, Math.ceil(count / 20)) + count,
    )
  },
)
