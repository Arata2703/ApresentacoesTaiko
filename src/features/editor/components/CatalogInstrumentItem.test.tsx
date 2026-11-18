import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { CatalogInstrumentItem } from './CatalogInstrumentItem'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function props() {
  return {
    name: 'Tambor de ensaio',
    abbreviation: 'Ens.',
    kind: 'shime' as const,
    onAdd: vi.fn(),
    actions: { onEdit: vi.fn(), onRemove: vi.fn() },
  }
}

it('mostra o nome completo e os ícones quando cabem e usa a abreviação ao faltar espaço', () => {
  let width = 240
  let resize: ResizeObserverCallback = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback
      }
      observe() {}
      disconnect = disconnect
    },
  )
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const value = this.hasAttribute('data-compact')
        ? width
        : this.textContent === 'Tambor de ensaio'
          ? 100
          : this.textContent === '+'
            ? 8
            : this.tagName === 'SPAN' && this.querySelector('button')
              ? 40
              : this.tagName === 'SPAN' && this.querySelector('img')
                ? 18
                : 0
      return { width: value } as DOMRect
    },
  )
  const input = props()
  const app = render(<CatalogInstrumentItem {...input} />)
  expect(
    screen.getByRole('button', { name: 'Editar Tambor de ensaio' }),
  ).toBeVisible()
  width = 145
  act(() => resize([], {} as ResizeObserver))
  expect(
    screen.queryByRole('button', { name: 'Editar Tambor de ensaio' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Adicionar Tambor de ensaio' }),
  ).toHaveAttribute('title', input.name)
  width = 80
  act(() => resize([], {} as ResizeObserver))
  expect(screen.getByText('Ens.', { exact: true })).toBeVisible()
  act(() => resize([], {} as ResizeObserver))
  width = 240
  act(() => resize([], {} as ResizeObserver))
  expect(
    screen.getByRole('button', { name: 'Remover Tambor de ensaio' }),
  ).toBeVisible()
  expect(screen.queryByText('Ens.', { exact: true })).not.toBeInTheDocument()
  app.unmount()
  expect(disconnect).toHaveBeenCalled()
})

it('abre com botão direito ou teclado e executa a opção sem adicionar ao palco', async () => {
  const input = props(),
    user = userEvent.setup()
  render(
    <>
      <button>Fora</button>
      <CatalogInstrumentItem {...input} />
    </>,
  )
  const add = screen.getByRole('button', { name: 'Adicionar Tambor de ensaio' })
  fireEvent.contextMenu(add)
  const menu = screen.getByRole('menu')
  expect(within(menu).getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
  await user.keyboard('{ArrowDown}{Home}{End}{ArrowUp}')
  expect(within(menu).getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(input.actions.onEdit).toHaveBeenCalledOnce()
  expect(input.onAdd).not.toHaveBeenCalled()
  await user.click(add)
  expect(input.onAdd).toHaveBeenCalledOnce()
  await user.keyboard('{Shift>}{F10}{/Shift}')
  await user.click(screen.getByRole('menuitem', { name: 'Remover' }))
  expect(input.actions.onRemove).toHaveBeenCalledOnce()
  fireEvent.keyDown(add, { key: 'ContextMenu' })
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(add).toHaveFocus()
  fireEvent.contextMenu(add)
  await user.keyboard('{Tab}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.contextMenu(add)
  await user.click(screen.getByRole('button', { name: 'Fora' }))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

function pointer(
  target: Element,
  type: string,
  extra: Record<string, unknown> = {},
) {
  const event = Object.assign(new Event(type, { bubbles: true }), {
    pointerType: 'touch',
    clientX: 10,
    clientY: 10,
    ...extra,
  })
  fireEvent(target, event)
}

it('abre por toque prolongado e cancela o gesto ao mover, soltar ou interromper o toque', () => {
  vi.useFakeTimers()
  const input = props()
  const app = render(<CatalogInstrumentItem {...input} />)
  const add = screen.getByRole('button', { name: 'Adicionar Tambor de ensaio' })
  pointer(add, 'pointerdown')
  act(() => vi.advanceTimersByTime(550))
  expect(screen.getByRole('menu')).toBeVisible()
  pointer(add, 'pointerup')
  fireEvent.click(add)
  expect(input.onAdd).not.toHaveBeenCalled()
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
  pointer(add, 'pointerdown')
  pointer(add, 'pointermove', { clientX: 25 })
  act(() => vi.advanceTimersByTime(600))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(add)
  expect(input.onAdd).toHaveBeenCalledOnce()
  for (const end of ['pointerup', 'pointercancel', 'pointerout']) {
    pointer(add, 'pointerdown', { pointerType: 'pen' })
    pointer(add, end)
    act(() => vi.advanceTimersByTime(600))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  }
  pointer(add, 'pointerdown')
  app.unmount()
  act(() => vi.advanceTimersByTime(600))
})

it('mantém o clique e o menu nativo dos itens sem ações de edição', async () => {
  const user = userEvent.setup(),
    onAdd = vi.fn()
  render(<CatalogInstrumentItem name="Okedo" kind="okedo" onAdd={onAdd} />)
  const add = screen.getByRole('button', { name: 'Adicionar Okedo' })
  fireEvent.contextMenu(add)
  await user.keyboard('{Shift>}{F10}{/Shift}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  await user.click(add)
  expect(onAdd).toHaveBeenCalledOnce()
})
