import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MapFiles } from './MapFiles'
import { download } from '../../../integrations/download'
import { exportMap } from '../../../integrations/exportMap'
import { serializeMap } from '../../../integrations/mapFile'
import {
  importPresentation,
  serializePresentation,
} from '../../../integrations/presentationFile'
import { createPresentation } from '../../../domain/presentation/presentation'
import { presentationFixture } from '../../../test/presentationFixture'
import { projectMap, firstMapId } from '../editorProjection'
import App from '../../../App'
import { addPlayerToSelected } from '../../../test/addPlayer'

vi.mock('../../../integrations/download', () => ({ download: vi.fn() }))
vi.mock('../../../integrations/exportMap', () => ({ exportMap: vi.fn() }))
afterEach(() => vi.resetAllMocks())
const p = presentationFixture()
const page = projectMap(p, firstMapId(p))

function upload(source: string, size = source.length) {
  fireEvent.change(screen.getByLabelText('Abrir apresentação'), {
    target: { files: [{ size, text: () => Promise.resolve(source) }] },
  })
}
async function confirmOpen(source: string) {
  upload(source)
  await screen.findByRole('alertdialog')
  await userEvent.click(
    screen.getByRole('button', { name: 'Substituir e abrir' }),
  )
}
async function savedSource() {
  const blob = vi.mocked(download).mock.calls.at(-1)![0]
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsText(blob)
  })
}

