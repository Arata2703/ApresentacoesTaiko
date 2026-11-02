import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export async function addPlayerToSelected(name: string) {
  const instrument = screen
    .getByRole('button', { name: /Use as setas para mover/, pressed: true })
    .getAttribute('aria-label')!
  const mapName = (screen.getByLabelText('Nome da música') as HTMLInputElement)
    .value
  await userEvent.click(
    screen.getByRole('button', { name: 'Gerenciar integrantes' }),
  )
  await userEvent.type(screen.getByLabelText('Nome do novo integrante'), name)
  await userEvent.click(
    screen.getByRole('button', { name: 'Adicionar integrante' }),
  )
  await userEvent.click(
    screen.getByRole('button', { name: `Abrir mapa ${mapName}` }),
  )
  await userEvent.click(screen.getByRole('button', { name: instrument }))
  await userEvent.click(
    screen.getByRole('checkbox', { name: new RegExp(`^${name} · pessoa`) }),
  )
}
