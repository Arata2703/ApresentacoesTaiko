import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { strFromU8, unzipSync } from 'fflate'
import { afterEach, expect, it, vi } from 'vitest'
import { download } from './download'
import { exportPresentation } from './exportPresentation'
import { importPresentation } from './presentationFile'
import { presentationFixture } from '../test/presentationFixture'

vi.mock('./download', () => ({ download: vi.fn() }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

const font = await readFile(
  'node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff',
)
function availableFonts() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response(font)),
  )
}

it('baixa ZIP com PDF e projeto reabrível do mesmo estado, mesmo se os dados mudarem durante a geração', async () => {
  const p = presentationFixture()
  const original = presentationFixture()
  let release!: () => void
  const ready = new Promise<void>((resolve) => {
    release = resolve
  })
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => {
      await ready
      return new Response(font)
    }),
  )
  const exporting = exportPresentation(p)
  Object.assign(p, { title: 'Outro título' })
  Object.assign(p.people[0]!, { name: 'Outro nome' })
  release()
  await exporting
  const [blob, filename] = vi.mocked(download).mock.calls[0]!
  expect(filename).toBe('apresentacao-taiko.zip')
  expect(blob.type).toBe('application/zip')
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()))
  expect(Object.keys(files).sort()).toEqual([
    'apresentacao-taiko.json',
    'apresentacao-taiko.pdf',
  ])
  const restored = importPresentation(
    strFromU8(files['apresentacao-taiko.json']!),
  )
  expect(restored).toMatchObject({ status: 'valid', presentation: original })
  const pdf = await PDFDocument.load(files['apresentacao-taiko.pdf']!)
  expect(pdf.getTitle()).toBe(original.title)
  expect(pdf.getPageCount()).toBe(8)
  expect(download).toHaveBeenCalledTimes(1)
})

it('não inicia download se não conseguir carregar a fonte', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response('', { status: 404 })),
  )
  await expect(exportPresentation(presentationFixture())).rejects.toThrow(
    'carregar a fonte',
  )
  expect(download).not.toHaveBeenCalled()
})

it('recusa projeto inválido antes de buscar fontes ou gerar um pacote', async () => {
  availableFonts()
  await expect(
    exportPresentation({ ...presentationFixture(), title: '' }),
  ).rejects.toThrow()
  expect(fetch).not.toHaveBeenCalled()
  expect(download).not.toHaveBeenCalled()
})

it('não baixa pacote incompleto se a geração do PDF falhar', async () => {
  availableFonts()
  await expect(
    exportPresentation({ ...presentationFixture(), title: '太鼓' }),
  ).rejects.toThrow('caracteres sem suporte')
  expect(download).not.toHaveBeenCalled()
})

it('informa falha de download e permite repetir a exportação', async () => {
  availableFonts()
  vi.mocked(download).mockImplementationOnce(() => {
    throw new Error('Download indisponível')
  })
  await expect(exportPresentation(presentationFixture())).rejects.toThrow(
    'Download indisponível',
  )
  await expect(
    exportPresentation(presentationFixture()),
  ).resolves.toBeUndefined()
  expect(download).toHaveBeenCalledTimes(2)
})
