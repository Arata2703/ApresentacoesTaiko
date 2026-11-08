import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { savePresentationCache } from '../../integrations/presentationCache'
import { presentationFixture } from '../../test/presentationFixture'
import { createPresentation } from '../../domain/presentation/presentation'

async function create(name = 'Adicionar transição') {
  await userEvent.click(screen.getByRole('button', { name }))
}
describe('tela de transição textual', () => {
  it('marca como revisada pelo editor da transição e mantém a tela aberta', async () => {
    const p = presentationFixture()
    savePresentationCache(
      {
        ...p,
        transitions: p.transitions.map((transition) =>
          transition.id === 'middle'
            ? { ...transition, needsReview: true }
            : transition,
        ),
      },
      'b',
    )
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: /Abrir transição .*: Ponte/ }),
    )
    const editor = screen.getByRole('region', { name: 'Editor de transição' })
    expect(within(editor).getByRole('alert')).toBeVisible()
    await userEvent.click(
      within(editor).getByRole('button', {
        name: 'Marcar transição como revisada',
      }),
    )
    expect(within(editor).queryByRole('alert')).not.toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Editor de transição' }),
    ).toBeVisible()
    expect(within(editor).getByLabelText('Nome do tsunagi')).toHaveValue(
      'Ponte',
    )
  })
  it('cria entre músicas e atualiza mapas automaticamente sem perder instruções', async () => {
    render(<App />)
    await userEvent.clear(screen.getByLabelText('Nome da música'))
    await userEvent.type(screen.getByLabelText('Nome da música'), 'Ibuki')
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar mapa' }),
    )
    await userEvent.clear(screen.getByLabelText('Nome da música'))
    await userEvent.type(screen.getByLabelText('Nome da música'), 'Yatai')
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Ibuki' }),
    )
    await create()
    expect(
      screen.getByRole('group', { name: 'Adicionar slides' }),
    ).toBeVisible()
    await userEvent.type(
      screen.getByLabelText('Nome do tsunagi'),
      'Ponte suave',
    )
    fireEvent.input(screen.getByLabelText('Instruções da transição'), {
      target: { innerHTML: '<p>Mover okedo.</p><p>Aguardar sinal.</p>' },
    })
    const previous = screen.getByRole('region', { name: 'Mapa anterior' })
    expect(
      within(previous).getByRole('heading', { name: 'Ibuki' }),
    ).toBeVisible()
    expect(within(previous).getByText('Okedo')).toBeVisible()
    expect(
      within(screen.getByRole('region', { name: 'Próximo mapa' })).getByRole(
        'heading',
        { name: 'Yatai' },
      ),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Exportar PDF da apresentação' }),
    ).toBeEnabled()
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar mapa anterior' }),
    )
    await userEvent.clear(screen.getByLabelText('Nome da música'))
    await userEvent.type(screen.getByLabelText('Nome da música'), 'Ibuki novo')
    await userEvent.click(
      screen.getByRole('button', { name: /Abrir transição .*: Ponte suave/ }),
    )
    expect(screen.getByRole('heading', { name: 'Ibuki novo' })).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Ibuki novo' }),
    )
    await userEvent.keyboard('{Alt>}{ArrowDown}{ArrowDown}{/Alt}')
    await userEvent.click(
      screen.getByRole('button', { name: /Abrir transição .*: Ponte suave/ }),
    )
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await userEvent.click(
      screen.getByRole('button', { name: /Abrir transição .*: Ponte suave/ }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('A sequência mudou')
    expect(screen.getByLabelText('Instruções da transição')).toHaveTextContent(
      'Mover okedo.Aguardar sinal.',
    )
    expect(
      within(screen.getByRole('region', { name: 'Mapa anterior' })).getByRole(
        'heading',
        { name: 'Yatai' },
      ),
    ).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Marcar Ponte suave como revisada' }),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar próximo mapa' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remover mapa' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmar remoção do mapa' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /Abrir transição .*: Ponte suave/ }),
    )
    expect(screen.getByText(/Sem próximo mapa/)).toBeVisible()
    expect(screen.getByLabelText('Instruções da transição')).toHaveTextContent(
      'Mover okedo.Aguardar sinal.',
    )
    expect(screen.getByRole('alert')).toBeVisible()
  }, 15000)
  it('insere após uma transição selecionada e acrescenta ao fim na tela de integrantes', async () => {
    render(<App />)
    const sidebar = screen.getByRole('complementary', {
      name: 'Páginas da apresentação',
    })
    await create()
    await userEvent.type(screen.getByLabelText('Nome do tsunagi'), 'Ponte')
    await userEvent.click(
      within(sidebar).getByRole('button', { name: 'Adicionar mapa' }),
    )
    expect(screen.getByLabelText('Nome da música')).toHaveValue('Música 2')
    await userEvent.click(
      within(sidebar).getByRole('button', { name: /Abrir transição .*Ponte/ }),
    )
    await create()
    expect(
      within(screen.getByRole('region', { name: 'Próximo mapa' })).getByText(
        'Música 2',
      ),
    ).toBeVisible()
    await userEvent.click(
      within(sidebar).getByRole('button', { name: /Integrantes/ }),
    )
    await create()
    expect(
      within(screen.getByRole('region', { name: 'Mapa anterior' })).getByText(
        'Música 2',
      ),
    ).toBeVisible()
    expect(screen.getByText(/Sem próximo mapa/)).toBeVisible()
  }, 15000)
  it('oferece entrada e saída e confirma remoção apenas da transição', async () => {
    render(<App />)
    await userEvent.click(screen.getByText(/Ordem da apresentação/))
    await create('Adicionar transição de entrada')
    expect(screen.getByText(/Sem mapa anterior/)).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Remover transição' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Remover transição' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmar remoção da transição' }),
    )
    expect(
      screen.queryByRole('region', { name: 'Editor de transição' }),
    ).not.toBeInTheDocument()
    await create()
    expect(screen.getByText(/Sem próximo mapa/)).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar mapa anterior' }),
    )
    expect(screen.getByLabelText('Nome da música')).toHaveValue(
      'Primeira música',
    )
  })
  it('abre transições importadas com tocadores e preserva transição sem mapas', async () => {
    savePresentationCache(presentationFixture(), 'b')
    const { unmount } = render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: /Abrir transição .*: Ponte/ }),
    )
    expect(screen.getByText('Ana/João')).toBeVisible()
    expect(screen.getByText('Fue')).toBeVisible()
    expect(screen.getByLabelText('Instruções da transição')).toHaveTextContent(
      'Mover okedo.Levar bases para o fundo.',
    )
    unmount()
    savePresentationCache(createPresentation('empty', 'Vazia'), null)
    render(<App />)
    await create('Adicionar transição')
    expect(screen.getByText(/Sem mapa anterior/)).toBeVisible()
    expect(screen.getByText(/Sem próximo mapa/)).toBeVisible()
  })
})