describe('arquivos e primeiro fluxo integrado', () => {
  it('edita, salva, reabre e entrega ao PDF os mesmos nomes, posições, rotação e medidas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Adicionar Okedo' }))
    await addPlayerToSelected('Ana Silva')
    fireEvent.change(screen.getByLabelText('Horizontal · m'), {
      target: { value: '3.25' },
    })
    fireEvent.change(screen.getByLabelText('Profundidade · m'), {
      target: { value: '4' },
    })
    fireEvent.change(screen.getByRole('slider'), { target: { value: '135' } })
    await user.clear(screen.getByLabelText('Nome da apresentação'))
    await user.type(screen.getByLabelText('Nome da apresentação'), 'Festival')
    await user.clear(screen.getByLabelText('Nome da música'))
    await user.type(screen.getByLabelText('Nome da música'), 'Ibuki')
    await user.click(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    )
    expect(download).toHaveBeenCalledWith(
      expect.any(Blob),
      'apresentacao-taiko.json',
    )
    const source = await savedSource()
    const loaded = importPresentation(source)
    expect(loaded.status).toBe('valid')
    if (loaded.status !== 'valid') throw new Error('Backup inválido')
    const instrument = loaded.presentation.maps[0]!.instruments[0]!
    expect(instrument).toMatchObject({
      baseId: 'okedo-suwaridai',
      position: { x: 3.25, y: 4 },
      rotation: 135,
    })
    expect(loaded.presentation.people[0]!.name).toBe('Ana Silva')
    await user.click(
      screen.getByRole('button', { name: 'Remover instrumento' }),
    )
    upload(source)
    await screen.findByRole('alertdialog')
    await user.click(screen.getByRole('button', { name: 'Cancelar abertura' }))
    expect(
      screen.getByRole('heading', { name: 'O palco é seu.' }),
    ).toBeVisible()
    await confirmOpen(source)
    await user.click(
      screen.getByRole('button', { name: /Okedo, tocador Ana Silva/ }),
    )
    expect(screen.getByLabelText('Horizontal · m')).toHaveValue(3.25)
    expect(screen.getByLabelText('Profundidade · m')).toHaveValue(4)
    expect(screen.getByRole('slider')).toHaveValue('135')
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Ibuki')
    await user.click(
      screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
    )
    expect(exportMap).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Festival',
        song: 'Ibuki',
        stage: { width: 10, depth: 6 },
        instruments: [
          expect.objectContaining({
            id: instrument.id,
            player: 'Ana Silva',
            x: 3.25,
            y: 4,
            rotation: 135,
          }),
        ],
      }),
    )
    expect(
      await screen.findByText(/PDF A4 horizontal do mapa selecionado baixado/),
    ).toBeVisible()
  }, 15000)
  it('abre formato completo, navega mapas e preserva pessoas, bases, transições e materiais ao salvar', async () => {
    render(<App />)
    await confirmOpen(serializePresentation(p))
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Yatai')
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Ibuki' }),
    )
    expect(screen.getByLabelText('Palco de 12 por 8 metros')).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: /Okedo, tocador Ana\/João/ }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'João · pessoa 2' }),
    ).toBeChecked()
    expect(screen.getByText('Okedo Eitetsu', { exact: true })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Horizontal · m'), {
      target: { value: '7' },
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    )
    const loaded = importPresentation(await savedSource())
    if (loaded.status !== 'valid') throw new Error('Backup inválido')
    expect(loaded.presentation.transitions).toEqual(p.transitions)
    expect(loaded.presentation.materials).toEqual(p.materials)
    expect(loaded.presentation.people).toEqual(p.people)
    expect(loaded.presentation.maps[0]!.instruments[0]!.position.x).toBe(7)
    expect(loaded.presentation.maps[1]).toEqual(p.maps[1])
    expect(loaded.presentation.sequence).toEqual(p.sequence)
  })
  it('avisa da conversão do legado antes de abrir e mantém tocador editável', async () => {
    render(<App />)
    upload(
      serializeMap({
        title: 'Mostra Japão',
        song: 'Ibuki',
        instruments: [
          { id: 'a', kind: 'shime', player: 'João', x: 3, y: 4, rotation: 90 },
        ],
      }),
    )
    await screen.findByRole('alertdialog')
    expect(screen.getByText(/Mapa M02 convertido/)).toBeVisible()
    expect(screen.getByLabelText('Nome da apresentação')).toHaveValue(
      'Minha apresentação',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Substituir e abrir' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /Shime, tocador João/ }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Gerenciar integrantes' }),
    )
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar nome de João (pessoa 1)' }),
    )
    await userEvent.type(
      screen.getByLabelText('Novo nome de João (pessoa 1)'),
      ' Silva',
    )
    await userEvent.keyboard('{Enter}')
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Ibuki' }),
    )
    expect(
      screen.getByRole('button', { name: /Shime, tocador João Silva/ }),
    ).toBeVisible()
  })
  it('oferece criar o primeiro mapa de uma apresentação vazia e só então libera PDF', async () => {
    render(<App />)
    await confirmOpen(
      serializePresentation(createPresentation('empty', 'Vazia')),
    )
    expect(
      screen.getByRole('heading', { name: 'Apresentação sem mapas' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
    ).toBeDisabled()
    await userEvent.click(
      screen.getByRole('button', { name: 'Criar primeiro mapa' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    expect(
      screen.getByRole('button', { name: /Okedo, sem tocador/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
    ).toBeEnabled()
  })
  it.each([
    'inválido',
    JSON.stringify({ format: 'taiko-presentation', version: 2 }),
    JSON.stringify({
      format: 'taiko-presentation',
      version: 1,
      presentation: {},
    }),
  ])(
    'recusa arquivo inválido/incompatível sem substituir o trabalho: %s',
    async (source) => {
      render(<App />)
      await userEvent.click(
        screen.getByRole('button', { name: 'Adicionar Okedo' }),
      )
      upload(source)
      expect(
        await screen.findByText(/Sua apresentação atual foi preservada/),
      ).toBeVisible()
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Okedo, sem tocador/ }),
      ).toBeVisible()
    },
  )
  it('trata seleção vazia, arquivo grande e falha de leitura', async () => {
    const open = vi.fn()
    render(<MapFiles presentation={p} page={page} onOpen={open} />)
    fireEvent.change(screen.getByLabelText('Abrir apresentação'), {
      target: { files: [] },
    })
    upload('{}', 5_000_001)
    expect(
      await screen.findByText(/Não foi possível ler o arquivo/),
    ).toBeVisible()
    fireEvent.change(screen.getByLabelText('Abrir apresentação'), {
      target: {
        files: [{ size: 10, text: () => Promise.reject(new Error('leitura')) }],
      },
    })
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
      ).toBeEnabled(),
    )
    expect(open).not.toHaveBeenCalled()
  })
  it('não gera backup de estado inválido e exibe falha de download', async () => {
    const view = render(
      <MapFiles
        presentation={{ ...p, title: '' }}
        page={page}
        onOpen={vi.fn()}
      />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    )
    expect(
      screen.getByText(/Não foi possível baixar a apresentação/),
    ).toBeVisible()
    expect(download).not.toHaveBeenCalled()
    view.rerender(<MapFiles presentation={p} page={page} onOpen={vi.fn()} />)
    vi.mocked(download).mockImplementation(() => {
      throw new Error('download')
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    )
    expect(screen.getByText(/Seu trabalho foi preservado/)).toBeVisible()
  })
  it('bloqueia ações enquanto gera PDF e só exporta o mapa selecionado', async () => {
    let finish!: () => void
    vi.mocked(exportMap).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    render(<MapFiles presentation={p} page={page} onOpen={vi.fn()} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
    )
    expect(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    ).toBeDisabled()
    expect(screen.getByLabelText('Abrir apresentação')).toBeDisabled()
    expect(exportMap).toHaveBeenCalledWith(page)
    finish()
    expect(
      await screen.findByText(/PDF A4 horizontal do mapa selecionado baixado/),
    ).toBeVisible()
  })
  it.each([new Error('Fonte indisponível'), 'falha'])(
    'exibe falha de PDF e reabilita os controles: %s',
    async (error) => {
      vi.mocked(exportMap).mockRejectedValue(error)
      render(<MapFiles presentation={p} page={page} onOpen={vi.fn()} />)
      await userEvent.click(
        screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
      )
      expect(
        await screen.findByText(
          error instanceof Error
            ? error.message
            : 'Falha ao gerar PDF. Tente novamente.',
        ),
      ).toBeVisible()
      expect(
        screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
      ).toBeEnabled()
    },
  )
})
