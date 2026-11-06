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
  await user.click(within(page).getByRole('button', { name: 'Editar Faixa' }))
  await user.clear(name)
  await user.type(name, 'Faixa de palco')
  await user.click(
    within(page).getByRole('button', { name: 'Salvar material' }),
  )
  await waitFor(() =>
    expect(
      readPresentationCache().data?.presentation.materials[0],
    ).toMatchObject({ name: 'Faixa de palco', quantity: 3 }),
  )
  view.unmount()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Materiais manuais' }))
  expect(screen.getByRole('row', { name: /Faixa de palco 3/ })).toBeVisible()
  await user.click(
    screen.getByRole('button', { name: 'Editar Faixa de palco' }),
  )
  await user.click(screen.getByRole('button', { name: 'Cancelar edição' }))
  expect(screen.getByLabelText('Nome do material')).toHaveValue('')
  await user.click(
    screen.getByRole('button', { name: 'Editar Faixa de palco' }),
  )
  await user.click(
    screen.getByRole('button', { name: 'Remover Faixa de palco' }),
  )
  expect(screen.getByText('Nenhum material cadastrado.')).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Salvar material' }),
  ).not.toBeInTheDocument()
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
