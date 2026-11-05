import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { catalog } from '../../domain/stage'
import { addPlayerToSelected } from '../../test/addPlayer'

describe('fluxos da primeira tela', () => {
  it('começa vazio e avisa que o trabalho ainda não é salvo', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'O palco é seu.' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Cada detalhe no seu lugar.' }),
    ).toBeVisible()
    expect(
      screen.getByText(/Sessão local · salvamento automático no navegador/),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Escolha um instrumento',
    )
  })

  it('atualiza títulos e usa um título alternativo para música sem nome', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.clear(screen.getByLabelText('Nome da apresentação'))
    await user.type(
      screen.getByLabelText('Nome da apresentação'),
      'Mostra Japão',
    )
    expect(screen.getByLabelText('Nome da apresentação')).toHaveValue(
      'Mostra Japão',
    )
    await user.clear(screen.getByLabelText('Nome da música'))
    expect(screen.getByText('Música sem título')).toBeVisible()
    await user.type(screen.getByLabelText('Nome da música'), 'Ibuki')
    expect(
      within(screen.getByLabelText('Páginas da apresentação')).getByText(
        'Ibuki',
      ),
    ).toBeVisible()
  })

  it.each(catalog)(
    'adiciona $name com a base correspondente',
    async ({ name, base }) => {
      const user = userEvent.setup()
      render(<App />)
      await user.click(
        screen.getByRole('button', { name: `Adicionar ${name}` }),
      )
      expect(
        screen.getByRole('button', {
          name: `${name}, sem tocador. Use as setas para mover.`,
        }),
      ).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('heading', { name })).toBeVisible()
      const baseName =
        base === 'Suwaridai'
          ? `${name.startsWith('Nagado') ? 'Nagado' : name} suwaridai`
          : base
      expect(screen.getByText(baseName, { exact: true })).toBeVisible()
      expect(screen.getByRole('status')).toHaveTextContent(
        `${name} adicionado ao palco.`,
      )
      expect(
        screen.queryByRole('heading', { name: 'O palco é seu.' }),
      ).not.toBeInTheDocument()
    },
  )

  it('adiciona pelo estado vazio, edita propriedades e move por teclado', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Adicionar um okedo/ }))
    await addPlayerToSelected('Ana')
    fireEvent.change(screen.getByLabelText('Horizontal · m'), {
      target: { value: '4' },
    })
    fireEvent.change(screen.getByLabelText('Profundidade · m'), {
      target: { value: '3' },
    })
    fireEvent.change(screen.getByRole('slider', { name: 'Rotação' }), {
      target: { value: '90' },
    })
    expect(screen.getByRole('slider')).toHaveValue('90')
    const instrument = screen.getByRole('button', {
      name: /Okedo, tocador Ana/,
    })
    await user.click(instrument)
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(screen.getByLabelText('Horizontal · m')).toHaveValue(4.1)
    expect(screen.getByLabelText('Profundidade · m')).toHaveValue(3.1)
    await user.keyboard('{ArrowLeft}{ArrowUp}a')
    expect(screen.getByLabelText('Horizontal · m')).toHaveValue(4)
    expect(screen.getByLabelText('Profundidade · m')).toHaveValue(3)
    expect(screen.getByRole('slider')).toHaveValue('90')
  })

  it('troca seleção sem perder propriedades e remove até voltar ao estado vazio', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Adicionar Okedo' }))
    await addPlayerToSelected('Ana')
    await user.click(screen.getByRole('button', { name: 'Adicionar Shime' }))
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).not.toBeChecked()
    const first = screen.getByRole('button', { name: /Okedo, tocador Ana/ })
    expect(first).toHaveAttribute('aria-pressed', 'false')
    await user.click(first)
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).toBeChecked()
    await user.click(
      screen.getByRole('button', { name: 'Remover instrumento' }),
    )
    expect(
      screen.queryByRole('button', { name: /Okedo, tocador Ana/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Cada detalhe no seu lugar.' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Okedo removido.')
    await user.click(screen.getByRole('button', { name: /Shime, sem tocador/ }))
    await user.click(
      screen.getByRole('button', { name: 'Remover instrumento' }),
    )
    expect(
      screen.getByRole('heading', { name: 'O palco é seu.' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Shime removido.')
  })
})
