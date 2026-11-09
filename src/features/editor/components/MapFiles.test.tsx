import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MapFiles } from './MapFiles'
import { download } from '../../../integrations/download'
import { exportPresentation } from '../../../integrations/exportPresentation'
import { serializeMap } from '../../../integrations/mapFile'
import {
  importPresentation,
  serializePresentation,
} from '../../../integrations/presentationFile'
import { createPresentation } from '../../../domain/presentation/presentation'
import { presentationFixture } from '../../../test/presentationFixture'
import App from '../../../App'
import { addPlayerToSelected } from '../../../test/addPlayer'

vi.mock('../../../integrations/download', () => ({ download: vi.fn() }))
vi.mock('../../../integrations/exportPresentation', () => ({
  exportPresentation: vi.fn(),
}))
afterEach(() => vi.resetAllMocks())
const p = presentationFixture()

it('exporta a apresentação pela tela de integrantes sem exigir salvamento', async () => {
  const user = userEvent.setup()
  render(<App />)
  const name = screen.getByLabelText('Nome da música')
  await user.clear(name)
  await user.type(name, 'Yatai de abertura')
  await user.click(screen.getByRole('button', { name: /Integrantes/ }))
  const button = screen.getByRole('button', {
    name: 'Exportar apresentação',
  })
  expect(button).toBeEnabled()
  await user.click(button)
  expect(exportPresentation).toHaveBeenCalledWith(
    expect.objectContaining({
      maps: expect.arrayContaining([
        expect.objectContaining({ title: 'Yatai de abertura' }),
      ]),
    }),
  )
}, 15000)

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
    expect(
      screen.getByRole('button', { name: 'Cancelar abertura' }),
    ).toHaveFocus()
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
      screen.getByRole('button', { name: 'Exportar apresentação' }),
    )
    expect(exportPresentation).toHaveBeenCalledWith(loaded.presentation)
    expect(await screen.findByText(/Apresentação exportada/)).toBeVisible()
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
  it('permite exportar a apresentação antes e depois de criar o primeiro mapa', async () => {
    render(<App />)
    await confirmOpen(
      serializePresentation(createPresentation('empty', 'Vazia')),
    )
    expect(
      screen.getByRole('heading', { name: 'Apresentação sem mapas' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Exportar apresentação' }),
    ).toBeEnabled()
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
      screen.getByRole('button', { name: 'Exportar apresentação' }),
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
    render(<MapFiles presentation={p} onOpen={open} />)
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
        screen.getByRole('button', { name: 'Exportar apresentação' }),
      ).toBeEnabled(),
    )
    expect(open).not.toHaveBeenCalled()
  })
  it('não gera backup de estado inválido e exibe falha de download', async () => {
    const view = render(
      <MapFiles
        presentation={{ ...p, title: '' }}

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
    view.rerender(<MapFiles presentation={p} onOpen={vi.fn()} />)
    vi.mocked(download).mockImplementation(() => {
      throw new Error('download')
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    )
    expect(screen.getByText(/Seu trabalho foi preservado/)).toBeVisible()
  })
  it('mantém o popup modal até concluir a exportação e libera o backup depois', async () => {
    let finish!: () => void
    vi.mocked(exportPresentation).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    render(<MapFiles presentation={p} onOpen={vi.fn()} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Exportar apresentação' }),
    )
    expect(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    ).toBeDisabled()
    expect(screen.getByLabelText('Abrir apresentação')).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Gerando arquivos…' }),
    ).toBeDisabled()
    expect(exportPresentation).toHaveBeenCalledWith(p)
    const popup = screen.getByRole('alertdialog', {
      name: 'Exportando apresentação',
    })
    expect(popup).toBeVisible()
    await userEvent.keyboard('{Escape}')
    fireEvent.click(popup, { clientX: -1, clientY: -1 })
    expect(popup).toBeVisible()
    finish()
    expect(await screen.findByText(/Apresentação exportada/)).toBeVisible()
    expect(
      screen.queryByRole('alertdialog', { name: 'Exportando apresentação' }),
    ).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar apresentação editável' }),
    )
    expect(download).toHaveBeenCalledWith(
      expect.any(Blob),
      'apresentacao-taiko.json',
    )
    expect(exportPresentation).toHaveBeenCalledTimes(1)
  })
  it.each([new Error('Fonte indisponível'), 'falha'])(
    'exibe falha de PDF e reabilita os controles: %s',
    async (error) => {
      let fail!: (reason: unknown) => void
      vi.mocked(exportPresentation).mockImplementation(
        () =>
          new Promise<void>((_, reject) => {
            fail = reject
          }),
      )
      render(<MapFiles presentation={p} onOpen={vi.fn()} />)
      await userEvent.click(
        screen.getByRole('button', { name: 'Exportar apresentação' }),
      )
      expect(
        screen.getByRole('alertdialog', { name: 'Exportando apresentação' }),
      ).toBeVisible()
      fail(error)
      expect(
        await screen.findByText(
          error instanceof Error
            ? error.message
            : 'Falha ao exportar a apresentação. Tente novamente.',
        ),
      ).toBeVisible()
      expect(
        screen.queryByRole('alertdialog', { name: 'Exportando apresentação' }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Exportar apresentação' }),
      ).toBeEnabled()
    },
  )
})

it('exporta a apresentação completa mesmo sem mapa ativo e recupera de falha', async () => {
  const user = userEvent.setup()
  render(<MapFiles presentation={p} onOpen={vi.fn()} />)
  vi.mocked(exportPresentation)
    .mockRejectedValueOnce(new Error('Fonte indisponível'))
    .mockResolvedValueOnce(undefined)
  const button = screen.getByRole('button', {
    name: 'Exportar apresentação',
  })
  await user.click(button)
  expect(await screen.findByText('Fonte indisponível')).toBeVisible()
  await user.click(button)
  expect(
    await screen.findByText(
      'Apresentação exportada. O ZIP contém o PDF e o arquivo editável.',
    ),
  ).toBeVisible()
  expect(exportPresentation).toHaveBeenLastCalledWith(p)
})
