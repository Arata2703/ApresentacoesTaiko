import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ConfirmationPopup } from './ConfirmationPopup'

it('exibe conteúdo formatado e executa a ação escolhida entre três botões', async () => {
  const user = userEvent.setup()
  const cancel = vi.fn()
  const review = vi.fn()
  const proceed = vi.fn()
  render(
    <ConfirmationPopup
      title="Confirmar alteração"
      dismissActionIndex={0}
      actions={[
        { label: 'Cancelar', onClick: cancel },
        { label: 'Revisar', onClick: review },
        { label: 'Prosseguir', onClick: proceed },
      ]}
    >
      <p>
        Confira a música <strong>Ibuki</strong>.
      </p>
    </ConfirmationPopup>,
  )
  const popup = screen.getByRole('alertdialog', { name: 'Confirmar alteração' })
  expect(within(popup).getByText('Ibuki', { selector: 'strong' })).toBeVisible()
  const buttons = within(popup).getAllByRole('button')
  expect(buttons.map((button) => button.textContent)).toEqual([
    'Cancelar',
    'Revisar',
    'Prosseguir',
  ])
  expect(within(popup).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  await user.keyboard('{ArrowLeft}')
  expect(
    within(popup).getByRole('button', { name: 'Prosseguir' }),
  ).toHaveFocus()
  await user.keyboard('{ArrowRight}{Tab}{Enter}')
  expect(review).toHaveBeenCalledOnce()
  expect(cancel).not.toHaveBeenCalled()
  expect(proceed).not.toHaveBeenCalled()
})

it('executa o descarte configurado ao clicar fora, inclusive em qualquer lado do popup', () => {
  const dismiss = vi.fn()
  render(
    <ConfirmationPopup
      title="Confirmar alteração"
      actions={[
        { label: 'Confirmar', onClick: vi.fn() },
        { label: 'Cancelar', onClick: dismiss },
      ]}
      dismissActionIndex={1}
    >
      <p>Confira as alterações.</p>
    </ConfirmationPopup>,
  )
  const popup = screen.getByRole('alertdialog')
  vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(100, 100, 200, 150),
  )
  fireEvent.click(popup, { clientX: 150, clientY: 150 })
  expect(dismiss).not.toHaveBeenCalled()
  for (const [clientX, clientY] of [
    [50, 150],
    [350, 150],
    [150, 50],
    [150, 300],
  ]) {
    fireEvent.click(popup, { clientX, clientY })
  }
  expect(dismiss).toHaveBeenCalledTimes(4)
})

function PopupExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir confirmação
      </button>
      {open && (
        <ConfirmationPopup
          title="Confirmação"
          dismissActionIndex={0}
          actions={[{ label: 'Cancelar', onClick: () => setOpen(false) }]}
        >
          <p>Revise antes de continuar.</p>
        </ConfirmationPopup>
      )}
    </>
  )
}

it.each(['Escape', 'Cancelar'])(
  'devolve o foco ao controle de origem ao fechar por %s',
  async (action) => {
    const user = userEvent.setup()
    render(<PopupExample />)
    const origin = screen.getByRole('button', { name: 'Abrir confirmação' })
    await user.click(origin)
    expect(screen.getByRole('alertdialog')).toBeVisible()
    if (action === 'Escape') await user.keyboard('{Escape}')
    else await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(origin).toHaveFocus()
  },
)

it.each([true, false])(
  'trata cancelamento nativo com ação disponível = %s',
  (available) => {
    const dismiss = vi.fn()
    render(
      <ConfirmationPopup
        title="Confirmação"
        dismissActionIndex={0}
        actions={available ? [{ label: 'Cancelar', onClick: dismiss }] : []}
      >
        <p>Aguarde.</p>
      </ConfirmationPopup>,
    )
    const event = new Event('cancel', { cancelable: true })
    fireEvent(screen.getByRole('alertdialog'), event)
    expect(event.defaultPrevented).toBe(true)
    expect(dismiss).toHaveBeenCalledTimes(available ? 1 : 0)
  },
)

it('foca a ação de cancelamento configurada e navega com setas verticais, Home e End', async () => {
  const user = userEvent.setup()
  const proceed = vi.fn()
  render(
    <ConfirmationPopup
      title="Escolher ação"
      dismissActionIndex={1}
      actions={[
        { label: 'Revisar', onClick: vi.fn() },
        { label: 'Cancelar', onClick: vi.fn() },
        { label: 'Confirmar', onClick: proceed },
      ]}
    >
      <p>Escolha uma ação.</p>
    </ConfirmationPopup>,
  )
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus()
  await user.keyboard('{ArrowUp}')
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  await user.keyboard('{Home}')
  expect(screen.getByRole('button', { name: 'Revisar' })).toHaveFocus()
  await user.keyboard('{End} ')
  expect(proceed).toHaveBeenCalledOnce()
})
