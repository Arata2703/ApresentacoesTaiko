import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MapFiles } from './MapFiles'
import { download } from '../../../integrations/download'
import { exportMap } from '../../../integrations/exportMap'
import { serializeMap } from '../../../integrations/mapFile'
import App from '../../../App'

vi.mock('../../../integrations/download', () => ({ download: vi.fn() }))
vi.mock('../../../integrations/exportMap', () => ({ exportMap: vi.fn() }))
const map = { title: 'Mostra Japão', song: 'Ibuki', instruments: [] }
afterEach(() => vi.resetAllMocks())

function upload(source: string, size = source.length) {
  fireEvent.change(screen.getByLabelText('Abrir mapa'), {
    target: { files: [{ size, text: () => Promise.resolve(source) }] },
  })
}

describe('arquivos pela interface', () => {
  it('baixa arquivo editável com o estado atual e orienta o usuário', async () => {
    render(<MapFiles map={map} onOpen={vi.fn()} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar mapa editável' }),
    )
    expect(download).toHaveBeenCalledWith(expect.any(Blob), 'mapa-taiko.json')
    expect(screen.getByText(/Arquivo editável baixado/)).toBeVisible()
  })
  it('só substitui o trabalho depois de confirmação e permite cancelar', async () => {
    const open = vi.fn()
    render(<MapFiles map={map} onOpen={open} />)
    upload(serializeMap(map))
    expect(await screen.findByRole('alertdialog')).toBeVisible()
    expect(open).not.toHaveBeenCalled()
    await userEvent.click(
      screen.getByRole('button', { name: 'Cancelar abertura' }),
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    upload(serializeMap(map))
    await screen.findByRole('alertdialog')
    await userEvent.click(
      screen.getByRole('button', { name: 'Substituir e abrir' }),
    )
    expect(open).toHaveBeenCalledExactlyOnceWith(map)
    expect(screen.getByText(/Mapa reaberto/)).toBeVisible()
  })
  it('preserva o mapa em arquivos inválidos, grandes ou seleção vazia', async () => {
    const open = vi.fn()
    render(<MapFiles map={map} onOpen={open} />)
    fireEvent.change(screen.getByLabelText('Abrir mapa'), {
      target: { files: [] },
    })
    upload('inválido')
    expect(
      await screen.findByText(/Seu mapa atual foi preservado/),
    ).toBeVisible()
    upload('{}', 1_000_001)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Exportar PDF' }),
      ).toBeEnabled(),
    )
    expect(open).not.toHaveBeenCalled()
  })
  it('exporta o estado corrente e bloqueia ações durante geração', async () => {
    let finish!: () => void
    vi.mocked(exportMap).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    render(<MapFiles map={map} onOpen={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))
    expect(
      screen.getByRole('button', { name: 'Baixar mapa editável' }),
    ).toBeDisabled()
    expect(screen.getByLabelText('Abrir mapa')).toBeDisabled()
    expect(exportMap).toHaveBeenCalledWith(map)
    finish()
    expect(await screen.findByText(/PDF A4 horizontal baixado/)).toBeVisible()
  })
  it.each([new Error('Fonte indisponível'), 'falha'])(
    'mostra falha de PDF sem perder estado: %s',
    async (error) => {
      vi.mocked(exportMap).mockRejectedValue(error)
      render(<MapFiles map={map} onOpen={vi.fn()} />)
      await userEvent.click(
        screen.getByRole('button', { name: 'Exportar PDF' }),
      )
      expect(
        await screen.findByText(
          error instanceof Error
            ? error.message
            : 'Falha ao gerar PDF. Tente novamente.',
        ),
      ).toBeVisible()
      expect(screen.getByRole('button', { name: 'Exportar PDF' })).toBeEnabled()
    },
  )
  it('reabre no editor real, limpa seleção e mantém propriedades editáveis', async () => {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    upload(
      serializeMap({
        ...map,
        instruments: [
          {
            id: 'importado',
            kind: 'shime',
            player: 'João',
            x: 3,
            y: 4,
            rotation: 90,
          },
        ],
      }),
    )
    await screen.findByRole('alertdialog')
    await userEvent.click(
      screen.getByRole('button', { name: 'Substituir e abrir' }),
    )
    expect(screen.getByLabelText('Nome da apresentação')).toHaveValue(
      'Mostra Japão',
    )
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Ibuki')
    expect(
      screen.queryByRole('button', { name: /Okedo, sem tocador/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Cada detalhe no seu lugar.' }),
    ).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: /Shime, tocador João/ }),
    )
    expect(screen.getByLabelText('Horizontal · m')).toHaveValue(3)
    expect(screen.getByLabelText('Profundidade · m')).toHaveValue(4)
    expect(screen.getByRole('slider')).toHaveValue('90')
    await userEvent.type(screen.getByLabelText('Nome do tocador'), ' Silva')
    expect(
      screen.getByRole('button', { name: /Shime, tocador João Silva/ }),
    ).toBeVisible()
  })
})
