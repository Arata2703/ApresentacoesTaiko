import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../../App'
import { ShowOrder } from './ShowOrder'
import { presentationFixture } from '../../../test/presentationFixture'
import { createPresentation } from '../../../domain/presentation/presentation'
import { savePresentationCache } from '../../../integrations/presentationCache'

describe('sequência de músicas na interface', () => {
  it('cria mapas, duplica, renomeia a cópia e confirma exclusão sem apagar o original', async () => {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Duplicar mapa' }))
    expect(screen.getByLabelText('Nome da música')).toHaveValue(
      'Primeira música (cópia)',
    )
    await userEvent.clear(screen.getByLabelText('Nome da música'))
    await userEvent.type(screen.getByLabelText('Nome da música'), 'Yatai')
    await userEvent.click(
      screen.getByRole('button', { name: /Okedo, sem tocador/ }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Remover instrumento' }),
    )
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Abrir mapa Primeira música',
      }),
    )
    expect(
      screen.getByRole('button', { name: /Okedo, sem tocador/ }),
    ).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar mapa' }),
    )
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Música 3')
    expect(
      screen
        .getAllByRole('button', { name: /Abrir mapa/ })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      'Abrir mapa Primeira música',
      'Abrir mapa Música 3',
      'Abrir mapa Yatai',
    ])
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Música 3' }),
    )
    await userEvent.keyboard('{Alt>}{ArrowUp}{ArrowDown}{/Alt}')
    await userEvent.click(screen.getByRole('button', { name: 'Remover mapa' }))
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remover mapa' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmar remoção do mapa' }),
    )
    expect(
      screen.queryByRole('button', { name: 'Abrir mapa Música 3' }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Yatai')
    await userEvent.click(screen.getByText(/Ordem da apresentação/))
    const order = screen.getByRole('list')
    expect(
      within(order)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Abrir música 1: Primeira música', 'Abrir música 2: Yatai'])
    await userEvent.click(
      within(order).getByRole('button', { name: 'Abrir música 2: Yatai' }),
    )
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Yatai')
  })
  it('mostra tsunagi sem nome e revisão e trata a apresentação vazia', async () => {
    const p = presentationFixture()
    const { unmount } = render(
      <ShowOrder
        onAddEntry={() => {}}
        onBack={() => {}}
        onOpen={() => {}}
        presentation={{
          ...p,
          maps: p.maps.map((map) => ({ ...map, title: '' })),
          transitions: p.transitions.map((t) => ({ ...t, needsReview: true })),
        }}
      />,
    )
    expect(
      await screen.findByRole('button', { name: 'Abrir tsunagi 3: Ponte' }),
    ).toBeVisible()
    expect(
      screen.getAllByRole('button', { name: /Abrir tsunagi \d+: Sem nome/ }),
    ).toHaveLength(2)
    expect(screen.getAllByText(/Revisar transição/)).toHaveLength(3)
    expect(
      screen.getAllByRole('button', {
        name: /Abrir música .*Música sem título/,
      }),
    ).toHaveLength(2)
    unmount()
    render(
      <ShowOrder
        onAddEntry={() => {}}
        onBack={() => {}}
        onOpen={() => {}}
        presentation={createPresentation('empty', 'Vazia')}
      />,
    )
    expect(screen.getByText(/Nenhuma música ou transição/)).toBeVisible()
  })
})

it('abre músicas e tsunagis pelo diagrama e retorna à edição pela navegação', async () => {
  savePresentationCache(presentationFixture(), 'a')
  const user = userEvent.setup()
  render(<App />)
  const orderButton = screen.getByRole('button', {
    name: 'Ordem da apresentação',
  })
  await user.click(orderButton)
  expect(orderButton).toHaveAttribute('aria-pressed', 'true')
  const diagram = screen.getByRole('region', { name: 'Ordem da apresentação' })
  expect(within(diagram).getAllByRole('listitem')).toHaveLength(5)
  await user.click(
    within(diagram).getByRole('button', { name: 'Abrir tsunagi 3: Ponte' }),
  )
  expect(
    screen.getByRole('region', { name: 'Editor de transição' }),
  ).toBeVisible()
  expect(screen.getByLabelText('Nome do tsunagi')).toHaveValue('Ponte')
  await user.click(orderButton)
  await user.click(screen.getByRole('button', { name: 'Voltar aos mapas' }))
  expect(
    screen.getByRole('region', { name: 'Editor de transição' }),
  ).toBeVisible()
  await user.click(orderButton)
  await user.click(
    screen.getByRole('button', { name: 'Abrir música 2: Yatai' }),
  )
  expect(screen.getByLabelText('Nome da música')).toHaveValue('Yatai')
  await user.click(orderButton)
  await user.click(screen.getByRole('button', { name: 'Voltar aos mapas' }))
  expect(screen.getByLabelText('Nome da música')).toHaveValue('Yatai')
})
