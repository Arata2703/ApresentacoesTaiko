import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import App from '../../App'
import { exportMaterials } from '../../integrations/exportMaterials'
import { readPresentationCache } from '../../integrations/presentationCache'

vi.mock('../../integrations/exportMaterials', () => ({
  exportMaterials: vi.fn(),
}))

it('valida, adiciona, edita, remove e restaura a lista manual', async () => {
  const user = userEvent.setup()
  const view = render(<App />)
  await user.click(screen.getByRole('button', { name: 'Materiais manuais' }))
  const page = screen.getByRole('region', { name: 'Materiais manuais' })
  const name = within(page).getByLabelText('Nome do material')
  const quantity = within(page).getByLabelText('Quantidade')
  const add = within(page).getByRole('button', { name: 'Adicionar material' })
  expect(
    within(page).getByRole('button', { name: 'Exportar PDF dos materiais' }),
  ).toBeDisabled()
  await user.click(add)
  expect(within(page).getByRole('alert')).toBeVisible()
  await user.type(name, 'Faixa')
  for (const invalid of ['0', '-2', '1.5', '']) {
    await user.clear(quantity)
    if (invalid) await user.type(quantity, invalid)
    await user.click(add)
    expect(within(page).getByRole('alert')).toHaveTextContent(
      'inteiro positivo',
    )
    expect(within(page).getByText('Nenhum material cadastrado.')).toBeVisible()
  }
  await user.type(quantity, '3')
  await user.click(add)
  expect(within(page).getByRole('row', { name: /Faixa 3/ })).toBeVisible()
  await user.dblClick(
    screen.getByRole('button', { name: 'Editar nome de Faixa' }),
  )
  const editName = screen.getByRole('textbox', { name: 'Editar nome de Faixa' })
  await user.clear(editName)
  await user.type(editName, 'Faixa de palco{Enter}')
  await user.dblClick(
    screen.getByRole('button', { name: 'Editar quantidade de Faixa de palco' }),
  )
  const editQuantity = screen.getByRole('textbox', {
    name: 'Editar quantidade de Faixa de palco',
  })
  await user.clear(editQuantity)
  await user.type(editQuantity, '0{Enter}')
  expect(screen.getByRole('alert')).toHaveTextContent('inteiro positivo')
  await user.clear(editQuantity)
  await user.type(editQuantity, '4{Enter}')
  await waitFor(() =>
    expect(
      readPresentationCache().data?.presentation.materials[0],
    ).toMatchObject({ name: 'Faixa de palco', quantity: 4 }),
  )
  view.unmount()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Materiais manuais' }))
  expect(screen.getByRole('row', { name: /Faixa de palco 4/ })).toBeVisible()
  await user.dblClick(
    screen.getByRole('button', { name: 'Editar nome de Faixa de palco' }),
  )
  await user.type(
    screen.getByRole('textbox', { name: 'Editar nome de Faixa de palco' }),
    ' rascunho{Escape}',
  )
  expect(screen.getByRole('row', { name: 'Faixa de palco 4' })).toBeVisible()
  const quantityButton = screen.getByRole('button', {
    name: 'Editar quantidade de Faixa de palco',
  })
  quantityButton.focus()
  await user.keyboard('{F2}')
  const reopenedQuantity = screen.getByRole('textbox', {
    name: 'Editar quantidade de Faixa de palco',
  })
  await user.clear(reopenedQuantity)
  await user.type(reopenedQuantity, '5')
  await user.click(screen.getByLabelText('Nome do material'))
  expect(screen.getByRole('row', { name: 'Faixa de palco 5' })).toBeVisible()
  await user.click(
    screen.getByRole('button', { name: 'Remover Faixa de palco' }),
  )
  const confirmation = screen.getByRole('alertdialog')
  expect(confirmation).toHaveTextContent('Quantidade: 5')
  await user.click(
    within(confirmation).getByRole('button', { name: 'Confirmar' }),
  )
  expect(screen.getByText('Nenhum material cadastrado.')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Voltar aos mapas' }))
  expect(screen.getByLabelText('Nome da música')).toBeVisible()
}, 15000)

it('exporta a lista atual e mostra erro recuperável se a geração falhar', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Materiais manuais' }))
  await user.type(screen.getByLabelText('Nome do material'), 'Banner')
  await user.click(screen.getByRole('button', { name: 'Adicionar material' }))
  vi.mocked(exportMaterials)
    .mockRejectedValueOnce(new Error('Falha ao carregar a fonte.'))
    .mockResolvedValueOnce(undefined)
  const pdf = screen.getByRole('button', { name: 'Exportar PDF dos materiais' })
  await user.click(pdf)
  expect(await screen.findByText('Falha ao carregar a fonte.')).toBeVisible()
  await user.click(pdf)
  expect(
    await screen.findByText('PDF dos materiais manuais baixado.'),
  ).toBeVisible()
  expect(exportMaterials).toHaveBeenLastCalledWith(expect.any(String), [
    expect.objectContaining({ name: 'Banner', quantity: 1 }),
  ])
})

it('ajusta quantidades com as setas e cancela somente alterações da edição', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Materiais manuais' }))
  await user.type(screen.getByLabelText('Nome do material'), 'Okedo')
  await user.click(screen.getByRole('button', { name: 'Adicionar material' }))
  const increase = screen.getByRole('button', { name: /Aumentar:.*Okedo/ })
  const decrease = screen.getByRole('button', { name: /Diminuir:.*Okedo/ })
  expect(decrease).toBeDisabled()
  await user.click(increase)
  expect(screen.getByRole('row', { name: 'Okedo 2' })).toBeVisible()
  await user.dblClick(
    screen.getByRole('button', { name: 'Editar quantidade de Okedo' }),
  )
  const draft = screen.getByRole('textbox', {
    name: 'Editar quantidade de Okedo',
  })
  await user.type(draft, 'a')
  expect(draft).toHaveValue('2')
  await user.click(increase)
  expect(draft).toHaveValue('3')
  await user.keyboard('{Escape}')
  expect(screen.getByRole('row', { name: 'Okedo 2' })).toBeVisible()
  await user.click(decrease)
  expect(screen.getByRole('row', { name: 'Okedo 1' })).toBeVisible()
  await user.dblClick(
    screen.getByRole('button', { name: 'Editar quantidade de Okedo' }),
  )
  const negative = screen.getByRole('textbox', {
    name: 'Editar quantidade de Okedo',
  })
  await user.clear(negative)
  await user.type(negative, '-2')
  expect(negative).toHaveAttribute('aria-invalid', 'true')
  await user.keyboard('{Enter}{Escape}')
  expect(screen.getByRole('row', { name: 'Okedo 1' })).toBeVisible()
})
