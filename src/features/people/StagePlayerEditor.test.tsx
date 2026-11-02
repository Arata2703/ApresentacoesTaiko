import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StagePlayerEditor } from './StagePlayerEditor'
import App from '../../App'
import { presentationFixture } from '../../test/presentationFixture'
import { serializePresentation } from '../../integrations/presentationFile'
import { addPerson } from '../../domain/presentation/people'

async function loadExample() {
  const p = addPerson(presentationFixture(), 'ana2', 'Ana')
  const source = serializePresentation(p)
  fireEvent.change(screen.getByLabelText('Abrir apresentação'), {
    target: {
      files: [{ size: source.length, text: () => Promise.resolve(source) }],
    },
  })
  await screen.findByRole('alertdialog')
  await userEvent.click(
    screen.getByRole('button', { name: 'Substituir e abrir' }),
  )
}

describe('edição direta do rótulo no palco', () => {
  it('edita no próprio texto, cria integrantes e usa A/B sem abrir um painel', async () => {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar tocadores de Okedo' }),
    )
    await userEvent.type(screen.getByRole('combobox'), 'Kaory/Rafael')
    await userEvent.keyboard('{Enter}')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Okedo, tocador Kaory\/Rafael/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Integrantes (2)' }),
    ).toBeVisible()
    expect(
      screen.getByRole('checkbox', { name: 'Kaory · pessoa 1' }),
    ).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Rafael · pessoa 2' }),
    ).toBeChecked()
    await userEvent.dblClick(
      screen.getByRole('button', {
        name: 'Editar tocadores de Okedo: Kaory/Rafael',
      }),
    )
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.keyboard('{Enter}')
    expect(
      screen.getByRole('button', { name: /Okedo, sem tocador/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Integrantes (2)' }),
    ).toBeVisible()
  })
  it('autocomplete escolhe o homônimo pelo ID e mantém a identidade em edição sem alteração', async () => {
    render(<App />)
    await loadExample()
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar tocadores de Fue' }),
    )
    await userEvent.type(screen.getByRole('combobox'), 'an')
    expect(screen.getByRole('option', { name: 'Ana · pessoa 1' })).toBeVisible()
    await userEvent.click(
      screen.getByRole('option', { name: 'Ana · pessoa 3' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /Fue, tocador Ana/ }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).not.toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 3' }),
    ).toBeChecked()
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar tocadores de Fue: Ana' }),
    )
    await userEvent.keyboard('{Enter}')
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 3' }),
    ).toBeChecked()
  })
  it('aceita teclado para editar/autocompletar, salva ao sair e cancela sem alterar o instrumento', async () => {
    render(<App />)
    await loadExample()
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar tocadores de Fue' }),
    )
    await userEvent.keyboard('x{F2}')
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{ArrowDown}{Enter}')
    expect(
      screen.getByRole('button', { name: /Fue, tocador Ana/ }),
    ).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar tocadores de Fue: Ana' }),
    )
    await userEvent.keyboard('{Enter}')
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'joa')
    await userEvent.keyboard('{Escape}')
    expect(
      screen.getByRole('button', { name: /Fue, tocador Ana/ }),
    ).toBeVisible()
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar tocadores de Fue: Ana' }),
    )
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'João')
    await userEvent.click(screen.getByLabelText('Nome da música'))
    expect(
      screen.getByRole('button', { name: /Fue, tocador João/ }),
    ).toBeVisible()
  })
  it('não confirma nomes ambíguos/inválidos e não duplica confirmação ao perder foco', async () => {
    const onCommit = vi.fn()
    const onCancel = vi.fn()
    render(
      <>
        <StagePlayerEditor
          people={[
            { id: 'a', name: 'Ana' },
            { id: 'b', name: 'Ana' },
          ]}
          selectedIds={[]}
          onCommit={onCommit}
          onCancel={onCancel}
        />
        <button>Sair</button>
      </>,
    )
    await userEvent.type(screen.getByRole('combobox'), 'Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(screen.getByRole('alert')).toHaveTextContent('mesmo nome')
    expect(onCommit).not.toHaveBeenCalled()
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'X'.repeat(81))
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('1 a 80')
    expect(screen.getByText('Nenhum integrante encontrado.')).toBeVisible()
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'Bia')
    await userEvent.click(
      screen.getByRole('option', { name: 'Adicionar “Bia” aos integrantes' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(onCommit).toHaveBeenCalledExactlyOnceWith([{ name: 'Bia' }])
  })
})
