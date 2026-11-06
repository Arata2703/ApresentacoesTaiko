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
