// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { afterEach, expect, it, vi } from 'vitest'
import { download } from './download'
import { exportMap } from './exportMap'

vi.mock('./download', () => ({ download: vi.fn() }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
it('carrega fonte local, gera PDF real e encaminha download', async () => {
  const font = await readFile(
    'node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff',
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(font)))
  await exportMap({ title: 'Japão', song: 'Ibuki', instruments: [] })
  const [blob, name] = vi.mocked(download).mock.calls[0]!
  expect(name).toBe('mapa-taiko.pdf')
  expect(blob.type).toBe('application/pdf')
  const pdf = await PDFDocument.load(await blob.arrayBuffer())
  expect(pdf.getPageCount()).toBe(1)
  expect(pdf.getTitle()).toBe('Japão - Ibuki')
})
it('não baixa um PDF se a fonte não carregar', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('', { status: 404 })),
  )
  await expect(
    exportMap({ title: '', song: '', instruments: [] }),
  ).rejects.toThrow('carregar a fonte')
  expect(download).not.toHaveBeenCalled()
})
