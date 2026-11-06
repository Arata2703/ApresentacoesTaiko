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
  for (const button of buttons) expect(button).not.toHaveFocus()
  await user.click(within(popup).getByRole('button', { name: 'Revisar' }))
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
