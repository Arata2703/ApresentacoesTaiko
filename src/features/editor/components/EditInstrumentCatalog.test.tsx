import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import App from '../../../App'
import { presentationFixture } from '../../../test/presentationFixture'
import { addCustomInstrument } from '../../../domain/presentation/customInstruments'
import { addMapInstrument } from '../../../domain/presentation/maps'
import {
  savePresentationCache,
  readPresentationCache,
} from '../../../integrations/presentationCache'
import { iconPng } from '../../../test/iconPng'

function seed() {
  let p = addCustomInstrument(presentationFixture(), {
    id: 'custom',
    name: 'Tambor próprio',
    kind: 'shime',
  })
  p = addCustomInstrument(p, {
    id: 'spare',
    name: 'Reserva',
    kind: 'shime',
    png: iconPng,
  })
  p = addMapInstrument(p, 'a', 'custom-a', 'shime', 'custom')
  p = addMapInstrument(p, 'b', 'custom-b', 'shime', 'custom')
  expect(savePresentationCache(p, 'a')).toBe('')
}

it('edita nome e ícone, cancela rascunhos e recupera a alteração em todos os mapas', async () => {
  seed()
  const user = userEvent.setup()
  const app = render(<App />)
  await user.click(
    screen.getByRole('button', { name: 'Editar Tambor próprio' }),
  )
  await user.clear(screen.getByLabelText('Nome', { exact: true }))
  await user.type(screen.getByLabelText('Nome', { exact: true }), 'Descartar')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(
    screen.getByRole('button', { name: 'Adicionar Tambor próprio' }),
  ).toBeVisible()
  await user.click(
    screen.getByRole('button', { name: 'Editar Tambor próprio' }),
  )
  expect(screen.getByLabelText('Nome', { exact: true })).toHaveValue(
    'Tambor próprio',
  )
  await user.clear(screen.getByLabelText('Nome', { exact: true }))
  await user.type(screen.getByLabelText('Nome', { exact: true }), ' ')
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Informe um nome')
  await user.clear(screen.getByLabelText('Nome', { exact: true }))
  await user.type(
    screen.getByLabelText('Nome', { exact: true }),
    'Tambor revisado',
  )
  await user.type(screen.getByLabelText('Abreviação (opcional)'), 'Rev.')
  await user.selectOptions(
    screen.getByLabelText('Ícone', { exact: true }),
    'nagado',
  )
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(
    screen
      .getByRole('button', { name: 'Adicionar Tambor revisado' })
      .querySelector('img'),
  ).toHaveAttribute('src', expect.stringContaining('nagado'))
  await waitFor(() =>
    expect(
      readPresentationCache().data?.presentation.customInstruments?.[0]?.name,
    ).toBe('Tambor revisado'),
  )
  const saved = readPresentationCache().data!.presentation
  expect(
    saved.maps
      .flatMap((map) => map.instruments)
      .filter((item) => item.customInstrumentId === 'custom')
      .map((item) => item.kind),
  ).toEqual(['nagado', 'nagado'])
  app.unmount()
  render(<App />)
  expect(
    screen.getByRole('button', { name: 'Editar Tambor revisado' }),
  ).toBeVisible()
  await user.click(
    screen.getByRole('button', { name: 'Editar Tambor revisado' }),
  )
  expect(screen.getByLabelText('Abreviação (opcional)')).toHaveValue('Rev.')
})

it('preserva a imagem enviada ao renomear e permite trocar por um ícone do catálogo', async () => {
  seed()
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Editar Reserva' }))
  expect(
    screen.getByRole('img', { name: 'Prévia do ícone' }).querySelector('img'),
  ).toHaveAttribute('src', `data:image/png;base64,${iconPng}`)
  await user.clear(screen.getByLabelText('Nome', { exact: true }))
  await user.type(
    screen.getByLabelText('Nome', { exact: true }),
    'Reserva nova',
  )
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(
    screen
      .getByRole('button', { name: 'Adicionar Reserva nova' })
      .querySelector('img'),
  ).toHaveAttribute('src', `data:image/png;base64,${iconPng}`)
  await waitFor(() =>
    expect(
      readPresentationCache().data?.presentation.customInstruments?.[1]?.kind,
    ).toBe('shime'),
  )
  await user.click(screen.getByRole('button', { name: 'Editar Reserva nova' }))
  await user.selectOptions(
    screen.getByLabelText('Ícone', { exact: true }),
    'shime',
  )
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(
    screen
      .getByRole('button', { name: 'Adicionar Reserva nova' })
      .querySelector('img'),
  ).toHaveAttribute('src', expect.stringContaining('shime'))
})

it('informa as músicas e bloqueia a remoção em uso; pede confirmação para excluir um item livre', async () => {
  seed()
  const user = userEvent.setup()
  render(<App />)
  await user.click(
    screen.getByRole('button', { name: 'Remover Tambor próprio' }),
  )
  const used = screen.getByRole('alertdialog', { name: 'Instrumento em uso' })
  expect(within(used).getByText('Ibuki')).toBeVisible()
  expect(within(used).getByText('Yatai')).toBeVisible()
  expect(
    within(used).queryByRole('button', { name: 'Confirmar' }),
  ).not.toBeInTheDocument()
  await user.click(within(used).getByRole('button', { name: 'Voltar' }))
  await user.click(screen.getByRole('button', { name: 'Remover Reserva' }))
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(
    screen.getByRole('button', { name: 'Adicionar Reserva' }),
  ).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Remover Reserva' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(
    screen.queryByRole('button', { name: 'Adicionar Reserva' }),
  ).not.toBeInTheDocument()
  await waitFor(() =>
    expect(
      readPresentationCache().data?.presentation.customInstruments,
    ).toHaveLength(1),
  )
})

it('preserva o símbolo legado ao editar apenas o nome de um instrumento importado', async () => {
  const p = addCustomInstrument(presentationFixture(), {
    id: 'legacy',
    name: 'Legado',
    kind: 'nagado-p',
  })
  expect(savePresentationCache(p, 'a')).toBe('')
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Editar Legado' }))
  await user.clear(screen.getByLabelText('Nome', { exact: true }))
  await user.type(
    screen.getByLabelText('Nome', { exact: true }),
    'Legado revisado',
  )
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  await waitFor(() =>
    expect(
      readPresentationCache().data?.presentation.customInstruments,
    ).toEqual([{ id: 'legacy', name: 'Legado revisado', kind: 'nagado-p' }]),
  )
})
