// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { afterEach, expect, it, vi } from 'vitest'
import { exportMaterials } from './exportMaterials'
import { createMaterialsPdf } from './materialsPdf'
import { download } from './download'

vi.mock('./download', () => ({ download: vi.fn() }))
const font = new Uint8Array(
  await readFile(
    'node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff',
  ),
)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it('gera e baixa PDF A4 horizontal com acentos e paginação', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(font)))
  await exportMaterials(
    'Mostra Japão',
    Array.from({ length: 19 }, (_, i) => ({
      id: String(i),
      name: `Peça ${i + 1}`,
      quantity: i + 1,
    })),
  )
  const [blob, name] = vi.mocked(download).mock.calls[0]!
  expect(name).toBe('materiais-taiko.pdf')
  expect(blob.type).toBe('application/pdf')
  const pdf = await PDFDocument.load(await blob.arrayBuffer())
  expect(pdf.getTitle()).toBe('Mostra Japão - Materiais manuais')
  expect(pdf.getPages().map((page) => page.getSize())).toEqual(
    Array.from({ length: 2 }, () => ({ width: 841.89, height: 595.28 })),
  )
})

it('não baixa quando a fonte falha e informa caracteres incompatíveis', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('', { status: 404 })),
  )
  await expect(exportMaterials('Mostra Japão', [])).rejects.toThrow(
    'carregar a fonte',
  )
  expect(download).not.toHaveBeenCalled()
  await expect(createMaterialsPdf('太鼓', [], font)).rejects.toThrow(
    'caracteres sem suporte',
  )
})
