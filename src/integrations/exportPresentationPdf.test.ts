import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { afterEach, expect, it, vi } from 'vitest'
import { download } from './download'
import { exportPresentationPdf } from './exportPresentationPdf'
import { presentationFixture } from '../test/presentationFixture'

vi.mock('./download', () => ({ download: vi.fn() }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it('baixa um PDF completo usando fontes locais', async () => {
  const font = await readFile(
    'node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff',
  )
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response(font)),
  )
  await exportPresentationPdf(presentationFixture())
  const [blob, filename] = vi.mocked(download).mock.calls[0]!
  expect(filename).toBe('apresentacao-taiko.pdf')
  expect(blob.type).toBe('application/pdf')
  expect(
    (await PDFDocument.load(await blob.arrayBuffer())).getPageCount(),
  ).toBe(8)
})

it('não inicia download se não conseguir carregar a fonte', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response('', { status: 404 })),
  )
  await expect(exportPresentationPdf(presentationFixture())).rejects.toThrow(
    'carregar a fonte',
  )
  expect(download).not.toHaveBeenCalled()
})
