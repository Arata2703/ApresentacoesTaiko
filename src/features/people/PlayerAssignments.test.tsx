import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PlayerAssignments } from './PlayerAssignments'

it('mostra apenas os nomes dos integrantes nos rótulos de atribuição', () => {
  render(
    <PlayerAssignments
      people={[{ id: 'kaory', name: 'Kaory' }]}
      selectedIds={[]}
      onAssign={vi.fn()}
      onManage={vi.fn()}
    />,
  )
  expect(screen.getByText('Kaory', { exact: true })).toBeVisible()
  expect(screen.queryByText(/· pessoa/)).not.toBeInTheDocument()
})
