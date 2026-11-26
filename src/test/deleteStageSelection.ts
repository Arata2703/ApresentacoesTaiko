import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
export async function deleteStageSelection() {
  fireEvent.contextMenu(document.querySelector('[data-stage-surface]')!)
  await userEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }))
}
