import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { DataTable } from './DataTable'

it('mantém células somente leitura sem editor ao dar duplo clique', async () => {
  render(
    <DataTable
      rows={[{ id: 'a', value: 'Conferido' }]}
      rowId={(row) => row.id}
      rowLabel={(row) => row.value}
      columns={[
        {
          id: 'status',
          kind: 'read',
          title: 'Status',
          value: (row) => row.value,
        },
      ]}
    />,
  )
  const cell = screen.getByRole('cell', { name: 'Conferido' })
  await userEvent.dblClick(cell)
  expect(cell).toHaveTextContent('Conferido')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

function EditableTable() {
  const [row, setRow] = useState({ id: 'a', name: 'Ana', quantity: 1 })
  return (
    <>
      <DataTable
        rows={[row]}
        rowId={(item) => item.id}
        rowLabel={(item) => item.name}
        columns={[
          {
            id: 'name',
            kind: 'editable',
            input: 'text',
            title: 'Nome',
            label: () => 'Editar nome',
            value: (item) => item.name,
            validate: (value) => (value.trim() ? '' : 'Informe um nome.'),
            save: (_, name) => setRow((current) => ({ ...current, name })),
          },
          {
            id: 'quantity',
            kind: 'editable',
            input: 'number',
            title: 'Quantidade',
            min: 1,
            label: () => 'Editar quantidade',
            value: (item) => item.quantity,
            validate: (value) =>
              Number(value) >= 1 ? '' : 'Informe uma quantidade positiva.',
            save: (_, quantity) =>
              setRow((current) => ({ ...current, quantity })),
          },
        ]}
      />
      <button type="button">Depois da tabela</button>
    </>
  )
}

it.each(['Enter', 'Escape'])(
  'mantém o foco na célula ao encerrar a edição com %s',
  async (key) => {
    const user = userEvent.setup()
    render(<EditableTable />)
    await user.tab()
    await user.keyboard('{Enter}')
    const input = screen.getByRole('textbox', { name: 'Editar nome' })
    await user.clear(input)
    await user.type(input, 'Ana Silva')
    await user.keyboard(`{${key}}`)
    const name = screen.getByRole('button', { name: 'Editar nome' })
    expect(name).toHaveFocus()
    expect(name).toHaveTextContent(key === 'Enter' ? 'Ana Silva' : 'Ana')
    await user.tab()
    expect(
      screen.getByRole('button', { name: 'Editar quantidade' }),
    ).toHaveFocus()
  },
)

it('associa o erro ao campo e mantém o foco ao tentar salvar uma quantidade inválida', async () => {
  const user = userEvent.setup()
  render(<EditableTable />)
  await user.dblClick(screen.getByRole('button', { name: 'Editar quantidade' }))
  const input = screen.getByRole('textbox', { name: 'Editar quantidade' })
  await user.clear(input)
  await user.type(input, '-1{Enter}')
  expect(input).toHaveFocus()
  expect(input).toHaveAccessibleDescription('Informe uma quantidade positiva.')
})

it('salva ao sair da célula sem retirar o foco do controle escolhido', async () => {
  const user = userEvent.setup()
  render(<EditableTable />)
  await user.dblClick(screen.getByRole('button', { name: 'Editar nome' }))
  await user.type(
    screen.getByRole('textbox', { name: 'Editar nome' }),
    ' Silva',
  )
  const next = screen.getByRole('button', { name: 'Depois da tabela' })
  await user.click(next)
  expect(next).toHaveFocus()
  expect(screen.getByRole('button', { name: 'Editar nome' })).toHaveTextContent(
    'Ana Silva',
  )
})
