import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../../App'
import { ShowOrder } from './ShowOrder'
import { presentationFixture } from '../../../test/presentationFixture'
import { createPresentation } from '../../../domain/presentation/presentation'

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
      screen.getByRole('button', { name: '+ Adicionar música' }),
    )
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Música 3')
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Música 3' }),
    )
    await userEvent.keyboard('{Alt>}{ArrowUp}{ArrowDown}{/Alt}')
    await userEvent.click(screen.getByRole('button', { name: 'Remover mapa' }))
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
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Primeira música', 'Yatai'])
  })
  it('mostra tsunagi sem nome e revisão e trata a apresentação vazia', async () => {
    const p = presentationFixture()
    const { unmount } = render(
      <ShowOrder
        presentation={{
          ...p,
          transitions: p.transitions.map((t) => ({ ...t, needsReview: true })),
        }}
      />,
    )
    await userEvent.click(screen.getByText(/Ordem da apresentação/))
    expect(await screen.findByText(/Tsunagi: Ponte/)).toBeVisible()
    expect(screen.getAllByText(/Tsunagi: Sem nome/)).toHaveLength(2)
    expect(screen.getAllByText(/Revisar transição/)).toHaveLength(3)
    unmount()
    render(<ShowOrder presentation={createPresentation('empty', 'Vazia')} />)
    await userEvent.click(screen.getByText(/Ordem da apresentação/))
    expect(screen.getByText(/Nenhuma música ou transição/)).toBeVisible()
  })
})
