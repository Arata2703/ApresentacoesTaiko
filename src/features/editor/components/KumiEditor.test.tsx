import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import App from '../../../App'
import {
  savePresentationCache,
  readPresentationCache,
} from '../../../integrations/presentationCache'
import { presentationFixture } from '../../../test/presentationFixture'
import { addMapInstrument } from '../../../domain/presentation/maps'
import { createKumi } from '../../../domain/presentation/kumi'

function fixture(grouped = false) {
  let p = addMapInstrument(presentationFixture(), 'a', 'shime', 'shime')
  p = addMapInstrument(p, 'a', 'nagado', 'nagado')
  if (grouped) p = createKumi(p, 'a', 'k', ['drum', 'shime'])
  savePresentationCache(p, 'a')
  render(<App />)
}
function stage() {
  return document.querySelector<HTMLElement>('[data-stage-surface]')!
}
async function selectAll() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Nagado, sem tocador/ }))
  await user.keyboard('{Control>}a{/Control}')
  return user
}
describe('seleção e Kumi no editor', () => {
  it.each(['Control', 'Meta'])(
    'seleciona todos com %s+A, mesmo com foco nas ferramentas',
    async (modifier) => {
      fixture(true)
      const user = userEvent.setup()
      await user.click(
        screen.getByRole('button', { name: /Nagado, sem tocador/ }),
      )
      screen.getByRole('switch', { name: 'Mostrar nomes' }).focus()
      await user.keyboard(`{${modifier}>}a{/${modifier}}`)
      expect(
        screen.getByRole('button', { name: 'Selecionar Kumi' }),
      ).toHaveAttribute('aria-pressed', 'true')
      expect(
        screen.getByRole('button', { name: /Nagado, sem tocador/ }),
      ).toHaveAttribute('aria-pressed', 'true')
    },
  )
  it('Ctrl+A na edição do Kumi seleciona seus componentes sem incluir instrumentos externos', async () => {
    fixture(true)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    await user.click(screen.getByRole('button', { name: 'Editar Kumi' }))
    await user.click(screen.getByRole('button', { name: /Shime, tocador/ }))
    await user.keyboard('{Control>}a{/Control}')
    expect(
      screen.getByRole('button', { name: /Okedo, tocador/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /Shime, tocador/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /Nagado, sem tocador/ }),
    ).toHaveAttribute('aria-pressed', 'false')
  })
  it('alterna nomes de instrumentos e Kumi sem alterar os dados e mantém o modo entre mapas', async () => {
    fixture(true)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    const before = readPresentationCache().data!.presentation
    const toggle = screen.getByRole('switch', { name: 'Mostrar nomes' })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(toggle).not.toBeChecked()
    expect(
      within(stage()).queryByRole('button', {
        name: 'Editar tocadores do Kumi',
      }),
    ).not.toBeInTheDocument()
    expect(
      within(stage()).queryByRole('button', {
        name: 'Editar tocadores de Nagado',
      }),
    ).not.toBeInTheDocument()
    expect(
      stage().querySelectorAll('[data-stage-instrument] img'),
    ).toHaveLength(3)
    expect(
      screen.getByRole('combobox', { name: 'Integrante do Kumi' }),
    ).toHaveValue('Ana/João')
    await user.click(toggle)
    expect(
      within(stage()).getByRole('button', { name: 'Editar tocadores do Kumi' }),
    ).toBeVisible()
    expect(
      within(stage()).getByRole('button', {
        name: 'Editar tocadores de Nagado',
      }),
    ).toBeVisible()
    expect(readPresentationCache().data!.presentation).toEqual(before)
    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: 'Abrir mapa Yatai' }))
    expect(
      screen.getByRole('switch', { name: 'Mostrar nomes' }),
    ).not.toBeChecked()
    expect(
      within(stage()).queryByRole('button', {
        name: 'Editar tocadores de Shinobue',
      }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Mostrar nomes' }))
    expect(
      within(stage()).getByRole('button', {
        name: 'Editar tocadores de Shinobue',
      }),
    ).toBeVisible()
  })
  it('limita a área clicável ao desenho, descontando as margens transparentes do ícone', () => {
    fixture()
    const image = stage().querySelector<HTMLImageElement>(
      '[data-instrument-id="nagado"] img',
    )!
    Object.defineProperties(image, {
      complete: { value: true },
      naturalWidth: { value: 256 },
      naturalHeight: { value: 256 },
      clientWidth: { value: 40 },
      clientHeight: { value: 40 },
    })
    Object.defineProperties(stage(), {
      clientWidth: { value: 500 },
      clientHeight: { value: 300 },
    })
    const pixels = new Uint8ClampedArray(256 * 256 * 4)
    for (let y = 64; y < 192; y++)
      for (let x = 64; x < 192; x++) pixels[(y * 256 + x) * 4 + 3] = 255
    const context = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        translate: vi.fn(),
        rotate: vi.fn(),
        drawImage: vi.fn(),
        getImageData: () => ({ data: pixels }),
      } as unknown as CanvasRenderingContext2D)
    try {
      fireEvent.load(image)
      const target = screen.getByRole('button', { name: /Nagado, sem tocador/ })
      expect(Number.parseFloat(target.style.width)).toBeCloseTo(20)
      expect(Number.parseFloat(target.style.height)).toBeCloseTo(20)
    } finally {
      context.mockRestore()
    }
  })
  it.each(
    ['Delete', 'Backspace'].flatMap((key) =>
      ['individual', 'múltipla', 'Kumi', 'componente'].map((mode) => ({
        key,
        mode,
      })),
    ),
  )('apaga seleção $mode com $key', async ({ key, mode }) => {
    fixture(mode === 'Kumi' || mode === 'componente')
    const user = userEvent.setup()
    if (mode === 'Kumi' || mode === 'componente')
      await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    if (mode === 'componente') {
      await user.click(screen.getByRole('button', { name: 'Editar Kumi' }))
      await user.click(screen.getByRole('button', { name: /Shime, tocador/ }))
    }
    if (mode === 'individual')
      await user.click(
        screen.getByRole('button', { name: /Nagado, sem tocador/ }),
      )
    if (mode === 'múltipla') await selectAll()
    await user.keyboard(`{${key}}`)
    expect(stage().querySelectorAll('[data-stage-instrument]')).toHaveLength(
      mode === 'múltipla' ? 0 : mode === 'Kumi' ? 1 : 2,
    )
    if (mode === 'componente')
      expect(
        screen.getByRole('button', { name: 'Concluir edição' }),
      ).toBeVisible()
  })
  it('apaga seleção por retângulo mesmo quando o foco está no palco vazio', async () => {
    fixture()
    const user = userEvent.setup()
    await user.pointer([
      {
        target: stage(),
        keys: '[MouseLeft>]',
        coords: { clientX: 0, clientY: 0 },
      },
      { coords: { clientX: 600, clientY: 360 } },
      { keys: '[/MouseLeft]' },
    ])
    fireEvent.keyDown(document.body, { key: 'Delete' })
    expect(stage().querySelectorAll('[data-stage-instrument]')).toHaveLength(0)
  })
  it('adiciona cópias somente no palco e mantém uma entrada por nome no catálogo', async () => {
    fixture(true)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    await user.type(
      screen.getByLabelText('Nome do Kumi · opcional'),
      'Shoumai{Enter}',
    )
    const catalog = screen.getByRole('region', { name: 'Instrumentos' })
    for (let index = 0; index < 3; index++)
      await user.click(
        within(catalog).getByRole('button', { name: 'Adicionar Shoumai' }),
      )
    expect(
      screen.getAllByRole('button', { name: 'Selecionar Shoumai' }),
    ).toHaveLength(4)
    expect(
      within(catalog).getAllByRole('button', { name: 'Adicionar Shoumai' }),
    ).toHaveLength(1)
    const name = screen.getByLabelText('Nome do Kumi · opcional')
    await user.clear(name)
    await user.type(name, 'SHOUMAI{Enter}')
    expect(
      within(catalog).getAllByRole('button', { name: /Adicionar Shoumai/i }),
    ).toHaveLength(1)
    fireEvent.contextMenu(stage())
    await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }))
    expect(stage().querySelectorAll('[data-kumi-id]')).toHaveLength(5)
    expect(
      within(catalog).getAllByRole('button', { name: /Adicionar Shoumai/i }),
    ).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Duplicar mapa' }))
    expect(
      within(screen.getByRole('region', { name: 'Instrumentos' })).getAllByRole(
        'button',
        { name: /Adicionar Shoumai/i },
      ),
    ).toHaveLength(1)
  })
  it('inclui Kumi na lista comum com miniatura e exibe apenas o integrante no palco', async () => {
    fixture(true)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    await user.type(
      screen.getByLabelText('Nome do Kumi · opcional'),
      'Shoumai{Enter}',
    )
    const catalog = screen.getByRole('region', { name: 'Instrumentos' })
    const item = within(catalog).getByRole('button', {
      name: 'Adicionar Shoumai',
    })
    expect(
      within(item).getByRole('img', {
        name: 'Miniatura dos instrumentos do Kumi',
      }),
    ).toBeVisible()
    expect(
      screen.queryByRole('region', { name: 'Kumi no catálogo' }),
    ).not.toBeInTheDocument()
    expect(within(stage()).queryByText('Shoumai')).not.toBeInTheDocument()
    const field = screen.getByRole('combobox', { name: 'Integrante do Kumi' })
    await user.clear(field)
    await user.type(field, 'Ana{Enter}')
    expect(
      screen.queryByRole('button', { name: 'Gerenciar integrantes' }),
    ).not.toBeInTheDocument()
    expect(
      within(stage()).getByRole('button', {
        name: 'Editar tocadores do Shoumai',
      }),
    ).toHaveTextContent('Ana')
    await user.clear(
      screen.getByRole('combobox', { name: 'Integrante do Kumi' }),
    )
    await user.keyboard('{Escape}')
    expect(
      screen.getByRole('combobox', { name: 'Integrante do Kumi' }),
    ).toHaveValue('Ana')
    await user.click(item)
    expect(
      screen.getAllByRole('button', { name: 'Selecionar Shoumai' }),
    ).toHaveLength(2)
  })
  it('edita o integrante por nome e preserva a edição dos componentes do Kumi', async () => {
    fixture(true)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    expect(
      screen.queryByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).not.toBeInTheDocument()
    const member = screen.getByRole('combobox', { name: 'Integrante do Kumi' })
    await user.clear(member)
    await user.type(member, 'João{Enter}')
    await user.click(
      screen.getByRole('button', { name: 'Editar tocadores do Kumi' }),
    )
    const field = screen.getByRole('combobox', {
      name: 'Tocadores no instrumento',
    })
    await user.keyboard('{Escape}')
    expect(field).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Editar tocadores do Kumi' }),
    )
    await user.type(
      screen.getByRole('combobox', { name: 'Tocadores no instrumento' }),
      'Ana{Enter}',
    )
    await user.tab()
    expect(
      screen.queryByRole('combobox', { name: 'Tocadores no instrumento' }),
    ).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Editar tocadores do Kumi' }),
    )
    await user.type(
      screen.getByRole('combobox', { name: 'Tocadores no instrumento' }),
      'Nova{Enter}',
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(
      screen.getByRole('button', { name: /Shime, tocador.*Nova/ }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    await user.click(screen.getByRole('button', { name: 'Editar Kumi' }))
    fireEvent.keyDown(screen.getByRole('button', { name: /Shime, tocador/ }), {
      key: 'Enter',
    })
    fireEvent.click(screen.getByRole('button', { name: /Shime, tocador/ }), {
      detail: 0,
    })
    fireEvent.click(screen.getByRole('button', { name: /Okedo, tocador/ }), {
      detail: 0,
      ctrlKey: true,
    })
    fireEvent.click(screen.getByRole('button', { name: /Okedo, tocador/ }), {
      detail: 0,
      ctrlKey: true,
    })
    expect(screen.getByLabelText('Horizontal · m')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Concluir edição' }))
    const target = screen.getByRole('button', { name: 'Selecionar Kumi' })
    target.focus()
    await user.keyboard('{ArrowRight}{ArrowLeft}')
    fireEvent.contextMenu(stage())
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.load(stage().querySelector('img')!)
  })
  it('seleciona por retângulo e mantém ações disponíveis após apagar componentes em edição', async () => {
    fixture(true)
    const user = userEvent.setup()
    await user.pointer([
      {
        target: stage(),
        keys: '[MouseLeft>]',
        coords: { clientX: 0, clientY: 0 },
      },
      { coords: { clientX: 600, clientY: 360 } },
      { keys: '[/MouseLeft]' },
    ])
    expect(screen.getByText('2 elementos selecionados')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    await user.click(screen.getByRole('button', { name: 'Editar Kumi' }))
    await user.click(screen.getByRole('button', { name: /Shime, tocador/ }))
    fireEvent.contextMenu(stage())
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    expect(
      screen.getByRole('button', { name: 'Concluir edição' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Concluir edição' }))
  })
  it('seleciona vários sem arrastar com modificadores e agrupa com tocadores apenas no conjunto', async () => {
    fixture()
    const user = await selectAll()
    await user.click(screen.getByRole('button', { name: 'Formar Kumi' }))
    expect(
      screen.getByRole('button', { name: 'Selecionar Kumi' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.queryByRole('button', {
        name: 'Editar tocadores de Okedo: Ana/João',
      }),
    ).not.toBeInTheDocument()
    const name = screen.getByLabelText('Nome do Kumi · opcional')
    await user.type(name, 'Trio')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Adicionar Trio' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Editar Kumi' }))
    await user.click(screen.getByRole('button', { name: /Shime, tocador/ }))
    expect(screen.getByLabelText('Horizontal · m')).toBeVisible()
    expect(
      screen.queryByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'À base' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'À base' }))
    await user.click(screen.getByRole('button', { name: 'Concluir edição' }))
    fireEvent.contextMenu(stage(), { clientX: 50, clientY: 50 })
    await user.click(screen.getByRole('menuitem', { name: 'Desagrupar' }))
    expect(
      screen.queryByRole('button', { name: 'Selecionar Trio' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Editar tocadores de Shime: Ana/João',
      }),
    ).toBeVisible()
  })
  it('duplica pelo catálogo e menu, apaga sem afetar o original e abre ações por duplo clique', async () => {
    fixture(true)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Selecionar Kumi' }))
    const name = screen.getByLabelText('Nome do Kumi · opcional')
    await user.type(name, 'Dupla{Enter}')
    await user.click(screen.getByRole('button', { name: 'Adicionar Dupla' }))
    expect(
      screen.getAllByRole('button', { name: 'Selecionar Dupla' }),
    ).toHaveLength(2)
    fireEvent.doubleClick(stage(), { clientX: 20, clientY: 20 })
    await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }))
    expect(
      screen.getAllByRole('button', { name: 'Selecionar Dupla' }),
    ).toHaveLength(3)
    fireEvent.contextMenu(stage())
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    expect(
      screen.getAllByRole('button', { name: 'Selecionar Dupla' }),
    ).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Duplicar mapa' }))
    expect(
      screen.getAllByRole('button', { name: 'Selecionar Dupla' }),
    ).toHaveLength(2)
  })
  it('oferece ferramentas por ícones, exige três elementos para espaçar e conserva seleção ao usar teclado', async () => {
    fixture()
    const user = await selectAll()
    for (const label of [
      'À esquerda',
      'À direita',
      'Ao topo',
      'À base',
      'Centro horizontal',
      'Centro vertical',
      'Espaçar horizontalmente',
      'Espaçar verticalmente',
      'Espelhar esquerda e direita',
      'Espelhar frente e fundo',
    ])
      await user.click(screen.getByRole('button', { name: label }))
    const instrument = screen.getByRole('button', {
      name: /Nagado, sem tocador/,
    })
    instrument.focus()
    await user.keyboard('{ArrowRight}{ArrowDown}{ArrowLeft}{ArrowUp}')
    await user.keyboard('{Shift>}{F10}{/Shift}')
    expect(screen.getByRole('menu', { name: 'Ações da seleção' })).toBeVisible()
    await user.keyboard('{Escape}')
    await user.click(instrument)
    expect(
      screen.getByRole('button', { name: 'Espaçar horizontalmente' }),
    ).toBeDisabled()
    const panel = screen.getByRole('complementary', {
      name: 'Seleção e propriedades',
    })
    expect(within(panel).getByLabelText('Horizontal · m')).toBeVisible()
  })
})
